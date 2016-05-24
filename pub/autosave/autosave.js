/* 
 * Adapted from PmWiki AutoSave <http://www.pmwiki.org/wiki/Cookbook/AutoSave>
 * Autosave the input text in textarea on receiving new input. The delay for autosaving 
 * is configurable, and any new keystroke resets the autosave timer.
 * A special string is inserted at the caret position when autosaving to serve as the 
 * anchor for scrolling when viewing.
 * Closing the page at any time with unsaved changes invokes a synchronous saving
 * (blocking saving). This can cause a bit unresponsiveness.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var AS = 
{
  savedStatusStr: "<span  style='background-color: lightgreen;'>&nbsp;&nbsp;&nbsp;</span>",
  savingStatusStr: "<span  style='background-color: yellow;'>&nbsp;&nbsp;&nbsp;</span>",
  typingStatusStr: '...',

  noMarkPage1: 'Site.SideBar',
	noMarkPage2: 'Site.Pageactions',
	noMarkPage3: 'Site.Editform',
	noMarkPage4: 'Main.DecryptText',
	noMarkPage5: 'Main.Runcode',
	
  lastEditMark: '',
  
  lastInputTime: 0,
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
//        AS.status = "<span  style='background-color: lightgreen;'>&nbsp;&nbsp;&nbsp;</span>";
//        AS.status ="<span  style='background-color: lightgreen; color: black;'>Saved</span>";

				var 
//				as_action = AS.req.getResponseHeader("X-AutoSaveAction"),
//				    as_pn = AS.req.getResponseHeader("X-AutoSavePage"),
				    as_time = AS.req.getResponseHeader("X-AutoSaveTime");
//				if (as_action) AS.ef.action = as_action;
//				if (as_pn) AS.ef.n.value = as_pn;
//				if (as_time) AS.ef.basetime.value = as_time;

//				if (as_time)
//				{
					AS.basetime = as_time;
					AS.setLastModCookies();
//				}

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
/* Meng: Change the "else" statement below. Now it won't stop on autosave failure. */
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
		if (AS.textID.codemirror != null)
		{ }

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
  	// symbols with http symbols. The only changes that matter to me seem to be only the 
  	// two symbols: & +
	  var textContent = AS.ifTextChange();
    if (textContent != null)
    {
      AS.lastTextContent = textContent;
      AS.post_str = AS.post_str + encodeURIComponent(AS.addMark(AS.lastTextContent));
//      AS.post_str = AS.post_str + (AS.addMark(AS.lastTextContent)).replace(/&/g, '%26');
      
      return true;
    }
    else
    {
      AS.post_str = AS.post_str + encodeURIComponent(AS.addMark(AS.lastTextContent));
//      AS.post_str = AS.post_str + (AS.addMark(AS.lastTextContent)).replace(/&/g, '%26');
      
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
		AS.req.setRequestHeader( "User-Agent", "XMLHTTP/1.0" );
		AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
  
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
	
	// For debugging purpose.
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
				AS.req.setRequestHeader( "User-Agent", "XMLHTTP/1.0" );
				AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				AS.req.onreadystatechange = AS.reply;
				AS.req.send(AS.post_str);
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
			if (AS.id2 == null)
			{
				// If not currently saving, change the status text.
				if (!AS.busy) {	AS.set_status("Typing");	}
        else { AS.set_status("Autosaving"); }
        
				// Set a timeout for triggering the saving process.
				AS.id1 = setTimeout( AS.keydownSave, AS.delay );
			}
		}
		// New input had been detected.
		else
		{	
			if (!AS.busy) {	AS.set_status("Typing");	}
      else { AS.set_status("Autosaving"); }
      
			var clock = new Date();
			var inputTime = clock.getTime();
				
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
	},
	
  // Insert a special string (last edit markt) at the caret position when autosaving to 
  // serve as the anchor for scrolling when viewing. In order not to corrupt the wiki 
  // markup to html conversion, the mark must begin with an empty space. Also, depending
  // on the context where the mark is inserted, the insertion way will be a bit different.
  // This is also not to mess up the html conversion.
	addMark: function(textContent)
	{ 
// This is kinda lame. To be improved.
    var pagenameUpper = AS.pagename.toUpperCase();
	  if (pagenameUpper == AS.noMarkPage1) { return textContent; }
	  if (pagenameUpper == AS.noMarkPage2) { return textContent; }
	  if (pagenameUpper == AS.noMarkPage3) { return textContent; }
	  if (pagenameUpper == AS.noMarkPage4) { return textContent; }
	  if (pagenameUpper == AS.noMarkPage5) { return textContent; }

    if (textContent == 'delete') { return textContent; }

    var caretPos = AS.textID.selectionStart;

    // Take care of the newline markup. If the caret is right after a wiki newline markup,
    // insert the mark before it.
    if (textContent.substring(caretPos-2,caretPos) == '\\\\')
    { return [textContent .slice(0, caretPos-2), AS.lastEditMark, textContent.slice(caretPos-2)].join(''); }
    else
    {
      var preChar = textContent.substring(caretPos-1,caretPos);
      
      // Take care of the "right before a bullet" case. If the caret is right before a wiki
      // bullet markup, insert the mark after it.
      if (preChar == "\n" || preChar == '')
      {
        var nextChar = textContent.substring(caretPos,caretPos+1);
        if (nextChar == '*' || nextChar == '#')
        {
          var spacePos = textContent.substring(caretPos,caretPos+150).indexOf(' ');
          { return [textContent .slice(0, caretPos+spacePos), AS.lastEditMark, textContent.slice(caretPos+spacePos)].join(''); }
        }
        // Handle the case the caret is at the beginning of the line followed by newline.
        // Insert the mark at the end of the last line. 
        else if (preChar == "\n" && nextChar == "\n")
        { return [textContent.slice(0, caretPos-1), AS.lastEditMark+"\n", textContent.slice(caretPos)].join(''); }
      }
      
      // Take care of the hyperlink markup. If "]]" is detected within the next 150 
      // characters, and "[[" is not detected or "[[" appears later than "]]", insert 
      // the mark after "]]".
      var bracketEndPos = textContent.substring(caretPos,caretPos+150).indexOf(']]');
      if (bracketEndPos != -1)
      {
        var bracketStartPos = textContent.substring(caretPos,caretPos+150).indexOf('[[');
        if (bracketStartPos == -1 || bracketStartPos > bracketEndPos)
        { return [textContent.slice(0, caretPos+bracketEndPos+2), AS.lastEditMark, textContent.slice(caretPos+bracketEndPos+2)].join(''); }
      }

      // Take care of the latex markup and page var.
      // If "}" is detected within the next 150 
      // characters, and "{" is not detected or "{" appears later than "}", insert 
      // the mark after "}".
      var latexEndPos = textContent.substring(caretPos,caretPos+150).indexOf('}');
      if (latexEndPos != -1)
      {
        var latexStartPos = textContent.substring(caretPos,caretPos+150).indexOf('{');
        if (latexStartPos == -1 || latexStartPos > latexEndPos)
        { return [textContent.slice(0, caretPos+latexEndPos+1), AS.lastEditMark, textContent.slice(caretPos+latexEndPos+1)].join(''); }
      }

      // Default. Insert the mark at the caret position.
      return [textContent.slice(0, caretPos), AS.lastEditMark, textContent.slice(caretPos)].join('');
    }
	},
	
	// Remove the special string inserted at the last caret position when autosaving.
	removeMark: function(mark)
	{
    var textContent = AS.getTextContent();
    var pos = textContent.indexOf(mark);
		if ( pos != -1 )
		{
      var caretPos = AS.textID.selectionStart;			
      textContent = [textContent.slice(0, pos), textContent.slice(pos+mark.length)].join('');
			AS.setTextContent(textContent);
      AS.textID.selectionStart = caretPos;
      AS.textID.selectionEnd = caretPos;
//		  alert('found & removed');
		}
	},
	
	init: function()
	{
		if ( !AS.url || !AS.delay || !$("text") ) return;
		
		AS.textID = document.getElementById('text');
    AS.ef = AS.textID.form;

		AS.noMarkPage1 = AS.noMarkPage1.toUpperCase();
		AS.noMarkPage2 = AS.noMarkPage2.toUpperCase();
		AS.noMarkPage3 = AS.noMarkPage3.toUpperCase();
		AS.noMarkPage4 = AS.noMarkPage4.toUpperCase();
		AS.noMarkPage5 = AS.noMarkPage5.toUpperCase();
		AS.removeMark(AS.lastEditMark);

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
			var asc = AS.get_cookie();
			if (asc!==null) AS.cb.checked = (asc=='1') ? true : false;
		}
	}
};


addEventSimple( window, "load", AS.init );
addEventSimple( window, "input", AS.onNewInput );
//addEventSimple( window, "paste", AS.onNewInput );
addEventSimple( window, "keydown", AS.onKeydown );

/*
if (document.getElementById('text').codemirror != null)
{  
  addEventSimple( window, "keyup", AS.cmEnterDeleteFix );
	addEventSimple( window, "drop", AS.onNewInput );
}
*/

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
		  	AS.post_str = AS.prefix+AS.basetime+'&text=' + encodeURIComponent(AS.addMark(AS.lastTextContent));
//		  	AS.post_str = AS.prefix+AS.basetime+'&text=' + (AS.addMark(AS.lastTextContent)).replace(/&/g, '%26');
  	 
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
      
// I think the above is better than below and the functionality is the same. After a while
// if nothing goes wrong, delete the below.
/*
      if (AS.ifTextChange() != null)
		  {
  			clearTimeout(AS.id2);
      	AS.make_new_post_str(); 
				AS.saveOnUnload();
		  }
*/
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
