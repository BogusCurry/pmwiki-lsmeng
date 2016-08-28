/* 
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

function getBulletStart(pos)
{
	// Find bullet start
	var start1 = document.getElementById('text').form.text.value.lastIndexOf("\n*",pos-1) +1;
	var start2 = document.getElementById('text').form.text.value.lastIndexOf("\n#",pos-1) +1;
	if (start1+start2 == 0)
	{ 
		var firstChar = document.getElementById('text').form.text.value.substr(0,1);
		if (firstChar != '*' && firstChar != '#')  {return;}
	}
	return Math.max(start1,start2);
}

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

function selectLine(pos)
{
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
  
// 	showCursorHighlight();	  

}, false);
	
window.addEventListener('keydown', function()
{
	// Scroll up & dn
	if (event.keyCode == 38 && event.altKey && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();  
		document.getElementById('text').scrollTop -= EditEnhanceLineHeight;
	}
	else if (event.keyCode == 40 && event.altKey && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();
		document.getElementById('text').scrollTop += EditEnhanceLineHeight;
	}

  // Page up down and highlight current line
	else if (event.keyCode == 33 && event.altKey && event.shiftKey)
	{
		setTimeout(function()
		{ selectLine(document.getElementById('text').selectionStart); },0);
	}
	else if (event.keyCode == 34 && event.altKey && event.shiftKey)
	{
		setTimeout(function()
		{ selectLine(document.getElementById('text').selectionStart-1);	},0);
	}	
	
	// Line up dn and highlight current line
	else if (event.keyCode == 38 && event.altKey && event.shiftKey)
	{
 		event.preventDefault();
	  document.getElementById('text').scrollTop -= EditEnhanceLineHeight;
		selectLine(document.getElementById('text').selectionStart-1);
	}
	else if (event.keyCode == 40 && event.altKey && event.shiftKey)
	{
		event.preventDefault();
		document.getElementById('text').scrollTop += EditEnhanceLineHeight;

		var pos = document.getElementById('text').selectionStart;
		if (document.getElementById('text').form.text.value.substring(pos,pos+1) != "\n")
		{
 		  var nextLine = document.getElementById('text').form.text.value.indexOf("\n",pos+1)+1;
 		  var start = nextLine==0 ? pos : nextLine;
		}
		else { var start = pos + 1; }
		document.getElementById('text').selectionStart = start;

		var end = document.getElementById('text').form.text.value.indexOf("\n",start);
		end = end==-1 ? document.getElementById('text').form.text.value.length : end;
		document.getElementById('text').selectionEnd = end;
	}
	
  // Move to the last/next bullet
  else if (event.keyCode == 38 && event.altKey)
	{
		event.preventDefault();
		var pos = document.getElementById('text').selectionStart-1;
		
		document.getElementById('text').selectionStart =
		document.getElementById('text').selectionEnd =  getBulletStart(pos);
		document.getElementById('text').blur();
		document.getElementById('text').focus();			
	}
	else if (event.keyCode == 40 && event.altKey)
	{
		event.preventDefault();
		var pos = document.getElementById('text').selectionStart;
		
		document.getElementById('text').selectionStart = 
		document.getElementById('text').selectionEnd = getBulletEnd(pos);
		document.getElementById('text').blur();
		document.getElementById('text').focus();			
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
				var start = document.getElementById('text').form.text.value.lastIndexOf("\n\n",pos-1) +2;
				var end = document.getElementById('text').form.text.value.indexOf("\n\n",pos);
				document.getElementById('text').selectionStart = start;
				document.getElementById('text').selectionEnd = end;
			}
			// Select line
			else
			{
				// A fix for resolving conflict with Chrome's url command
				var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1;
				var end = document.getElementById('text').form.text.value.indexOf("\n",pos);
				if (document.getElementById('text').selectionStart == start &&
						document.getElementById('text').selectionEnd == end)
				{ return; }

				event.preventDefault();
				document.getElementById('text').blur();
				document.getElementById('text').focus();
        selectLine(pos);
			}
    }
		// Select the whole bullet
		else if (event.altKey && event.shiftKey)
    {
			event.preventDefault();
			var pos = document.getElementById('text').selectionStart;
			
			document.getElementById('text').selectionStart = getBulletStart(pos);
			document.getElementById('text').selectionEnd = getBulletEnd(pos);
    }
	}
		
	// Open viewing page in a new tab
	else if (event.keyCode == 75 && event.shiftKey && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    window.open(window.location.href.replace(/\?action=edit/i,''), '_blank');
  }

  // Ctrl+shift+del to delete till the end of the line
  else if (event.keyCode == 8 && event.shiftKey && (event.ctrlKey || event.metaKey))
  {
		var pos = document.getElementById('text').selectionStart;
		var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1;
		var end = document.getElementById('text').form.text.value.indexOf("\n",pos);
		end = end==-1 ? document.getElementById('text').form.text.value.length : end;
		document.getElementById('text').selectionStart = pos;
		document.getElementById('text').selectionEnd = end;
  }

//  console.log(event.keyCode)
}
, false);
