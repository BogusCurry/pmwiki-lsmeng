/* 
 * Adapted from PmWiki AutoSave <http://www.pmwiki.org/wiki/Cookbook/AutoSave>
 * Autosave the input text in textarea on receiving new input. The autosaving delay
 * is configurable, and any new input within the delay extends it by resetting the timer.
 * A maximum total delay is also configurable 
 * When autosaving, the number of bullets appearing before the current caret position is 
 * calculated and stored in a cookie, which is then used for calculating the corresponding
 * scroll position when browsing this page.
 * Closing the page at any time with unsaved changes triggers a synchronous saving
 * (blocking saving). This can cause a bit unresponsiveness.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var AS = 
{
  savedStatusStr: "<span style='background-color: lightgreen;'>&nbsp;&nbsp;&nbsp;</span>",
  savingStatusStr: "<span style='background-color: yellow;'>&nbsp;&nbsp;&nbsp;</span>",
  typingStatusStr: '...',
	
  lastInputTime: 0,
  inputBurstStartTime: 0,
  id1: null,
  id2: null,
  textID: null,
  prefix: '',
  lastTextContent: '',
  pagename: '',
	delay: 0, // in milliseconds
	url: '',
	post_str: '',
	busy: false,
	ef: null, cb: null, lbl: null, txt: null,
	req: null, id: null,  status: '',
  
  basetime: 0,
	
  // Set a cookie recording the current time. This is to work with the AutoRefresher.js
	setLastModCookies: function()
	{
		cookieName = ScrollPositioner.pagename.toUpperCase() + '-LastMod';
	  var clock = new Date();
    document.cookie = cookieName + "=" + escape(Math.round(clock.getTime()/1000));
	},

  // Receive a status code/string and reflect on the autosave html field.
	set_status: function(str)
	{
  	if (!AS.cb.checked) { return; }
  	 
		switch(str)
		{
			case "ok":
        AS.status = AS.savedStatusStr;
				var as_time = AS.req.getResponseHeader("X-AutoSaveTime");
				if (AS.basetime != as_time) { AS.setLastModCookies(); }
				AS.basetime = as_time;
        break;
        
			case "Autosaving":
        AS.status = AS.savingStatusStr;
				break;

			case "Typing":
        AS.status = AS.typingStatusStr;
				break;

			default: // some error
        AS.status ="<span  style='background-color: red; color: white;'>"+str+"</span>";
				if (AS.cb)
				{
					AS.cb.checked = false;
					AS.cb.disabled = true;
				}
		}
    AS.status = AS.status + AS.MarkupToHTML();
    AS.txt.innerHTML = AS.status;
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
    // Meng. Change the "else" statement below. Now it won't stop on autosave failure.
//		else AS.set_status("Autosave failed (HTTP status " + AS.req.status + ')');
		else
		{
			AS.txt.innerHTML = "<span  style='background-color: red; color: white;'>Autosave failed (HTTP status " + AS.req.status + ')</span>';
			AS.busy = false;
		}
	},

  // Set the content of the text field to "textContent" depending on which kind of text 
  // field we are working with.
  setTextContent: function(textContent)
  {
    // Codemirror. Defunct.
		if (AS.textID.codemirror != null) {}

    // Legacy textarea.
    else if (AS.ef != null)
    {	AS.ef.elements['text'].value = textContent; }

    // Div with content editable. Defunct.
    else
    { AS.textID.innerText = textContent; }
  },

  // Return the content of the text field depending on which kind of text field we are
  // working with.
  getTextContent: function()
  {
    // Codemirror. Defunct.
		if (AS.textID.codemirror != null)
		{ return AS.textID.codemirror.getValue(); }

    // Legacy textarea.		
    else if (AS.ef != null)
    {	return AS.ef.elements['text'].value; }

    // Div with content editable. Defunct.
    else
    { return AS.textID.innerText; }
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
  	AS.post_str = AS.prefix+AS.basetime+'&text=';
  	
  	// encodeURIComponent() replace special characters including Chinese and special
  	// symbols with http symbols. The only changes that matter to me seem to be only these 
  	// two symbols though: & +
  	// Replacing encodeURIComponent() with explicit string replace could improve the 
  	// performance a little bit; however, I am not absolutely sure if this is absolutely 
  	// safe.
	  var textContent = AS.ifTextChange();
    if (textContent != null)
    {
      AS.lastTextContent = textContent;
      AS.post_str = AS.post_str + encodeURIComponent(AS.lastTextContent);
      
      return true;
    }
    else
    {
      AS.post_str = AS.post_str + encodeURIComponent(AS.lastTextContent);
      
      return false;
    }
	},

  // Perform a sync saving (blocking saving) of the autosaving string. This is to be 
  // called when the page is closed with unsaved changes. The saving function 
  // AS.req.send() seems to be glitchy though in the sense that the functions following 
  // it somethings don't get executed. Moving the setLastModCookies() ahead of it ensures
  // the cookie will be set, but the page might be loaded with incomplete changes when 
  // viewing since the actual last modified time is a bit later.
	saveOnUnload: function()
	{
		AS.req.open("POST",AS.url,false);
		AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
  
    AS.countBulletWriteCookie();
    AS.setLastModCookies();
		AS.req.send(AS.post_str);  

/*
    // If there are & symbols, scripts after req.send will not be executed.
    // The best I can do for now is to move setLastModCookies() ahead of req.send 
		if (AS.post_str.indexOf('%26') != -1) 
		{
			AS.setLastModCookies();
			AS.req.send(AS.post_str);
		}
		else
		{
			AS.req.send(AS.post_str);
			AS.setLastModCookies();
		}
*/
	},
	
	// This is used for debugging purpose.
	MarkupToHTML: function()
	{
//    var str = AS.ef.elements['text'];	
//	  var testStr = "tst";
//	  return "<br>"+str.wiki2html();
//    return "<br>"+AS.post_str;
//	  return "<br>"+encodeURIComponent(str);

  	return "";
	},
	
	
	// Perform an async saving. If there is already an ongoing async saving, wait a short
	// period (100 ms) and check again. The saving is performed only if the text field 
	// has been changed since make_new_post_str() was last called.
	keydownSave: function()
	{ 
  	if (!AS.cb.checked) { return; }
  	
		AS.id1 = null;
		
		// If saving is not in progress, perform the saving procedures.
		if (!AS.busy)
		{
			AS.id2 = null;
			
			var hasNewInput = AS.make_new_post_str(); 
      if (hasNewInput == true)
			{ 
				AS.set_status("Autosaving");
				
				AS.busy = true;
				AS.req.open("POST",AS.url,true);
				AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				AS.req.onreadystatechange = AS.reply;
				AS.req.send(AS.post_str);
	      AS.countBulletWriteCookie();
			}
			else { AS.set_status("ok"); }
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
		if (AS.status == AS.typingStatusStr) { AS.onNewInput(); }
	},

  // Just a fix for codemirror. Defunct.
  cmEnterDeleteFix: function()
  {
		if (AS.ifTextChange() != null) { AS.onNewInput(); }
  },

  // On receiving new input, activate a timer for triggering the saving process
  // (keydownSave). Any new keystrokes resets this timer.
  // To handle the case that the saving time is long (a few seconds), this function gets
  // a bit complicated.
	onNewInput: function()
	{	
		if (!AS.cb.checked) { return; }

		// If new input hasn't been detected.
		if (AS.id1 == null)
		{
			// If no other saving process is waiting 
			// (If another saving process is already waiting, it must be performing autosaving
			// and when the process is done waiting, any new input will be saved altogether 
			// So there is no need to check new input, change status, or set timeout to trigger another saving
			// process)
//			if (AS.id2 == null)
//			{
				// If not currently saving, change the status text.
				if (!AS.busy) {	AS.set_status("Typing");	}
        else { AS.set_status("Autosaving"); }

        // Record the starting time of the input burst        
				var clock = new Date();
				AS.inputBurstStartTime = clock.getTime();

				// Set a timeout for triggering the saving process.
				AS.id1 = setTimeout( AS.keydownSave, AS.delay );
//			}
// Debugging
//			else { AS.txt.innerHTML = 'Already saving'; }
		}
		// New input had been detected.
		else
		{	
			if (!AS.busy) {	AS.set_status("Typing"); }
      else { AS.set_status("Autosaving"); }
      
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
    
    var caretPos = AS.textID.selectionStart;
		var HTML = textContent.substring(0,caretPos);

		// This one liner is of course from the Internet. It computes the number of times
		// the specified string appears in the string "HTML".
		var numBullet1 = (HTML.match(/\n\*/g) || []).length;
		var numBullet2 = (HTML.match(/\n\#/g) || []).length;
		var numBullet = numBullet1+numBullet2;
		if (HTML.substring(0,1) == '*' || HTML.substring(0,1) == '#') { numBullet++; }

    if (numBullet != 0)
    {
		  cookieName = ScrollPositioner.pagename.toUpperCase() + '-ScrollY';
		  document.cookie = cookieName + "=" + escape('n'+numBullet);
    }
	},

	init: function()
	{
		if ( !AS.url || !AS.delay || !$("text") ) return;
		
		// Check for out-dated text. The built-in navigation mechanism "last page" of browsers
		// buffers the text content of the textarea, which of course leads to undesirable 
		// consequences. Fortunately the "true" text content can be obtained by calling
		// textContent, which is then compared with the current text in the textarea field 
		// to see if the current text is outdated/buffered.
    if (document.getElementById('text').textContent != document.getElementById('text').form.text.value)
    { location.reload(); }

		AS.textID = document.getElementById('text');
    AS.ef = AS.textID.form;

    var clock = new Date();
    AS.basetime = Math.floor(clock.getTime()/1000);

		AS.prefix = 'action=edit&n='+AS.pagename+'&basetime=';

		AS.make_new_post_str();
		AS.req = createXMLHTTPObject();

		if (!AS.req) return;
		AS.cb = $("autosave-cb");
		AS.lbl = $("autosave-label");
		AS.txt = $("autosave-status");

    AS.status = "Ready";
    AS.status = AS.status + AS.MarkupToHTML();	
    AS.txt.innerHTML = AS.status;

		if (AS.cb)
		{
			addEventSimple( AS.cb, "click", function() { AS.ctrl(); AS.set_cookie( AS.cb.checked ? '1' : '0' ); } );
		} 
	}
};


addEventSimple(window, "load", AS.init);
addEventSimple(window, "input", AS.onNewInput);
addEventSimple(window, "paste", AS.onNewInput);
addEventSimple(window, "drop", AS.onNewInput);
//addEventSimple( window, "keydown", AS.onKeydown );

// Perform a synchronous saving if there are unsaved changes before the the page is closed
window.addEventListener("beforeunload", function(event)
{ 
  if (AS.cb.checked && AS.status != "")
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
		  	AS.post_str = AS.prefix+AS.basetime+'&text=' + encodeURIComponent(AS.lastTextContent);
  	 
			  AS.saveOnUnload();
			}
		}
		
		// If new input has been detected
		else if (AS.status == AS.typingStatusStr)
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

// Call async save immediately on focusout
window.addEventListener('focusout', function()
{
  if (AS.cb.checked && AS.status != "")
	{
		if (AS.status == AS.typingStatusStr)
    {
			clearTimeout(AS.id1);
			AS.keydownSave();
    }
	}
}, false);

// Save buttons: F2 or alt
window.addEventListener('keydown', function()
{
  if ((event.keyCode == 18 || event.keyCode == 113) && AS.status != 'Ready')
  {
		clearTimeout(AS.id1);
		AS.keydownSave();
  }
}, false);
