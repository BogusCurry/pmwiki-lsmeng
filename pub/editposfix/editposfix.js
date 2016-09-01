/* 
 * This recipe memorizes both the current scroll and cursor positions when editing using
 * local storage. The scroll/cursor positions are therefore memorized after hitting 
 * "Save and edit", or a page refresh. Each PmWiki page has a separate local storage,
 * which means the scroll/cursor positions are memorized separately for each page.
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160728
 */

var EditPosFix = {
  pagename: '',
  action: 'edit',

  // Set a local storage item "name" with key/value pair "key" and "value".
  // If "key" is null then the item is treated as a simple variable; otherwise it is an 
  // array. If "value" is null then the local storage is deleted in the former case; the 
  // key entry is deleted in the latter case.
  setStorageByKey: function(name, key, value) {
    if (key == null) {
      if (value == null) {
        localStorage.removeItem(name);
      } else {
        localStorage.setItem(name, value);
      }
    } else {
      var content = JSON.parse(localStorage.getItem(name));

      if (content == null) {
        content = new Object();
      }
      if (value == null) {
        delete content[key];
      } else {
        content[key] = value;
      }
      localStorage.setItem(name, JSON.stringify(content));
    }
  },

  // Get the value of key "key" in local storage item "name"
  // If "key" is null then the whole content of "name" is returned;
  getStorageByKey(name, key) {
    if (key == null) {
      return JSON.parse(localStorage.getItem(name));
    }

    try {
      var value = JSON.parse(localStorage.getItem(name))[key];
    } catch (e) {}

    return value;
  },

  // Set the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different.
  setScrollPos: function(y) {
    if (EditPosFix.action == 'edit') {
      document.getElementById('text').scrollTop = y;
    } else {
      document.body.scrollTop = y;
    }
  },

  // Get the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different.
  getScrollPos: function() {
    if (EditPosFix.action == 'edit') {
      return document.getElementById('text').scrollTop;
    } else {
      return document.body.scrollTop;
    }
  },

  // Record the current scroll position in local storage. The scroll positions for
  // browsing and editing pages are stored separately. If null is passed then the entry is
  // deleted. If the current scroll position is 0, the entry is also deleted.
  setScrollPosLS: function(value) {
    if (EditPosFix.action == 'edit') {
      var name = 'EDIT-ScrollY';
    }
    value = value === null ? value : EditPosFix.getScrollPos();
    value = value == 0 ? null : value; {
      EditPosFix.setStorageByKey(name, EditPosFix.pagename, value);
    }
  },

  // Return the scroll position stored in local storage based on the current action.
  getScrollPosLS: function() {
    if (EditPosFix.action == 'edit') {
      var name = 'EDIT-ScrollY';
    }
    return EditPosFix.getStorageByKey(name, EditPosFix.pagename);
  },

  // Get & set the caret position.
  getCaretPos: function() {
    return document.getElementById('text').selectionStart;
  },
  setCaretPos: function(caret, caret2) {
    if (caret == null || caret2 == null) {
      return;
    }
    document.getElementById('text').selectionStart = caret;
    document.getElementById('text').selectionEnd = caret2;
  },

  // Record the current caret position in local storage. If the current caret position is
  // 0, the entry is deleted.
  setCaretPosLS: function() {
    var value = EditPosFix.getCaretPos();
    value = value == 0 ? null : value;
    EditPosFix.setStorageByKey('Caret', EditPosFix.pagename, value);
  },

  // Read from local storage to get the last caret position.
  getCaretPosLS: function() {
    return EditPosFix.getStorageByKey('Caret', EditPosFix.pagename);
  },

  init: function() {
    EditPosFix.pagename = EditPosFix.pagename.toUpperCase();

    // Check local storage to get last scroll position.
    var value = EditPosFix.getScrollPosLS();
    value = value == null ? 0 : value;

    // Check local storage to get last cursor position.
    // Note that the sequence of the following commands matters. If the caret 
    // positioning comes before the focus, Chrome/Safari will scroll so that caret is
    // centered in the screen, which interferes with the setScroll command.
    document.getElementById('text').focus();
    var caretPos = EditPosFix.getCaretPosLS();
    EditPosFix.setCaretPos(caretPos, caretPos);
    EditPosFix.setScrollPos(value);
  }
}

window.addEventListener('load', EditPosFix.init, false);

// Record the scroll and caret position on page close.
window.addEventListener("beforeunload", function() {
  EditPosFix.setScrollPosLS();
  EditPosFix.setCaretPosLS();
}, false);
