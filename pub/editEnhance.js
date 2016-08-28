/* 
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

function showCursorHighlight()
{
	var pos = document.getElementById('text').selectionStart;
	var scrollTop = document.getElementById('text').scrollTop;
	var cursorHighlight = document.getElementById('cursorHighlight');
	cursorHighlight.style.display = 'initial';
	cursorHighlight.style.top = getTextAreaHeightAtCaretPos(pos) + cursorHighlight.clientHeight - scrollTop  + 'px';
}
function hideCursorHighlight()
{
	cursorHighlight.style.display = 'none';
}

function getTextAreaHeightAtCaretPos(pos)
 {
//  console.log(document.getElementById('text').form.text.value.substring(pos,1));
  if (pos == 0) { pos = 1; }
// 	else if (document.getElementById('text').form.text.value.substring(pos-1,pos) == "\n") { pos += 1; }
  var textAreaDiv = document.getElementById('textAreaDiv');
  textAreaDiv.innerHTML = document.getElementById('text').form.text.value.substring(0,pos+1).replace(/\n/g,"<br>");
  return textAreaDiv.clientHeight;
}

window.addEventListener('wheel',function()
{
  hideCursorHighlight();
},false);

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


  var cursorHighlight = document.createElement('div');
  cursorHighlight.id = 'cursorHighlight';
  cursorHighlight.style.position = 'fixed';
  cursorHighlight.style.display = 'none';
  cursorHighlight.style.top = rectObject.top + 2 + 'px';
  cursorHighlight.style.left = rectObject.left + 'px';
  cursorHighlight.style.opacity = 0.3;
  cursorHighlight.style.backgroundColor = 'lightgreen';
  cursorHighlight.style.height = window.getComputedStyle(document.getElementById('text'))['line-height'];
  cursorHighlight.style.width = window.getComputedStyle(document.getElementById('text'))['width'];
 	document.body.appendChild(cursorHighlight);
  
	showCursorHighlight();
	  

}, false);

window.addEventListener('click',function()
{
	hideCursorHighlight();
},false);
	
window.addEventListener('keydown', function()
{  	
	// Scroll up & dn without moving caret
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

	// Scroll up & dn
	// The default behavior for dn puts the cursor at the end of line, which I don't like
	// Write my own solution to put it at the front of the line
	else if (event.keyCode == 38 && event.altKey)
	{	document.getElementById('text').scrollTop -= EditEnhanceLineHeight; }
	else if (event.keyCode == 40 && event.altKey)
	{
		event.preventDefault();
		document.getElementById('text').scrollTop += EditEnhanceLineHeight;
		var pos = document.getElementById('text').selectionStart;
	
		if ( document.getElementById('text').form.text.value.substring(pos,pos+1) != "\n")
		{	document.getElementById('text').selectionStart = document.getElementById('text').form.text.value.indexOf("\n",pos+1)+1; }
		else
		{ document.getElementById('text').selectionStart += 1; }
	}
	
	// Insert mode: Ctrl+i
	else if (event.keyCode == 73 && (event.ctrlKey || event.metaKey))
	{
		event.preventDefault();
		document.getElementById('text').focus();
		EditEnhanceCmdDn = false;
	}

  // Cmd+(shift)+l: selection line or paragraph
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
				var start = document.getElementById('text').form.text.value.lastIndexOf("\n",pos-1)+1;
				var end = document.getElementById('text').form.text.value.indexOf("\n",pos);

				// A fix for resolving conflict with Chrome's url command
				if (document.getElementById('text').selectionStart == start &&
						document.getElementById('text').selectionEnd == end)
				{ return; }

				event.preventDefault();
				document.getElementById('text').selectionStart = start;
				document.getElementById('text').selectionEnd = end;
			}
    }
		// Select the whole bullet
		else if (event.altKey && event.shiftKey)
    {
			event.preventDefault();
			var pos = document.getElementById('text').selectionStart;

			// Find bullet start
			var start1 = document.getElementById('text').form.text.value.lastIndexOf("\n*",pos-1) +1;
			var start2 = document.getElementById('text').form.text.value.lastIndexOf("\n#",pos-1) +1;
			if (start1+start2 == 0)
			{ 
			  var firstChar = document.getElementById('text').form.text.value.substr(0,1);
			  if (firstChar != '*' && firstChar != '#')  {return;}
			}
      
			// Find bullet end
      var end1 = document.getElementById('text').form.text.value.indexOf("\n*",pos);
      end1 = end1==-1 ? Infinity : end1;
      var end2 = document.getElementById('text').form.text.value.indexOf("\n#",pos);
      end2 = end2==-1 ? Infinity : end2;
      var end = Math.min(end1,end2);
			if (end == Infinity) { end = document.getElementById('text').form.text.value.length; }
			
			document.getElementById('text').selectionStart = Math.max(start1,start2);
			document.getElementById('text').selectionEnd = end+1;
    }
	}
	
	// Open viewing page in a new tab
	else if (event.keyCode == 75 && event.shiftKey && (event.ctrlKey || event.metaKey))
  {
    event.preventDefault();
    window.open(window.location.href.replace(/\?action=edit/i,''), '_blank');
  }

//   else if (event.keyCode == 39 && (event.ctrlKey || event.metaKey))
//   {
//     showCursorHighlight();
//   }
  
	else if (event.keyCode >= 37 && event.keyCode <= 40)
	{
    if (!event.shiftKey)
    {
      setTimeout(showCursorHighlight,0);
    }
    else
    {
      hideCursorHighlight();
    }
	}


//   console.log(event.keyCode)
}
, false);
