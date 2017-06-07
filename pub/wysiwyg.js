/* 
 */

"use strict";

var wysiwyg = wysiwyg || (function()
{
  /* Dependencies */

  /* Private properties */
  var _wikitextElement;
	var _saveUrl;
	var _basetime;
	
  function get1stLIElement(element)
  {
    if (element.tagName === "LI") { return element; }
    else if (element === document.body) { return null; }
    else { return get1stLIElement(element.parentElement); }
  }

  function handleInput()
  {
    var bulletElement = get1stLIElement(event.srcElement);
    var allBullet = _wikitextElement.getElementsByTagName("LI");
    var bulletIdx = Array.prototype.indexOf.call(allBullet, bulletElement);
    var prevValue = event.prevValue.toString();
    var newValue = event.newValue.toString();

		// The last line in a bullet will be appended by a newline char
		if (prevValue.slice(-1) === "\n") { prevValue = prevValue.slice(0, -1); }
		if (newValue.slice(-1) === "\n") { newValue = newValue.slice(0, -1); }
		
    // Send a post msg to the server
    var postMsg = {};
    postMsg.bulletIdx = bulletIdx;
    postMsg.prevValue = prevValue;
    postMsg.newValue = newValue;
    postMsg = JSON.stringify(postMsg);
    console.log(postMsg);
    var req = new XMLHttpRequest();
    req.open('POST', _saveUrl, true);
		req.setRequestHeader("BASETIME", _basetime);
		req.setRequestHeader("WYSIWYG", true);
    req.send(postMsg);
    req.onreadystatechange = function()
    {
      if (this.readyState === 4 && this.status === 200)
      {
      	console.log("saved");
      }
    };
  }

  function init()
  {
// Mind the ending slash
    _saveUrl = location.href + "/autosave";
    _basetime = Math.floor(new Date().getTime()/1000);
    _wikitextElement = document.getElementById("wikitext");
    _wikitextElement.contentEditable = true;
    _wikitextElement.addEventListener("DOMCharacterDataModified", handleInput);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {};
})();
