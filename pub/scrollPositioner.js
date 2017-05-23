/* 
* Read and set cookies (local storage) for storing last scroll and caret positions.
*
* This also works with 'autosave.js',
* which sets a cookie storing the number of bullets before the caret position when
* performing autosave. When browsing, scrollPositioner reads the cookie and tries to
* locate the position in page HTML corresponding to that stored in the cookie. Once
* found, a special html string is dynamically inserted as an anchor for scrolling.
*
* When browsing, this class also implements a mechanism in which if enter is
* pressed with texts selected, the number of bullets before the selected text
* is calculated, and a corresponding cookie is set. The editing page will be opened
* automatically in a new tab.
*
* When editing, this class reads the aforementioned cookie (if exists) and tries to
* locate the position in textarea corresponding to that given in the cookie. Once
* found, a special html string is dynamically inserted as an anchor for scrolling. To
* achieve this, however, the textarea has to be dynamically changed to a div component.
* After the scrolling, the textarea is changed back.
*
* Before closing, the width of the textarea will be stored in a cookie, for the server
* side to read and set an approximate height for the textarea later. This significantly
* speeds up setting the textarea height.
*
* Cookies have been replaced with local storages except textAreaWidth, which has to be
* sent to the server side.
*
* Copyright 2017 Ling-San Meng (f95942117@gmail.com)
* Version 20170523
*/

"use strict";

