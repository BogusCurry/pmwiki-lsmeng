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
 * Version 20170607
 */

"use strict";

var AS = AS || (function()
{
  /* Dependencies */

  /* Private properties */
	var _autosaveElement;
  var _status = '';
  var _savedStatusHtml = "<span class='savedStatus'></span>";
  var _disableStatusHtml = "<span class='disabledStatus'></span>";
  var _initStatusHtml = "";
  var _errStatusHtml = "<span class='errStatus'></span>";
  var _typingStatusHtml = '<span class="autosaveStatus"><span class="typingStatus-outer"><span class="typingStatus-inner"></span></span></span>';
  var _savingStatusHtml = '<span class="autosaveStatus"><span class="savingStatus-outer"><span class="savingStatus-inner"></span></span></span>';

  var _lastInputTime = 0;
  var _inputBurstStartTime = 0;
  var _id1 = null;
  var _id2 = null;
  var _textID = null;
  var _lastTextContent = '';
  var _pagenameU = '';
  var _post_str = '';
  var _busy = false;
  var _txt = null; //lbl = null,
  var _req = null;
  var _id = null;
	var _textElement;
  var _basetime = 0;

  var _eventCallback = {"saved": []}; // queue for callback functions on saved event

// Set a local storage item "name" with key/value pair "key" and "value".
// If "key" is null then the item is treated as a simple variable; otherwise it is an
// array. If "value" is null then the local storage is deleted in the former case; the
// entry is deleted in the latter case.
  function setStorageByKey(name, key, value)
  {
    if (key == null)
    {
      if (value == null) { localStorage.removeItem(name); }
      else
      { localStorage.setItem(name, value); }
    }
    else
    {
      var content = JSON.parse(localStorage.getItem(name));

      if (content == null) { content = new Object(); }
      if (value == null) { delete content[key]; }
      else { content[key] = value; }
      localStorage.setItem(name, JSON.stringify(content));
    }
  }

  // Get the value of key "key" in local storage item "name"
  // If "key" is null then the whole content of "name" is returned;
  function getStorageByKey(name, key)
  {
    if (key == null) { return JSON.parse(localStorage.getItem(name)); }

    try { var value = JSON.parse(localStorage.getItem(name))[key]; }
    catch(e) {}

    return value;
  }

  // Set a local storage recording the current time. This is to work with AutoRefresher.js
  function setLastModLS()
  {
    var clock = new Date();
    setStorageByKey('LastMod', _pagenameU, Math.round(clock.getTime()/1000));
  }

  // Receive a status code/string and reflect on the autosave html field.
  function set_status(str)
  {
    if (_status === 'Disabled') { return; }

    _status = str;

    switch(str)
    {
      case "Saved":
      _txt.innerHTML = _savedStatusHtml;
      var as_time = _req.getResponseHeader("X-AutoSaveTime");
      if (_basetime != as_time) { setLastModLS(); }
      _basetime = as_time;

      if (window.buddyWin && !buddyWin.closed)
      {
        buddyWin.location = buddyWin.location.href;
        setTimeout(function() { buddyWin.buddyWin = window; }, 1000);
      }

      // Saved event is open for registering callback
      // Process them here
      if (_eventCallback["saved"].length)
      { _eventCallback["saved"].forEach(function(fn) { fn(); }); }

      break;

      case "Autosaving":
      _txt.innerHTML = _savingStatusHtml;
      break;

      case "Typing":
      _txt.innerHTML = _typingStatusHtml;
      break;

      default: // some error
      _status = 'Disabled';
      _txt.innerHTML = _errStatusHtml;// + "<span style='margin-left:25px; color: red;'>"+str+"</span>";
      var div = document.createElement("div");
      div.innerHTML = str;
      console.log("Autosave error:\n"+div.textContent);
      alert("Autosave error:\n"+div.textContent);
    }
  }

  // For async http request. This function is called automatically if working with
  // onreadystatechange when the http response is received from the server.
  function reply()
  {
    if (_req.readyState != 4)
    {
      return;
    }
    if (_req.status == 200 || _req.status == 304)
    {
      _busy = false;
      set_status(_req.responseText);
    }
    else
    {
      _status = 'Disabled';
      _txt.innerHTML = _errStatusHtml;
      console.log("Autosave error:\n"+"HTTP status: "+_req.status);
      alert("Autosave error:\n"+"HTTP status: "+_req.status);

      _busy = false;
    }
  }

  // Set the content of the text field to "textContent" depending on which kind of text
  // field we are working with.
  function setTextContent(textContent)
  {
    _textElement.value = textContent;
  }

  // Return the content of the text field depending on which kind of text field we are
  // working with.
  function getTextContent()
  {
    return _textElement.value;
  }

  // See if the content of the text field has been changed since the last time
  // the saving string is composed, i.e., make_new_post_str() is called
  // Return the text content if changed.
  //        null otherwise.
  function ifTextChange()
  {
    var textContent = getTextContent();
    if (textContent != _lastTextContent)
    {
      return textContent;
    }
    else { return null; }
  }

  // Compose the complete string for autosaving.
  // Return true if the text field has been changed since make_new_post_str() was last called.
  //        false otherwise.
  function make_new_post_str()
  {
    var textContent = ifTextChange();
    if (textContent != null)
    {
      _lastTextContent = textContent;
      _post_str = _lastTextContent;
      return true;
    }
    else
    {
      _post_str = _lastTextContent;
      return false;
    }
  }

  // Perform a sync saving (blocking saving) of the autosaving string. This is to be
  // called when the page is closed with unsaved changes. The saving function
  // _req.send() seems to be glitchy though in the sense that the functions following
  // it somethings don't get executed. Moving the setLastModLS() ahead of it ensures
  // the cookie will be set, but the page might be loaded with incomplete changes when
  // viewing since the actual last modified time is a bit later.
  function saveOnUnload()
  {
    _req.open("POST",AS.url,false);
    _req.setRequestHeader( "BASETIME", _basetime );
    countBulletWriteCookie();
    setLastModLS();
    _req.send(_post_str);

/*
    // If there are & symbols, scripts after req.send will not be executed.
    // The best I can do for now is to move setLastModLS() ahead of req.send
    if (_post_str.indexOf('%26') != -1)
    {
      setLastModLS();
      _req.send(_post_str);
    }
    else
    {
      _req.send(_post_str);
      setLastModLS();
    }
*/
  }

  // Perform an async saving. If there is already an ongoing async saving, wait a short
  // period (100 ms) and check again. The saving is performed only if the text field
  // has been changed since make_new_post_str() was last called.
  function keydownSave()
  {
    if (_status === 'Disabled') { return; }

    _id1 = null;

    // If saving is not in progress, perform the saving procedures.
    if (!_busy)
    {
      _id2 = null;

      var hasNewInput = make_new_post_str();
      if (hasNewInput == true)
      {
        // Use AJAX xml request to save the string
        set_status("Autosaving");
        _busy = true;
        _req.open("POST",AS.url,true);
        _req.setRequestHeader( "BASETIME", _basetime );

        // Show saving progress
// 				_req.upload.onprogress = function(e)
// 				{ console.log("Saving... " + Math.round(e.loaded/e.total*100) + "%"); };

        _req.onreadystatechange = reply;
        _req.send(_post_str);
        countBulletWriteCookie();
      }
      else if (_status != 'Init')
      { set_status("Saved"); }
    }
    else
    {
      // If saving is in progress, wait a short period of time and check again.
      if (_id2 == null)
      { _id2 = setTimeout( keydownSave, 100); }
    }
  }

  // If new input has already been detected and the user is currently typing
  // any new keystroke counts as a new input
  function onKeydown()
  {
    if (_status == 'Typing') { onNewInput(); }
  }

  // On receiving new input, activate a timer for triggering the saving process
  // (keydownSave). Any new keystrokes resets this timer.
  // To handle the case that the saving time is long (a few seconds), this function gets
  // a bit complicated.
  function onNewInput()
  {
    if (_status === 'Disabled') { return; }

    // If new input hadn't been detected.
    if (_id1 == null)
    {
      // If no other saving process is waiting
      // (If another saving process is already waiting, it must be performing autosaving
      // and when the process is done waiting, any new input will be saved altogether
      // So there is no need to check new input, change status, or set timeout to trigger another saving
      // process)
      if (!_busy && _status != 'Typing') { set_status("Typing"); }
      else { }//console.log('here'); }

      // Record the starting time of the input burst
      var clock = new Date();
      _inputBurstStartTime = clock.getTime();

      // Set a timeout for triggering the saving process.
      _id1 = setTimeout( keydownSave, AS.delay );
    }
    // New input had been detected.
    else
    {
      if (!_busy && _status != 'Typing') { set_status("Typing"); }
      else { }//set_status("Autosaving"); }

      var clock = new Date();
      var inputTime = clock.getTime();

      // If a prespecified duration (60 sec) has passed since the last autosave
      if ((inputTime - _inputBurstStartTime) > 60000) {}
      // Else compute the time difference and delay the autosave for continuous inputs
      else
      {
        var diff = inputTime - _lastInputTime;
        _lastInputTime = inputTime;

        // The current key stroke is continuous typing
        if (diff < AS.delay)
        {
          // Reset the timeout for triggering the saving process.
          clearTimeout(_id1);
          _id1 = setTimeout( keydownSave, AS.delay );
        }
      }
    }
  }

  // Count the number of bullets appearing before the current caret position, and then
  // write the result to a cookie. The cookie is used for scroll positioning when browsing
  function countBulletWriteCookie()
  {
    var textContent = getTextContent();

    var caretPos = _textElement.selectionStart;
    var HTML = textContent.substring(0,caretPos);

    // Computes the number of times bullets appearing in the string "HTML".
    var numBullet = (HTML.match(/\n[\*＊#＃]/g) || []).length;

    var firstChar = HTML.substring(0,1);
    if (firstChar == '*' || firstChar == '#' || firstChar == '＊' || firstChar == '＃')
    numBullet++;

    if (numBullet != 0)
    setStorageByKey('VIEW-ScrollY', _pagenameU, 'n'+numBullet);
  }

  function fixASStatusPos()
  {
    // Move the saving status to the bottom left of the textarea, ASSUMING the textarea
    // height fills the browser area
    var rectObject = _textElement.getBoundingClientRect();
    var top = _autosaveElement.style.top = window.innerHeight-30+'px';
    var left = _autosaveElement.style.left = rectObject.left+'px';

    localStorage.setItem('AutosaveSymTop', top);
    localStorage.setItem('AutosaveSymLeft', left);
  }

  // Provide a subscribe method for registering callback on certain events.
  // Currently only saved event is supported.
  function subscribe(event, callback)
  {
    if (_eventCallback[event] !== undefined)
    {
      if (typeof callback !== "function")
      { throw "Unexpected param: " + callback; return; }

      _eventCallback[event].push(callback);
    }
    else { throw "Unexpected event: " + event; return; }
  }

  function init()
  {
    if (!AS.url || !AS.delay) return;

    // Check for out-dated text. The built-in navigation mechanism "last page" of browsers
    // buffers the text content of the textarea, which of course leads to undesirable
    // consequences. Fortunately the "true" text content can be obtained by calling
    // textContent, which is then compared with the current text in the textarea field
    // to see if the current text is outdated/buffered.
    if (document.getElementById('text').textContent != document.getElementById('text').value)
    { location.reload(); }

    _pagenameU = window.pmwiki.pagename.toUpperCase();

    _textElement = document.getElementById('text');
    _autosaveElement = document.getElementById('autosaveStatus');

    // Set cursor to move it drag is enabled.
    if (AS.enableDrag)
    { _autosaveElement.style.cursor = 'move'; }

    // Read from local storage to set the saving status position
    // If not set, or the position goes out the visible area,
    // a default position is set.
    var top = localStorage.getItem('AutosaveSymTop');
    var left = localStorage.getItem('AutosaveSymLeft');
    if (AS.enableDrag && top != null &&
    parseInt(top)>0  && parseInt(top) <window.innerHeight &&
    parseInt(left)>0 && parseInt(left)< window.innerWidth)
    {
      _autosaveElement.style.top = top;
      _autosaveElement.style.left = left;
    }
    else
    { fixASStatusPos(); }

    // If drag is not enabled, auto re-position the AS status ball on
    // resizing window
    if (!AS.enableDrag)
    { window.addEventListener('resize', fixASStatusPos, false); }

    var clock = new Date();
    _basetime = Math.floor(clock.getTime()/1000);

    make_new_post_str();
    _req = new XMLHttpRequest();

    if (!_req) return;
    _txt = _autosaveElement;

    _status = 'Init';
    _txt.innerHTML = _initStatusHtml;

    // Set the default on/off of autosaving
    var pageLastModTime = document.getElementsByName("lastmodtime")[0].value;
    var autosaveSwitch = getStorageByKey('Autosave', _pagenameU);
    var noWriteLongTime = (_basetime - pageLastModTime)/86400 > AS.saveOffDay ? true : false;
    if (noWriteLongTime || autosaveSwitch === 'off')
    {
      // If the page hasn't been updated for a long time, delete the local storage entry
      // if it's present
      if (noWriteLongTime && autosaveSwitch)
      { setStorageByKey('Autosave', _pagenameU, null); }
      _status = 'Disabled';
      _txt.innerHTML = _disableStatusHtml;
    }

    // Implement drag and move of the autosaving status
    if (AS.enableDrag)
    {
      _autosaveElement.onmouseup = function()
      {
        var top = this.style.top;
        var left = this.style.left;

        localStorage.setItem('AutosaveSymTop', top);
        localStorage.setItem('AutosaveSymLeft', left);
        window.onmousemove = '';
      }
      _autosaveElement.onmousedown = function(e)
      {
        var mouseCoordX = e.clientX;
        var mouseCoordY = e.clientY;

        var imgCoordX = parseInt(this.style.left);
        var imgCoordY = parseInt(this.style.top);

        window.onmousemove = function(e)
        {
          _autosaveElement.style.left = imgCoordX+e.clientX-mouseCoordX+'px';
          _autosaveElement.style.top  = imgCoordY+e.clientY-mouseCoordY+'px';
        };
        return false;
      }
    }

    _textElement.addEventListener("input", onNewInput, false);
  }

  document.addEventListener('DOMContentLoaded', init);
// window.addEventListener("input", onNewInput, false);
// window.addEventListener("paste", onNewInput, false);
// window.addEventListener("drop", onNewInput, false);

// Perform a synchronous saving if there are unsaved changes before the the page is closed
  window.addEventListener("beforeunload", function(event)
  {
    if (_status !== 'Disabled')// && _txt.innerHTML != "")
    {
      // If there is an on going saving process.
      if (_busy)
      {
        // If there are more input waiting to be saved, pop up an alert
        // message since there seems to be no way of getting those saved automatically.
        if (ifTextChange() != null) { event.returnValue = "Still saving..."; return; }

        // Leaving when it's autosaving with no more inputs. Perform an additional
        // synchronous saving anyway to make sure the saving can be completed before closing
        else
        {
          // Make the basetime extremely large so that the saving won't fail because of
          // simultaneous editing; this might happen because there is already an ongoing
          // saving process.
          _basetime = '9999999999';
          _post_str = _lastTextContent;

          saveOnUnload();
        }
      }

      // If new input has been detected
      else if (_status == 'Typing')
      {
        clearTimeout(_id1);
        if (make_new_post_str()) { saveOnUnload(); }

//      event.returnValue = "All done"; return;
      }

      else
      {
        // This case seems to happen only during the small interval between 2 continuous
        // saves from "double input"
        clearTimeout(_id2);
        if (make_new_post_str()) { saveOnUnload(); }
      }
    }
  });

  window.addEventListener('keydown', function()
  {
    // Save buttons: Ctrl+s
    if (event.keyCode == 83 && (event.ctrlKey || event.metaKey))
    {
      event.preventDefault();
      clearTimeout(_id1);
      keydownSave();
    }
    // Toggle autosave: esc
    else if (event.keyCode == 27)
    {
      if (_status !== 'Disabled')
      {
        setStorageByKey('Autosave', _pagenameU, 'off');
        _status = 'Disabled';
        _txt.innerHTML = _disableStatusHtml;
      }
      else
      {
        setStorageByKey('Autosave', _pagenameU, null);
        _status = 'Init';
        _txt.innerHTML = _initStatusHtml;
        keydownSave();
      }
    }
  });

  // Reveal public API
  var returnObj =
  {
    // Methods
    subscribe: subscribe
  };
  return returnObj;
})();
