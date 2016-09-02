/* 
 * Rich edit commands for textarea.
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

// Return the cursor position of the previous paragraph start.
function getLastParaStart(pos)
{
	var str = document.getElementById('text').form.text.value.slice(0,pos).split('').reverse().join('');
	// The start of a paragraph is identified by a newline, followed by optional multiple
	// empty spaces, followed by another char which is either a newline nor empty space
	var match = str.match(/[^\s]\s*\n\s*\n/);
	if (match == null)
	{ 
		if (document.getElementById('text').form.text.value.substr(0,1) == "\n" && 
				document.getElementById('text').form.text.value.substr(1,1) != "\n" && pos > 1)
		{ return 1; }
		else { return 0; }
		
	}
	var start = pos - match['index'] - 1;
  return start;
}

// Return the cursor position of the next paragraph start.
function getNextParaStart(pos)
{
	var str = document.getElementById('text').form.text.value.slice(pos);

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
			var lastNLIdx = document.getElementById('text').form.text.value.slice(0,pos).lastIndexOf("\n");
			if (document.getElementById('text').form.text.value.slice(lastNLIdx+1,pos).replace(/ /g,'') == "")
			{ return pos + firstNLIdx + 1; }
		}
	}

  match = str.match(/\n *\n *[^\s]/);
	if (match == null) { return document.getElementById('text').form.text.value.length; }
	var start = pos + match['index'] + match[0].length -1; 
	return start;
}

// Return the cursor position of the paragraph end.
function getParaEnd(pos)
{
	var str = document.getElementById('text').form.text.value.slice(pos);
	var match = str.match(/\n\s*?\n/);
	if (match == null) { return document.getElementById('text').form.text.value.length; }
 	var end = pos + match['index'] ;
	return end;
}

// Return the cursor position of the previous bullet start.
function getBulletStart(pos)
{
	// Find bullet start
	var start1 = document.getElementById('text').form.text.value.lastIndexOf("\n*",pos-1) +1;
	var start2 = document.getElementById('text').form.text.value.lastIndexOf("\n#",pos-1) +1;
	if (start1+start2 == 0)
	{ 
		var firstChar = document.getElementById('text').form.text.value.substr(0,1);
		if (firstChar != '*' && firstChar != '#')  { return -1; }
	}
	return Math.max(start1,start2);
}

// Return the cursor position of the bullet end.
function getBulletEnd(pos)
{
	// Find bullet end
	var end1 = document.getElementById('text').form.text.value.indexOf("\n*",pos);
	end1 = end1==-1 ? Infinity : end1;
	var end2 = document.getElementById('text').form.text.value.indexOf("\n#",pos);
	end2 = end2==-1 ? Infinity : end2;
	var end = Math.min(end1,end2);
	if (end == Infinity) { end = document.getElementById('text').form.text.value.length; }
	
	return end+1;
}

// Highlight the current line by text selection
function selectLine(pos)
{
	document.getElementById('text').selectionStart =
	document.getElementById('text').selectionEnd = pos;  
	document.getElementById('text').blur();
	document.getElementById('text').focus();
	var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1;
	var end = document.getElementById('text').form.text.value.indexOf("\n",pos);
	end = end==-1 ? document.getElementById('text').form.text.value.length : end;
	document.getElementById('text').selectionStart = start;
	document.getElementById('text').selectionEnd = end;
}

// Compute the correct top offset for the cursor highlight div based on the cursor position
// and the scroll position. A cutoff value has been set due to performance issue.
function showCursorHighlight()
{
	var pos = document.getElementById('text').selectionStart;
  if (pos > 20000) { return; }
	var scrollTop = document.getElementById('text').scrollTop;
	var cursorHighlight = document.getElementById('cursorHighlight');
	cursorHighlight.style.display = 'initial';
	cursorHighlight.style.top = getTextAreaHeightAtCaretPos(pos) + cursorHighlight.clientHeight - scrollTop  + 'px';
}
function hideCursorHighlight()
{	cursorHighlight.style.display = 'none'; }

// Well, it turns out there are still a few glitches with creating a hidden div; most of 
// the problems arise because of text wrapping though. E.g., ctrl+l puts the cursor at 
// the end of the line, while this actually can't be achieved with navigating simply 
// using direction keys.
function getTextAreaHeightAtCaretPos(pos)
{
  if (pos == 0) { pos = 1; }
//  	else if (document.getElementById('text').form.text.value.substring(pos-1,pos) == "\n") { pos += 1; }
  var textAreaDiv = document.getElementById('textAreaDiv');
  textAreaDiv.innerHTML = document.getElementById('text').form.text.value.substring(0,pos+1).replace(/\n/g,"<br>");
  return textAreaDiv.clientHeight;
}

window.addEventListener('load',function()
{
	EditEnhanceLineHeight = parseInt(window.getComputedStyle(document.getElementById('text'))['line-height']);
/*	
	// Create an invisible div having the same dimension here
	// due to the adjustment made in other js, a small delay should be applied here
  var textAreaDiv = document.createElement('div');
  textAreaDiv.style.visibility = 'hidden';
  textAreaDiv.id = 'textAreaDiv';
  textAreaDiv.style.position = 'fixed';
	var rectObject = document.getElementById('text').getBoundingClientRect();
  textAreaDiv.style.top = rectObject.top + 2 + 'px';
  textAreaDiv.style.left = rectObject.left + 2 + 'px';
  textAreaDiv.style.width = parseInt(window.getComputedStyle(document.getElementById('text'))['width'])+'px';
  textAreaDiv.style.fontFamily = window.getComputedStyle(document.getElementById('text'))['font-family'];
  textAreaDiv.style.fontSize = window.getComputedStyle(document.getElementById('text'))['font-size'];
  textAreaDiv.style.lineHeight = window.getComputedStyle(document.getElementById('text'))['line-height'];
  textAreaDiv.style.whiteSpace = window.getComputedStyle(document.getElementById('text'))['white-space'];
  textAreaDiv.style.wordBreak = window.getComputedStyle(document.getElementById('text'))['word-break'];
 	document.body.appendChild(textAreaDiv);

  // Create the cursor highlight div
  var cursorHighlight = document.createElement('div');
  cursorHighlight.id = 'cursorHighlight';
  cursorHighlight.style.position = 'fixed';
  cursorHighlight.style.display = 'none';
  cursorHighlight.style.top = rectObject.top + 2 + 'px';
  cursorHighlight.style.left = rectObject.left + 'px';
  cursorHighlight.style.opacity = 0.4;
  cursorHighlight.style.backgroundColor = 'lightgreen';
  cursorHighlight.style.height = window.getComputedStyle(document.getElementById('text'))['line-height'];
  cursorHighlight.style.width = window.getComputedStyle(document.getElementById('text'))['width'];
 	document.body.appendChild(cursorHighlight);

 	showCursorHighlight();	  
*/
  selectLine(document.getElementById('text').selectionStart);

}, false);

