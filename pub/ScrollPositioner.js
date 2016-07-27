/* 
 * Read and set cookies (local storage) for storing last scroll and caret positions. 
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
 * Before closing, the width of the textarea will be stored in a cookie, for the server
 * side to read and set an approximate height for the textarea later. This significantly
 * speeds up setting the textarea height.
 *
 * Cookies have been replaced with local storages except textAreaWidth, which has to be
 * sent to the server side.
 *
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var ScrollPositioner = 
{
  pagename: '',
  action: '',
  isBrowsing: false,
  lastCaretPos: 0,
  OS: '',
  nWaitForLatex: 0, 

  // Set a local storage item "name" with key/value pair "key" and "value".
  // If "key" is null then the item is treated as a simple variable; otherwise it is an 
  // array. If "value" is null then the local storage is deleted in the former case; the 
  // entry is deleted in the later case.
  setStorageByKey: function(name, key, value)
	{ 
	  if (key == null)
	  { 
			if (value == null) { localStorage.removeItem(name); }
			else
			{	localStorage.setItem(name, value); }
	  }
	  else
	  {
			var content = JSON.parse(localStorage.getItem(name));

			if (content == null) { content = new Object(); }
			if (value == null) { delete content[key]; }
			else { content[key] = value; }
			localStorage.setItem(name, JSON.stringify(content));
		}
	},

	// Get the value of key "key" in local storage item "name"
	// If "key" is null then the whole content of "name" is returned;
	getStorageByKey(name, key)
	{
	  if (key == null) 	{ return JSON.parse(localStorage.getItem(name)); }
	  
	  try { var value = JSON.parse(localStorage.getItem(name))[key]; }
	  catch(e) {}
	  
	  return value;
	},
	
  // Set a cookie with the given name/value.
	setCookie: function(name, value)
	{ document.cookie = name + "=" + escape(value); },
	
	// Delete the cookie "name"
	delCookie: function(name)
	{ 
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		document.cookie = name + "=;expires=" + exp.toGMTString(); 
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

  // Record the current scroll position in local storage. The scroll positions for
  // browsing and editing pages are stored separately. If null is passed then the entry is
  // deleted. If the current scroll position is 0, the entry is also deleted.
  setScrollPosLS: function(value)
	{
    if (ScrollPositioner.isBrowsing == false)
      	 { var name = 'EDIT-ScrollY'; }
	  else { var name = 'VIEW-ScrollY'; }

		value = value===null ? value : ScrollPositioner.getScrollPos();
		value = value==0 ? null : value;
		{ ScrollPositioner.setStorageByKey(name, ScrollPositioner.pagename, value); }		
	},

  // Return the scroll position stored in local storage based on the current action.
  getScrollPosLS: function()
	{	
    if (ScrollPositioner.isBrowsing == false)
      	 { var name = 'EDIT-ScrollY'; }
	  else { var name = 'VIEW-ScrollY'; }

	  return ScrollPositioner.getStorageByKey(name, ScrollPositioner.pagename);
	},
	
/* The following is for caret positioning */
/****************************************************************************************/
  
  // Get & set the caret position. Depending on the current editing mechanism (codemirror,
  // div with content editable, legacy textarea), the methods are different.
  getCaretPos: function()
  {
	  return document.getElementById('text').selectionStart;
  },
  setCaretPos: function(caret, caret2)
  {
    if (caret == null || caret2 == null) { return; }
		document.getElementById('text').selectionStart = caret;
		document.getElementById('text').selectionEnd = caret2;
  },  

  // Record the current caret position in cookie. If the current caret position is 0, the
  // entry is deleted.
  setCaretPosLS: function()
  {
		var value = ScrollPositioner.getCaretPos();
		value = value==0 ? null : value;
    ScrollPositioner.setStorageByKey('Caret', ScrollPositioner.pagename, value);
  },

	// Read from local storage to get the last caret position.
  getCaretPosLS: function()
  { return ScrollPositioner.getStorageByKey('Caret', ScrollPositioner.pagename); },

