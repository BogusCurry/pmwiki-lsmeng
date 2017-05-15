/* 
* Rich edit commands for textarea.
*
* Author: Ling-San Meng
* Email: f95942117@gmail.com
*/

// Return true if the given string contains only invisible characters
// false otherwise
function isStrEmpty(str)
{
  if (/[^\s]/.test(str)) { return false; }
  else { return true; }
}

// Return the cursor position of the previous paragraph start.
function getLastParaStart(pos)
{
  var text = editEnhanceElement.form.text.value;
  
  // If this is a non empty line and the given pos is not at the beginning of the line
  var lineStart = getLineStart(pos);
  
  if (!isStrEmpty(text.slice(lineStart,getLineEnd(pos))) && pos != lineStart)
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
function getNextParaStart(pos)
{
  var str = editEnhanceElement.form.text.value.slice(pos);
  
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
      var lastNLIdx = editEnhanceElement.form.text.value.slice(0,pos).lastIndexOf("\n");
      if (isStrEmpty(editEnhanceElement.form.text.value.slice(lastNLIdx+1,pos)))
      { return pos + firstNLIdx + 1; }
    }
  }
  
  // Find an empty line
  var matchPos = str.search(/^[ 	]*$/m);
  if (matchPos == -1) { return editEnhanceElement.form.text.value.length; }
  var start = pos + matchPos;
  
  // Find a non empty line
  matchPos = str.slice(matchPos).search(/^[ 	]*[^\s]/m);
  if (matchPos == -1) { return editEnhanceElement.form.text.value.length; }
  
  return start + matchPos;
}

// Return the cursor position of the paragraph end.
function getParaEnd(pos)
{
  var str = editEnhanceElement.form.text.value.slice(pos);
  
  // If this is an empty line
  if (isStrEmpty(editEnhanceElement.form.text.value.slice(getLineStart(pos),pos)))
  {
    // Find the first nonempty char
    var matchPos = str.search(/[^\s]/);
    if (matchPos == -1) { return editEnhanceElement.form.text.value.length; }
    str = str.slice(matchPos + 1);
    pos += matchPos + 1;
  }
  
  var match = str.match(/\n\s*?\n/);
  if (match == null) { return editEnhanceElement.form.text.value.length; }
  return pos + match['index'] + match.slice(1,match.indexOf("\n")).length + 1;
}

// Return the cursor position of the previous bullet start.
function getBulletStart(pos)
{
  // Find bullet start
  var start1 = editEnhanceElement.form.text.value.lastIndexOf("\n*",pos-1) +1;
  var start2 = editEnhanceElement.form.text.value.lastIndexOf("\n#",pos-1) +1;
  if (start1+start2 == 0)
  {
    var firstChar = editEnhanceElement.form.text.value.substr(0,1);
    if (firstChar != '*' && firstChar != '#')  { return -1; }
  }
  return Math.max(start1,start2);
}

// Return the cursor position of the bullet end.
function getBulletEnd(pos)
{
  // Find bullet end
  var end1 = editEnhanceElement.form.text.value.indexOf("\n*",pos);
  end1 = end1==-1 ? Infinity : end1+1;
  var end2 = editEnhanceElement.form.text.value.indexOf("\n#",pos);
  end2 = end2==-1 ? Infinity : end2+1;
  var end3 = getParaEnd(pos);
  var end = Math.min(end1,end2,end3);
  if (end == Infinity) { end = editEnhanceElement.form.text.value.length; }
  
  return end;
}

// Return the char offset of the start of the line
function getLineStart(pos)
{
  return pos==0 ? 0 : editEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1;
}

// Return the char offset of the end of the line
function getLineEnd(pos)
{
  var end = editEnhanceElement.form.text.value.indexOf("\n",pos);
  end = end==-1 ? editEnhanceElement.form.text.value.length : end+1;
  return end;
}

// Highlight the current line by text selection
function selectLine(pos)
{
  editEnhanceElement.blur();
  editEnhanceElement.selectionStart =
  editEnhanceElement.selectionEnd = pos;
  editEnhanceElement.focus();
  var lineEndPos = getLineEnd(pos);
  if (editEnhanceElement.form.text.value[lineEndPos-1] == "\n")
  { lineEndPos--; }
  editEnhanceElement.selectionStart = getLineStart(pos);
  editEnhanceElement.selectionEnd = lineEndPos;
}

