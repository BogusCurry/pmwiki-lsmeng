/* 
 * Rich edit commands for textarea.
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170524
 */

"use strict";

var editEnhance = editEnhance || (function()
{
  /* Dependencies */

  /* Private properties */
  // For keeping track of the selection direction. 1 for forward selection,
  // 0 for backward selection
  var _selectDirection = 0;
  var _OS;
  var _lineHeight = 0;
  var _cursorPos;
  var _scrollPos;

  // Return true if the given string contains only invisible characters
  // false otherwise
  function isStrEmpty(str)
  {
    if (/[^\s]/.test(str)) { return false; }
    else { return true; }
  }

  // Return the cursor position of the previous paragraph start.
  function getLastParaStart(text, pos)
  {
    // If this is a non empty line and the given pos is not at the beginning of the line
    var lineStart = getLineStart(text, pos);

    if (!isStrEmpty(text.slice(lineStart,getLineEnd(text, pos))) && pos != lineStart)
    var pointer = lineStart-1;

    else
    {
      var pointer = pos;

      // Reversely find the first nonempty line
      while (1)
      {
        var lastNewlinePos = text.lastIndexOf("\n", --pointer) +1;
        if (lastNewlinePos == 0 || pointer <= 0) { return 0; }

        // A quick check for a real empty line
        if (lastNewlinePos-1 == pointer) { pointer = lastNewlinePos-1; }

        // See if it's a line with only empty spaces
        else if (!isStrEmpty(text.slice(lastNewlinePos, pointer+1)))
        {
          pointer = lastNewlinePos-1;
          break;
        }
        else { pointer = lastNewlinePos-1; }
      }
    }

    // Reversely find the first empty line
    while (1)
    {
      // Find the last newline, if none then return
      var lastNewlinePos = text.lastIndexOf("\n", --pointer) +1;

      // Deal with the 1st line special case
      if (lastNewlinePos == 0) { return 0; }

      // A quick check for a real empty line
      if (lastNewlinePos-1 == pointer) { return pointer+2; }

      // See if it's a line with only empty spaces
      else if (isStrEmpty(text.slice(lastNewlinePos, pointer+1))) { return pointer+2; }

      // Deal with the 1st line special case
      else if (lastNewlinePos == 1) { return pointer+1; }

      // Else, move to the newline pos then continue
      else pointer = lastNewlinePos-1;
    }
  }

  // Return the cursor position of the next paragraph start.
  function getNextParaStart(text, pos)
  {
    var str = text.slice(pos);

    // Handle the case where the next line is a new paragraph
    // If there is nothing between pos and next newline
    var firstNLIdx = str.indexOf("\n");
    if (isStrEmpty(str.slice(0,firstNLIdx)))
    {
      // If there is something between next newline and next next new line
      var secondNLIdx = str.indexOf("\n", firstNLIdx+1);
      if (!isStrEmpty(str.slice(firstNLIdx+1,secondNLIdx)))
      {
        // If there is nothing between last newline and pos
        var lastNLIdx = text.slice(0,pos).lastIndexOf("\n");
        if (isStrEmpty(text.slice(lastNLIdx+1,pos)))
        { return pos + firstNLIdx + 1; }
      }
    }

    // Find an empty line
    var matchPos = str.search(/^[   ]*$/m);
    if (matchPos == -1) { return text.length; }
    var start = pos + matchPos;

    // Find a non empty line
    matchPos = str.slice(matchPos).search(/^[   ]*[^\s]/m);
    if (matchPos == -1) { return text.length; }

    return start + matchPos;
  }

  // Return the cursor position of the paragraph end.
  function getParaEnd(text, pos)
  {
    var str = text.slice(pos);

    // If this is an empty line
    if (isStrEmpty(text.slice(getLineStart(text, pos),pos)))
    {
      // Find the first nonempty char
      var matchPos = str.search(/[^\s]/);
      if (matchPos == -1) { return text.length; }
      str = str.slice(matchPos + 1);
      pos += matchPos + 1;
    }

    var match = str.match(/\n\s*?\n/);
    if (match == null) { return text.length; }
    return pos + match['index'] + match.slice(1,match.indexOf("\n")).length + 1;
  }

  // Return the cursor position of the previous bullet start.
  function getBulletStart(text, pos)
  {
    // Find bullet start
    var start1 = text.lastIndexOf("\n*",pos-1) +1;
    var start2 = text.lastIndexOf("\n#",pos-1) +1;
    if (start1+start2 == 0)
    {
      var firstChar = text.substr(0,1);
      if (firstChar != '*' && firstChar != '#') { return -1; }
    }
    return Math.max(start1,start2);
  }

  // Return the cursor position of the bullet end.
  function getBulletEnd(text, pos)
  {
    // Find bullet end
    var end1 = text.indexOf("\n*",pos);
    end1 = end1==-1 ? Infinity : end1+1;
    var end2 = text.indexOf("\n#",pos);
    end2 = end2==-1 ? Infinity : end2+1;
    var end3 = getParaEnd(text, pos);
    var end = Math.min(end1,end2,end3);
    if (end == Infinity) { end = text.length; }

    return end;
  }

  // Return the char offset of the start of the line
  function getLineStart(text, pos) { return pos==0 ? 0 : text.lastIndexOf("\n",pos-1)+1; }

  // Return the char offset of the end of the line
  function getLineEnd(text, pos)
  {
    var end = text.indexOf("\n",pos);
    end = end==-1 ? text.length : end+1;
    return end;
  }

  // Highlight the current line by text selection
  function selectLine(textElement, pos)
  {
    textElement.blur();
    textElement.selectionStart = textElement.selectionEnd = pos;
    textElement.focus();
    var lineEndPos = getLineEnd(textElement.value, pos);
    if (textElement.value[lineEndPos-1] == "\n") { lineEndPos--; }
    textElement.selectionStart = getLineStart(textElement.value, pos);
    textElement.selectionEnd = lineEndPos;
  }

  function getNextWordPos(text, pos)
  {
    if (text[pos] == " ") { pos++; }

    var end = text.length;
//   var matchPos = text.slice(pos,end).search(/\uff0c/);
//   \u3002
    var matchPos = text.slice(pos,end).search(/\s\S|\S\s|\W[\uff0c\u3002\w]|[\uff0c\u3002\w]\W/);
    if (matchPos == -1) { return end; }
    else { return matchPos+pos+1; }
  }

  function getLastWordPos(text, pos)
  {
    if (text[pos-1] == " ") { pos--; }

    // get line start, and the content in between
    var lineStart = getLastParaStart(pos);
    var lineStr = text.slice(lineStart,pos);

    // String inversion to perform an inverse regex
    var o = '';
    for (var i = lineStr.length - 1; i >= 0; i--)
    o += lineStr[i];
    var matchPos = o.search(/\W[\uff0c\u3002\w]|[\uff0c\u3002\w]\W|\S\s|\s\S/);
    matchPos = lineStr.length - matchPos;
    matchPos += lineStart - 1;

    if (matchPos == pos) { matchPos = lineStart; }
    return matchPos;
  }

  // posOutwardSelect: the position to go to for outward selection
  // posInwardSelect: the position to go to for inward selection
  function makeSelection(textElement, posOutwardSelect, posInwardSelect)
  {
    var start = textElement.selectionStart;
    var end = textElement.selectionEnd;
    textElement.blur();

    // If something has been selected
    if (posOutwardSelect != null)
    {
      textElement.selectionEnd = textElement.selectionStart = posOutwardSelect;
      textElement.focus();
      if (!_selectDirection) { textElement.selectionEnd = end; }
      else { textElement.selectionStart = start; }
    }
    else
    {
      textElement.selectionStart = textElement.selectionEnd = posInwardSelect;
      textElement.focus();
      if (_selectDirection) { textElement.selectionStart = start; }
      else { textElement.selectionEnd = end; }
    }
  }

  // Move caret to the specified position
  // The char offset relative to the line start is memorized if "shouldUpdateOffset" is set
  // to true
  function moveCaretAndFocus(textElement, pos)
  {
    textElement.blur();
    textElement.selectionEnd = textElement.selectionStart = pos;
    textElement.focus();
  }

  // As title
  function scrollToSelection(textElement)
  {
    var start = textElement.selectionStart;
    var end = textElement.selectionEnd;
    textElement.blur();
    textElement.selectionStart =  textElement.selectionEnd = start;
    var textLen = textElement.value.length;
    if (start > textLen>>1) { textElement.scrollTop = 0; }
    else { textElement.scrollTop = textElement.scrollHeight; }
    textElement.focus();
    textElement.selectionEnd = end;
  }

  // Update the char offset and line number in the information div
  function updateInfoDiv(infoDiv, textElement)
  {
    infoDiv.innerHTML = 'Char: '+ textElement.selectionStart+
    "<br>Line: "+
    (textElement.value.slice(0,textElement.selectionStart).match(/\n/g) || []).length;
  }

  function mainKeydownFun()
  {
    var textElement = event.target;
    if (textElement.tagName !== "TEXTAREA") { return; }

    // A fix for windows. Prevent alt key to turn the focus to browser's toolbar.
    if (event.keyCode == 18)
    {
      event.preventDefault();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey)
    {
      var start = textElement.selectionStart;
      var end = textElement.selectionEnd;
    }

    /************** Fix some annoying full-width characters **************/
    // Fixes for simple full-width char do not work. Even after replacement and
    // preventDefault, the original full-width char still shows up after a blur/focus,
    // which is a required step in my caret positioning mechanism.
    if (event.key == '9' && event.metaKey)
    {
      document.execCommand("insertText", false, '()');
      textElement.selectionStart = textElement.selectionEnd =
      (textElement.selectionStart - 1);
      event.preventDefault();
      return;
    }
    else if (event.key == ';' && event.metaKey)
    {
      document.execCommand("insertText", false, '[]');
      textElement.selectionStart = textElement.selectionEnd =
      (textElement.selectionStart - 1);
      event.preventDefault();
      return;
    }
    else if (event.key == ':' && event.shiftKey && event.metaKey)
    {
      document.execCommand("insertText", false, '{}');
      textElement.selectionStart = textElement.selectionEnd =
      (textElement.selectionStart - 1);
      event.preventDefault();
      return;
    }

    /************** End of full-width character fix **************/

    // Up/Dn
    if (event.keyCode == 38 || event.keyCode == 40)
    {
      if (event.altKey)
      {
        event.preventDefault();

        // Ctrl+Cmd+Alt: scroll up long
        if (event.ctrlKey && event.metaKey && event.altKey)
        textElement.scrollTop += (event.keyCode - 39)*(_lineHeight<<3);

        // Ctrl or Cmd+Alt: scroll up short
        else if ((event.ctrlKey || event.metaKey) && event.altKey)
        textElement.scrollTop += (event.keyCode - 39)*(_lineHeight<<2);

        // Alt: paragraph traversal
        else if (event.keyCode == 38)
        {
          if (!event.shiftKey)
          {
            var posSimpleMove = getLastParaStart(textElement.value, start);
            moveCaretAndFocus(textElement, posSimpleMove);
            selectLine(textElement, posSimpleMove);
          }
          else
          {
            var direction = 0;

            if (end != start && _selectDirection == (direction^1))
            {
              var posOutwardSelect = getLastParaStart(textElement.value, end);
              if (posOutwardSelect <= start) { posOutwardSelect = start; }
              var posInwardSelect = null;
            }
            else
            {
              var posOutwardSelect = null;
              var posInwardSelect = getLastParaStart(textElement.value, start);
              _selectDirection = direction;
            }

            makeSelection(textElement, posOutwardSelect, posInwardSelect);
          }
        }

        else if (event.keyCode == 40)
        {
          if (!event.shiftKey)
          {
            var posSimpleMove = getNextParaStart(textElement.value, start);
            moveCaretAndFocus(textElement, posSimpleMove);
            selectLine(textElement, posSimpleMove);
          }
          else
          {
            var direction = 1;

            if (end != start && _selectDirection == (direction^1))
            {
              var posOutwardSelect = getParaEnd(textElement.value, start);
              if (posOutwardSelect > end) { posOutwardSelect = end; }
              var posInwardSelect = null;
            }
            else
            {
              var posOutwardSelect = null;
              var posInwardSelect = getParaEnd(textElement.value, end+1);
              _selectDirection = direction;
            }

            makeSelection(textElement, posOutwardSelect, posInwardSelect);
          }
        }
      }
      // Ctrl+up to go to the top of page and highlight line. A fix for Windows.
      else if (event.ctrlKey || event.metaKey)
      {
        event.preventDefault();

        if (event.shiftKey)
        {
          if (event.keyCode == 38)      textElement.selectionStart = 0;
          else if (event.keyCode == 40) textElement.selectionEnd = textElement.value.length;
        }
        else
        {
          if (event.keyCode == 38)
          {
            selectLine(textElement, 0);
            if (textElement.selectionStart == 0 && textElement.selectionEnd == 1)
            { textElement.selectionStart = textElement.selectionEnd = 0; }
          }
          else if (event.keyCode == 40) selectLine(textElement, textElement.value.length);
        }
      }
    }

    // Page up dn and highlight the current line
    // To go back to exactly the same line between page up & dn, a little bit tweak is
    // needed. This is again due to the text wrapping.
    else if ((event.keyCode == 33 || event.keyCode == 34) && _OS == 'Mac')
    {
      // Align the cursor at the start before the page changes
      textElement.selectionStart = textElement.selectionEnd = start;

      setTimeout(function()
      {
        // After the browser performs page up/dn, get the updated selection start
        start = textElement.selectionStart;

        // Handle the special case of the last line
        if (textElement.selectionEnd == textElement.value.length)
        { textElement.selectionStart = textElement.value.lastIndexOf("\n", start-1)+1; }

        // Don't touch the selection start; only put the selection end at the end of the
        // line.
        var end = textElement.value.indexOf("\n", start);
        end = end==-1 ? textElement.value.length : end;
        textElement.selectionEnd = end;
      }
      ,0);
    }

    // Cmd/alt+shift+l: selection line, paragraph, or bullet
    else if (event.keyCode == 76)
    {
      if (event.ctrlKey || (_OS == 'Mac' && event.metaKey))
      {
        // Shift dn, select paragraph
        if (event.shiftKey)
        {
          event.preventDefault();

          // Execute if the line is non-empty
          if (textElement.value.slice(getLineStart(textElement.value, start), getLineEnd(textElement.value, start)).replace(/\s/g,'') != '')
          {
            textElement.selectionStart = getLastParaStart(textElement.value, start+1);
            textElement.selectionEnd = getParaEnd(textElement.value, start);
          }
        }
      }
      // Select the whole bullet
      else if ((event.altKey || event.metaKey) && event.shiftKey)
      {
        event.preventDefault();

        // Execute if the line is non-empty
        if (textElement.value.slice(getLineStart(textElement.value, start), getLineEnd(textElement.value, start)).replace(/\s/g,'') != '')
        {
          var bulletStart = getBulletStart(textElement.value, start);

          if (bulletStart == -1 || bulletStart < getLastParaStart(textElement.value, start)) { return; }
          else
          {
            textElement.selectionStart = bulletStart;
            textElement.selectionEnd = getBulletEnd(textElement.value, start);
          }
        }
      }
    }

    // Ctrl+i to put the line with cursor at the center of the screen
    else if (event.keyCode == 73 && (event.ctrlKey || event.metaKey))
    { scrollToSelection(textElement); }

    // Ctrl+shift+D to duplicate a line
    else if (event.keyCode == 68 && (event.ctrlKey || event.metaKey) && event.shiftKey)
    {
      event.preventDefault();

      // Get the line text
      var lineStart = getLineStart(textElement.value, start);
      var lineEnd = getLineEnd(textElement.value, start);
      textElement.selectionStart = textElement.selectionEnd = lineEnd;
      var lineText = textElement.value.slice(lineStart, lineEnd);
      var lineTextLen = lineText.length;

      // Add a new line char if this is the last line
      if (lineText.slice(-1) != "\n") { lineText = "\n" + lineText; }

      // Insert the duplicated line
      document.execCommand("insertText", false, lineText);

      // Position the cursor at the beginning of the duplicated line
      textElement.blur();
      textElement.selectionStart = textElement.selectionEnd =
      textElement.selectionStart - lineTextLen;
      textElement.focus();
    }

    // Ctrl+(shift)+enter to begin a new line below or above the current line
    else if (event.keyCode == 13 && (event.ctrlKey || event.metaKey))
    {
      event.preventDefault();

      var initScroll = textElement.scrollTop;

      if (event.shiftKey)
      {
        var lineStart = getLineStart(textElement.value, start);
        if (lineStart == 0)
        {
          textElement.selectionStart =
          textElement.selectionEnd = 0;
          document.execCommand("insertText", false, "\n");
          textElement.selectionStart =
          textElement.selectionEnd = 0;
        }
        else
        {
          textElement.selectionStart =
          textElement.selectionEnd = lineStart-1;
          document.execCommand("insertText", false, "\n");
        }
      }
      else
      {
        // Deal with the special case where the ending newline char is selected
        if (start != end && textElement.value[end-1] == "\n")
        { var lineEnd = end; }
        else { var lineEnd = getLineEnd(textElement.value, end); }
        if (lineEnd == textElement.value.length) { lineEnd++; }
        textElement.selectionStart =
        textElement.selectionEnd = lineEnd-1;
        document.execCommand("insertText", false, "\n");
      }

      textElement.scrollTop = initScroll;
    }

    // Ctrl ; to scroll to the next mis-spelled word
    else if (event.keyCode == 186 && (event.ctrlKey || event.metaKey))
    {
      // A small delay is required to wait for the browser to perform the search
      setTimeout(function()
      {
        textElement.blur();
        textElement.selectionStart = textElement.selectionEnd = start;
        textElement.focus();
        textElement.selectionEnd = end;
      }
      ,100);
    }

    /************** Emulate Emacs key bindings **************/

    // Ctrl-p
    else if (event.keyCode == 80)
    {
      // Alt-p previous para
      if (event.altKey)
      {
        event.preventDefault();
        var posSimpleMove = getLastParaStart(textElement.value, start);

        if (!event.shiftKey)
        {
          moveCaretAndFocus(textElement, posSimpleMove);
          selectLine(textElement, posSimpleMove);
        }
        else
        {
          var direction = 0;

          if (end != start && _selectDirection == (direction^1))
          {
            var posOutwardSelect = getLastParaStart(textElement.value, end);
            if (posOutwardSelect <= start) { posOutwardSelect = start; }
            var posInwardSelect = null;
          }
          else
          {
            var posOutwardSelect = null;
            var posInwardSelect = posSimpleMove;
            _selectDirection = direction;
          }

          makeSelection(textElement, posOutwardSelect, posInwardSelect);
        }
      }
    }

    // Ctrl-n next line
    // Checking the event.code property is a fix for MAC, and only works in Chrome
    else if (event.keyCode == 78 || event.code == 'KeyN')
    {
      // Alt-n go to next para
      // Alt-shift-n continuous para selection down
      if (event.altKey)
      {
        event.preventDefault();

        if (!event.shiftKey)
        {
          var posSimpleMove = getNextParaStart(textElement.value, start);
          moveCaretAndFocus(textElement, posSimpleMove);
          selectLine(textElement, posSimpleMove);
        }
        else
        {
          var direction = 1;

          if (end != start && _selectDirection == (direction^1))
          {
            var posOutwardSelect = getParaEnd(textElement.value, start);
            if (posOutwardSelect > end) { posOutwardSelect = end; }
            var posInwardSelect = null;
          }
          else
          {
            var posOutwardSelect = null;
            var posInwardSelect = getParaEnd(textElement.value, end+1);
            _selectDirection = direction;
          }

          makeSelection(textElement, posOutwardSelect, posInwardSelect);
        }
      }
    }

    // Ctrl-k kill a line
    // Ctrl-alt-k kill backward till line start
    // Ctrl-cmd-k kill forward till line end
    else if (event.keyCode == 75 && (event.ctrlKey || event.metaKey))
    {
      event.preventDefault();

      if (event.altKey)
      {
        textElement.selectionStart = getLineStart(textElement.value, start);
        textElement.selectionEnd = start;
      }
      else if (event.ctrlKey)
      {
        textElement.selectionStart = start;
        var lineEnd = getLineEnd(textElement.value, start);
        if (lineEnd == textElement.value.length)
        { textElement.selectionEnd = lineEnd; }
        else { textElement.selectionEnd = lineEnd-1; }
      }
      else
      {
        textElement.selectionStart = getLineStart(textElement.value, start);
        textElement.selectionEnd = getLineEnd(textElement.value, start);
      }
      document.execCommand("insertText", false, "");
    }

    // Tab inserts two white spaces
    else if (event.keyCode == 9 && !(event.ctrlKey || event.metaKey || event.altKey))
    {
      if (event.target != textElement) { return; }
      event.preventDefault();
      document.execCommand("insertText", false, "  ");
    }

    // Focus after undo/redo
    else if (event.keyCode == 90 && (event.ctrlKey || event.metaKey))
    {
      if (document.activeElement === textElement)
      { setTimeout(function()  { scrollToSelection(textElement); }, 25); }
    }
  }

  function keyupFunFixForWindows()
  {
    var textElement = event.target;
    if (textElement.tagName !== "TEXTAREA") { return; }

    // Up/Dn
    if (event.keyCode == 38 || event.keyCode == 40)
    {
      if (event.metaKey)
      {
        event.preventDefault();

        // Ctrl+Cmd+Alt: scroll up long
        if (event.ctrlKey && event.metaKey && event.altKey)
        textElement.scrollTop += (event.keyCode - 39)*(_lineHeight<<3);

        // Ctrl or Cmd+Alt: scroll up short
        else if (event.metaKey && event.altKey)
        textElement.scrollTop += (event.keyCode - 39)*(_lineHeight<<2);

        // Alt+Shift: continuous paragraph selection
        else if (event.shiftKey && event.keyCode == 38)
        {
          textElement.blur();
          var end = textElement.selectionEnd;
          var pos = textElement.selectionStart;
          var start = textElement.selectionEnd =
          textElement.selectionStart = getLastParaStart(textElement.value, pos);
          textElement.focus();
          textElement.selectionEnd = end;
        }
        else if (event.shiftKey && event.keyCode == 40)
        {
          textElement.blur();
          var start = textElement.selectionStart;
          var pos = textElement.selectionEnd;
          var end = getParaEnd(textElement.value, pos+1)

          textElement.selectionStart = textElement.selectionEnd = end;
          textElement.focus();
          textElement.selectionStart = start;
        }

        // Move to the last/next paragraph.
        else
        {
          var pos = textElement.selectionStart;
          if (event.keyCode == 38)      var start = getLastParaStart(textElement.value, pos);
          else if (event.keyCode == 40) var start = getNextParaStart(textElement.value, pos);
          selectLine(textElement, start);
          if (textElement.selectionStart == 0 && textElement.selectionEnd == 1)
          { textElement.selectionStart = textElement.selectionEnd = 0; }
        }
      }
    }
  }

  function init()
  {
    var mainTextElement = document.getElementById('text');
    if (mainTextElement) { _lineHeight = parseInt(window.getComputedStyle(mainTextElement)['line-height']); }
    else { _lineHeight = 24; }

    // Determine the OS
    if (window.navigator.platform === "Win32") { _OS = "Windows"; }
    else if (window.navigator.platform === "MacIntel") { _OS = "Mac"; }
    else { alert("Undefined OS!"); return; }

/*
    // Create a small div to show the char and line number
    var infoDiv = document.createElement('div');
    infoDiv.style.background = 'rgb(112,112,112)';
    infoDiv.style.color = 'white';
    infoDiv.style.fontWeight = 'bold';
    infoDiv.style.fontSize = '80%';
    infoDiv.style.fontFamily = 'Verdana,sans-serif';
    infoDiv.style.padding = '2px';
    infoDiv.style.borderRadius = '3px';
    infoDiv.style.position = 'fixed';
    infoDiv.style.top = mainTextElement.getBoundingClientRect().top + 'px';
    infoDiv.style.right = '20px';
    infoDiv.style.webkitFilter = 'drop-shadow(0px 0px 2px gray)';

    document.body.appendChild(infoDiv);

    updateInfoDiv(infoDiv, mainTextElement);

    window.addEventListener('click', function() { updateInfoDiv(infoDiv, mainTextElement) });
    window.addEventListener('keyup', function() { updateInfoDiv(infoDiv, mainTextElement) });
*/

    // When the meta key is down, other key presses can only be detected by key up on Windows.
    if (_OS == 'Windows') { window.addEventListener('keyup', keyupFunFixForWindows); }

    window.addEventListener('keydown', mainKeydownFun);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {};
})();
