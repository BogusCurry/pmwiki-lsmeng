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
 * Version 20170530
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
  var _inputElementLen;
  var _hyperLinkElement;
  var _selectLink;
  var _tabCount;
  var _hyperLinkElementWikiText;
  var _browseWindow;

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
        scrollPositioner.setStorageByKey('EDIT-ScrollY', 'MAIN.'+year+mon, 'n* '+clock.getDate()+', '+weekDays[clock.getDay()]);
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

    var pagename, action;
    [pagename, action] = parsePagenameAction(link);

    // If it's already edit, return it directly
    if (action === "edit") { return link; }

    // If action is present
    if (/[\?&]action=/i.test(link)) { return link.replace(action, "edit"); }
    // Else no action specified
    else { return link + '?action=edit'; }
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
      if (!match[1]) { var pagename = "Main.HomePage"; }
      else
      {
        pagename = match[3] + "." + match[4];
        var pagenameAsInURL = match[2];
      }
      if (!match[5]) { var action = "browse"; }
      else { action = match[6]; }
    }
    // Url mapping using mod_rewrite in Apache
    // pmwiki/group/page?action=xxxx
    else
    {
      match = url.match(/pmwiki\/((\w+)\/(\w+))?(\?action=(\w+))?$/i);
      if (!match[1]) { var pagename = "Main.HomePage"; }
      else
      {
        pagename = match[2] + "/" + match[3];
        pagenameAsInURL = match[1];
      }
      if (!match[4]) { var action = "browse"; }
      else { action = match[5]; }
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
      var redirectPagename = "Site/SearchE";
      var url = _url.replace(/[\?&]action=(.*)$/, "");
      var pagenameAsInURL = parsePagenameAction(url)[2];
      if (!pagenameAsInURL)
      {
        if (url.slice(-1) !== "/") { url += "/"; }
        url += redirectPagename;
      }
      else { url = url.replace(pagenameAsInURL, redirectPagename); }
      window.open(url, '_blank');
    }

    // Ctrl+cmd+r to open all recent changes
//   else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && (event.metaKey||event.altKey))
    else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && event.metaKey)
    {
      event.preventDefault();
      var redirectPagename = "Site/Allrecentchanges";
      var url = _url.replace(/[\?&]action=(.*)$/, "");
      var pagenameAsInURL = parsePagenameAction(url)[2];
      if (!pagenameAsInURL)
      {
        if (url.slice(-1) !== "/") { url += "/"; }
        url += redirectPagename;
      }
      else { url = url.replace(pagenameAsInURL, redirectPagename); }
      window.open(url, '_blank');
    }

    // Ctrl+cmd+u to open the upload page
    else if ((event.keyCode == 85||event.code=='KeyU') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var pos = _url.indexOf('?action=');
      if (pos != -1) { window.open(_url.slice(0,pos+8) + 'upload', '_blank'); }
      else { window.open(_url + '?action=upload', '_blank'); }
    }

    // Ctrl+cmd+h to open the history
    else if ((event.keyCode == 72||event.code=='KeyH') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var pos = _url.indexOf('?action=');
      if (pos != -1) { window.open(_url.slice(0,pos+8) + 'diff', '_blank'); }
      else { window.open(_url + '?action=diff', '_blank'); }
    }

    // Ctrl+cmd+b to open the backlink
    else if ((event.keyCode == 66||event.code=='KeyB') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var redirectPagename = "Site/Search?action=search&q=link=" + _pagename;
      var url = _url.replace(/[\?&]action=(.*)$/, "");
      var pagenameAsInURL = parsePagenameAction(url)[2];
      if (!pagenameAsInURL)
      {
        if (url.slice(-1) !== "/") { url += "/"; }
        url += redirectPagename;
      }
      else { url = url.replace(pagenameAsInURL, redirectPagename); }
      window.location = url;
    }

    // Ctrl+cmd+a to open the attribute
    else if ((event.keyCode == 65||event.code=='KeyA') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var pos = _url.indexOf('?action=');
      if (pos != -1) { window.open(_url.slice(0,pos+8) + 'attr', '_blank'); }
      else { window.open(_url + '?action=attr', '_blank'); }
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

      // judge from the url to tell whether this is edit or browse
      var url = window.location.href;
      var action = "browse";
      if (/[\?&]action=edit/i.test(url)) { action = "edit"; }

      // If the current action is edit
      if (action === "edit")
      {
        // Leave if textElement is not the focused element
        if (document.getElementById("text") !== document.activeElement) { return; }

        // If a window has been opened, leave
        if (_browseWindow && !_browseWindow.closed) { return; }

        // Declare a global property to keep track of whether the associated view page has
        // been opened. This is to work with autosave.js to auto refresh the view page.
        if ((event.ctrlKey && event.metaKey) || (event.ctrlKey && event.altKey))
        { _browseWindow = window.open(url.replace(/[\?&]action=edit/i,''), '_blank'); }
        else { window.location = url.replace(/[\?&]action=edit/i,''); }
      }
      // The current action is browse
      else
      {
        // Leave if document body is not focused
        if (document.body !== document.activeElement) { return; }

        // If a window has been opened, leave
        if (_browseWindow && !_browseWindow.closed) { return; }

        if ((event.ctrlKey && event.metaKey) || (event.ctrlKey && event.altKey))
        { _browseWindow = window.open(url + '?action=edit', '_blank'); }
        else { window.location = url + '?action=edit'; }
      }
    }

    // Handle the enter key press when a link is selected; simply call the onmouseup routine
    // since the procedure is completely the same
    else if (_action != 'edit' && event.keyCode == 13 && !event.altKey && _selectLink)
    { handleGoToLink(event); }
  });

  // Return the window object of the corresponding browse page if opened
  function getBrowseWindow() { return _browseWindow; }

  // Reveal public API
  var returnObj =
  {
    getBrowseWindow: getBrowseWindow
  };
  return returnObj;
})();