window.addEventListener('load',function()
{
  window.editEnhanceElement = document.getElementById('text');
  
  EditEnhanceLineHeight = parseInt(window.getComputedStyle(editEnhanceElement)['line-height']);
  
	// Determine the OS
	if (window.navigator.platform === "Win32") { EditEnhanceOS = "Windows"; }
	else if (window.navigator.platform === "MacIntel") { EditEnhanceOS = "Mac"; }
	else { alert("Undefined OS!"); return; }
  
  // For keeping track of the horizontal offset when performing next/previous line
  editEnhanceElement.offset = 0;
  
  // For keeping track of the selection direction. 1 for forward selection,
  // 0 for backward selection
  editEnhanceElement.selectDirection = 0;
  
  // Create a small div to show the char and line number
  var infoDiv = document.createElement('div');
  infoDiv.id = 'infoDivID';
  infoDiv.style.background = 'rgb(112,112,112)';
  infoDiv.style.color = 'white';
  infoDiv.style.fontWeight = 'bold';
  infoDiv.style.fontSize = '80%';
  infoDiv.style.fontFamily = 'Verdana,sans-serif';
  infoDiv.style.padding = '2px';
  infoDiv.style.borderRadius = '3px';
  infoDiv.style.position = 'fixed';
  infoDiv.style.top = editEnhanceElement.getBoundingClientRect().top + 'px';
  infoDiv.style.right = '20px';
  infoDiv.style.webkitFilter = 'drop-shadow(0px 0px 2px gray)';
  
// 	document.body.appendChild(infoDiv);
  
  updateInfoDiv();
  
  
/*
  // On textInput, replace some frequently used full-width characters
	// Comma, dot is too tricky to deal with as an extra space has to be inserted after
	// replacement.
	editEnhanceElement.addEventListener('textInput', function()
	{
		var inputText = event.data;

		if (inputText.indexOf('＊') != -1)
		{ inputText = inputText.replace(/\uff0a/g,'*'); }

		else if (inputText.indexOf('＃') != -1)
		{ console.log('ht');inputText = inputText.replace(/\uFF03/g,'#'); }

		else if (inputText.indexOf('＼') != -1)
		{ console.log("here");inputText = inputText.replace(/\uFF3C/g,'\\'); }
		
		if (inputText.indexOf('、') != -1)
		{ inputText = inputText.replace(/\u3001/g,'\''); }
	
		if (inputText.indexOf('	') != -1)
		{ inputText = inputText.replace(/	/g,' '); }

		if (inputText.indexOf('；；') != -1)
		{
			inputText = inputText.replace('；；','""');
			setTimeout(function()
			{ editEnhanceElement.selectionStart =
				editEnhanceElement.selectionEnd = (editEnhanceElement.selectionStart - 1); }, 0);
		}

		if (inputText != event.data)
		{
			document.execCommand("insertText", false, inputText);
			event.preventDefault();
		}
	});
*/
});

// Update the char offset and line number in the information div
function updateInfoDiv()
{
// 	document.getElementById('infoDivID').innerHTML = 'Char: '+editEnhanceElement.selectionStart+
// 	"<br>Line: "+
// 	(editEnhanceElement.form.text.value.slice(0,editEnhanceElement.selectionStart).match(/\n/g) || []).length;  	  
}

window.addEventListener('click', function() { updateInfoDiv(); }, false);

// When the meta key is down, other key presses can only be detected by key up on Windows.
window.addEventListener('keyup', function()
{
  if (!window.EditEnhanceOS) { return; }
  
  updateInfoDiv();
  
  if (EditEnhanceOS == 'Windows')
  {
    // Up/Dn
    if (event.keyCode == 38 || event.keyCode == 40)
    {
      if (event.metaKey)
      {
        event.preventDefault();
        
        // Ctrl+Cmd+Alt: scroll up long
        if (event.ctrlKey && event.metaKey && event.altKey)
        editEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<3);
        
        // Ctrl or Cmd+Alt: scroll up short
        else if (event.metaKey && event.altKey)
        editEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<2);
        
        // Alt+Shift: continuous paragraph selection
        else if (event.shiftKey && event.keyCode == 38)
        {
          editEnhanceElement.blur();
          var end = editEnhanceElement.selectionEnd;
          var pos = editEnhanceElement.selectionStart;
          var start = editEnhanceElement.selectionEnd =
          editEnhanceElement.selectionStart = getLastParaStart(pos);
          editEnhanceElement.focus();
          editEnhanceElement.selectionEnd = end;
        }
        else if (event.shiftKey && event.keyCode == 40)
        {
          editEnhanceElement.blur();
          var start = editEnhanceElement.selectionStart;
          var pos = editEnhanceElement.selectionEnd;
          var end = getParaEnd(pos+1)
          
          editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = end;
          editEnhanceElement.focus();
          editEnhanceElement.selectionStart = start;
        }
        
        // Move to the last/next paragraph.
        else
        {
          var pos = editEnhanceElement.selectionStart;
          if (event.keyCode == 38)      var start = getLastParaStart(pos);
          else if (event.keyCode == 40) var start = getNextParaStart(pos);
          selectLine(start);
          if (editEnhanceElement.selectionStart == 0 && editEnhanceElement.selectionEnd == 1)
          { editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = 0; }
        }
      }
    }
  }
}
, false);

