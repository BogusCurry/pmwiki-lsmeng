/**	Part of PmWiki AutoSave
 *	<http://www.pmwiki.org/wiki/Cookbook/AutoSave>
 *	Copyright 2009 Eemeli Aro <eemeli@gmail.com>
 *	Version: 2009-05-28
 */

var AS = 
{
  outputStr: '',
  lastInputTime: 0,
  id1: null,
  id2: null,
  prefix: '',
	delay: 0, // in milliseconds
	url: '',
	post_str: '',
	busy: false,
	ef: null, cb: null, lbl: null, txt: null,
	req: null, id: null, ts: null, status: '',
	pretty_time: function() {
		var diff = ((new Date()) - AS.ts) / 1e3 + 1,
			u = [ "seconds", "minutes", "hours" ],
			s = [ 1, 60, 60, 1e9];
		if (diff<2) return "just now";
		for (var i in s) if ( (diff/=s[i]) < 2 ) return ~~(diff*=s[i])+" "+u[i-1]+" ago";
	},
	
	set_status: function(str)
	{
//  	if (!AS.cb.checked) { return; }
  	 
		switch(str)
		{
			case "ok":
        AS.status ="<span  style='background-color: lightgreen; color: black;'>Saved</span><br>" + AS.outputStr;

				AS.ts = new Date();
				var as_action = AS.req.getResponseHeader("X-AutoSaveAction"),
				    as_pn = AS.req.getResponseHeader("X-AutoSavePage"),
				    as_time = AS.req.getResponseHeader("X-AutoSaveTime");
				if (as_action) AS.ef.action = as_action;
				if (as_pn) AS.ef.n.value = as_pn;
				if (as_time) AS.ef.basetime.value = as_time;

        break;
   
			case "Autosaving...":
        AS.status ="Autosaving...<br>"+AS.outputStr;
				break;

			case "Typing...":
        AS.status ="Typing...<br>"+AS.outputStr;
				break;

			default: // some error
  			AS.status = "<br>"+str;
  			AS.outputStr = str;
/*
				AS.ts = new Date();
				var as_action = AS.req.getResponseHeader("X-AutoSaveAction"),
				    as_pn = AS.req.getResponseHeader("X-AutoSavePage"),
				    as_time = AS.req.getResponseHeader("X-AutoSaveTime");
				if (as_action) AS.ef.action = as_action;
				if (as_pn) AS.ef.n.value = as_pn;
				if (as_time) AS.ef.basetime.value = as_time;
*/
        break;

/*
        AS.status ="<span  style='background-color: red; color: white;'>"+str+"</span>";
				if (AS.cb)
				{
					AS.cb.checked = false;
					AS.cb.disabled = true;
				}
*/
		}
    AS.txt.innerHTML = AS.status;
	},

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

	make_new_post_str: function()
	{
		var el = AS.ef.elements['text'];
    
    // Compose the complete saving string.
		AS.post_str = AS.prefix+AS.ef.elements['basetime'].value+'&text='+encodeURIComponent(el.value);

    // See if the text has been changed
		if ( el.value != el.defaultValue )
		{
			el.defaultValue = el.value;
	  	return true;
		}
    else { return false; }
	},

	blockingSave: function()
	{
		var req = createXMLHTTPObject();
		req.open("POST",AS.url,false);
		req.setRequestHeader( "User-Agent", "XMLHTTP/1.0" );
		req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
		req.send(AS.post_str);
	},
	
	keydownSave: function()
	{ 
//  	if (!AS.cb.checked) { return; }
  	
		AS.id1 = null;
		
		// If saving is not in progress, perform the saving procedures.
		if (!AS.busy)
		{
			AS.id2 = null;
			
			var hasNewInput = AS.make_new_post_str(); 
      if (hasNewInput == true)
			{ 
				AS.set_status("Autosaving...");
				
				AS.busy = true;
				AS.req.open("POST",AS.url,true);
				AS.req.setRequestHeader( "User-Agent", "XMLHTTP/1.0" );
				AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				AS.req.onreadystatechange = AS.reply;
				AS.req.send(AS.post_str);
			}
//			else { AS.set_status("ok"); }
		}
		// If saving is in progress, wait a short period of time and check again.
		else { AS.id2 = setTimeout( AS.keydownSave, 100); }
	},
	
	// If new input has already been detected and the user is currently typing
	// any new keystroke counts as a new input
	onKeydown: function()
	{
		if (AS.status == "Typing...") { AS.onNewInput(); }
	},

	onNewInput: function()
	{
		if (!AS.busy)
		{	
			var el = AS.ef.elements['text'];	
		  if ( el.value != el.defaultValue )
		  {
				AS.busy = true;
				AS.req.open("POST",AS.url,true);
				AS.req.setRequestHeader( "User-Agent", "XMLHTTP/1.0" );
				AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				AS.req.onreadystatechange = AS.reply;
				AS.req.send(AS.prefix+AS.ef.elements['basetime'].value+'&text='+encodeURIComponent('SAVE'+AS.ef.elements['text'].value));
			}
		}

//		if (!AS.cb.checked) { return; }
		
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
				if (!AS.busy) {	AS.set_status("Typing...");	}

				// Set a timeout for triggering the saving process.
				AS.id1 = setTimeout( AS.keydownSave, AS.delay );
			}
		}
		// New input had been detected.
		else
		{	
			if (!AS.busy) {	AS.set_status("Typing...");	}
			
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

	init: function()
	{
		if ( !AS.url || !AS.delay || !$("text") ) return;
		AS.ef = $("text").form;
		AS.prefix = 'action=edit&n='+AS.ef.elements['n'].value+'&basetime=';
		AS.make_new_post_str();
		AS.req = createXMLHTTPObject();
		if (!AS.req) return;
		AS.txt = $("autosave-status");

		AS.lbl = $("autosave-label");
		AS.cb = $("autosave-cb");		
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
addEventSimple( window, "keydown", AS.onKeydown );

window.onbeforeunload = function()
{	
  if (AS.cb.checked && AS.status != "")
	{
		// If there is another saving processing waiting to be executed, pop up
		if (AS.busy)
		{
			var el = AS.ef.elements['text'];	
		  if ( el.value != el.defaultValue )
		  {
		  	return "Still saving...";
		  }
			else
			{
  			AS.make_new_post_str(); 
				AS.blockingSave();
			}
		}
		else if (AS.status == "Typing...")
    {
    	AS.make_new_post_str(); 
	  	AS.blockingSave();
    }
	}
}

