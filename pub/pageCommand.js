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
 * Version 20170520
*/

"use strict";

(function()
{
  /* Dependencies */

  /* Private properties */
  var _url;
  var _pagename;
  var _action;
  var _inputElementLen;
  var _hyperLinkElement;
  var _selectLink;
  var _tabCount;
  var _hyperLinkElementWikiText;

  // Since the box element shadows the original hyperlink, the clicking behavior
  // has to be defined again. Somehow "onclick" cannot detect a click when ctrl is
  // pressed; while "onmouseup" works fine.
  function handleGoToLink()
  {
    if (_selectLink)
    {
      event.preventDefault();
      var link = _selectLink.href;

      if (event.shiftKey && link.toLowerCase().indexOf('pmwiki.php') !== -1)
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

    var match = link.match(/pmwiki\.php\?n=([\.\w]+)[\?&]action=edit/i);

    var pagename = match[1];
    var pagenameL = pagename.toLowerCase();

    if (pagenameL == 'investment.homepage')
    { link = link.replace(pagename, 'Investment.Journal'+year); }
    else if (pagenameL == 'htc.homepage')
    { link = link.replace(pagename, 'HTC.Journal'+year); }
    else if (pagenameL == 'computerscience.homepage')
    { link = link.replace(pagename, 'ComputerScience.Journal'+year); }
    else if (pagenameL == 'main.onthisday')
    {
      var mon = clock.getMonth()+1;
      mon = mon<10 ? '0'+mon : mon;
      link = link.replace(pagename, 'Main.'+year+mon);

      // Create a LS storing the wiki markup for editing today. E.g., "n* 11, Wed" for 11th
      // Wednesday. This is to work with scrollPositioner.js, which implements the mechanism
      // to scroll there when the edit page is opened.
      if (window.scrollPositioner)
      {
        var weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        scrollPositioner.setStorageByKey('EDIT-ScrollY', 'MAIN.'+year+mon, 'n* '+clock.getDate()+', '+weekDays[clock.getDay()]);
      }
    }

    else {  }

    return link;
  }

  function getEditLink(link)
  {
    if (/\?action=edit/i.test(link)) { return link; }

    // Remove hash tag if present
    var match = link.match(/#.*$/);
    if (match) { link = link.replace(match[0],""); }

    // parse the pagename
    var pagenamePos = link.toLowerCase().indexOf('?n=');

    // go to editing main.homepage
    if (pagenamePos == -1) { return link+'?n=Main.HomePage?action=edit'; }

    var pagename = link.substr(link.toLowerCase().indexOf('?n=')+3);

    // Go to main.homepage if pagename is empty
    if (pagename == '') { return link+'?n=Main.HomePage?action=edit'; }

    // if it exists and is complete, go to its editing page
    else if (pagename.indexOf('.') != -1) { return link+'?action=edit'; }

    // else go to editing its group homepage
    else { return link+'.HomePage?action=edit'; }
  }

  window.addEventListener('load', function()
  {
    // Get url & remove hash tag if present
    _url = window.location.href.replace(/#.*?$/,"");

    var match = _url.match(/pmwiki\.php(\?n=([\.\w]+))?([\?&]action=(\w+))?/i);
    if (!match[1]) { _pagename = "Main.HomePage"; }
    else { _pagename = match[2]; }
    if (!match[3]) { _action = "browse"; }
    else { _action = match[4]; }

    _action = _action.toLowerCase();

    _inputElementLen = document.getElementsByTagName("input").length;

    _hyperLinkElement = document.links;
    var hyperLinkElementLen = _hyperLinkElement.length;
    for (var i=0;i<hyperLinkElementLen;i++)
    {
      _hyperLinkElement[i].addEventListener('click', function()
      { _selectLink = this; handleGoToLink(); });
    }
  });

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
      var match = _url.match(/\?.+/i);
      var pos = match==null ? _url.length : match['index'];
      window.open(_url.slice(0, pos)+'?n=Site.SearchE', '_blank');
    }

    // Ctrl+cmd+r to open all recent changes
//   else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && (event.metaKey||event.altKey))
    else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && event.metaKey)
    {
      event.preventDefault();
      var match = _url.match(/\?.+/i);
      var pos = match==null ? _url.length : match['index'];
      window.open(_url.slice(0, pos)+'?n=Site.Allrecentchanges', '_blank');
    }

    // Ctrl+cmd+u to open the upload page
    else if ((event.keyCode == 85||event.code=='KeyU') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      if (_url.indexOf('?n=') == -1) { window.open(_url + '?n=Main.Homepage?action=upload', '_blank'); }
      else
      {
        var pos = _url.indexOf('?action=');
        if (pos != -1) { window.open(_url.slice(0,pos+8) + 'upload', '_blank'); }
        else { window.open(_url + '?action=upload', '_blank'); }
      }
    }

    // Ctrl+cmd+h to open the history
    else if ((event.keyCode == 72||event.code=='KeyH') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      if (_url.indexOf('?n=') == -1) { window.open(_url + '?n=Main.Homepage?action=diff', '_blank'); }
      else
      {
        var pos = _url.indexOf('?action=');
        if (pos != -1) { window.open(_url.slice(0,pos+8) + 'diff', '_blank'); }
        else { window.open(_url + '?action=diff', '_blank'); }
      }
    }

    // Ctrl+cmd+b to open the backlink
    else if ((event.keyCode == 66||event.code=='KeyB') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      var match = _url.match(/\?.+/i);
      var pos = match==null ? _url.length : match['index'];
      window.location = _url.slice(0, pos)+'?n=Site.Search?action=search&q=link='+_pagename;
    }

    // Ctrl+cmd+a to open the attribute
    else if ((event.keyCode == 65||event.code=='KeyA') && event.ctrlKey && (event.metaKey||event.altKey))
    {
      event.preventDefault();
      if (_url.indexOf('?n=') == -1) { window.open(_url + '?n=Main.Homepage?action=attr', '_blank'); }
      else
      {
        var pos = _url.indexOf('?action=');
        if (pos != -1) { window.open(_url.slice(0,pos+8) + 'attr', '_blank'); }
        else { window.open(_url + '?action=attr', '_blank'); }
      }
    }

    // Ctrl+alt+g for goto page
    // Kind of abandonded
    else if (event.keyCode == 71 && event.metaKey && event.altKey)
    {
      var pagename = prompt("Go to page...");
      if (pagename)
      {
        var pagenamePos = _url.indexOf('?n=');
        if (pagenamePos == -1) {  }
        else { window.open(_url.slice(0,pagenamePos+3)+pagename, '_blank'); }
      }
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

    // Handle the enter key press when a link is selected; simply call the onmouseup routine
    // since the procedure is completely the same
    else if (_action != 'edit' && event.keyCode == 13 && !event.altKey && _selectLink)
    { handleGoToLink(); }
  });
})();