function getNextWordPos(pos)
{
  if (editEnhanceElement.form.text.value[pos] == " ") { pos++; }
  
  var end = editEnhanceElement.form.text.value.length;
//   var matchPos = editEnhanceElement.form.text.value.slice(pos,end).search(/\uff0c/);
//   \u3002
  var matchPos = editEnhanceElement.form.text.value.slice(pos,end).search(/\s\S|\S\s|\W[\uff0c\u3002\w]|[\uff0c\u3002\w]\W/);
  if (matchPos == -1) { return end; }
  else { return matchPos+pos+1; }
}

function getLastWordPos(pos)
{
  if (editEnhanceElement.form.text.value[pos-1] == " ") { pos--; }
  
  // get line start, and the content in between
  var lineStart = getLastParaStart(pos);
  var lineStr = editEnhanceElement.form.text.value.slice(lineStart,pos);
  
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
function makeSelection(posOutwardSelect, posInwardSelect)
{
  var start = editEnhanceElement.selectionStart;
  var end = editEnhanceElement.selectionEnd;
  editEnhanceElement.blur();
  
  // If something has been selected
  if (posOutwardSelect != null)
  {
    editEnhanceElement.selectionEnd = editEnhanceElement.selectionStart = posOutwardSelect;
    editEnhanceElement.focus();
    if (!editEnhanceElement.selectDirection) { editEnhanceElement.selectionEnd = end; }
    else { editEnhanceElement.selectionStart = start; }
  }
  else
  {
    editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = posInwardSelect;
    editEnhanceElement.focus();
    if (editEnhanceElement.selectDirection) { editEnhanceElement.selectionStart = start; }
    else { editEnhanceElement.selectionEnd = end; }
  }
}

// Move caret to the specified position
// The char offset relative to the line start is memorized if "shouldUpdateOffset" is set
// to true
function moveCaretAndFocus(pos, shouldUpdateOffset)
{
  editEnhanceElement.blur();
  editEnhanceElement.selectionEnd = editEnhanceElement.selectionStart = pos;
  editEnhanceElement.focus();
  
  if (shouldUpdateOffset) { updateOffset(); }
}

// As title
function scrollToSelection()
{
	var start = editEnhanceElement.selectionStart;
	var end = editEnhanceElement.selectionEnd;
  editEnhanceElement.blur();
	editEnhanceElement.selectionStart =	editEnhanceElement.selectionEnd = start;
	var textLen = editEnhanceElement.form.text.value.length;
	if (start > textLen>>1) { editEnhanceElement.scrollTop = 0; }
	else { editEnhanceElement.scrollTop = editEnhanceElement.scrollHeight; }
	editEnhanceElement.focus();
	editEnhanceElement.selectionEnd = end;
}

// Get the position relative to the nearest newline, and record it as a global property
function updateOffset()
{
  var end = editEnhanceElement.selectionEnd;
  editEnhanceElement.offset = end - getLineStart(end);
}

// When receiving input, update the char offset relative to line start
// window.addEventListener('input', function() { updateOffset(); }, false);

window.addEventListener('keydown', function()
{
  if (!window.editEnhanceElement) { return; }

  // A fix for windows. Prevent alt key to turn the focus to browser's toolbar.
  if (event.keyCode == 18)
  {
    event.preventDefault();
    return;
  }
  
  if (event.ctrlKey || event.metaKey || event.altKey)
  {
    var start = editEnhanceElement.selectionStart;
    var end = editEnhanceElement.selectionEnd;
  }

  /************** Fix some annoying full-width characters **************/
  // Fixes for simple full-width char do not work. Even after replacement and
  // preventDefault, the original full-width char still shows up after a blur/focus,
  // which is a required step in my caret positioning mechanism.
	if (event.key == '9' && event.metaKey) 
  {
    document.execCommand("insertText", false, '()');
   	editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = 
   	(editEnhanceElement.selectionStart - 1);
    event.preventDefault();
    return;
  }
  else if (event.key == ';' && event.metaKey) 
  {
    document.execCommand("insertText", false, '[]');
   	editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = 
   	(editEnhanceElement.selectionStart - 1);
    event.preventDefault();
    return;
  }
  else if (event.key == ':' && event.shiftKey && event.metaKey) 
  {
		document.execCommand("insertText", false, '{}');
		editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = 
		(editEnhanceElement.selectionStart - 1);
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
      editEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<3);
      
      // Ctrl or Cmd+Alt: scroll up short
      else if ((event.ctrlKey || event.metaKey) && event.altKey)
      editEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<2);
      
      // Alt: paragraph traversal
      else if (event.keyCode == 38)
      {
        if (!event.shiftKey)
        {
          var posSimpleMove = getLastParaStart(start);
          moveCaretAndFocus(posSimpleMove, true);
          selectLine(posSimpleMove);
        }
        else
        {
          var direction = 0;
          
          if (end != start && editEnhanceElement.selectDirection == (direction^1))
          {
            var posOutwardSelect = getLastParaStart(end);
            if (posOutwardSelect <= start) { posOutwardSelect = start; }
            var posInwardSelect = null;
          }
          else
          {
            var posOutwardSelect = null;
            var posInwardSelect = getLastParaStart(start);
            editEnhanceElement.selectDirection = direction;
          }
          
          makeSelection(posOutwardSelect, posInwardSelect);
        }
      }
      
      else if (event.keyCode == 40)
      {
        if (!event.shiftKey)
        {
          var posSimpleMove = getNextParaStart(start);
          moveCaretAndFocus(posSimpleMove, true);
          selectLine(posSimpleMove);
        }
        else
        {
          var direction = 1;
          
          if (end != start && editEnhanceElement.selectDirection == (direction^1))
          {
            var posOutwardSelect = getParaEnd(start);
            if (posOutwardSelect > end) { posOutwardSelect = end; }
            var posInwardSelect = null;
          }
          else
          {
            var posOutwardSelect = null;
            var posInwardSelect = getParaEnd(end+1);
            editEnhanceElement.selectDirection = direction;
          }
          
          makeSelection(posOutwardSelect, posInwardSelect);
        }
      }
    }
    // Ctrl+up to go to the top of page and highlight line. A fix for Windows.
    else if (event.ctrlKey || event.metaKey)
    {
      event.preventDefault();
      
      if (event.shiftKey)
      {
        if (event.keyCode == 38)      editEnhanceElement.selectionStart = 0;
        else if (event.keyCode == 40) editEnhanceElement.selectionEnd = editEnhanceElement.form.text.value.length;
      }
      else
      {
        if (event.keyCode == 38)
        {
          selectLine(0);
          if (editEnhanceElement.selectionStart == 0 && editEnhanceElement.selectionEnd == 1)
          { editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = 0; }
        }
        else if (event.keyCode == 40) selectLine(editEnhanceElement.form.text.value.length);
      }
    }
  }

