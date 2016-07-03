/* 
 * Read and set cookies for storing last scroll and caret positions. 
 * 
 * This also works with 'autosave.js', 
 * which sets a cookie storing the number of bullets before the caret position when 
 * performing autosave. When browsing, ScrollPositioner reads the cookie and tries to 
 * locate the position in page HTML corresponding to that stored in the cookie. Once
 * found, a special html string is dynamically inserted as an anchor for scrolling. 
 *
 * When browsing, this class also implements a mechanism in which if enter is
 * pressed with texts selected, the number of bullets before the selected text
 * is calculated, and a corresponding cookie is set. The editing page will be opened
 * automatically in a new tab.
 * 
 * When editing, this class reads the aforementioned cookie (if exists) and tries to 
 * locate the position in textarea corresponding to that given in the cookie. Once
 * found, a special html string is dynamically inserted as an anchor for scrolling. To 
 * achieve this, however, the textarea has to be dynamically changed to a div component.
 * After the scrolling, the textarea is changed back. 
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var ScrollPositioner = 
{
  pagename: '',
  action: '',
  isBrowsing: false,
  isEmEnable: false,
  isEditableEnable: false,
  isLegacyTextedit: false,
  lastCaretPos: 0,
  OS: '',
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
			var c_start=document.cookie.indexOf(c_name + "=");
			if (c_start!=-1)
			{
				c_start=c_start + c_name.length+1;
				var c_end=document.cookie.indexOf(";",c_start);
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

    // Add 'EDIT' to distinguish between browsing and editing pages.
    if (ScrollPositioner.isBrowsing == false)
	  { cookieName = cookieName + 'EDIT'; }
	  
	  cookieName = cookieName + '-ScrollY';

    // Overwrite the cookie only if its content does not begin with 'n', which is a 
    // special value used for locating the bullet.
		var value = ScrollPositioner.getCookie(cookieName);
		if (value.substring(0,1) != 'n')
		{
			var value = ScrollPositioner.getScrollPos();
			
			if (value != 0) { document.cookie = cookieName + "=" + escape(value); }
			else { ScrollPositioner.delCookie(cookieName); }
		}
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
  setCaretPos: function(caret, caret2)
  {
	  if (ScrollPositioner.isEmEnable == true) {}
	  
		else if (ScrollPositioner.isEditableEnable == true)
		{ ScrollPositioner.setCaretPosForEditable(caret); }

    else if (ScrollPositioner.isLegacyTextedit == true)
		{
		  document.getElementById('text').selectionStart = caret;
      document.getElementById('text').selectionEnd = caret2;
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

    if (currentPos != y) { ScrollPositioner.setCaretPos(y,y); }
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
      
  		document.getElementById('text').form.elements['text'].value = [textContent.slice(0, caretPosStart), pastedText, textContent.slice(caretPosEnd)].join('');
            		
			caretPosStart = caretPosStart+pastedText.length;			
			document.getElementById('text').selectionStart = caretPosStart;
			document.getElementById('text').selectionEnd = caretPosStart;			
			
			ScrollPositioner.setCaretPosCookies();
			textAreaAdjust();
			
      // If false the original paste won't go
			return false; 
		};
  },
  
  // When browsing, replace the special string inserted at the last caret position when
  // autosaving with a predefined html location markup #lastEdit and scroll there, or an
  // empty string depending on the entered url. When viewing the history, simply remove
  // all such special strings.
  setScrollFromEdit: function(value)
  {
		if (value.substring(0,1) == 'n') { value = value.slice(1); }
		else { ScrollPositioner.setScrollPos(value); return; }
     	  
		var numBullet = value;
		
		// Delete the cookie as we would like the press-then-edit to be valid only once
		// after pressed.
		var HTML = document.getElementById('wikitext').innerHTML;    

		// Find the char offset of the numBullet-th <li => pos
		var L = HTML.length, pos = -1;
		while(numBullet-- && pos++<L)
		{
			var pos = HTML.indexOf('<li', pos);
			if (pos == -1) { break; }
		}
		var endPos = HTML.indexOf('>',pos) + 1;

		var screenHeightAdj = Math.round(window.innerHeight/3);
		var styleMarkupStr = ' style="background-color: yellow;"';
    var bulletMarkup = HTML.substring(pos,endPos);
    var idPos = bulletMarkup.indexOf('id=');
    var idName = '';
    if (idPos != -1)
    {
      var quoteChar = bulletMarkup.substring(idPos+3,idPos+4);
      idName = bulletMarkup.substring(idPos+4,bulletMarkup.indexOf(quoteChar,idPos+4));
    }
		else
		{
			idName = 'lastEdit';
		  styleMarkupStr = ' id="'+idName+'"'+styleMarkupStr;
		}

		HTML = [HTML.slice(0, endPos-1), styleMarkupStr, HTML.slice(endPos-1)].join('');	
		document.getElementById('wikitext').innerHTML = HTML;

		// A certain delay is needed when there are a lot of images waiting to be arranged on
		// the page, i.e., diary pages. A delay of around 1 second is needed for diary page 
		// with a lot of images. Not satisfied with this solution; there should be a mechanism
		// for Chrome to notify me when the images are done arranging.
    var positionDelay = 0;
    if (ScrollPositioner.isDiaryPage == 2) { positionDelay = 1000; }
		setTimeout(function()
		{
		  // First scroll the lastEdit id into view, then get the id's position relative to 
		  // the browser window. Adjust the scroll position so that the id is 1/3 of the 
		  // browser window height.
			document.getElementById(idName).scrollIntoView();			
			var idPosRelBrowser = Math.floor(document.getElementById(idName).getBoundingClientRect().top);
      screenHeightAdj = Math.max(0, screenHeightAdj - idPosRelBrowser);
			ScrollPositioner.setScrollPos(ScrollPositioner.getScrollPos()-screenHeightAdj);
		},positionDelay);
  },

  // Wait for the LATEX rendering to complete first since it also replaces the page HTML.
  // Then call setScrollFromEdit();
  waitLatexThenSetScroll: function(value)
  {
    var HTML = document.getElementById('wikitext').innerHTML;

    // See if the primitive markup for latex equations is still visible in the page HTML
		if (HTML.indexOf('{$') != -1 && HTML.indexOf('$}') != -1)
		{
			ScrollPositioner.nWaitForLatex++;
     	if (ScrollPositioner.nWaitForLatex > 100)
     	{
     	  alert('Latex rendering exceeds 10 seconds!');
     	  ScrollPositioner.setScrollFromEdit(value);
     	  return;
     	}
     		  
			setTimeout(function(){ScrollPositioner.waitLatexThenSetScroll(value)},100);
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
        	  ScrollPositioner.setScrollFromEdit(value);
     		    return;
     		  }
     		  
			    setTimeout(function(){ScrollPositioner.waitLatexThenSetScroll(value)},100);
		    }
		    else
		    {
		      ScrollPositioner.nWaitForLatex = 0;
       	  ScrollPositioner.setScrollFromEdit(value);
		    } 
		  }
		  // No primitive markup, no latex header, means no latex on this page
		  else { ScrollPositioner.setScrollFromEdit(value); }
		}
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
  
	// When browsing, if enter is pressed with texts selected, the caret position will 
	// be computed and stored in a cookie. The editing page will be open in a new tab 
	// automatically with scroll and caret situated at the beginning of the selected bullet.
	// Also called the "Edit here" mechanism.
  setScrollFromBrowse: function(value)
  {		
    var numBullet = value;
      
		// The change from <textarea to <div corrupts the font settings, this affects the
		// scroll position. Specifically set the font to match the <textarea editing style
		// to deal with this problem. The font is unfortunately OS dependent.
		// The line-height can be controlled. Remember to set the textarea line-height
		// to 1.2em in css.
		if (ScrollPositioner.OS == 'Mac')
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
		var pos = ScrollPositioner.computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet);

    var screenHeightAdj = Math.round(window.innerHeight/3);
    var markedStr = '<a id="lastEdit" style="padding-top: '+screenHeightAdj+'px;">{PAD}</a>';
		HTML = [HTML.slice(0, pos), markedStr, HTML.slice(pos)].join('');
		document.getElementById('wikitext').innerHTML = HTML;
		document.getElementById('lastEdit').scrollIntoView();
		document.getElementById('wikitext').innerHTML = document.getElementById('wikitext').innerHTML.replace(markedStr,'');

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
		isFirstLineBullet = -1;
		if (HTML.substring(0,1) == '*' || HTML.substring(0,1) == '#')
		{ isFirstLineBullet = 0; }
		
		pos = ScrollPositioner.computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet);
    var pos2 = HTML.indexOf("\n",pos);
    if (pos2 == -1) { pos2 = pos+1; }

		ScrollPositioner.setCaretPos(pos,pos2);
  },
  
  init: function()
  {
	  if (ScrollPositioner.action == 'browse')
	  {
	    ScrollPositioner.isBrowsing = true;
	    
	    // Check cookie. If the cookie content begins with 'n', the page has just been 
	    // modified. Delete it and scroll to the modified position.
	    // For browsing, before any scrolling we have to wait until the latex rendering is 
	    // completed; otherwise the scroll is not correct.
  	  cookieName = ScrollPositioner.pagename.toUpperCase() + '-ScrollY';
  		var value = ScrollPositioner.getCookie(cookieName);
  		if (value.substring(0,1) == 'n') { ScrollPositioner.delCookie(cookieName); }
     	ScrollPositioner.waitLatexThenSetScroll(value);  
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
	  	}
	    	    
	    // Check cookie. If the cookie content begins with 'n', texts from browsing have 
	    // just been selected for editing. Delete it and scroll to the specified position.
	    cookieName = ScrollPositioner.pagename.toUpperCase() + 'EDIT-ScrollY';
  		var value = ScrollPositioner.getCookie(cookieName);
  		if (value.substring(0,1) == 'n')
      {
      	ScrollPositioner.delCookie(cookieName);
      	ScrollPositioner.setScrollFromBrowse(value.slice(1));
      }
  		else
  		{ 
  			ScrollPositioner.setScrollPos(value);
				ScrollPositioner.readCookieSetCaretPos();
  		}
	  }
  }
}

window.addEventListener('load', ScrollPositioner.init, false);

// Enabling this will lock the scroll and caret positions for the same pages that are opened
//window.addEventListener('focus', ScrollPositioner.readCookieSetScrollPos, false);
//window.addEventListener('focus', ScrollPositioner.readCookieSetCaretPos, false);

// Record the scroll and caret position on focusout and page close.
//window.addEventListener("focusout", setScrollAndCaretPosCookie, false);
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

// When enter is pressed, check whether texts are selected. If yes, compute the number of
// html bullets before the selected text, record it in cookie, and then open a new tab
// for editing.
window.addEventListener('keydown', function()
{
//alert(ScrollPositioner.getScrollPos());
  if (ScrollPositioner.isBrowsing == true)
  {
    // Spaces are all removed for comparison.
		if( event.keyCode == 13 )
		{
		  // Remove spaces and replace special characters. 
			var sel = window.getSelection();
			var selString = sel.toString().replace(/ /g,'').replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

			if (selString == '') { return; }
			if (selString.substring(0,1) == "\n") { selString = selString.slice(1); }
			var newlinePos = selString.indexOf("\n");
			if (newlinePos != -1) { selString = selString.substring(0,newlinePos); }

		  // Remove spaces.
			var HTML = document.getElementById('wikitext').innerHTML.replace(/ /g,'');

			var selStringPos = HTML.indexOf( selString );
			HTML = HTML.substring(0,selStringPos);

			if (selStringPos == -1)
			{ alert('The selected string can\'t be found!'); return; }
			
	    // This one liner is of course from the Internet. It computes the number of times
	    // "<li" appears in the string "HTML".
			var numBullet = (HTML.match(/<li/g) || []).length;

			cookieName = ScrollPositioner.pagename.toUpperCase() + 'EDIT-ScrollY';
			document.cookie = cookieName + "=" + escape('n'+numBullet);
			
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

