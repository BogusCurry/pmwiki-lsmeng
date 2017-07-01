/* 
 * Rich page commands for pmwiki.
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170702
 */

"use strict";

var pageCommand = pageCommand || (function()
{
  /* Dependencies */
  // window.scrollPositioner;

  /* Private properties */
  var _url;
  var _pagename;
  var _action;
  var _textElement;
  var _inputElementLen;
  var _hyperLinkElement;
  var _selectLink;
  var _tabCount;
  var _hyperLinkElementWikiText;

  // Since the box element shadows the original hyperlink, the clicking behavior
  // has to be defined again. Somehow "onclick" cannot detect a click when ctrl is
  // pressed; while "onmouseup" works fine.
  function handleGoToLink(event)
  {
    if (_selectLink)
    {
      event.preventDefault();
      var link = _selectLink.href;

      if (event.shiftKey && link.match(/\/pmwiki[\.\/]/i))
      {
        link = getEditLink(link);
        link = mapSpecialEditLink(link);
      }

      var option = '_self';
      if (event.ctrlKey || event.metaKey) { option = '_blank'; }
      window.open(link, option);
    }
  }

  function mapSpecialEditLink(link)
  {
    var clock = new Date();
    var year = clock.getFullYear().toString();

    var pagenameAsInURL = parsePagenameAction(link)[2];

    if (/investment[\.\/]homepage/i.test(pagenameAsInURL))
    { link = link.replace(pagenameAsInURL, 'Investment/Journal'+year); }
    else if (/htc[\.\/]homepage/i.test(pagenameAsInURL))
    { link = link.replace(pagenameAsInURL, 'HTC/Journal'+year); }
    else if (/computerscience[\.\/]homepage/i.test(pagenameAsInURL))
    { link = link.replace(pagenameAsInURL, 'ComputerScience/Journal'+year); }
    else if (/main[\.\/]onthisday/i.test(pagenameAsInURL))
    {
      var mon = clock.getMonth()+1;
      mon = mon<10 ? '0'+mon : mon;
      link = link.replace(pagenameAsInURL, 'Main/'+year+mon);

      // Create a LS storing the wiki markup for editing today. E.g., "n* 11, Wed" for 11th
      // Wednesday. This is to work with scrollPositioner.js, which implements the mechanism
      // to scroll there when the edit page is opened.
      if (window.scrollPositioner)
      {
        var weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        scrollPositioner.setStorageByKey('EDIT-ScrollY', 'MAIN/'+year+mon, 'n* '+clock.getDate()+', '+weekDays[clock.getDay()]);
      }
    }

    else {}

    return link;
  }

  function getEditLink(link)
  {
    // Remove hash tag if present
    var match = link.match(/#.*$/);
    if (match) { link = link.replace(match[0],""); }

    var pagename, action, pagenameAsInURL;
    [pagename, action, pagenameAsInURL] = parsePagenameAction(link);

    // If it's already edit, return it directly
    if (action === "edit") { return link; }

    var pos = link.indexOf(pagenameAsInURL);
    return link.slice(0, pos + pagenameAsInURL.length) + "/edit";
  }

  // Parse the pagename and action from the given URL
  function parsePagenameAction(url)
  {
    // No url mapping using mod_rewrite in Apache
    // pmwiki.php?n=group.page?action=xxxx
    // pmwiki.php?n=group/page?action=xxxx
    // pmwiki.php/group.page?action=xxxx
    // pmwiki.php/group/page?action=xxxx
    var match = url.match(/pmwiki\.php(\?n=|\/)?((\w+)[\.\/](\w+))?([\?&]action=(\w+))?/i);
    if (match)
    {
      if (!match[1]) { var pagename = "Main/HomePage"; }
      else
      {
        pagename = match[3] + "." + match[4];
        var pagenameAsInURL = match[2];
      }
      if (!match[5]) { var action = "browse"; }
      else { action = match[6]; }
    }
    // /group/page?action=xxxx
    // /group/page/action
    else
    {
      // Get the URI with base path stripped
      var match = url.match(/https?:\/\/[^\/]+(.*)/);
      var URI = match[1];
      var pattern = new RegExp(window.pmwiki.base, "i");
      URI = URI.replace(pattern, "", URI);

      match = URI.match(/((\w+)\/(\w+))(\?action=(\w+)|\/(\w+)\/?$|\/(\w+)[\?&])?/i);
      if (!match[1]) { var pagename = "Main/HomePage"; }
      else
      {
        pagename = match[2] + "/" + match[3];
        pagenameAsInURL = match[1];
      }
      if (!match[4]) { var action = "browse"; }
      else { action = match[5] ||  match[6] || match[7]; }
    }

    return [pagename, action, pagenameAsInURL];
  }

  function init()
  {
    // Get url & remove hash tag if present
    _url = window.location.href.replace(/#.*?$/,"");

    _pagename = window.pmwiki.pagename;
    _action = window.pmwiki.action.toLowerCase();

    _inputElementLen = document.getElementsByTagName("input").length;

    _textElement = document.getElementById('text');

    _hyperLinkElement = document.links;
    var hyperLinkElementLen = _hyperLinkElement.length;
    for (var i=0;i<hyperLinkElementLen;i++)
    {
      _hyperLinkElement[i].addEventListener('click', function()
      { _selectLink = this; handleGoToLink(event); });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  window.addEventListener('keydown', function()
  {
    // On esc, if there are text/link selected, deselect them
    if (event.keyCode == 27 && _action == 'browse')
    {
      var selString = window.getSelection();
      if (selString != '') selString.removeAllRanges();
      if (_selectLink) { _selectLink.blur(); }
    }

    // Ctrl+cmd+f or +z to open search in a new tab
    else if ((event.keyCode == 70||event.code=="KeyF") && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var pagenameAsInURL = parsePagenameAction(_url)[2];
      var pos = _url.indexOf(pagenameAsInURL);
      var url = _url.slice(0, pos);
      window.open(url + "Site/SearchE");
    }

    // Ctrl+cmd+r to open all recent changes
    else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && (event.metaKey||event.altKey))
//     else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && event.metaKey)
    {
      event.preventDefault();
      var pagenameAsInURL = parsePagenameAction(_url)[2];
      var pos = _url.indexOf(pagenameAsInURL);
      var url = _url.slice(0, pos);
      window.open(url + "Site/Allrecentchanges");
    }

    // Ctrl+cmd+u to open the upload page
    else if ((event.keyCode == 85||event.code=='KeyU') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var pagenameAsInURL = parsePagenameAction(_url)[2];
      var pos = _url.indexOf(pagenameAsInURL);
      var url = _url.slice(0, pos + pagenameAsInURL.length);
      window.open(url + "/upload");
    }

    // Ctrl+cmd+h to open the history
    else if ((event.keyCode == 72||event.code=='KeyH') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      var pagenameAsInURL = parsePagenameAction(_url)[2];
      var pos = _url.indexOf(pagenameAsInURL);
      var url = _url.slice(0, pos + pagenameAsInURL.length);
      window.open(url + "/diff");
    }

    // Ctrl+cmd+b to open the backlink
    else if ((event.keyCode == 66||event.code=='KeyB') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var pagenameAsInURL = parsePagenameAction(_url)[2];
      var pos = _url.indexOf(pagenameAsInURL);
      var url = _url.slice(0, pos);
      window.location = url + "Site/Search?action=search&q=link=" + _pagename;
    }

    // Ctrl+cmd+a to open the attribute
    else if ((event.keyCode == 65||event.code=='KeyA') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      var pagenameAsInURL = parsePagenameAction(_url)[2];
      var pos = _url.indexOf(pagenameAsInURL);
      var url = _url.slice(0, pos + pagenameAsInURL.length);
      window.open(url + "/attr");
    }

    // Tab/~ to traverse the hyperlinks in the wikitext element
    else if (_action != 'edit' && _inputElementLen == 0 &&
    ((event.keyCode == 9 || event.keyCode == 192) &&
    !(event.ctrlKey || event.metaKey || event.altKey)))
    {
      event.preventDefault();

      // Some initialization
      if (_tabCount === undefined)
      {
        _tabCount = -1;
        _hyperLinkElementWikiText = [];
        for (var i=0;i<_hyperLinkElement.length;i++)
        {
          // Only capture those hyperlinks that's a children of wikitext
          if (document.getElementById('wikitext').contains(_hyperLinkElement[i]) &&
          _hyperLinkElement[i].className != 'createlink' &&
          _hyperLinkElement[i].href != "")
          { _hyperLinkElementWikiText.push(_hyperLinkElement[i]); }
        }
      }

      // Loop count for the highlighted link element
      if (event.keyCode == 9 && !event.shiftKey)
      {
        _tabCount++;
        if (_tabCount == _hyperLinkElementWikiText.length)
        { _tabCount -= _hyperLinkElementWikiText.length; }
      }
      else if (_tabCount == -1)
      { _tabCount += _hyperLinkElementWikiText.length; }
      else
      {
        _tabCount--;
        if (_tabCount < 0)
        { _tabCount += _hyperLinkElementWikiText.length; }
      }

      _selectLink = _hyperLinkElementWikiText[_tabCount];

      // Scroll in to view the link & then adjust the position a bit
      if (_selectLink)
      {
        _selectLink.scrollIntoView(true);
        var screenHeightAdj = Math.round(window.innerHeight/3);
        var idPosRelBrowser = Math.floor(_selectLink.getBoundingClientRect().top);
        screenHeightAdj = Math.max(0, screenHeightAdj - idPosRelBrowser);
        document.body.scrollTop -= screenHeightAdj;

        _selectLink.focus();
      }
    }

    // Ctrl+/ to open browse/edit page for edit/browse page
    // The 'Slash' is a fix for Yahoo Chinese input on Windows
    else if ((event.keyCode == 191 || event.code == 'Slash') && (event.ctrlKey || event.metaKey))
    {
      event.preventDefault();

      // If the current action is edit
      if (_action === "edit")
      {
        // Leave if textElement is not the focused element
        if (document.getElementById("text") !== document.activeElement) { return; }

        // Declare a global property to keep track of whether the associated view page has
        // been opened. This is to work with autosave.js to auto refresh the view page.
        if ((event.ctrlKey && event.metaKey) || (event.ctrlKey && event.altKey))
        {
          window.buddyWin = window.open(_url.replace(/[\?&]action=edit|\/edit\/?$/i,''), '_blank');
          setBuddyWinStupid(buddyWin);
        }
        else { window.location = _url.replace(/[\?&]action=edit|\/edit\/?$/i, ''); }
      }
      // The current action is browse
      else if (_action === "browse")
      {
        // Leave if document body is not focused
        if (document.body !== document.activeElement) { return; }

        if ((event.ctrlKey && event.metaKey) || (event.ctrlKey && event.altKey))
        {
          if (window.buddyWin && !buddyWin.closed)
          {
            buddyWin.location = buddyWin.location.href;
            buddyWin.focus();
            setBuddyWinStupid(buddyWin);
          }
          else
          {
            window.buddyWin = window.open(_url + '/edit', '_blank');
            setBuddyWinStupid(buddyWin);
          }
        }
        else { window.location = _url + '/edit'; }
      }
      else {}
    }

    // Handle the enter key press when a link is selected; simply call the onmouseup routine
    // since the procedure is completely the same
    else if (_action != 'edit' && event.keyCode == 13 && !event.altKey && _selectLink)
    { handleGoToLink(event); }

    // Fix for the page up/dn behavior on MAC
    // 30 seems to be the line height
    // Also, skip the fix is "imgfocus" recipe is currently active
    else if (event.keyCode == 33 && event.altKey && !(window.imgfocus && imgfocus.popupImgElement))
    { setScrollPos(getScrollPos() - window.innerHeight + 30); }
    else if (event.keyCode == 34 && event.altKey && !(window.imgfocus && imgfocus.popupImgElement))
    { setScrollPos(getScrollPos() + window.innerHeight - 30); }

    // Ctrl+Alt up/dn: scroll up/dn short
    else if ((event.keyCode == 38 || event.keyCode == 40) && event.ctrlKey && event.altKey)
    { setScrollPos(getScrollPos() + (event.keyCode - 39)*(30<<2)); }
  });

  // Get the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different. Currently they are the same.
  function getScrollPos()
  {
    if (_action == 'edit') { return _textElement.scrollTop; }
    else { return document.body.scrollTop; }
  }

  // Set the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different
  function setScrollPos(y)
  {
    if (_action == 'edit') { _textElement.scrollTop = y; }
    else { document.body.scrollTop = y; }
  }

  // This is really stupid. Appending a custom property to a given "buddyWin" window
  // object only works after that window has been loaded. But I can't find a way to know
  // when the load event of buddyWin fires.
  function setBuddyWinStupid(buddyWin)
  {
    for (let i = 0; i < 10; i++)
    { setTimeout(function() { buddyWin.buddyWin = window; }, 500 * i + 1000); }
  }

  return {};
})();