/*
  // Alt+right/left to move forward/backward a word
  else if (event.keyCode == 37 && (event.altKey || (event.ctrlKey && EditEnhanceOS == 'Windows')) && !event.shiftKey)
  {
    event.preventDefault();
    var posSimpleMove = getLastWordPos(start);
    if (!event.shiftKey) { moveCaretAndFocus(posSimpleMove, true); }
  }
  else if (event.keyCode == 39 && (event.altKey || (event.ctrlKey && EditEnhanceOS == 'Windows')) && !event.shiftKey)
  {
    event.preventDefault();
    var posSimpleMove = getNextWordPos(end);
    if (!event.shiftKey) { moveCaretAndFocus(posSimpleMove, true); }
  }
*/
  
  // Page up dn and highlight the current line
  // To go back to exactly the same line between page up & dn, a little bit tweak is
  // needed. This is again due to the text wrapping.
  else if ((event.keyCode == 33 || event.keyCode == 34) && EditEnhanceOS == 'Mac')
  {
    // Align the cursor at the start before the page changes
    editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = start;
    
    setTimeout(function()
    {
      // After the browser performs page up/dn, get the updated selection start
      start = editEnhanceElement.selectionStart;
      
      // Handle the special case of the last line
      if (editEnhanceElement.selectionEnd == editEnhanceElement.form.text.value.length)
      { editEnhanceElement.selectionStart = editEnhanceElement.form.text.value.lastIndexOf("\n", start-1)+1; }
      
      // Don't touch the selection start; only put the selection end at the end of the
      // line.
      var end = editEnhanceElement.form.text.value.indexOf("\n", start);
      end = end==-1 ? editEnhanceElement.form.text.value.length : end;
      editEnhanceElement.selectionEnd = end;
    }
    ,0);
  }
  
  // Cmd/alt+shift+l: selection line, paragraph, or bullet
  else if (event.keyCode == 76)
  {
    if (event.ctrlKey || (EditEnhanceOS == 'Mac' && event.metaKey))
    {
      // Shift dn, select paragraph
      if (event.shiftKey)
      {
        event.preventDefault();
        
        // Execute if the line is non-empty
        if (editEnhanceElement.form.text.value.slice(getLineStart(start), getLineEnd(start)).replace(/\s/g,'') != '')
        {
          editEnhanceElement.selectionStart = getLastParaStart(start+1);
          editEnhanceElement.selectionEnd = getParaEnd(start);
        }
      }
/*
      // Select line
      else
      {
        // A fix for resolving conflict with Chrome's url command
        if (start != getLineStart(start) || end != getLineEnd(start))
        {
          event.preventDefault();
          selectLine(start);
        }
      }
*/
    }
    // Select the whole bullet
    else if ((event.altKey || event.metaKey) && event.shiftKey)
    {
      event.preventDefault();
      
      // Execute if the line is non-empty
      if (editEnhanceElement.form.text.value.slice(getLineStart(start), getLineEnd(start)).replace(/\s/g,'') != '')
      {
        var bulletStart = getBulletStart(start);
        
        if (bulletStart == -1 || bulletStart < getLastParaStart(start)) { return; }
        else
        {
          editEnhanceElement.selectionStart = bulletStart;
          editEnhanceElement.selectionEnd = getBulletEnd(start);
        }
      }
    }
  }
  
  // Ctrl+/ to open viewing page
  // The 'Slash' is a fix for Yahoo Chinese input on Windows
  else if ((event.keyCode == 191 || event.code == 'Slash') && (event.ctrlKey || event.metaKey))
  {
  	// Leave if textarea is not focused
		if (editEnhanceElement !== document.activeElement) { return; }
  	
    event.preventDefault();
    if ((event.ctrlKey && EditEnhanceOS == 'Mac') || ((event.altKey||event.metaKey)) && EditEnhanceOS == 'Windows')
    { 
    	// Declare a global property to keep track of whether the associated view page has
			// been opened. This is to work with autosave.js to auto refresh the view page.
			window.EditEnhanceViewWindow =
			window.open(window.location.href.replace(/\?action=edit/i,''), '_blank');
    }
    else
    { window.location = window.location.href.replace(/\?action=edit/i,''); }
  }

