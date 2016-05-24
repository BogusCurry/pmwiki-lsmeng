/* 
 * Remember and set the scroll and caret positions. When browsing, this also replaces the
 * special string inserted at the last caret position when editing with a predefined html
 * location markup #lastEdit and scrolls there, or an empty string depending on the
 * entered url. When browsing, this class also implements a mechanism in which if enter is
 * pressed when there are texts selected, the editing page will be open in a new tab with
 * scroll and caret situated at the beginning of the selected bullet.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var ScrollPositioner = 
{
  pagename: '',
  action: '',
  lastEditMark: '',
  isBrowsing: false,
  isEmEnable: false,
  isEditableEnable: false,
  isLegacyTextedit: false,
  lastCaretPos: 0,
  posAfterPaste: 0,
  lastScrollHeight: 0,
  stationName: '',
  nWaitForLatex: 0, 
  

  // Delete the cookie with cookie name "name"
	delCookie: function(name)
	{ 
		var cval = ScrollPositioner.getCookie(name); 
		if(cval != null)
		{
			var exp = new Date();
			exp.setTime(exp.getTime() - 1);
			document.cookie = name + "="+cval+";expires="+exp.toGMTString(); 
		}
	},
	
  // Get the value of the cookie "c_name"
  // Return the cookie value if it exists.
  //        an empty string otherwise.
	getCookie: function(c_name)
	{
		if (document.cookie.length>0)
		{
			c_start=document.cookie.indexOf(c_name + "=");
			if (c_start!=-1)
			{
				c_start=c_start + c_name.length+1;
				c_end=document.cookie.indexOf(";",c_start);
				if (c_end==-1) { c_end=document.cookie.length;}
				return unescape(document.cookie.substring(c_start,c_end));
			}
		}

		return "";
	},

/* The following is for scroll positioning */
/****************************************************************************************/
	
  // Set the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different. Currently they are the same.	
	setScrollPos: function(y)
	{ document.body.scrollTop = y; },

  // Get the scroll position. Depending on the current pmwiki action (browsing, editing,
  // etc), the method could be different. Currently they are the same.	
	getScrollPos: function()
	{ return document.body.scrollTop; },

  // Record the current scroll position in cookie. The scroll positions for browsing and 
  // editing pages are recorded separately.
  setScrollPosCookies: function()
	{
		cookieName = ScrollPositioner.pagename.toUpperCase();

    if (ScrollPositioner.isBrowsing == false)
	  { cookieName = cookieName + 'EDIT'; }
	  
	  cookieName = cookieName + '-ScrollY';

		var value = ScrollPositioner.getScrollPos();
		
		if (value != 0) { document.cookie = cookieName + "=" + escape(value); }
		else { ScrollPositioner.delCookie(cookieName); }
	},
	
	// Read from cookie to get the last scroll position and set it accordingly.
  readCookieSetScrollPos: function()
  {
		cookieName = ScrollPositioner.pagename.toUpperCase();

    if (ScrollPositioner.isBrowsing == false)
	  { cookieName = cookieName + 'EDIT'; }
	  	
	  cookieName = cookieName + '-ScrollY';
  
		var y = ScrollPositioner.getCookie(cookieName);
		if (y == null || y == "") { y = 0; }
	
    ScrollPositioner.setScrollPos(y);

// Remove the below if NGO since I think the above line is exactly the same and clearer.
//		var currentPos = ScrollPositioner.getScrollPos();
//    if (currentPos != y) { ScrollPositioner.setScrollPos(y); }
  },

