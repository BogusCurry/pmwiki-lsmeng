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
	var text = EditEnhanceElement.form.text.value;
  
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
	var str = EditEnhanceElement.form.text.value.slice(pos);

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
			var lastNLIdx = EditEnhanceElement.form.text.value.slice(0,pos).lastIndexOf("\n");
			if (isStrEmpty(EditEnhanceElement.form.text.value.slice(lastNLIdx+1,pos)))
			{ return pos + firstNLIdx + 1; }
		}
	}

  // Find an empty line
  var matchPos = str.search(/^ *$/m);
	if (matchPos == -1) { return EditEnhanceElement.form.text.value.length; }
	var start = pos + matchPos;

  // Find a non empty line
  matchPos = str.slice(matchPos).search(/^ *[^\s]/m);
	if (matchPos == -1) { return EditEnhanceElement.form.text.value.length; }
	
	return start + matchPos;
}

// Return the cursor position of the paragraph end.
function getParaEnd(pos)
{
	var str = EditEnhanceElement.form.text.value.slice(pos);
	
  // If this is an empty line
	if (isStrEmpty(EditEnhanceElement.form.text.value.slice(getLineStart(pos),pos)))
	{
	  // Find the first nonempty char
		var matchPos = str.search(/[^\s]/);
		if (matchPos == -1) { return EditEnhanceElement.form.text.value.length; }
		str = str.slice(matchPos + 1);
		pos += matchPos + 1;
	}
	
	var match = str.match(/\n\s*?\n/);
	if (match == null) { return EditEnhanceElement.form.text.value.length; }
	return pos + match['index'] + match.slice(1,match.indexOf("\n")).length + 1;
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
	end1 = end1==-1 ? Infinity : end1+1;
	var end2 = EditEnhanceElement.form.text.value.indexOf("\n#",pos);
	end2 = end2==-1 ? Infinity : end2+1;
  var end3 = getParaEnd(pos);
	var end = Math.min(end1,end2,end3);
	if (end == Infinity) { end = EditEnhanceElement.form.text.value.length; }
	
	return end;
}

// Return the char offset of the start of the line
function getLineStart(pos)
{
	return pos==0 ? 0 : EditEnhanceElement.form.text.value.lastIndexOf("\n",pos-1)+1;
}

// Return the char offset of the end of the line
function getLineEnd(pos)
{
	var end = EditEnhanceElement.form.text.value.indexOf("\n",pos);
	end = end==-1 ? EditEnhanceElement.form.text.value.length : end+1;
	return end;
}

// Highlight the current line by text selection
function selectLine(pos)
{
	EditEnhanceElement.blur();
	EditEnhanceElement.selectionStart =
	EditEnhanceElement.selectionEnd = pos;  
	EditEnhanceElement.focus();
	EditEnhanceElement.selectionStart = getLineStart(pos);
	EditEnhanceElement.selectionEnd = getLineEnd(pos);
}

window.addEventListener('load',function()
{
  EditEnhanceElement = document.getElementById('text');

	EditEnhanceLineHeight = parseInt(window.getComputedStyle(EditEnhanceElement)['line-height']);  

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
	infoDiv.style.top = EditEnhanceElement.getBoundingClientRect().top + 'px';
 	infoDiv.style.right = '20px';
	infoDiv.style.webkitFilter = 'drop-shadow(0px 0px 2px gray)';

// 	document.body.appendChild(infoDiv);
	
	updateInfoDiv();
}, false);

// Update the char offset and line number in the information div
function updateInfoDiv()
{
// 	document.getElementById('infoDivID').innerHTML = 'Char: '+EditEnhanceElement.selectionStart+
// 	"<br>Line: "+
// 	(EditEnhanceElement.form.text.value.slice(0,EditEnhanceElement.selectionStart).match(/\n/g) || []).length;  	  
}

window.addEventListener('click', function() { updateInfoDiv(); }, false);

// When the meta key is down, other key presses can only be detected by key up on Windows.
window.addEventListener('keyup', function()
{
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
					EditEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<3);

				// Ctrl or Cmd+Alt: scroll up short
				else if (event.metaKey && event.altKey)
					EditEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<2);

				// Alt+Shift: continuous paragraph selection 
				else if (event.shiftKey && event.keyCode == 38)
				{
					EditEnhanceElement.blur();
					var end = EditEnhanceElement.selectionEnd;
					var pos = EditEnhanceElement.selectionStart;
					var start = EditEnhanceElement.selectionEnd = 
											EditEnhanceElement.selectionStart = getLastParaStart(pos);
					EditEnhanceElement.focus();
					EditEnhanceElement.selectionEnd = end;
				}
				else if (event.shiftKey && event.keyCode == 40)
				{
					EditEnhanceElement.blur();
					var start = EditEnhanceElement.selectionStart;			  
					var pos = EditEnhanceElement.selectionEnd;
					var end = getParaEnd(pos+1)

					EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = end;
					EditEnhanceElement.focus();
					EditEnhanceElement.selectionStart = start;
				}

				// Move to the last/next paragraph.
				else
				{
					var pos = EditEnhanceElement.selectionStart;
					if (event.keyCode == 38)      var start = getLastParaStart(pos);
					else if (event.keyCode == 40) var start = getNextParaStart(pos);
					selectLine(start);
					if (EditEnhanceElement.selectionStart == 0 && EditEnhanceElement.selectionEnd == 1)
					{ EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = 0; }
				}
			}
		}
  }
}, false);