/*
  // Ctrl+shift+del to delete till the end of the line
  // Shift+del to delete the whole line
  // Ctrl+del to forward delete till the start of the line
  else if (event.keyCode == 8)
  {
    // If texts are selected, delete the selected area no matter what
    // modifier keys are pressed
    if (start != end)
    { document.execCommand("insertText", false, ""); }
    
    else if (event.shiftKey)
    {
      if (event.ctrlKey || event.metaKey)
      {
        editEnhanceElement.selectionStart = start;
        var end = getLineEnd(start);
        var textLen = editEnhanceElement.form.text.value.length;
        end = end==textLen ? textLen : end-1;
        editEnhanceElement.selectionEnd = end;
        
        // A fix for Windows since the Backspace key does not function when * key is pressed
        if (EditEnhanceOS == 'Windows')
        { document.execCommand("insertText", false, ""); }
      }
      else
      {
        editEnhanceElement.selectionStart = getLineStart(start);
        editEnhanceElement.selectionEnd = getLineEnd(start);
      }
    }
    else if (event.ctrlKey || event.metaKey)
    {
      editEnhanceElement.selectionStart = getLineStart(start);
      editEnhanceElement.selectionEnd = start;
    }
  }
*/
  
  // Ctrl+u to record a jump point, ctrl+j to go to the jump point
  else if (event.keyCode == 85 && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    EditEnhanceCursorPos = start;
    EditEnhanceScrollPos = editEnhanceElement.scrollTop;
  }
  else if (event.keyCode == 74 && (event.ctrlKey || event.metaKey) && !event.shiftKey)
  {
    if (EditEnhanceOS == 'Windows')
    event.preventDefault();
    
    if (typeof EditEnhanceCursorPos != 'undefined')
    {
      editEnhanceElement.selectionStart =
      editEnhanceElement.selectionEnd = EditEnhanceCursorPos;
      editEnhanceElement.scrollTop = EditEnhanceScrollPos;
    }
  }
  
  // Ctrl+i to put the line with cursor at the center of the screen
  else if (event.keyCode == 73 && (event.ctrlKey || event.metaKey))
  { scrollToSelection(); }
  
  // Ctrl+shift+D to duplicate a line
  else if (event.keyCode == 68 && (event.ctrlKey || event.metaKey) && event.shiftKey)
  {
    event.preventDefault();
    
    // Get the line text
    var lineStart = getLineStart(start);
    var lineEnd = getLineEnd(start);
    editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = lineEnd;
    var lineText = editEnhanceElement.form.text.value.slice(lineStart, lineEnd);
    var lineTextLen = lineText.length;
    
    // Add a new line char if this is the last line
    if (lineText.slice(-1) != "\n") { lineText = "\n" + lineText; }
    
    // Insert the duplicated line
    document.execCommand("insertText", false, lineText);
    
    // Position the cursor at the beginning of the duplicated line
    editEnhanceElement.blur();
    editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd =
    editEnhanceElement.selectionStart - lineTextLen;
    editEnhanceElement.focus();
  }