/* The following is for caret positioning */
/****************************************************************************************/

  // Set Caret position for contenteditable works fine. Get, however, gives me tons of
  // trouble and is yet to be solved. Both defunct.
  getCaretPosForEditable: function()
  {
    var pos = window.getSelection().anchorOffset;    
    ScrollPositioner.lastCaretPos = pos;

// Add this for debugging. If the caret goes around erratically, something is wrong.
//    ScrollPositioner.setCaretPosForEditable(pos);

    return pos;
  },
  setCaretPosForEditable: function(caret)
  {
		var node = document.getElementById('text');
		var textNode = node.firstChild;
		var range = document.createRange();
		range.setStart(textNode, caret);
		range.setEnd(textNode, caret);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
  },
  
  // Get & set the caret position. Depending on the current editing mechanism (codemirror,
  // div with content editable, legacy textarea), the methods are different.
  getCaretPos: function()
  {
	  if (ScrollPositioner.isEmEnable == true) {}
	  
		else if (ScrollPositioner.isEditableEnable == true)
		{ return ScrollPositioner.getCaretPosForEditable(); }

    else if (ScrollPositioner.isLegacyTextedit == true)
		{ return document.getElementById('text').selectionStart; }

  },
  setCaretPos: function(caret)
  {
	  if (ScrollPositioner.isEmEnable == true) {}
	  
		else if (ScrollPositioner.isEditableEnable == true)
		{ ScrollPositioner.setCaretPosForEditable(caret); }

    else if (ScrollPositioner.isLegacyTextedit == true)
		{
		  document.getElementById('text').selectionStart = caret;
      document.getElementById('text').selectionEnd = caret;
		}
  },  

  // Record the current caret position in cookie.
  setCaretPosCookies: function()
  {
		cookieName = ScrollPositioner.pagename.toUpperCase() + '-Caret';

		var value = ScrollPositioner.getCaretPos();
		
		if (value != 0) { document.cookie = cookieName + "=" + escape(value); }
		else { ScrollPositioner.delCookie(cookieName); }
  },

	// Read from cookie to get the last caret position and set it accordingly.
  readCookieSetCaretPos: function()
  {
		var y = ScrollPositioner.getCookie(ScrollPositioner.pagename.toUpperCase()+'-Caret');
		if (y == null || y == "") { y = 0; }

		var currentPos = ScrollPositioner.getCaretPos();

    if (currentPos != y) { ScrollPositioner.setCaretPos(y); }
  },

  // Paste in legacy textarea sometimes eat out one more newline character and this has
  // been bothering me for quite a long time. Intercepting the paste text and composing 
  // the text after paste can be a solution, but this cripples the builtin undo mechanism.
  // Strangely, after all the fixes and improvements I have made, the paste problem seems
  // to disappear somehow. Need to observe for some time.
  // Declaring this on paste behavior outside the class doesn't seem to work.
  pasteFixForLegacyTextarea: function()
  {    
		document.getElementById('text').onpaste = function(e)
		{
			var pastedText = undefined;
			if (window.clipboardData && window.clipboardData.getData) { // IE
				pastedText = window.clipboardData.getData('Text');
			} else if (e.clipboardData && e.clipboardData.getData) {
				pastedText = e.clipboardData.getData('text/plain');
			}
			
			var caretPosStart = document.getElementById('text').selectionStart;
			var caretPosEnd = document.getElementById('text').selectionEnd;
  		var textContent = document.getElementById('text').form.elements['text'].value;			
      
  		document.getElementById('text').form.elements['text'].value = [textContent .slice(0, caretPosStart), pastedText, textContent.slice(caretPosEnd)].join('');
            		
			caretPosStart = caretPosStart+pastedText.length;			
			document.getElementById('text').selectionStart = caretPosStart;
			document.getElementById('text').selectionEnd = caretPosStart;			
			
			ScrollPositioner.setCaretPosCookies();
			textAreaAdjust();
			
      // If false the original paste won't go
			return false; 
		};
  },

  // Return the character offset of the "numBullet"-th bullet in string "HTML".
  // A bullet is characterized by the pattern "\n*" or "\n#"
  // "isFirstLineBullet" is the character offset of the very 1st bullet with no newline 
  // character right before it, and is -1 if nonexistent.
  computeCharOffsetForBullet: function(HTML, numBullet, isFirstLineBullet)
  {
    var charOffset;
    
		if (numBullet == 1)
		{
			if (isFirstLineBullet != -1) { charOffset = isFirstLineBullet; }
			else
			{
				// Get the first occurence of "\n*" or "\n#"
				charOffset = HTML.indexOf("\n*");
				if (charOffset == -1) { charOffset = HTML.indexOf("\n#"); }
				if (charOffset == -1) { alert('Unexpected case!'); }
			}
		}
		else
		{
			if (isFirstLineBullet != -1)
			{
				// Get the numBullet-1 occurrence of "\n*" or "\n#"
				charOffset = nthIndex(HTML, "\n*", "\n#", numBullet-1);
			}
			else
			{
				// Get the numBullet occurrence of "\n*" or "\n#"
				charOffset = nthIndex(HTML, "\n*", "\n#", numBullet);
			}
		}

		charOffset++;

    return charOffset;
  },
  
  // When browsing, replace the special string inserted at the last caret position when
  // autosaving with a predefined html location markup #lastEdit and scroll there, or an
  // empty string depending on the entered url. When viewing the history, simply remove
  // all such special strings.
  replaceMarkAndScroll: function()
  {
    if (ScrollPositioner.action == 'browse')
    {
			var HTML = document.getElementById('wikitext').innerHTML;
	
   		// It can happen that the string with an intentional empty space being the first 
			// character ends up with > being the first in html. Search for the non-empty part 
			// of the string and then check for the char right before it.
			var pos = HTML.indexOf(ScrollPositioner.lastEditMark.substring(1));
			if (pos == -1) { ScrollPositioner.readCookieSetScrollPos(); return; }
			else
			{
				var preChar = HTML.substring(pos-1,pos);
				if (preChar == ' ') { pos--; }
				else if (preChar == '>') {}
				else { alert('Unexpected case in replaceMarkAndScroll()!'); }
			}

      // If the url includes the location markup, replace the string with the location 
      // markup and a red triangle for easy spotting.
			var str = '';
			if (window.location.href.indexOf("#lastEdit") != -1)
			{ str = '<a id="lastEdit"><span  style=\'color: red;\'>&#9650</span></a>'; }
	
			document.getElementById('wikitext').innerHTML = [HTML.slice(0, pos), str, HTML.slice(pos+ScrollPositioner.lastEditMark.length)].join('');

			if (window.location.href.indexOf("#lastEdit") != -1)
			{
			  // Adjust the location markup to the middle of the browser.
				var halfScreenHeight = Math.round(window.innerHeight/2);
				document.getElementById('lastEdit').style.paddingTop = halfScreenHeight + 'px';
				document.getElementById('lastEdit').scrollIntoView();
			}
			else
			{ ScrollPositioner.readCookieSetScrollPos(); }
		}
    // If the pmwiki action is to view the history, simply remove all the special strings
    // for marks.
		else if (ScrollPositioner.action == 'diff')
		{
			document.getElementById('wikitext').innerHTML
			= document.getElementById('wikitext').innerHTML.replace(new RegExp(ScrollPositioner.lastEditMark.substring(1), 'g'), '');
		}
  },
  
  // Wait for the LATEX rendering to complete first since it also replaces the page HTML.
  // Then call replaceMarkAndScroll();
  waitLatexThenReplaceMarkAndScroll: function()
  {
    var HTML = document.getElementById('wikitext').innerHTML;

    // See if the primitive markup for latex equations is still visible in the page HTML
		if (HTML.indexOf('{$') != -1 && HTML.indexOf('$}') != -1)
		{
			ScrollPositioner.nWaitForLatex++;
     	if (ScrollPositioner.nWaitForLatex > 100)
     	{
     	  alert('Latex rendering exceeds 10 seconds!');
     	  ScrollPositioner.replaceMarkAndScroll();
     	  return;
     	}
     		  
			setTimeout(ScrollPositioner.waitLatexThenReplaceMarkAndScroll,100);
		}
		else
		{
		  // No primitive markup existing, but latex header is found. This means latex is 
		  // now trying to render each equations.
		  var mathJaxTagPos = HTML.lastIndexOf('<span class="MathJax_Preview">');
		  if (mathJaxTagPos != -1)
		  {
		    // If the last latex header is not followed by </span>, latex has not done 
		    // rendering equations.
        // 30 is the length of the above search string; 7 is for '</span>'
		    if (HTML.substring(mathJaxTagPos+30,mathJaxTagPos+30+7) != '</span>')
		    {
     		  ScrollPositioner.nWaitForLatex++;
     		  if (ScrollPositioner.nWaitForLatex > 100)
     		  {
     		    alert('Latex rendering exceeds 10 seconds!');
     		    ScrollPositioner.replaceMarkAndScroll();
     		    return;
     		  }
     		  
    		  setTimeout(ScrollPositioner.waitLatexThenReplaceMarkAndScroll,100);		      
		    }
		    else
		    {
		      ScrollPositioner.nWaitForLatex = 0;
		      ScrollPositioner.replaceMarkAndScroll();
		    } 
		  }
		  // No primitive markup, no latex header, means no latex on this page
		  else
		  { ScrollPositioner.replaceMarkAndScroll(); }
		}
  },
  
	// When browsing, if enter is pressed with texts selected, the caret position will 
	// be computed and stored in a cookie. The editing page will be open in a new tab 
	// automatically with scroll and caret situated at the beginning of the selected bullet.
	// Also called the "Edit here" mechanism.
  readCookieSetScrollCaretPosFromBrowse: function()
  {
		cookieName = ScrollPositioner.pagename.toUpperCase() + '-EditPos';
		var numBullet = ScrollPositioner.getCookie(cookieName);
		if (numBullet != null && numBullet != "")
		{
			// Delete the cookie as we would like the press-then-edit to be valid only once
			// after pressed.
			ScrollPositioner.delCookie(cookieName);

			// The change from <textarea to <div corrupts the font settings, this affects the
			// scroll position. Specifically set the font to match the <textarea editing style
			// to deal with this problem. The font is unfortunately OS dependent.
			if (ScrollPositioner.stationName == 'MBA')
			{ document.getElementById('text').style.fontFamily = 'Lucida Grande'; }
			else
			{ document.getElementById('text').style.fontFamily = 'COURIER'; }
			document.getElementById('text').style.lineHeight = '1.2em';

			// Force the textarea box to change into a div component.
			var HTML = document.getElementById('wikitext').innerHTML;

			HTML = HTML.replace('</textarea>', '<!-- END --></div>');
			HTML = HTML.replace('<textarea', '<!-- START --><div');
			document.getElementById('wikitext').innerHTML = HTML;
							
			// See if the first line of textarea begins with a bullet
			var isFirstLineBullet = HTML.indexOf('>*');
			if (isFirstLineBullet == -1) { isFirstLineBullet = HTML.indexOf('>#'); }

			// Get charOffset based on numBullet and isFirstLineBullet
			var charOffset = ScrollPositioner.computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet);

			// Insert mark and tell the browser to scroll there, then remove the mark
			var str = '<a id="lastEdit"></a>';
			document.getElementById('wikitext').innerHTML = [HTML.slice(0, charOffset), str, HTML.slice(charOffset)].join('');
			window.location = window.location.href + '#lastEdit';
			var pos = ScrollPositioner.getScrollPos() - 20;
			document.getElementById('wikitext').innerHTML = document.getElementById('wikitext').innerHTML.replace(str,'');
			
			// Change from div back to textarea
			HTML = document.getElementById('wikitext').innerHTML;
			HTML = HTML.replace('<!-- START --><div', '<textarea');
			HTML = HTML.replace('<!-- END --></div>', '</textarea>');
			document.getElementById('wikitext').innerHTML = HTML;

			/********************************************************************************/
			// Set caret position 
			// Somehow calculating from document body and add appropriate offset does not add
			// up. The difference between charOffset calculated above and below is not a fixed
			// value, which I thought it would be.
			// Let's just calculate it again using the text field then.
			HTML = document.getElementById('text').textContent;
			HTML = HTML.replace(ScrollPositioner.lastEditMark,'');
			isFirstLineBullet = -1;
			if (HTML.substring(0,1) == '*' || HTML.substring(0,1) == '#')
			{ isFirstLineBullet = 0; }
			
			charOffset = ScrollPositioner.computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet);

			// At the end, set caret => focus => set scroll, the order matters.
			ScrollPositioner.setCaretPos(charOffset);
			document.getElementById('text').focus();
			ScrollPositioner.setScrollPos(pos);

			return true;
		}
		else { return false; }
  },
  
  init: function()
  {
	  if (ScrollPositioner.action == 'browse')
	  {
	    ScrollPositioner.isBrowsing = true;
	    ScrollPositioner.waitLatexThenReplaceMarkAndScroll();
	  }
	  
	  else if (ScrollPositioner.action == 'diff')
	  {
	    ScrollPositioner.replaceMarkAndScroll();
	  }
	  
	  else if (ScrollPositioner.action == 'edit')
	  {  
	    // Initialize the styles depending on the editing mechanisms
	    // Codemirror. Defunct.
	    if (document.getElementById('text').codemirror != null)
	    {
  	    ScrollPositioner.isEmEnable = true;
  	    document.getElementById('text').codemirror.focus();
	    }
	    // Div with content editable. Defunct.
	  	else if (document.getElementById('text').form == null)
	  	{
	  	  ScrollPositioner.isEditableEnable = true;
 	  		document.getElementById('text').style.minHeight = '500px';
	  	  document.getElementById('text').focus();
	  	}
	    // Legacy textarea.
	  	else
	  	{
	  	  ScrollPositioner.isLegacyTextedit = true;
	  		document.getElementById('text').focus();	  		
      	textAreaAdjust();
//	  		ScrollPositioner.pasteFixForLegacyTextarea();
	  	}

      // Set the scroll and caret positions for text editing.	  	
      var result = ScrollPositioner.readCookieSetScrollCaretPosFromBrowse();

      if (!result)
		  {
				ScrollPositioner.readCookieSetScrollPos();
				ScrollPositioner.readCookieSetCaretPos();
			}	  	
	  }
  }
}

