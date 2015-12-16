/**	Part of PmWiki AutoSave
 *	<http://www.pmwiki.org/wiki/Cookbook/AutoSave>
 *	Copyright 2009 Eemeli Aro <eemeli@gmail.com>
 *	Version: 2009-05-28
 */

var AS = {
	delay: 0, // in seconds
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
	make_new_post_str: function() {
		var fe = { 'hidden':'', 'text':'', 'textarea':'' };
		var a = new Array();
		var c = 0, j = 0;
		for ( var i in AS.ef.elements ) {
			var el = AS.ef.elements[i];
			if ( el.type in fe ) {
				a[j++] = el.name + '=' + encodeURIComponent(el.value);
				if ( el.value != el.defaultValue ) {
					++c;
					el.defaultValue = el.value;
				}
			}
		}
		if (!c) return false;
		AS.post_str = a.join('&');
		return true;
	},
	set_status: function(str) {
		switch(str) {
			case "ok":
				AS.ts = new Date();
				var as_action = AS.req.getResponseHeader("X-AutoSaveAction"),
				    as_pn = AS.req.getResponseHeader("X-AutoSavePage"),
				    as_time = AS.req.getResponseHeader("X-AutoSaveTime");
				if (as_action) AS.ef.action = as_action;
				if (as_pn) AS.ef.n.value = as_pn;
				if (as_time) AS.ef.basetime.value = as_time;
				// fallthrough
			case undefined:
				if (AS.ts) {
/* Meng: Uncomment the following (show the last modified time). Pretty annoying in my opinion. */
				//	AS.status = "Draft autosaved at ";
				//	if (AS.ts.toLocaleFormat) AS.status += AS.ts.toLocaleFormat("%H:%M");
				//	else AS.status += AS.ts.getHours() + ':' + AS.ts.getMinutes();
				//	AS.status += " (" + AS.pretty_time() + ')';
				} else AS.status = "Autosave enabled";
				break;
			default: // some error
				if ( str.toLowerCase().indexOf("autosave") == -1 ) str = "Autosave: " + str;
				AS.status = str;
				clearInterval(AS.id);
				if (AS.cb) {
					AS.cb.checked = false;
					AS.cb.disabled = true;
				}
				if (AS.lbl) AS.lbl.title = "<span  style='background-color: red; color: white;'>Autosave disabled (error!)</span>";
		}
		AS.txt.innerHTML = AS.status;
	},

	reply: function() {
		if (AS.req.readyState != 4) return;
		if (AS.req.status == 200 || AS.req.status == 304) {
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

	save: function() {
		if ( !AS.busy && AS.make_new_post_str() ) {
			AS.txt.innerHTML = "Autosaving...";
			AS.busy = true;
			AS.req.open("POST",AS.url,true);
			AS.req.setRequestHeader( "User-Agent", "XMLHTTP/1.0" );
			AS.req.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
			AS.req.onreadystatechange = AS.reply;
			AS.req.send(AS.post_str);
		} else AS.set_status();
	},
	get_cookie: function() {
		var m = document.cookie.match("(?:^|;) *autosave=([^;]*)");
		return m ? m[1] : null;
	},
	set_cookie: function(value) {
		var date = new Date();
		date.setTime( date.getTime() + (30*24*60*60*1000) );
		document.cookie = "autosave="+value+"; expires="+date.toGMTString()+"; path=/";
	},
	ctrl: function() {
		clearInterval(AS.id);
		if ( !AS.cb || AS.cb.checked ) {
			//AS.txt.innerHTML = "Autosave enabled";
			if (AS.lbl) AS.lbl.title = "Disable autosave";
			AS.id = setInterval( AS.save, AS.delay * 1000 );
			AS.save();
		} else {
			AS.txt.innerHTML = "<span  style='background-color: red; color: white;'>Autosave disabled</span>";
			if (AS.lbl) AS.lbl.title = "Enable autosave";
		}
	},
	init: function() {
		if ( !AS.url || !AS.delay || !$("text") ) return;
		AS.ef = $("text").form;
		AS.make_new_post_str();
		AS.req = createXMLHTTPObject();
		if (!AS.req) return;
		AS.cb = $("autosave-cb"); AS.lbl = $("autosave-label"); AS.txt = $("autosave-status");
		addEventSimple( AS.ef, "submit", function() { clearInterval(AS.id); } );
		if (AS.cb) {
			addEventSimple( AS.cb, "click", function() { AS.ctrl(); AS.set_cookie( AS.cb.checked ? '1' : '0' ); } );
			var asc = AS.get_cookie();
			if (asc!==null) AS.cb.checked = (asc=='1') ? true : false;
		}
		AS.ctrl();
	}
};
addEventSimple( window, "load", AS.init );