/*  
  // Ctrl+(shift)+enter to begin a new line below or above the current line
  else if (event.keyCode == 13 && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    
    if (event.shiftKey)
    {
      var lineStart = getLineStart(start);
      if (lineStart == 0)
      {
        editEnhanceElement.selectionStart =
        editEnhanceElement.selectionEnd = 0;
        document.execCommand("insertText", false, "\n");
        editEnhanceElement.selectionStart =
        editEnhanceElement.selectionEnd = 0;
      }
      else
      {
        editEnhanceElement.selectionStart =
        editEnhanceElement.selectionEnd = lineStart-1;
        document.execCommand("insertText", false, "\n");
      }
    }
    else
    {
      // Deal with the special case where the ending newline char is selected
      if (start != end && editEnhanceElement.form.text.value[end-1] == "\n")
      { var lineEnd = end; }
      else { var lineEnd = getLineEnd(end); }
      if (lineEnd == editEnhanceElement.form.text.value.length) { lineEnd++; }
      editEnhanceElement.selectionStart =
      editEnhanceElement.selectionEnd = lineEnd-1;
      document.execCommand("insertText", false, "\n");
    }
		editEnhanceElement.blur();
		editEnhanceElement.focus();
  }
*/
  
  // Ctrl ; to scroll to the next mis-spelled word
  else if (event.keyCode == 186 && (event.ctrlKey || event.metaKey))
  {
    // A small delay is required to wait for the browser to perform the search
    setTimeout(function()
    {
      editEnhanceElement.blur();
      editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = start;
      editEnhanceElement.focus();
      editEnhanceElement.selectionEnd = end;
      
      updateOffset();
    }
    ,100);
  }
  
  /************** Emulate Emacs key bindings **************/
  