window.addEventListener('load', ScrollPositioner.init, false);

// Enabling this will lock the scroll and caret positions for the same pages that are opened
//window.addEventListener('focus', ScrollPositioner.readCookieSetScrollPos, false);
//window.addEventListener('focus', ScrollPositioner.readCookieSetCaretPos, false);

// When clicking the "view" button to go to the browsing url appended by the location 
// markup #lastEdit when the current url is not appended by one, the default behavior by 
// the browser is to simply search for the location markup in the page html. However, 
// I need the page to be reloaded for the markup to be replaced and take effect. 
// The following fixes this.
window.addEventListener('click', function()
{
  if (window.location.href.indexOf("#lastEdit") == -1)
  { setTimeout(function()
    {
      if (window.location.href.indexOf("#lastEdit") != -1) { location.reload(); }
    },1); }
}, false);

// Record the scroll and caret position on focusout and page close.
window.addEventListener("focusout", setScrollAndCaretPosCookie, false);
window.addEventListener("beforeunload", setScrollAndCaretPosCookie, false);
function setScrollAndCaretPosCookie()
{
  ScrollPositioner.setScrollPosCookies();
  
  if (ScrollPositioner.isBrowsing == false)
  { ScrollPositioner.setCaretPosCookies(); }
}

// On receiving new input, adjust the legacy textarea box size.
window.addEventListener('input', textAreaAdjust, false);
function textAreaAdjust()
{
  if (ScrollPositioner.isLegacyTextedit == true)
  {
    elem = document.getElementById('text');

		if (elem.clientHeight < elem.scrollHeight) 
		{
			elem.style.height = 'auto';
		  elem.style.height = elem.scrollHeight+500+'px';
		}
	}
}