window.addEventListener('keydown', function()
{
	// A fix for windows. Prevent alt key to turn the focus to browser's toolbar.
	if (event.keyCode == 18)
	{
		event.preventDefault();
		return;
	}

	// Up/Dn
	if (event.keyCode == 38 || event.keyCode == 40)
	{
		if (event.altKey)
		{
			event.preventDefault();  

			// Ctrl+Cmd+Alt: scroll up long
			if (event.ctrlKey && event.metaKey && event.altKey)
				EditEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<3);

			// Ctrl or Cmd+Alt: scroll up short
			else if ((event.ctrlKey || event.metaKey) && event.altKey)
				EditEnhanceElement.scrollTop += (event.keyCode - 39)*(EditEnhanceLineHeight<<2);

			// Alt+Shift: continuous paragraph selection 
			else if (event.shiftKey && event.keyCode == 38)
			{
				EditEnhanceElement.blur();
			  var end = EditEnhanceElement.selectionEnd;
				var pos = EditEnhanceElement.selectionStart;
				var start = EditEnhanceElement.selectionEnd = 
				            EditEnhanceElement.selectionStart = getLastParaStart(pos);
				EditEnhanceElement.focus();
				EditEnhanceElement.selectionEnd = end;
			}
			else if (event.shiftKey && event.keyCode == 40)
			{
				EditEnhanceElement.blur();
				var start = EditEnhanceElement.selectionStart;			  
				var pos = EditEnhanceElement.selectionEnd;
        var end = getParaEnd(pos+1)

        EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = end;
				EditEnhanceElement.focus();
				EditEnhanceElement.selectionStart = start;
			}

			// Move to the last/next paragraph.
			else
			{
				var pos = EditEnhanceElement.selectionStart;
				if (event.keyCode == 38)      var start = getLastParaStart(pos);
				else if (event.keyCode == 40) var start = getNextParaStart(pos);
				selectLine(start);
				if (EditEnhanceElement.selectionStart == 0 && EditEnhanceElement.selectionEnd == 1)
				{ EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = 0; }
    	}
		}
		// Ctrl+up to go to the top of page and highlight line. A fix for Windows.
		else if (event.ctrlKey || event.metaKey)
		{
			event.preventDefault();  

			if (event.shiftKey)
			{
			  if (event.keyCode == 38)      EditEnhanceElement.selectionStart = 0;
			  else if (event.keyCode == 40) EditEnhanceElement.selectionEnd = EditEnhanceElement.form.text.value.length;
			}
			else
			{
				if (event.keyCode == 38)
				{
				  selectLine(0);
				  if (EditEnhanceElement.selectionStart == 0 && EditEnhanceElement.selectionEnd == 1)
				  { EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = 0; }
				}
			  else if (event.keyCode == 40) selectLine(EditEnhanceElement.form.text.value.length); 
			}
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
		if (event.ctrlKey || (EditEnhanceOS == 'Mac' && event.metaKey))
		{
			var pos = EditEnhanceElement.selectionStart;

			// Shift dn, select paragraph
			if (event.shiftKey)
			{
				event.preventDefault();

        // Execute if the line is non-empty
        if (EditEnhanceElement.form.text.value.slice(getLineStart(pos), getLineEnd(pos)).replace(/\s/g,'') != '')
        {
				  EditEnhanceElement.selectionStart = getLastParaStart(pos+1);
				  EditEnhanceElement.selectionEnd = getParaEnd(pos);
				}
			}
			// Select line
			else
			{
				// A fix for resolving conflict with Chrome's url command
				if (EditEnhanceElement.selectionStart != getLineStart(pos) ||
						EditEnhanceElement.selectionEnd != getLineEnd(pos))
        {
 				  event.preventDefault();
				  selectLine(pos);
				}
			}
		}
		// Select the whole bullet
		else if ((event.altKey || event.metaKey) && event.shiftKey)
		{
			event.preventDefault();
			var pos = EditEnhanceElement.selectionStart;

      // Execute if the line is non-empty
			if (EditEnhanceElement.form.text.value.slice(getLineStart(pos), getLineEnd(pos)).replace(/\s/g,'') != '') 
			{
			  var bulletStart = getBulletStart(pos);
			
			  if (bulletStart == -1 || bulletStart < getLastParaStart(pos)) return;
			  else
			  {
  				EditEnhanceElement.selectionStart = bulletStart;
				  EditEnhanceElement.selectionEnd = getBulletEnd(pos);
			  }
		  }
		}
	}
	
	// Ctrl+/ to open viewing page
	else if (event.keyCode == 191 && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();
		if (event.shiftKey)
		{ window.open(window.location.href.replace(/\?action=edit/i,''), '_blank'); }
		else
		{ window.location = window.location.href.replace(/\?action=edit/i,''); }
	}

	// Ctrl+shift+del to delete till the end of the line
	// Shift+del to delete the whole line
	// Ctrl+del to forward delete till the start of the line
	else if (event.keyCode == 8)
	{
		// If texts are selected, delete the selected area no matter what 
		// modifier keys are pressed
		var pos = EditEnhanceElement.selectionStart;
		if (pos != EditEnhanceElement.selectionEnd)
		{ document.execCommand("insertText", false, ""); }
	
		else if (event.shiftKey)
		{
			if (event.ctrlKey || event.metaKey)
			{
				EditEnhanceElement.selectionStart = pos;
				var end = getLineEnd(pos);
				var textLen = EditEnhanceElement.form.text.value.length;
				end = end==textLen ? textLen : end-1;
				EditEnhanceElement.selectionEnd = end;
			  
			  // A fix for Windows since the Backspace key does not function when * key is pressed
    		if (EditEnhanceOS == 'Windows')
    		{	document.execCommand("insertText", false, ""); }
			}
			else
			{
				EditEnhanceElement.selectionStart = getLineStart(pos);
				EditEnhanceElement.selectionEnd = getLineEnd(pos);
			}
		}
		else if (event.ctrlKey || event.metaKey) 
		{
			EditEnhanceElement.selectionStart = getLineStart(pos);
			EditEnhanceElement.selectionEnd = pos;
		}
	}

	// Ctrl+k to record a jump point, ctrl+j to go to the jump point
	else if (event.keyCode == 75 && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();  
		EditEnhanceCursorPos = EditEnhanceElement.selectionStart;
		EditEnhanceScrollPos = EditEnhanceElement.scrollTop;
	}
	else if (event.keyCode == 74 && (event.ctrlKey || event.metaKey) && !event.shiftKey)
	{
		if (EditEnhanceOS == 'Windows')
			event.preventDefault();  

		if (typeof EditEnhanceCursorPos != 'undefined')
		{
	  	EditEnhanceElement.selectionStart = 
	  	EditEnhanceElement.selectionEnd = EditEnhanceCursorPos;
		  EditEnhanceElement.scrollTop = EditEnhanceScrollPos;
		}
	}

	// Ctrl+i to put the line with cursor at the center of the screen
	else if (event.keyCode == 73 && (event.ctrlKey || event.metaKey))
	{
		EditEnhanceElement.blur();
		var start = EditEnhanceElement.selectionStart;
		var end = EditEnhanceElement.selectionEnd;
		EditEnhanceElement.selectionStart =
		EditEnhanceElement.selectionEnd = start;
		var textLen = EditEnhanceElement.form.text.value.length;
    if (start > textLen>>1) { EditEnhanceElement.scrollTop = 0; }
		else { EditEnhanceElement.scrollTop = EditEnhanceElement.scrollHeight; }
		EditEnhanceElement.focus();
		EditEnhanceElement.selectionEnd = end;
	}

  // Ctrl+shift+D to duplicate a line
	else if (event.keyCode == 68 && (event.ctrlKey || event.metaKey) && event.shiftKey)
	{
		event.preventDefault();  

    // Get the line text
		var pos = EditEnhanceElement.selectionStart;
		var lineStart = getLineStart(pos);
		var lineEnd = getLineEnd(pos);
		EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = lineEnd;
		var lineText = EditEnhanceElement.form.text.value.slice(lineStart, lineEnd);
		var lineTextLen = lineText.length;

    // Add a new line char if this is the last line
		if (lineText.slice(-1) != "\n") { lineText = "\n" + lineText; }

    // Insert the duplicated line
		document.execCommand("insertText", false, lineText);

    // Position the cursor at the beginning of the duplicated line
		EditEnhanceElement.blur();
		EditEnhanceElement.selectionStart = EditEnhanceElement.selectionEnd = 
		EditEnhanceElement.selectionStart - lineTextLen;
		EditEnhanceElement.focus();
	}
	
	// Ctrl+(shift)+enter to begin a new line below or above the current line
	else if (event.keyCode == 13 && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();  

		if (event.shiftKey)
		{
  		var pos = EditEnhanceElement.selectionStart;
      var start = getLineStart(pos);
      if (start == 0)
      {
        EditEnhanceElement.selectionStart =
  		  EditEnhanceElement.selectionEnd = 0;
				document.execCommand("insertText", false, "\n");
				EditEnhanceElement.selectionStart =
				EditEnhanceElement.selectionEnd = 0;
  		}
  		else
  		{
        EditEnhanceElement.selectionStart =
  		  EditEnhanceElement.selectionEnd = start-1;
				document.execCommand("insertText", false, "\n");
  		}  					
		}
		else
	  {
			var pos = EditEnhanceElement.selectionEnd;
			var end = getLineEnd(pos);
			if (end == EditEnhanceElement.form.text.value.length) { end++; }
			{
				EditEnhanceElement.selectionStart =
				EditEnhanceElement.selectionEnd = end-1;
			  document.execCommand("insertText", false, "\n");
			}
		}
		EditEnhanceElement.blur();
		EditEnhanceElement.focus();
	}	
}
, false);