/*  
  // Left right key; memorize the horizontal position
  else if (event.keyCode == 39 || event.keyCode == 37)
  {
    // Get the position relative to the nearest newline
    setTimeout(function() { updateOffset(); }, 0);
    
    // Work with BTT key mapping for selecting till line start or line end.
    // Update the selection direction here.
    if (event.metaKey && event.shiftKey)
    { editEnhanceElement.selectDirection = (event.keyCode - 37) >> 1; }
  }
  
  // Ctrl-o open line
  else if (event.keyCode == 79 && (event.ctrlKey || event.metaKey) && !event.shiftKey)
  {
    event.preventDefault();
    document.execCommand("insertText", false, "\n");
    editEnhanceElement.selectionStart = editEnhanceElement.selectionEnd = start;
  }
  
  // Ctrl-d delete a char
  else if (event.keyCode == 68 && (event.ctrlKey || event.metaKey) && !event.shiftKey)
  {
    event.preventDefault();
    
    // If texts are selected, delete the selected area
    if (start != end) {}
    
    else
    {
      editEnhanceElement.selectionStart = start;
      editEnhanceElement.selectionEnd = start+1;
    }
    
    document.execCommand("insertText", false, "");
  }
  
  // The F key
  else if (event.keyCode == 70)
  {
    // Ctrl-f forward a char
    if (event.ctrlKey || event.metaKey)
    {
      event.preventDefault();
      
      if (!event.shiftKey)
      {
        if (start != end) { var posSimpleMove = end; }
        else { var posSimpleMove = end + 1; }
        moveCaretAndFocus(posSimpleMove, true);
      }
      else
      {
        var direction = 1;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = start + 1;
          if (posOutwardSelect > end) { posOutwardSelect = end; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = end + 1;
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
    // Alt-f forward a word
    // Alt-shift-f Select word forwards
    else if (event.altKey)
    {
      event.preventDefault();
      
      var posSimpleMove = getNextWordPos(end);
      
      if (!event.shiftKey) { moveCaretAndFocus(posSimpleMove, true); }
      else
      {
        var direction = 1;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = getNextWordPos(start);
          if (posOutwardSelect > end) { posOutwardSelect = end; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = posSimpleMove;
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
  }
  // The B key
  else if (event.keyCode == 66)
  {
    // Ctrl-b move backward a char
    if (event.ctrlKey || event.metaKey)
    {
      event.preventDefault();
      
      if (!event.shiftKey)
      {
        if (start != end) { var posSimpleMove = start; }
        else { var posSimpleMove = start - 1; }
        moveCaretAndFocus(posSimpleMove, true);
      }
      else
      {
        var direction = 0;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = end - 1;
          if (posOutwardSelect <= start) { posOutwardSelect = start; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = start - 1;
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
    
    // Alt-b backward a word
    // Alt-shift-b select ward backwards
    else if (event.altKey)
    {
      event.preventDefault();
      var posSimpleMove = getLastWordPos(start);
      
      if (!event.shiftKey) { moveCaretAndFocus(posSimpleMove, true); }
      else
      {
        var direction = 0;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect =  getLastWordPos(end);
          if (posOutwardSelect <= start) { posOutwardSelect = start; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = posSimpleMove;
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
  }
  
  // Ctrl-e go to line end
  else if (event.keyCode == 69 && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    var lineEnd = getLineEnd(end);
    var lastCharPos = editEnhanceElement.form.text.value.length;
    if (lineEnd == lastCharPos) { lineEnd++; }
    
    if (!event.shiftKey)
    {
      var posSimpleMove = lineEnd-1;
      moveCaretAndFocus(posSimpleMove, true);
    }
    else
    {
      var direction = 1;
      
      if (end != start && editEnhanceElement.selectDirection == (direction^1))
      {
        var posOutwardSelect = getLineEnd(start)-1;
        var posInwardSelect = null;
      }
      else
      {
        var posOutwardSelect = null;
        var posInwardSelect = lineEnd-1;
        editEnhanceElement.selectDirection = direction;
      }
      
      makeSelection(posOutwardSelect, posInwardSelect);
    }
  }
  
  // Ctrl-a go to line start
  else if (event.keyCode == 65 && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    
    if (!event.shiftKey)
    {
      var posSimpleMove = getLineStart(start);
      moveCaretAndFocus(posSimpleMove, true);
    }
    else
    {
      var direction = 0;
      
      if (end != start && editEnhanceElement.selectDirection == (direction^1))
      {
        var posOutwardSelect = getLineStart(end);
        var posInwardSelect = null;
      }
      else
      {
        var posOutwardSelect = null;
        var posInwardSelect = getLineStart(start);
        editEnhanceElement.selectDirection = direction;
      }
      
      makeSelection(posOutwardSelect, posInwardSelect);
    }
  }
*/
  
  // Ctrl-p previous line
  else if (event.keyCode == 80)
  {
    if (event.ctrlKey || event.metaKey)
    {
      event.preventDefault();
      
      if (!event.shiftKey)
      {
        var posSimpleMove = getLineStart(start);
        if (posSimpleMove != 0)
        {
          posSimpleMove = getLineStart(posSimpleMove-1);
          end = getLineEnd(posSimpleMove);
          if (posSimpleMove + editEnhanceElement.offset < end) { posSimpleMove += editEnhanceElement.offset; }
          else { posSimpleMove = end-1; }
        }
        moveCaretAndFocus(posSimpleMove, false);
      }
      else
      {
        var direction = 0;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = getLineStart(end-1);
          if (posOutwardSelect <= start) { posOutwardSelect = start; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = getLineStart(start-1);
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
    
    // Alt-p previous para
    else if (event.altKey)
    {
      event.preventDefault();
      var posSimpleMove = getLastParaStart(start);
      
      if (!event.shiftKey)
      {
        moveCaretAndFocus(posSimpleMove, true);
        selectLine(posSimpleMove);
      }
      else
      {
        var direction = 0;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = getLastParaStart(end);
          if (posOutwardSelect <= start) { posOutwardSelect = start; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = posSimpleMove;
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
  }
  // Ctrl-n next line
  // Checking the event.code property is a fix for MAC, and only works in Chrome
  else if (event.keyCode == 78 || event.code == 'KeyN')
  {
    if (event.ctrlKey || event.metaKey)
    {
      event.preventDefault();
      
      if (!event.shiftKey)
      {
        // Deal with the special case where the ending newline char is selected
        if (start != end && editEnhanceElement.form.text.value[end-1] == "\n")
        { var posSimpleMove = end; }
        else
        {
          var posSimpleMove = getLineEnd(end);;
          var lastCharPos = editEnhanceElement.form.text.value.length;
          if (posSimpleMove == lastCharPos) { posSimpleMove = lastCharPos; }
          else if (editEnhanceElement.form.text.value[posSimpleMove] != "\n")
          {
            posSimpleMove++;
            end = getLineEnd(posSimpleMove)-1;
            if (posSimpleMove + editEnhanceElement.offset <= end) { posSimpleMove += editEnhanceElement.offset-1; }
            else { posSimpleMove = end; }
          }
        }
        
        moveCaretAndFocus(posSimpleMove, false);
      }
      else
      {
        var direction = 1;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = getLineEnd(start);
          if (posOutwardSelect > end) { posOutwardSelect = end; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = getLineEnd(end);
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
      }
    }
    // Alt-n go to next para
    // Alt-shift-n continuous para selection down
    else if (event.altKey)
    {
      event.preventDefault();
      
      if (!event.shiftKey)
      {
        var posSimpleMove = getNextParaStart(start);
        moveCaretAndFocus(posSimpleMove, true);
        selectLine(posSimpleMove);
      }
      else
      {
        var direction = 1;
        
        if (end != start && editEnhanceElement.selectDirection == (direction^1))
        {
          var posOutwardSelect = getParaEnd(start);
          if (posOutwardSelect > end) { posOutwardSelect = end; }
          var posInwardSelect = null;
        }
        else
        {
          var posOutwardSelect = null;
          var posInwardSelect = getParaEnd(end+1);
          editEnhanceElement.selectDirection = direction;
        }
        
        makeSelection(posOutwardSelect, posInwardSelect);
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
      editEnhanceElement.selectionStart = getLineStart(start);
      editEnhanceElement.selectionEnd = start;
    }
    else if (event.ctrlKey)
    {
      editEnhanceElement.selectionStart = start;
      var lineEnd = getLineEnd(start);
      if (lineEnd == editEnhanceElement.form.text.value.length)
      		 { editEnhanceElement.selectionEnd = lineEnd; }
      else { editEnhanceElement.selectionEnd = lineEnd-1; }
    }
    else
    {
      editEnhanceElement.selectionStart = getLineStart(start);
      editEnhanceElement.selectionEnd = getLineEnd(start);
    }
    document.execCommand("insertText", false, "");
  }

	// Tab inserts two white spaces
	else if (event.keyCode == 9 && !(event.ctrlKey || event.metaKey || event.altKey))  
	{
		if (event.target != editEnhanceElement) { return; }
	  event.preventDefault();
	  document.execCommand("insertText", false, "  ");
	}

	// Focus after undo/redo
	else if (event.keyCode == 90 && (event.ctrlKey || event.metaKey))
	{
		if (document.activeElement === editEnhanceElement)
		{ setTimeout(function()	{ scrollToSelection(); }, 25); }
	}

//   console.log(event.keyCode);
}
, false);