function _textAreaAdjust()
{
  if (ScrollPositioner.isLegacyTextedit == true)
  {
    // Calculating the actual height by px seems to work fine for now
    var rows = document.querySelector('textarea').value.split("\n").length;
		elem = document.getElementById('text'); 
		
// elem.clientWidth/10.5 => num of char in one line
//alert(document.querySelector('textarea').value.split("\n")[0]);

    elem.style.height = 40*rows + 'px';
	}
}

// When enter is pressed, check whether texts are selected. If yes, compute the number of
// html bullets before the selected text, record it in cookie, and then open a new tab
// for editing.
window.addEventListener('keydown', function()
{
  if (ScrollPositioner.isBrowsing == true)
  {
		if( event.keyCode == 13 )
		{
			var sel = window.getSelection();
			var selString = sel.toString();
			if (selString == '') { return; }
			if (selString.substring(0,1) == "\n") { selString = selString.slice(1); }
			var newlinePos = selString.indexOf("\n");
			if (newlinePos != -1) { selString = selString.substring(0,newlinePos); }
	
			var HTML = document.getElementById('wikitext').innerHTML;       
			var selStringPos = HTML.indexOf( selString );
			HTML = HTML.substring(0,selStringPos);
	
	    // This one liner is of course from the Internet. It computes the number of times
	    // "<li" appears in the string "HTML".
			var numBullet = (HTML.match(/<li/g) || []).length;

			cookieName = ScrollPositioner.pagename.toUpperCase() + '-EditPos';
			document.cookie = cookieName + "=" + escape(numBullet);
			
			window.open(window.location.href.replace('#lastEdit','')+'?action=edit', '_blank');
		}
		
		return true;
	}
}, false);

// Get the indexOf the nth occurrence of either "pat1" or "pat2"
function nthIndex(str, pat1, pat2, n)
{
	var L= str.length, i= -1;
	while(n-- && i++<L)
	{
			var pos1 = str.indexOf(pat1, i);
			var pos2 = str.indexOf(pat2, i);   
			
			// If i j both found, take the smaller one
			if (pos1 != -1 && pos2 != -1)
			{ i = Math.min(pos1,pos2); }
			
			// if only i found, work with i 
			else if (pos1 != -1 && pos2 == -1)
			{ i = pos1; }
			
			// if only j found, work with j
			else if (pos1 == -1 && pos2 != -1)
			{ i = pos2; }
			
			// nothing, break
			else { break; }
	}
	
	return i;
}