var scrollPositioner = scrollPositioner || (function()
{
  /* Dependencies */
  var _imgfocus = window.imgfocus;

  /* Private properties */
  var _isInit = false;
  var _isBrowsing = false;
  var _OS = "";
  var _textElement, _wikitextElement;
  var _pagename;
  var _action;
  var _isDiaryPage;
  var _hash;
  var _url;

  // Queue for callback functions on "image remove" event
  var _eventCallback = {"init": []};

  // Set a local storage item "name" with key/value pair "key" and "value".
  // If "key" is null then the item is treated as a simple variable; otherwise it is an
  // array. If "value" is null then the local storage is deleted in the former case; the
  // entry is deleted in the latter case.
  function setStorageByKey(name, key, value)
  {
    if (key == null)
    {
// DEBUG
      alert("Empty key (pagename)!"); throw "Empty key (pagename)!"; return;

// Check if the content is nonempty first. If yes, don't overwrite
//       if (value == null) { localStorage.removeItem(name); }
//       else
//       { localStorage.setItem(name, value); }
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

  // Get the value of the cookie "name"
  // Return the cookie value if it exists.
  //        an empty string otherwise.
  function getCookie(name)
  {
    if (document.cookie.length>0)
    {
      var start = document.cookie.indexOf(name + "=");
      if (start != -1)
      {
        start = start + name.length+1;
        end = document.cookie.indexOf(";", start);
        if (end == -1) { end = document.cookie.length; }
        return unescape(document.cookie.substring(start, end));
      }
    }

    return "";
  }

  // Set a cookie with the given name/value.
  function setCookie(name, value) { document.cookie = name + "=" + escape(value); }

  // Delete the cookie "name"
  function delCookie(name)
  {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    document.cookie = name + "=;expires=" + exp.toGMTString();
  }

/* The following is for scroll positioning */
/****************************************************************************************/

  // Set the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different. Currently they are the same.
  // The 0 timeout is a bug fix for Chrome; otherwise it's not working.
  function setScrollPos(y)
  {
    if (_action == 'edit') { _textElement.scrollTop = y; }
    else { setTimeout(function(){ document.body.scrollTop = y; }, 0); }
  }

  // Get the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different. Currently they are the same.
  function getScrollPos()
  {
    if (_action == 'edit') { return _textElement.scrollTop; }
    else { return document.body.scrollTop; }
  }

  // Record the current scroll position in local storage. The scroll positions for
  // browsing and editing pages are stored separately. If null is passed then the entry is
  // deleted. If the current scroll position is 0, the entry is also deleted.
  function setScrollPosLS(value)
  {
    if (_isBrowsing == false) { var name = 'EDIT-ScrollY'; }
    else { var name = 'VIEW-ScrollY'; }

    value = value===null ? value : getScrollPos();
    value = value==0 ? null : value;
    setStorageByKey(name, _pagename, value);
    return value;
  }

  // Return the scroll position stored in local storage based on the current action.
  function getScrollPosLS()
  {
    if (_isBrowsing == false) { var name = 'EDIT-ScrollY'; }
    else { var name = 'VIEW-ScrollY'; }

    return getStorageByKey(name, _pagename);
  }

/* The following is for caret positioning */
/****************************************************************************************/

  // Get & set the caret position. Depending on the current editing mechanism (codemirror,
  // div with content editable, legacy textarea), the methods are different.
  function getCaretPos() { return _textElement.selectionStart; }
  function setCaretPos(caret, caret2)
  {
    if (caret == null || caret2 == null) { return; }
    _textElement.selectionStart = caret;
    _textElement.selectionEnd = caret2;
  }

  // Record the current caret position in cookie. If the current caret position is 0, the
  // entry is deleted.
  function setCaretPosLS(value)
  {
    value = value===null ? value : getCaretPos();
    value = value==0 ? null : value;
    setStorageByKey('Caret', _pagename, value);
  }

  // Read from local storage to get the last caret position.
  function getCaretPosLS()
  { return getStorageByKey('Caret', _pagename); }

/****************************************************************************************/

  // When browsing,
  // If a hash element has been set, scroll to it.
  // Otherwise based on the given value, scroll to the value directly, or to the position
  // corresponding to the nth bullet in case "value" begins with "n".
  // The bullet is computed and set by autosave.js
  function setScrollFromEdit(value)
  {
    if (_hash)
    {
      var idName = _hash.slice(1);
      var idElement = document.getElementById(idName);
      if (!idElement) { return; }
      // If the parent element of the hash tag is a bullet, scroll to the bullet and
      // highlight it; otherwise simply scroll to the tag
      var bulletObj = idElement.parentElement;
      if (!bulletObj || bulletObj.nodeName != "LI") { bulletObj = idElement; }
    }
    else
    {
      if (value == null) { return; }
      else if (String(value).substring(0,1) != 'n') { setScrollPos(value); return; }
      else { value = value.slice(1); }

      // Get timestamp, if expired then return
      //     var clock = new Date();
      //     var timeDiff = Math.floor(clock.getTime()/1000) - getStorageByKey('LastMod', _pagename);
      //     if (timeDiff > 600) { return; }

      var numBullet = value;
      var bulletObj = _wikitextElement.getElementsByTagName("li")[numBullet-1];

      // Leave if undefined; no bullets at all
      if (typeof bulletObj === 'undefined') { return; }
    }

    highlightScroll(bulletObj);
  }

  // Highlight the given element "bulletObj" for a short period of time and scroll into
  // view that element with a slight adjustment.
  function highlightScroll(bulletObj)
  {
    if (!bulletObj) { return; }

    bulletObj.style.backgroundColor = 'yellow';

    // Remove the highlight after 1 sec
    setTimeout(function()
    {
      bulletObj.style.webkitTransition = 'background-color 1s ease';
      bulletObj.style.backgroundColor = '';
    }, 1000);

    var screenHeightAdj = window.innerHeight/3;
    var idPosRelBrowser = bulletObj.getBoundingClientRect().top;
    var pos = Math.round(idPosRelBrowser - screenHeightAdj + document.body.scrollTop);
    setScrollPos(pos);
  }

  // Return the character offset of the "numBullet"-th bullet in string "HTML".
  // A bullet is characterized by the pattern "\n*" or "\n#"
  // "isFirstLineBullet" is the character offset of the very 1st bullet with no newline
  // character right before it, and is -1 if nonexistent.
  function computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet)
  {
    var charOffset;

    if (numBullet == 1)
    {
      if (isFirstLineBullet != -1) { charOffset = isFirstLineBullet; }
      else
      {
        // Get the first occurence of "\n*" or "\n#"
        charOffset = HTML.indexOf("\n*");
        if (charOffset == -1) { charOffset = HTML.indexOf("\n#"); }
        if (charOffset == -1) { alert('Unexpected case!'); }
      }
    }
    else
    {
      // Get the numBullet occurrence of "\n*" or "\n#"
      if (isFirstLineBullet != -1) { numBullet = numBullet - 1; }

      charOffset = nthIndex(HTML, "\n*", "\n#", numBullet);
    }

    return charOffset + 1;
  }

  // When browsing, if enter is pressed with texts selected, the caret position will
  // be computed and stored in a cookie. The editing page will be opened in a new tab
  // automatically with scroll and caret situated at the beginning of the selected bullet.
  // Also called the "Edit here" mechanism.
  // In addition, for the mechanism of "editing today", the stored value will be of the
  // form "n* date, WeekDay". In this case, simply find the character offset of it and
  // scroll there. This mechanism works with pageCommand.js
  function setScrollFromBrowse(value)
  {
    // The number of bullets appearing before the selected text.
    var numBullet = value;

    // Compute the caret offset given 'numBullet'.
    var HTML = _textElement.textContent;

    // This is for the editing today mechanism
    if (numBullet[0] == '*')
    {
      // Calculate its char offset
      var pos = HTML.indexOf(numBullet);
      var pos2 = HTML.indexOf("\n\n", pos);
    }
    // Else, this is for editing the selected text
    else
    {
      var isFirstLineBullet = -1;
      if (HTML.substring(0,1) == '*' || HTML.substring(0,1) == '#')
      { isFirstLineBullet = 0; }

      var pos = computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet);
      var pos2 = HTML.indexOf("\n",pos);
      if (pos2 == -1) { pos2 = pos+1; }
    }

    // It turns out that Chrome will scroll automatically by first setting the caret
    // position then focusing. For some reason, highlighting a line then focusing
    // work on MAC but not on Windows. For compatibility, break this into 2 parts.
    _textElement.blur();
    setCaretPos(pos, pos);
    _textElement.focus();
    setCaretPos(pos, pos2);
  }

  // Adjust the height of the text element based on the current window size
  function fixTextareaHeight()
  {
    // Check if the textarea height is correct; if not then adjust
    var rectObject = _textElement.getBoundingClientRect();
    var correctTextAreaHeight = window.innerHeight - rectObject.top-4;
    if (parseInt(_textElement.style.height) != correctTextAreaHeight)
    { _textElement.style.height = correctTextAreaHeight + 'px'; }
  }

  // Get the indexOf the nth occurrence of either "pat1" or "pat2"
  function nthIndex(str, pat1, pat2, n)
  {
    var L= str.length, i= -1;
    while(n-- && i++<L)
    {
      var pos1 = str.indexOf(pat1, i);
      var pos2 = str.indexOf(pat2, i);

      // If i j both found, take the smaller one
      if (pos1 != -1 && pos2 != -1)
      { i = Math.min(pos1,pos2); }

      // if only i found, work with i
      else if (pos1 != -1 && pos2 == -1)
      { i = pos1; }

      // if only j found, work with j
      else if (pos1 == -1 && pos2 != -1)
      { i = pos2; }

      // nothing, break
      else { break; }
    }

    return i;
  }

  // The function to call before closing the page. Store the current scroll and caret
  // position in local storage.
  function setScrollAndCaretPosCookie()
  {
    // Remove the LS data if the page text contains only the delete keyword
    if (_action === 'edit' && _textElement.value.trim().toLowerCase() === 'delete')
    {
      setScrollPosLS(null);
      setCaretPosLS(null);
    }
    else
    {
      var scrollPos = getScrollPosLS();
      // If the page has not been modified, record the scroll posotion
      if (String(scrollPos).substring(0,1) !== 'n') { scrollPos = setScrollPosLS(); }

      // The missing caret position problem...
      // It seems that sometimes when before the event beforeunload triggers, selectionStart
      // will unexpectedly return a value of 0 while in fact it's not. There is no way
      // to tell that a value of 0 is genuine or an unexpected one. The temp solution is
      // to also check the scroll position, and accept a caret position of 0 only if the
      // scroll position is also 0.
      if (_action === 'edit')
      {
        var caretPos = getCaretPos();
        if (caretPos == 0 && scrollPos == null) { caretPos = null; }
        if (caretPos != 0 || caretPos == null)
        { setStorageByKey('Caret', _pagename, caretPos); }

        // Record the window height.
        var rectObject = _textElement.getBoundingClientRect();
        var value = window.innerHeight - rectObject.top-4;
        var name = 'textAreaHeight';
        setCookie(name, value);
      }
    }
  }

  // Wait for the LATEX rendering to complete then call setScrollFromEdit();
  function waitLatexThenSetScroll(value)
  {
    // See if latex related markup and MathJax are both present
    var HTML = _wikitextElement.innerHTML;
    if ((/\{\$[^\n]+?\$\}/.test(HTML) ||
    HTML.lastIndexOf('<span class="MathJax_Preview">') !== -1) && MathJax && MathJax.Hub)
    {
      console.log("MathJax and markup both present. Register with MathJax");
      MathJax.Hub.Queue(function ()
      {
        console.log("MathJax onload; Scroll adjust Pos");
        setScrollFromEdit(value);
      });
    }
    else
    {
      console.log("No MathJax/markup. Scroll directly");
      setScrollFromEdit(value);
    }
  }

  // Currently only init event is open for registering, and only one callback
  // is supported. This is exclusively written for searchReplace.js
  // Can be expanded in the future.
  function subscribe(event, callback)
  {
    if (_eventCallback[event] !== undefined)
    {
      if (typeof callback !== "function")
      { throw "Unexpected param: " + callback; return; }

      _eventCallback[event].push(callback);
      return callback;
    }
    else { throw "Unexpected event: " + event; return; }
  }

  function isInit() { return _isInit; }

  function init()
  {
    // Determine the _OS
    if (window.navigator.platform === "Win32") { _OS = "Windows"; }
    else if (window.navigator.platform === "MacIntel") { _OS = "Mac"; }
    else { alert("Undefined OS!"); return; }

    // Record and remove hash tag if present
    _url = window.location.href;
    var match = _url.match(/#.+$/i);
    if (match)
    {
      _hash = match[0];
      window.location.href = _url.replace(_hash,"#");
      _url = _url.replace(_hash,"");
    }

    var match = _url.match(/pmwiki\.php(\?n=([\.\w]+))?([\?&]action=(\w+))?/i);
    if (!match[1]) { _pagename = "Main.HomePage"; }
    else { _pagename = match[2]; }
    if (!match[3]) { _action = "browse"; }
    else { _action = match[4]; }

    _pagename = _pagename.toUpperCase();
    _action = _action.toLowerCase();

// DEBUG
    if (!_pagename) { alert("Empty pagename!"); throw "Empty pagename!"; return; }

    _isDiaryPage = scrollPositioner.isDiaryPage;
    _wikitextElement = document.getElementById('wikitext');
    _textElement = document.getElementById('text');

    if (_action == 'browse')
    {
      _isBrowsing = true;

      // Read from the local storage to set the scroll position.
      // Before any scrolling we have to wait until the latex rendering is
      // completed; otherwise the scroll is not correct.
      // If the local storage content begins with 'n', the page has just been
      // modified. Delete it in such cases.
      var value = getScrollPosLS();
      if (value != null || _hash)
      {
        // if htmlavctrl module present
        // register scroll with its videoload event
        if (window.html5AVCtrl && !html5AVCtrl.isVideoLoad())
        {
          console.log("Scroll wait for video onload");
          html5AVCtrl.subscribe("videoLoad", function()
          {
            console.log("Video onload; Scroll adjust Pos");
            waitLatexThenSetScroll(value);
          });
        }
        else
        {
          console.log("No video/video already loaded. Scroll directly");
          waitLatexThenSetScroll(value);
        }

        if (String(value).substring(0,1) == 'n') { setScrollPosLS(null); }
      }

      // When "/" is pressed, check whether texts are selected. If yes, compute the number of
      // html bullets before the selected text, record it in cookie, and then open a new tab
      // for editing.
      window.addEventListener('keydown', function()
      {
        // Spaces are all removed for comparison.
        if (event.keyCode == 191 && (event.ctrlKey || event.metaKey))
        {
          // Leave if document body is not focused
          if (document.body !== document.activeElement) { return; }

          // Remove spaces and replace special characters.
          var sel = window.getSelection();
          var selString = sel.toString().replace(/ /g,'').replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");

          if (selString == '')
          {
            if ((event.ctrlKey && _OS == 'Mac') || ((event.altKey||event.metaKey) && _OS == 'Windows'))
            { window.open(_url + '?action=edit', '_blank'); }
            else
            { window.location = _url + '?action=edit'; }
            return;
          }

          if (selString.substring(0,1) == "\n") { selString = selString.slice(1); }
          var newlinePos = selString.indexOf("\n");
          if (newlinePos != -1) { selString = selString.substring(0,newlinePos); }

          // Remove spaces and newlines, also remove all the tags except <li.
          var HTML = _wikitextElement.innerHTML.replace(/ /g,'').replace(/\n/g,'').replace(/<(?!li)[^>]*>/ig, '');

          var selStringPos = HTML.indexOf(selString);
          HTML = HTML.substring(0, selStringPos);

          if (selStringPos == -1)
          { alert('The selected string can\'t be found!'); return; }

          // This one liner is of course from the Internet. It computes the number of times
          // "<li" appears in the string "HTML".
          var numBullet = (HTML.match(/<li/g) || []).length;

          setStorageByKey('EDIT-ScrollY', _pagename, 'n'+numBullet)

          if ((event.ctrlKey && _OS == 'Mac') || ((event.altKey||event.metaKey) && _OS == 'Windows'))
          {
//             if (window.opener) { window.opener.location.reload(); }
//             else { window.open(window.location.href +'?action=edit', '_blank'); }
            window.open(_url +'?action=edit', '_blank');
          }
          else { window.location = _url + '?action=edit'; }
        }

        else
        {
          var pos = getScrollPos();

          // Fix for the page up/dn behavior on MAC
          // 30 seems to be the line height
          // Also, skip the fix is "imgfocus" recipe is currently active
          if (event.keyCode == 33 && event.altKey && !(_imgfocus && _imgfocus.popupImgElement))
          { setScrollPos(pos - window.innerHeight + 30); }
          else if (event.keyCode == 34 && event.altKey && !(_imgfocus && _imgfocus.popupImgElement))
          { setScrollPos(pos + window.innerHeight - 30); }

          // Ctrl+Alt up/dn: scroll up/dn short
          else if ((event.keyCode == 38 || event.keyCode == 40) && event.ctrlKey && event.altKey)
          { setScrollPos(pos + (event.keyCode - 39)*(30<<2)); }
        }
      });
    }

    else if (_action == 'edit')
    {
      fixTextareaHeight();

      // Check cookie. If the cookie content begins with 'n', texts from browsing have
      // just been selected for editing. Delete it and scroll to the specified position.
      // focus() is not called before setScrollFromBrowse() in order not to disturb it.
      var value = getScrollPosLS();
      value = value==null ? 0 : value;
      if (String(value).substring(0,1) != 'n')
      {
        // Note that the sequence of the following commands matters. If the caret
        // positioning comes before the focus, Chrome will scroll so that caret is
        // centered in the screen, which interferes with the setScroll command.
        _textElement.focus();
        var pos = getCaretPosLS();
        if (typeof pos == 'undefined')
        {
          var start = 0;
          var end = _textElement.value.indexOf("\n",0);
        }
        else
        {
          var start = _textElement.value.lastIndexOf("\n",pos-1)+1;
          var end = _textElement.value.indexOf("\n",pos);
        }
        end = end==-1 ? _textElement.value.length : end;
        setCaretPos(start, end);
        setScrollPos(value);
      }
      else
      {
        setScrollFromBrowse(String(value).slice(1));
        setScrollPosLS(null);
      }

      window.addEventListener('resize', fixTextareaHeight);
    }

    _isInit = true;

    // Init event is open for registering callback
    // Process them here
    if (_eventCallback["init"].length)
    { _eventCallback["init"].forEach(function(fn) { fn(); }); }
  }

  document.addEventListener('DOMContentLoaded', init);

  // Record the scroll and caret position on focusout and page close.
  //window.addEventListener("focusout", scrollPositioner.setScrollAndCaretPosCookie);
  window.addEventListener("beforeunload", setScrollAndCaretPosCookie);

  // If the user clicks a hash jump link, handle it with my recipe.
  window.addEventListener("click", function()
  {
    // Leave if the target is not a hyperlink or if shift key is pressed (for editing)
    if (event.target.tagName != "A" || event.shiftKey) { return; }

    // If there is a hash tag && the target pagename is the same page
    // then this is a hash jump within the same page
    var url = event.target.href;
    var match = url.match(/#.+$/i);
    if (match && url.replace(match[0],"") == _url)
    {
      //     event.preventDefault();
      var idElement = document.getElementById(match[0].slice(1));
      var bulletObj = idElement.parentElement;
      if (!bulletObj || bulletObj.nodeName != "LI") { bulletObj = idElement; }
      highlightScroll(bulletObj);
    }
  });

  // If the user directly makes a hash change to the url, handle it with my recipe.
  window.addEventListener("hashchange", function()
  {
    event.preventDefault();
    var url = event.newURL;
    var match = url.match(/#.+$/i);
    if (!match) { return; }
    var idElement = document.getElementById(match[0].slice(1));
    if (!idElement) { return; }
    var bulletObj = idElement.parentElement;
    if (!bulletObj || bulletObj.nodeName != "LI") { bulletObj = idElement; }
    highlightScroll();
  });

  // Reveal public API
  var returnObj =
  {
    // Properties
    isDiaryPage: 0,

    // Methods
    isInit: isInit,
    subscribe: subscribe,
    setStorageByKey: setStorageByKey
  };
  return returnObj;
})();
