/* 
 * Adapted from PmWiki AutoSave <http://www.pmwiki.org/wiki/Cookbook/AutoSave>
 * Autosave the input text in textarea on receiving new input. The autosaving delay
 * is configurable, and any new input within the delay extends it by resetting the timer.
 * A maximum total delay is also configurable 
 * When autosaving, the number of bullets appearing before the current caret position is 
 * calculated and stored in a local storage, which is then used for calculating the 
 * corresponding scroll position when browsing this page.
 * Closing the page at any time with unsaved changes triggers a synchronous saving
 * (blocking saving). This can cause a bit unresponsiveness.
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170507
 */

var AS = 
{
  status: '',
  savedStatusHtml: "<div class='AutosaveMsg' style='-webkit-filter:drop-shadow(0 0 1px #0C0); background-color: #0C0; background:-webkit-linear-gradient(right, #0C0,#cfc);'></div>",
  savingStatusHtml: "<div class='AutosaveMsg' style='\
										-webkit-animation-name: savingPulse;\
										-webkit-animation-duration: 0.5s;\
										-webkit-animation-iteration-count: infinite;'></div>",
  disableStatusHtml: "<div class='AutosaveMsg' style='-webkit-filter:drop-shadow(0 0 1px #666); background-color: #999; background:-webkit-linear-gradient(right, #666, #eee);'></div>",
  initStatusHtml: "<div class='AutosaveMsg' style='-webkit-filter:drop-shadow(0 0 1px blue); background-color: blue; background:-webkit-linear-gradient(right, blue, lightblue);'></div>",
  errStatusHtml: "<div class='AutosaveMsg' style='-webkit-filter:drop-shadow(0 0 1px red); background-color: red; background:-webkit-linear-gradient(right, red, pink);'></div>",
  typingStatusHtml: "<div class='AutosaveMsg' style='-webkit-filter:drop-shadow(0 0 1px silver); background-color: #fc0; background:-webkit-linear-gradient(right, #fc0, #ff1);'></div>",
  
  enableDrag: 0,
  lastInputTime: 0,
  inputBurstStartTime: 0,
  id1: null,
  id2: null,
  textID: null,
//   prefix: '',
  lastTextContent: '',
  pagename: '',
  pagenameU: '',
	delay: 0, // in milliseconds
	url: '',
	post_str: '',
	busy: false,
	ef: null, txt: null, //lbl: null, 
	req: null, id: null,

  basetime: 0,
  
  eventCallback: {"saved": []}, // queue for callback functions on saved event

  // Set a local storage item "name" with key/value pair "key" and "value".
  // If "key" is null then the item is treated as a simple variable; otherwise it is an 
  // array. If "value" is null then the local storage is deleted in the former case; the 
  // entry is deleted in the latter case.
  setStorageByKey: function(name, key, value)
	{ 
	  if (key == null)
	  { 
			if (value == null) { localStorage.removeItem(name); }
			else
			{	localStorage.setItem(name, value); }
	  }
	  else
	  {
			var content = JSON.parse(localStorage.getItem(name));

			if (content == null) { content = new Object(); }
			if (value == null) { delete content[key]; }
			else { content[key] = value; }
			localStorage.setItem(name, JSON.stringify(content));
		}
	},

	// Get the value of key "key" in local storage item "name"
	// If "key" is null then the whole content of "name" is returned;
	getStorageByKey: function(name, key)
	{
	  if (key == null) 	{ return JSON.parse(localStorage.getItem(name)); }
	  
	  try { var value = JSON.parse(localStorage.getItem(name))[key]; }
	  catch(e) {}
	  
	  return value;
	},

  // Set a local storage recording the current time. This is to work with AutoRefresher.js
	setLastModLS: function()
	{
	  var clock = new Date();
	  AS.setStorageByKey('LastMod', AS.pagenameU, Math.round(clock.getTime()/1000));
	},

  // Receive a status code/string and reflect on the autosave html field.
	set_status: function(str)
	{
  	if (AS.status === 'Disabled') { return; }
  	
  	AS.status = str;
  	
		switch(str)
		{
			case "Saved":
				AS.txt.innerHTML = AS.savedStatusHtml;
				var as_time = AS.req.getResponseHeader("X-AutoSaveTime");
				if (AS.basetime != as_time) { AS.setLastModLS(); }
				AS.basetime = as_time;

				// If the associated view page has been opened, refresh it upon saving.
				if (typeof EditEnhanceViewWindow != "undefined")
				{
					// If the viewing page is suspended by a browser plugin and the url has been
					// replaced, security error might result due to same-origin policy
					try
					{
						var pageURL = EditEnhanceViewWindow.location.href;
						if (pageURL)
						{
							var pagename = pageURL.substr(pageURL.indexOf('=')+1).toUpperCase();
							if (pagename == AS.pagenameU) { EditEnhanceViewWindow.location.reload(); }
						}
					}
					catch(e) {}
				}

				// Saved event is open for registering callback
				// Process them here
				if (AS.eventCallback["saved"].length)
				{ AS.eventCallback["saved"].forEach(function(fn) { fn(); }); }
				
        break;
			        
			case "Autosaving":
        AS.txt.innerHTML = AS.savingStatusHtml;
				break;

			case "Typing":
        AS.txt.innerHTML = AS.typingStatusHtml;
				break;

			default: // some error
			  AS.status = 'Disabled';
        AS.txt.innerHTML = AS.errStatusHtml;// + "<span style='margin-left:25px; color: red;'>"+str+"</span>";
				var div = document.createElement("div");
				div.innerHTML = str;
        console.log("Autosave error:\n"+div.textContent);
        alert("Autosave error:\n"+div.textContent);
		}
	},

  // For async http request. This function is called automatically if working with 
  // onreadystatechange when the http response is received from the server.
	reply: function()
	{
		if (AS.req.readyState != 4)
		{
		  return;
		}
		if (AS.req.status == 200 || AS.req.status == 304)
		{
			AS.busy = false;
			AS.set_status(AS.req.responseText);
		} 
		else
		{
		  AS.status = 'Disabled';
			AS.txt.innerHTML = AS.errStatusHtml;
			console.log("Autosave error:\n"+"HTTP status: "+AS.req.status);
      alert("Autosave error:\n"+"HTTP status: "+AS.req.status);

			AS.busy = false;
		}
	},

  // Set the content of the text field to "textContent" depending on which kind of text 
  // field we are working with.
  setTextContent: function(textContent)
  {
    AS.ef.elements['text'].value = textContent;
  },

  // Return the content of the text field depending on which kind of text field we are
  // working with.
  getTextContent: function()
  {
    return AS.ef.elements['text'].value;
  },

  // See if the content of the text field has been changed since the last time 
  // the saving string is composed, i.e., make_new_post_str() is called
  // Return the text content if changed.
  //        null otherwise.
  ifTextChange: function()
  {
    var textContent = AS.getTextContent();
		if ( textContent != AS.lastTextContent )
		{
		  return textContent;
		}
    else { return null; }
  },
  
  // Compose the complete string for autosaving.
  // Return true if the text field has been changed since make_new_post_str() was last called.
  //        false otherwise.
	make_new_post_str: function()
	{	
	  var textContent = AS.ifTextChange();
    if (textContent != null)
    {
      AS.lastTextContent = textContent;
			AS.post_str = AS.lastTextContent;
      return true;
    }
    else
    {
			AS.post_str = AS.lastTextContent;
      return false;
    }
	},

  // Perform a sync saving (blocking saving) of the autosaving string. This is to be 
  // called when the page is closed with unsaved changes. The saving function 
  // AS.req.send() seems to be glitchy though in the sense that the functions following 
  // it somethings don't get executed. Moving the setLastModLS() ahead of it ensures
  // the cookie will be set, but the page might be loaded with incomplete changes when 
  // viewing since the actual last modified time is a bit later.
	saveOnUnload: function()
	{
		AS.req.open("POST",AS.url,false);
  	AS.req.setRequestHeader( "BASETIME", AS.basetime );
    AS.countBulletWriteCookie();
    AS.setLastModLS();
		AS.req.send(AS.post_str);  

/*
    // If there are & symbols, scripts after req.send will not be executed.
    // The best I can do for now is to move setLastModLS() ahead of req.send 
		if (AS.post_str.indexOf('%26') != -1) 
		{
			AS.setLastModLS();
			AS.req.send(AS.post_str);
		}
		else
		{
			AS.req.send(AS.post_str);
			AS.setLastModLS();
		}
*/
	},
	
	// Perform an async saving. If there is already an ongoing async saving, wait a short
	// period (100 ms) and check again. The saving is performed only if the text field 
	// has been changed since make_new_post_str() was last called.
	keydownSave: function()
	{ 
  	if (AS.status === 'Disabled') { return; }
  	
		AS.id1 = null;
		
		// If saving is not in progress, perform the saving procedures.
		if (!AS.busy)
		{
			AS.id2 = null;
			
			var hasNewInput = AS.make_new_post_str(); 
      if (hasNewInput == true)
			{
        // Use AJAX xml request to save the string
				AS.set_status("Autosaving");
				AS.busy = true;
				AS.req.open("POST",AS.url,true);
				AS.req.setRequestHeader( "BASETIME", AS.basetime );

				// Show saving progress
// 				AS.req.upload.onprogress = function(e)
// 				{ console.log("Saving... " + Math.round(e.loaded/e.total*100) + "%"); };

				AS.req.onreadystatechange = AS.reply;
				AS.req.send(AS.post_str);
	      AS.countBulletWriteCookie(); 
			}
			else if (AS.status != 'Init')
			{ AS.set_status("Saved"); }
		}
		else
		{	
  		// If saving is in progress, wait a short period of time and check again.
		  if (AS.id2 == null)
		  { AS.id2 = setTimeout( AS.keydownSave, 100); }
		}
	},
	
	// If new input has already been detected and the user is currently typing
	// any new keystroke counts as a new input
	onKeydown: function()
	{
		if (AS.status == 'Typing') { AS.onNewInput(); }
	},

  // On receiving new input, activate a timer for triggering the saving process
  // (keydownSave). Any new keystrokes resets this timer.
  // To handle the case that the saving time is long (a few seconds), this function gets
  // a bit complicated.
	onNewInput: function()
	{	
		if (AS.status === 'Disabled') { return; }

		// If new input hadn't been detected.
		if (AS.id1 == null)
		{
			// If no other saving process is waiting 
			// (If another saving process is already waiting, it must be performing autosaving
			// and when the process is done waiting, any new input will be saved altogether 
			// So there is no need to check new input, change status, or set timeout to trigger another saving
			// process)
  		if (!AS.busy && AS.status != 'Typing') { AS.set_status("Typing");	}
      else {}//console.log('here'); }

      // Record the starting time of the input burst        
	  	var clock = new Date();
			AS.inputBurstStartTime = clock.getTime();

			// Set a timeout for triggering the saving process.
			AS.id1 = setTimeout( AS.keydownSave, AS.delay );
		}
		// New input had been detected.
		else
		{	
			if (!AS.busy && AS.status != 'Typing') {	AS.set_status("Typing"); }
      else {}//AS.set_status("Autosaving"); }
      
			var clock = new Date();
			var inputTime = clock.getTime();

      // If a prespecified duration (60 sec) has passed since the last autosave
      if ((inputTime - AS.inputBurstStartTime) > 60000) {}
      // Else compute the time difference and delay the autosave for continuous inputs
      else
      {
				var diff = inputTime - AS.lastInputTime;
				AS.lastInputTime = inputTime;
			
				// The current key stroke is continuous typing
				if (diff < AS.delay)
				{
					// Reset the timeout for triggering the saving process.
					clearTimeout(AS.id1);
					AS.id1 = setTimeout( AS.keydownSave, AS.delay );
				}
			}
		}
	},

  // Count the number of bullets appearing before the current caret position, and then 
  // write the result to a cookie. The cookie is used for scroll positioning when browsing
	countBulletWriteCookie: function()
	{ 
    var textContent = AS.getTextContent();
    
    var caretPos = AS.text.selectionStart;
		var HTML = textContent.substring(0,caretPos);

		// Computes the number of times bullets appearing in the string "HTML".
		var numBullet = (HTML.match(/\n\*/g) || []).length + (HTML.match(/\n＊/g) || []).length +
                     (HTML.match(/\n#/g) || []).length + (HTML.match(/\n＃/g) || []).length;

    var firstChar = HTML.substring(0,1);
		if (firstChar == '*' || firstChar == '#' || firstChar == '＊' || firstChar == '＃')
		  numBullet++;

    if (numBullet != 0)
      AS.setStorageByKey('VIEW-ScrollY', AS.pagenameU, 'n'+numBullet);
	},

  fixASStatusPos: function()
	{
		// Move the saving status to the bottom left of the textarea, ASSUMING the textarea
		// height fills the browser area
		var rectObject = AS.text.getBoundingClientRect();
		var top = AS.saveStatus.style.top = window.innerHeight-30+'px';
		var left = AS.saveStatus.style.left = rectObject.left+'px';
	
		localStorage.setItem('AutosaveSymTop', top);
		localStorage.setItem('AutosaveSymLeft', left);
	},
	
	// Provide a subscribe method for registering callback on certain events.
	// Currently only saved event is supported.
  subscribe: function(event, callback)
	{
		if (AS.eventCallback[event] !== undefined)
	  {
			if (typeof callback !== "function")
			{ throw "Unexpected param: " + callback; return; }
			
			AS.eventCallback[event].push(callback);
	  }
	  else { throw "Unexpected event: " + event; return; }
	},
  
	init: function()
	{
		if ( !AS.url || !AS.delay || !document.getElementById("text") ) return;

		// Check for out-dated text. The built-in navigation mechanism "last page" of browsers
		// buffers the text content of the textarea, which of course leads to undesirable 
		// consequences. Fortunately the "true" text content can be obtained by calling
		// textContent, which is then compared with the current text in the textarea field 
		// to see if the current text is outdated/buffered.
    if (document.getElementById('text').textContent != document.getElementById('text').form.text.value)
    { location.reload(); }

    AS.pagenameU = AS.pagename.toUpperCase();
    
		AS.text = document.getElementById('text');
    AS.ef = AS.text.form;
		AS.saveStatus = document.getElementById('autosaveStatus');

    // Set cursor to move it drag is enabled.
    if (AS.enableDrag)
    { AS.saveStatus.style.cursor = 'move'; }
    
    // Read from local storage to set the saving status position
    // If not set, or the position goes out the visible area,
    // a default position is set.
    var top = localStorage.getItem('AutosaveSymTop');
		var left = localStorage.getItem('AutosaveSymLeft');
		if (AS.enableDrag && top != null &&
		    parseInt(top)>0  && parseInt(top) <window.innerHeight &&
	      parseInt(left)>0 && parseInt(left)< window.innerWidth)
		{		
			AS.saveStatus.style.top = top;
		  AS.saveStatus.style.left = left;
		}
		else
		{ AS.fixASStatusPos(); }
		
		// If drag is not enabled, auto re-position the AS status ball on
		// resizing window
		if (!AS.enableDrag)
	  { window.addEventListener('resize', AS.fixASStatusPos, false); }
		
    var clock = new Date();
    AS.basetime = Math.floor(clock.getTime()/1000);

		AS.make_new_post_str();
		AS.req = new XMLHttpRequest();

		if (!AS.req) return;
		AS.txt = AS.saveStatus;

    AS.status = 'Init';
    AS.txt.innerHTML = AS.initStatusHtml;
    
    // Set the default on/off of autosaving
    var pageLastModTime = document.getElementsByName("lastmodtime")[0].value;
		var autosaveSwitch = AS.getStorageByKey('Autosave', AS.pagenameU);
		var noWriteLongTime = (AS.basetime - pageLastModTime)/86400 > AS.saveOffDay ? true : false;
		if (noWriteLongTime || autosaveSwitch === 'off')
		{
			// If the page hasn't been updated for a long time, delete the local storage entry
			// if it's present 
			if (noWriteLongTime && autosaveSwitch)
			{ AS.setStorageByKey('Autosave', AS.pagenameU, null); }
			AS.status = 'Disabled';
			AS.txt.innerHTML = AS.disableStatusHtml;
		}
    
    // Implement drag and move of the autosaving status
    if (AS.enableDrag)
    {  
      AS.saveStatus.onmouseup = function()
      {
				var top = this.style.top;
				var left = this.style.left;
				
				localStorage.setItem('AutosaveSymTop', top);
				localStorage.setItem('AutosaveSymLeft', left);
				window.onmousemove = '';
      }
      AS.saveStatus.onmousedown = function(e)
      {
				var mouseCoordX = e.clientX;
				var mouseCoordY = e.clientY;
											
				var imgCoordX = parseInt(this.style.left);
				var imgCoordY = parseInt(this.style.top);
				
				window.onmousemove = function(e)
				{
					AS.saveStatus.style.left = imgCoordX+e.clientX-mouseCoordX+'px';
					AS.saveStatus.style.top  = imgCoordY+e.clientY-mouseCoordY+'px';
				};
				return false;
      }
    }
    
    AS.text.addEventListener("input", AS.onNewInput, false);
	}
};


window.addEventListener("load", AS.init, false);
// window.addEventListener("input", AS.onNewInput, false);
// window.addEventListener("paste", AS.onNewInput, false);
// window.addEventListener("drop", AS.onNewInput, false);

// Perform a synchronous saving if there are unsaved changes before the the page is closed
window.addEventListener("beforeunload", function(event)
{ 
  if (AS.status !== 'Disabled')// && AS.txt.innerHTML != "")
	{
    // If there is an on going saving process.
		if (AS.busy)
		{
  		// If there are more input waiting to be saved, pop up an alert
	  	// message since there seems to be no way of getting those saved automatically.
  	  if (AS.ifTextChange() != null) { event.returnValue = "Still saving..."; return; }
  	  
		  // Leaving when it's autosaving with no more inputs. Perform an additional
		  // synchronous saving anyway to make sure the saving can be completed before closing
			else
			{
			  // Make the basetime extremely large so that the saving won't fail because of 
			  // simultaneous editing; this might happen because there is already an ongoing 
			  // saving process.
        AS.basetime = '9999999999';
  	    AS.post_str = AS.lastTextContent;
			  
			  AS.saveOnUnload();
			}
		}
		
		// If new input has been detected
		else if (AS.status == 'Typing')
    {
			clearTimeout(AS.id1);
    	if (AS.make_new_post_str()) { AS.saveOnUnload(); }
		 
//      event.returnValue = "All done"; return;
    }

    else
    { 
      // This case seems to happen only during the small interval between 2 continuous 
      // saves from "double input"
			clearTimeout(AS.id2);			
      if (AS.make_new_post_str()) {	AS.saveOnUnload(); }
    }
	}
});

window.addEventListener('keydown', function()
{ 
  // Save buttons: Ctrl+s  
  if (event.keyCode == 83 && (event.ctrlKey || event.metaKey))
  {
		event.preventDefault();
		clearTimeout(AS.id1);
		AS.keydownSave();
  }
  // Toggle autosave: esc
  else if (event.keyCode == 27)
  {
    if (AS.status !== 'Disabled') 
    {
			AS.setStorageByKey('Autosave', AS.pagenameU, 'off');
			AS.status = 'Disabled';
			AS.txt.innerHTML = AS.disableStatusHtml;
    }
    else
    {
			AS.setStorageByKey('Autosave', AS.pagenameU, null);
			AS.status = 'Init';
			AS.txt.innerHTML = AS.initStatusHtml;
			AS.keydownSave();
    }
  }
}, false);