/****************************************************************************************/
  
  // When browsing, scroll to the position corresponding to the nth bullet stored in
  // local storage, which is set by the autosaving mechanism whenever a saving is
  // performed.
  setScrollFromEdit: function(value)
  {
		if (value == null) { return; }
		else if (String(value).substring(0,1) != 'n') { ScrollPositioner.setScrollPos(value); return; }
		else { value = value.slice(1); }
		 	  
		var numBullet = value;
		var bulletObj = document.getElementById('wikitext').getElementsByTagName("li")[numBullet-1];
		
		// Leave if undefined; no bullets at all
    if (typeof bulletObj === 'undefined') { return; }		
    
		var idName = 'lastEdit';
		bulletObj.id = idName;
		bulletObj.style.backgroundColor = 'yellow';

		// A certain delay is needed when there are a lot of images waiting to be arranged on
		// the page, i.e., diary pages. A delay of around 1 second is needed for diary page 
		// with a lot of images. Not satisfied with this solution; there should be a mechanism
		// for Chrome to notify me when the images are done arranging.
		// It turns out another fix is needed for embedding youtube using ape.js. Also fix
		// this by introducing a delay
    var positionDelay = 0;
    if (/<[^<]+class="embed"[^>]*>/.test(document.getElementById('wikitext').innerHTML))
    { positionDelay = Math.max(positionDelay,1000); }
    if (ScrollPositioner.isDiaryPage == 2) { positionDelay = Math.max(positionDelay,1000); }

  	var screenHeightAdj = Math.round(window.innerHeight/3);
    
		setTimeout(function()
		{
		  // First scroll the lastEdit id into view, then get the id's position relative to 
		  // the browser window. Adjust the scroll position so that the id is 1/3 of the 
		  // browser window height.
			document.getElementById(idName).scrollIntoView(true);
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
    // The number of bullets appearing before the selected text.
    var numBullet = value;

		// Compute the caret offset given 'numBullet'.
		var HTML = document.getElementById('text').textContent;
		isFirstLineBullet = -1;
		if (HTML.substring(0,1) == '*' || HTML.substring(0,1) == '#')
		{ isFirstLineBullet = 0; }

		pos = ScrollPositioner.computeCharOffsetForBullet(HTML, numBullet, isFirstLineBullet);
    var pos2 = HTML.indexOf("\n",pos);
    if (pos2 == -1) { pos2 = pos+1; }

    // It turns out that Chrome will scroll automatically by first setting the caret
    // position then focusing. For some reason, highlighting a line then focusing
    // work on MAC but not on Windows. For compatibility, break this into 2 parts.
    document.getElementById('text').blur();
		ScrollPositioner.setCaretPos(pos,pos);
    document.getElementById('text').focus();		
		ScrollPositioner.setCaretPos(pos,pos2);
  },

  init: function()
  {  
    ScrollPositioner.pagename = ScrollPositioner.pagename.toUpperCase();
  
	  if (ScrollPositioner.action == 'browse')
	  {
	    ScrollPositioner.isBrowsing = true;
	    
	    // Read from the local storage to set the scroll position.
	    // Before any scrolling we have to wait until the latex rendering is 
	    // completed; otherwise the scroll is not correct.
	    // If the local storage content begins with 'n', the page has just been 
	    // modified. Delete it in such cases.
  		var value = ScrollPositioner.getScrollPosLS();
  		if (value != null)
  		{
				ScrollPositioner.waitLatexThenSetScroll(value);
				
				if (String(value).substring(0,1) == 'n')
				{ ScrollPositioner.setScrollPosLS(null); }
			}
	  }
	  
	  else if (ScrollPositioner.action == 'edit')
	  {
			if (textAreaHeigthtAdjust()) { console.log('Js textAreaHeigthtAdjust() has been called!'); }

	    // Check cookie. If the cookie content begins with 'n', texts from browsing have 
	    // just been selected for editing. Delete it and scroll to the specified position.
	    // focus() is not called before setScrollFromBrowse() in order not to disturb it.
			var value = ScrollPositioner.getScrollPosLS();
			value = value==null ? 0 : value;
			if (String(value).substring(0,1) != 'n')
			{
				// Note that the sequence of the following commands matters. If the caret 
				// positioning comes before the focus, Chrome will scroll so that caret is
				// centered in the screen, which interferes with the setScroll command.
				document.getElementById('text').focus();
				var caretPos = ScrollPositioner.getCaretPosLS();
				ScrollPositioner.setCaretPos(caretPos, caretPos);
				ScrollPositioner.setScrollPos(value);
			}
			else
			{
				ScrollPositioner.setScrollFromBrowse(String(value).slice(1));
				ScrollPositioner.setScrollPosLS(null);
			}
	  }
  }
}

window.addEventListener('load', ScrollPositioner.init, false);

// Record the scroll and caret position on focusout and page close.
//window.addEventListener("focusout", setScrollAndCaretPosCookie, false);
window.addEventListener("beforeunload", setScrollAndCaretPosCookie, false);
function setScrollAndCaretPosCookie()
{
  var value = ScrollPositioner.getScrollPosLS();
  if (String(value).substring(0,1) != 'n')
  { ScrollPositioner.setScrollPosLS(); }
  
  if (ScrollPositioner.isBrowsing == false)
  { ScrollPositioner.setCaretPosLS(); }

	// Record the textarea width. 
	if (ScrollPositioner.action == 'edit')
	{
		var value = document.getElementById('text').clientWidth;
		var name = 'textAreaWidth';
		ScrollPositioner.setCookie(name, value);
	}
}

// On receiving new input, adjust the legacy textarea box size.
window.addEventListener('input', textAreaHeigthtAdjust, false);
function textAreaHeigthtAdjust()
{
	elem = document.getElementById('text');

	if (elem.clientHeight < elem.scrollHeight) 
	{
		elem.style.height = 'auto';
		elem.style.height = elem.scrollHeight+500+'px';
		return true;
	}
	return false;
}

// When enter is pressed, check whether texts are selected. If yes, compute the number of
// html bullets before the selected text, record it in cookie, and then open a new tab
// for editing.
window.addEventListener('keydown', function()
{
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

			ScrollPositioner.setStorageByKey('EDIT-ScrollY', ScrollPositioner.pagename, 'n'+numBullet)

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

