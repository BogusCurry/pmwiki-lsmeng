/**	Utility functions for PmWiki Attachtable & AutoSave
 *	<http://www.pmwiki.org/wiki/Cookbook/Attachtable>
 *	Version: 2009-04-28
 */

function $(id) { return document.getElementById(id); }


function addEventSimple(obj,evt,fn) {
	if (obj.addEventListener) obj.addEventListener(evt,fn,false);
	else if (obj.attachEvent) obj.attachEvent('on'+evt,fn);
}

function removeEventSimple(obj,evt,fn) {
	if (obj.removeEventListener) obj.removeEventListener(evt,fn,false);
	else if (obj.detachEvent) obj.detachEvent('on'+evt,fn);
}


function sendRequest( url, callback, postData ) {
	var req = createXMLHTTPObject();
	if (!req) return;
	var method = (postData) ? "POST" : "GET";
	req.open(method,url,true);
	req.setRequestHeader( 'User-Agent', 'XMLHTTP/1.0' );
	if (postData) req.setRequestHeader( 'Content-type', 'application/x-www-form-urlencoded' );
	req.onreadystatechange = function () {
		if (req.readyState != 4) return;
		if (req.status != 200 && req.status != 304) {
			//alert('HTTP error ' + req.status);
			return;
		}
		callback(req);
	}
	if (req.readyState == 4) return;
	req.send(postData);
}

function XMLHttpFactories() {
	return [
		function () {return new XMLHttpRequest()},
		function () {return new ActiveXObject("Msxml2.XMLHTTP")},
		function () {return new ActiveXObject("Msxml3.XMLHTTP")},
		function () {return new ActiveXObject("Microsoft.XMLHTTP")}
	];
}

function createXMLHTTPObject() {
	var xmlhttp = false;
	var factories = XMLHttpFactories();
	for( var i = 0; i < factories.length; ++i ) {
		try { xmlhttp = factories[i](); }
		catch (e) { continue; }
		break;
	}
	return xmlhttp;
}
