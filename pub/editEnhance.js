/* 
 * Rich edit commands for textarea.
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

// Return the cursor position of the previous paragraph start.
function getLastParaStart(pos)
{
	var str = EditEnhanceElement.form.text.value.slice(0,pos).split('').reverse().join('');
	// The start of a paragraph is identified by a newline, followed by optional multiple
	// empty spaces, followed by another char which is either a newline nor empty space
	var match = str.match(/[^\s]\s*\n\s*\n/);
	if (match == null)
	{ 
		if (EditEnhanceElement.form.text.value.substr(0,1) == "\n" && 
				EditEnhanceElement.form.text.value.substr(1,1) != "\n" && pos > 1)
		{ return 1; }
		else { return 0; }
		
	}
	var start = pos - match['index'] - 1;
  return start;
}

// Return the cursor position of the next paragraph start.
function getNextParaStart(pos)
{
	var str = EditEnhanceElement.form.text.value.slice(pos);

  // Handle the case where the next line is a new paragraph
  // If there is nothing between pos and next newline  
  var firstNLIdx = str.indexOf("\n");
  if (str.slice(0,firstNLIdx).replace(/ /g,'') == "")
  {
    // If there is something between next newline and next next new line
    var secondNLIdx = str.indexOf("\n", firstNLIdx+1);
		if (str.slice(firstNLIdx+1,secondNLIdx).replace(/ /g,'') != "")
		{		
		  // If there is nothing between last newline and pos
			var lastNLIdx = EditEnhanceElement.form.text.value.slice(0,pos).lastIndexOf("\n");
			if (EditEnhanceElement.form.text.value.slice(lastNLIdx+1,pos).replace(/ /g,'') == "")
			{ return pos + firstNLIdx + 1; }
		}
	}

  match = str.match(/\n *\n *[^\s]/);
	if (match == null) { return EditEnhanceElement.form.text.value.length; }
	var start = pos + match['index'] + match[0].length -1; 
	return start;
}

// Return the cursor position of the paragraph end.
function getParaEnd(pos)
{
	var str = EditEnhanceElement.form.text.value.slice(pos);
	var match = str.match(/\n\s*?\n/);
	if (match == null) { return EditEnhanceElement.form.text.value.length; }
 	var end = pos + match['index'] ;
	return end;
}

// Return the cursor position of the previous bullet start.
function getBulletStart(pos)
{
	// Find bullet start
	var start1 = EditEnhanceElement.form.text.value.lastIndexOf("\n*",pos-1) +1;
	var start2 = EditEnhanceElement.form.text.value.lastIndexOf("\n#",pos-1) +1;
	if (start1+start2 == 0)
	{ 
		var firstChar = EditEnhanceElement.form.text.value.substr(0,1);
		if (firstChar != '*' && firstChar != '#')  { return -1; }
	}
	return Math.max(start1,start2);
}

// Return the cursor position of the bullet end.
function getBulletEnd(pos)
{
	// Find bullet end
	var end1 = EditEnhanceElement.form.text.value.indexOf("\n*",pos);
	end1 = end1==-1 ? Infinity : end1;
	var end2 = EditEnhanceElement.form.text.value.indexOf("\n#",pos);
	end2 = end2==-1 ? Infinity : end2;
	var end = Math.min(end1,end2);
	if (end == Infinity) { end = EditEnhanceElement.form.text.value.length; }
	
	return end+1;
}

// Highlight the current line by text selection
function selectLine(pos)
{
	EditEnhanceElement.blur();
	EditEnhanceElement.selectionStart =
	EditEnhanceElement.selectionEnd = pos;  
	EditEnhanceElement.focus();
	var start = EditEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1;
	var end = EditEnhanceElement.form.text.value.indexOf("\n",pos);
	end = end==-1 ? EditEnhanceElement.form.text.value.length : end;
	EditEnhanceElement.selectionStart = start;
	EditEnhanceElement.selectionEnd = end;
}

window.addEventListener('load',function()
{
  EditEnhanceElement = document.getElementById('text');

	EditEnhanceLineHeight = parseInt(window.getComputedStyle(EditEnhanceElement)['line-height']);  

  // A small delay is added in order not to get interfered by Scrollpositioner.js
//   setTimeout("selectLine(EditEnhanceElement.selectionStart);", 50);
}, false);

// On focus, highlight the current line
// window.addEventListener('focus', function()
// { setTimeout("selectLine(EditEnhanceElement.selectionStart);",50); }, false);

window.addEventListener('keydown', function()
{
  // A fix for windows. Prevent the focus to go to browser's toolbar.
  if (event.altKey && EditEnhanceOS == 'Windows') event.preventDefault();

  // Up
  if (event.keyCode == 38)
	{
	  if (event.altKey)
	  {
			event.preventDefault();  

	    // Ctrl+Cmd+Alt: scroll up long
			if (event.ctrlKey && event.metaKey)
				EditEnhanceElement.scrollTop -= EditEnhanceLineHeight<<3;

	    // Ctrl+Cmd+Alt: scroll up short
			else if (event.ctrlKey || event.metaKey)
				EditEnhanceElement.scrollTop -= EditEnhanceLineHeight<<3;

			// Alt+Shift: continuous paragraph selection 
			else if (event.shiftKey)
			{
				var pos = EditEnhanceElement.selectionStart;
				EditEnhanceElement.selectionStart = getLastParaStart(pos);
			}  
			// Move to the last/next paragraph. Turns out to be non-trivial. Unlike selecting a whole
			// paragraph, detecting the start of a paragraph needs regex
			else
			{
				var pos = EditEnhanceElement.selectionStart;
				var start = getLastParaStart(pos);
				selectLine(start);
			}
		}
		// Ctrl+up to go to the top of page and highlight line. A fix for Windows.
		else if (event.ctrlKey || event.metaKey)
		{
			event.preventDefault();  

			if (event.shiftKey) { EditEnhanceElement.selectionStart = 0;	}
			else { selectLine(0); }
		}
	}
	// Down
	else if (event.keyCode == 40)
	{
		if (event.altKey)
		{
			event.preventDefault();  

	    // Ctrl+Cmd+Alt: scroll down long
			if (event.ctrlKey && event.metaKey)
				EditEnhanceElement.scrollTop += EditEnhanceLineHeight<<3;

	    // Ctrl+Cmd+Alt: scroll down short
			else if (event.ctrlKey || event.metaKey)
				EditEnhanceElement.scrollTop += EditEnhanceLineHeight<<3;

			// Alt+Shift: continuous paragraph selection 
			else if (event.shiftKey)
			{
				var pos = EditEnhanceElement.selectionEnd;
				if (pos == getParaEnd(pos))
				{ EditEnhanceElement.selectionEnd = getParaEnd(getNextParaStart(pos)); }
				else
				{ EditEnhanceElement.selectionEnd = getParaEnd(pos); }
			}
			// Move to the last/next paragraph.
			else
			{
				var pos = EditEnhanceElement.selectionStart;
				var start = getNextParaStart(pos);
				selectLine(start);
			}
    }
		// Ctrl+dn to go to the bottom of page and highlight line. A fix for Windows.
		else if (event.ctrlKey || event.metaKey)
		{
			event.preventDefault();  

			if (event.shiftKey)
			{ EditEnhanceElement.selectionEnd = EditEnhanceElement.form.text.value.length;	}
			else { selectLine(EditEnhanceElement.form.text.value.length); }
		}
	}

  // Page up dn and highlight the current line
  // To go back to exactly the same line between page up & dn, a little bit tweak is
  // needed. This is again due to the text wrapping.
 	else if (event.keyCode == 33 || event.keyCode == 34)
	{
	  // Align the cursor at the start before the page changes
		EditEnhanceElement.selectionStart =
		EditEnhanceElement.selectionEnd = 
		EditEnhanceElement.selectionStart;

  	setTimeout(function()
		{ 
			// Handle the special case of the last line
			if (EditEnhanceElement.selectionEnd == EditEnhanceElement.form.text.value.length)
			{
				var start = EditEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1;
				EditEnhanceElement.selectionStart = start;
			}

      // Don't touch the selection start; only put the selection end at the end of the
      // line. 
			var pos = EditEnhanceElement.selectionStart;
			var end = EditEnhanceElement.form.text.value.indexOf("\n",pos);
			end = end==-1 ? EditEnhanceElement.form.text.value.length : end;
			EditEnhanceElement.selectionEnd = end;		
		},0);
	}	

  // Cmd/alt+shift+l: selection line, paragraph, or bullet
	else if (event.keyCode == 76)
	{
	  if (event.ctrlKey || event.metaKey)
	  {
			var pos = EditEnhanceElement.selectionStart;
		
			// Shift dn, select paragraph
			if (event.shiftKey)
			{
				event.preventDefault();
				EditEnhanceElement.selectionStart = getLastParaStart(pos+1);
				EditEnhanceElement.selectionEnd = getParaEnd(pos);
			}
			// Select line
			else
			{
				if (EditEnhanceElement.selectionStart == 0) { var start = 0; }
				else { var start = EditEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1; }
				if (EditEnhanceElement.selectionEnd == EditEnhanceElement.form.text.value.length) { var end = EditEnhanceElement.form.text.value.length; }
				else { var end = EditEnhanceElement.form.text.value.indexOf("\n",pos); }

				// A fix for resolving conflict with Chrome's url command
				if (EditEnhanceElement.selectionStart == start &&
						EditEnhanceElement.selectionEnd == end) { return; }

				event.preventDefault();
        selectLine(pos);
			}
    }
		// Select the whole bullet
		else if (event.altKey && event.shiftKey)
    {
			event.preventDefault();
			var pos = EditEnhanceElement.selectionStart;
			var bulletStart = getBulletStart(pos);
			if (bulletStart == -1) { return; }
			else
			{
				EditEnhanceElement.selectionStart = bulletStart;
				EditEnhanceElement.selectionEnd = getBulletEnd(pos);
			}
    }
	}
		
	// Ctrl+enter to open viewing page
	else if (event.keyCode == 13 && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    if (event.shiftKey)
    { window.open(window.location.href.replace(/\?action=edit/i,''), '_blank'); }
    else
    { window.location = window.location.href.replace(/\?action=edit/i,''); }
  }

  // Ctrl+shift+del to delete till the end of the line
  // Shift+del to delete the whole line
  else if (event.keyCode == 8)
  {
  	var pos = EditEnhanceElement.selectionStart;
  	if (event.shiftKey)
  	{
  		if (event.ctrlKey || event.metaKey)
  		{
				var start = EditEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1;
				var end = EditEnhanceElement.form.text.value.indexOf("\n",pos);
				end = end==-1 ? EditEnhanceElement.form.text.value.length : end;
				EditEnhanceElement.selectionStart = pos;
				EditEnhanceElement.selectionEnd = end;
      }
      else
	    {
				var start = EditEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1;
				var end = EditEnhanceElement.form.text.value.indexOf("\n",pos);
				end = end==-1 ? EditEnhanceElement.form.text.value.length : end+1;
				EditEnhanceElement.selectionStart = start;
				EditEnhanceElement.selectionEnd = end;
	    }
		}
  }
  
  // Ctrl+k to record a jump point, ctrl+j to go to the jump point
  else if (event.keyCode == 75 && (event.ctrlKey || event.metaKey))
  {
		event.preventDefault();  
    EditEnhanceCursorPos = EditEnhanceElement.selectionStart;
    EditEnhanceScrollPos = EditEnhanceElement.scrollTop;
  }
  else if (event.keyCode == 74 && (event.ctrlKey || event.metaKey))
  {
    if (EditEnhanceOS == 'Windows') event.preventDefault();  
    if (typeof EditEnhanceCursorPos == 'undefined') return;
    EditEnhanceElement.selectionStart = 
    EditEnhanceElement.selectionEnd = EditEnhanceCursorPos;
    EditEnhanceElement.scrollTop = EditEnhanceScrollPos;
  }

  // Ctrl+i to put the line with cursor at the center of the screen
  else if (event.keyCode == 73 && (event.ctrlKey || event.metaKey))
  {
		EditEnhanceElement.blur();
    var start = EditEnhanceElement.selectionStart;
    var end = EditEnhanceElement.selectionEnd;
    EditEnhanceElement.selectionStart =
    EditEnhanceElement.selectionEnd = start;
	  EditEnhanceElement.scrollTop = 0;
		EditEnhanceElement.focus();
    EditEnhanceElement.selectionEnd = end;
  }
}
, false);