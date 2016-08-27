/* 
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */



window.addEventListener('load',function()
{
	EditEnhanceLineHeight = parseInt(window.getComputedStyle(document.getElementById('text'))['line-height']);
}, false);

window.addEventListener('keydown', function()
{
// console.log(event.keyCode)
	
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
  
//   console.log(event.keyCode)
}
, false);