// On focus, highlight the current line
window.addEventListener('focus', function()
{ selectLine(document.getElementById('text').selectionStart); }, false);

window.addEventListener('keydown', function()
{
	// Ctrl/Cmd + Alt to scroll up dn
  if ((event.keyCode == 38 || event.keyCode == 33) && event.altKey && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();  
		document.getElementById('text').scrollTop -= EditEnhanceLineHeight<<1;
	}
	else if ((event.keyCode == 40 || event.keyCode == 34) && event.altKey && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();
		document.getElementById('text').scrollTop += EditEnhanceLineHeight<<1;
	}

  // Page up dn and highlight the current line
	else if (event.keyCode == 33 && event.altKey)// && event.shiftKey)
	{
		setTimeout(function()
		{ selectLine(document.getElementById('text').selectionStart); },0);
	}
	else if (event.keyCode == 34 && event.altKey)// && event.shiftKey)
	{
		setTimeout(function()
		{ selectLine(document.getElementById('text').selectionStart-1);	},0);
	}	

  // Continuous paragraph selection 
	else if (event.keyCode == 38 && event.altKey && event.shiftKey)
	{
 		event.preventDefault();
		var pos = document.getElementById('text').selectionStart;
    document.getElementById('text').selectionStart = getLastParaStart(pos);
  }
	else if (event.keyCode == 40 && event.altKey && event.shiftKey)
	{
 		event.preventDefault();
		var pos = document.getElementById('text').selectionEnd;
    if (pos == getParaEnd(pos))
    { document.getElementById('text').selectionEnd = getParaEnd(getNextParaStart(pos)); }
    else
    { document.getElementById('text').selectionEnd = getParaEnd(pos); }
	}

  // Move to the last/next paragraph. Turns out to be non-trivial. Unlike selecting a whole
  // paragraph, detecting the start of a paragraph needs regex
  else if (event.keyCode == 38 && event.altKey)
	{
		event.preventDefault();
		var pos = document.getElementById('text').selectionStart;
    var start = getLastParaStart(pos);
    selectLine(start);
	}
	else if (event.keyCode == 40 && event.altKey)
	{
		event.preventDefault();
		var pos = document.getElementById('text').selectionStart;
 		var start = getNextParaStart(pos);
		selectLine(start);
  }

  // Cmd/alt+shift+l: selection line, paragraph, or bullet
	else if (event.keyCode == 76)
	{
	  if (event.ctrlKey || event.metaKey)
	  {
			var pos = document.getElementById('text').selectionStart;
		
			// Shift dn, select paragraph
			if (event.shiftKey)
			{
				event.preventDefault();
				document.getElementById('text').selectionStart = getLastParaStart(pos+1);
				document.getElementById('text').selectionEnd = getParaEnd(pos);
			}
			// Select line
			else
			{
				if (document.getElementById('text').selectionStart == 0) { var start = 0; }
				else { var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1; }
				if (document.getElementById('text').selectionEnd == document.getElementById('text').form.text.value.length) { var end = document.getElementById('text').form.text.value.length; }
				else { var end = document.getElementById('text').form.text.value.indexOf("\n",pos); }

				// A fix for resolving conflict with Chrome's url command
				if (document.getElementById('text').selectionStart == start &&
						document.getElementById('text').selectionEnd == end) { return; }

				event.preventDefault();
        selectLine(pos);
			}
    }
		// Select the whole bullet
		else if (event.altKey && event.shiftKey)
    {
			event.preventDefault();
			var pos = document.getElementById('text').selectionStart;
			var bulletStart = getBulletStart(pos);
			if (bulletStart == -1) { return; }
			else
			{
				document.getElementById('text').selectionStart = bulletStart;
				document.getElementById('text').selectionEnd = getBulletEnd(pos);
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
  	var pos = document.getElementById('text').selectionStart;
  	if (event.shiftKey)
  	{
  		if (event.ctrlKey || event.metaKey)
  		{
				var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1;
				var end = document.getElementById('text').form.text.value.indexOf("\n",pos);
				end = end==-1 ? document.getElementById('text').form.text.value.length : end;
				document.getElementById('text').selectionStart = pos;
				document.getElementById('text').selectionEnd = end;
      }
      else
	    {
				var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1;
				var end = document.getElementById('text').form.text.value.indexOf("\n",pos);
				end = end==-1 ? document.getElementById('text').form.text.value.length : end+1;
				document.getElementById('text').selectionStart = start;
				document.getElementById('text').selectionEnd = end;
	    }
		}
  }

  // Ctrl + up/dn to go to the top/bottom of page and highlight line. A fix for Windows.
  else if (event.keyCode == 38 && (event.ctrlKey || event.metaKey))
  {
  	event.preventDefault();
  	if (event.shiftKey)
  	{ document.getElementById('text').selectionStart = 0;	}
  	else { selectLine(0); }
  }
  else if (event.keyCode == 40 && (event.ctrlKey || event.metaKey))
  {
  	event.preventDefault();
  	if (event.shiftKey)
  	{ document.getElementById('text').selectionEnd = document.getElementById('text').form.text.value.length;	}
  	else { selectLine(document.getElementById('text').form.text.value.length); }
  }
}
, false);