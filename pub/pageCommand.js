/* 
* Rich page commands for pmwiki.
*
* Author: Ling-San Meng
* Email: f95942117@gmail.com
*/

var pageCommand = {  };

pageCommand.mapSpecialEditLink = function(link)
{
  var pagenamePosStart = link.toLowerCase().indexOf('?n=');
  var pagenamePosEnd = link.toLowerCase().indexOf('?action=edit');
  var pagename = link.slice(pagenamePosStart+3,pagenamePosEnd);
  
  var clock = new Date();
	var year = clock.getFullYear().toString();
	
	var pagenameL = pagename.toLowerCase();
  if (pagenameL == 'investment.homepage')
  { link = link.replace(pagename, 'Investment.Journal'+year); }
  else if (pagenameL == 'htc.homepage')
  { link = link.replace(pagename, 'HTC.Journal'+year); }
  else if (pagenameL == 'computerscience.homepage')
  { link = link.replace(pagename, 'ComputerScience.Journal'+year); }
  else if (pagenameL == 'main.onthisday')
  {
    var mon = clock.getMonth()+1;
    mon = mon<10 ? '0'+mon : mon;
    link = link.replace(pagename, 'Main.'+year+mon);

    // Create a LS storing the wiki markup for editing today. E.g., "n* 11, Wed" for 11th
    // Wednesday. This is to work with scrollPositioner.js, which implements the mechanism
    // to scroll there when the edit page is opened.
		if (window.scrollPositioner)
		{
			var weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		  scrollPositioner.setStorageByKey('EDIT-ScrollY', 'MAIN.'+year+mon, 'n* '+clock.getDate()+', '+weekDays[clock.getDay()]);
		}
  }
  
  else {}
  
  return link;
};

pageCommand.getEditLink = function(link)
{
	if (/\?action=edit/i.test(link)) { return link; }
	
	// Remove hash tag if present
  var match = link.match(/#.*$/);
  if (match) { link = link.replace(match[0],""); }
	
	// parse the pagename
	var pagenamePos = link.toLowerCase().indexOf('?n=');
	
	// go to editing main.homepage
	if (pagenamePos == -1) { return link+'?n=Main.HomePage?action=edit'; }
	
	var pagename = link.substr(link.toLowerCase().indexOf('?n=')+3);
	
	// Go to main.homepage if pagename is empty
	if (pagename == '') { return link+'?n=Main.HomePage?action=edit'; }
	
	// if it exists and is complete, go to its editing page
	else if (pagename.indexOf('.') != -1) { return link+'?action=edit'; }

	// else go to editing its group homepage
	else { return link+'.HomePage?action=edit'; }
};

window.addEventListener('load', function()
{
  // Record and remove hash tag if present
	pageCommand.url = window.location.href;
	var match = pageCommand.url.match(/#.*$/i);
	if (match) { pageCommand.url = pageCommand.url.replace(match[0],""); }
  
  pageCommand.inputElementLen = document.getElementsByTagName("input").length;
  
  pageCommand.hyperLinkElement = document.links;
	var hyperLinkElementLen = pageCommand.hyperLinkElement.length;
	for (var i=0;i<hyperLinkElementLen;i++)
	{
		pageCommand.hyperLinkElement[i].addEventListener('click', function()
		{
			if (event.shiftKey)
			{
				var link = this.href;

				if (link.toLowerCase().indexOf('pmwiki.php') != -1)
				{
					event.preventDefault();
					link = pageCommand.getEditLink(link);
					link = pageCommand.mapSpecialEditLink(link);
					var option = '_self';
					if (event.ctrlKey || event.metaKey)	{	option = '_blank'; }
					window.open(link, option);
				}
			}
		}, false);
	}
}, false);

window.addEventListener('keydown', function()
{ 
	// On esc, if there are text/link selected, deselect them
	if (event.keyCode == 27 && pageCommand.action == 'browse')
	{
		var selString = window.getSelection();
		if (selString != '') selString.removeAllRanges();
		
		if (pageCommand.selectLink) { delete pageCommand.selectLink; }
		if (pageCommand.box) { pageCommand.box.remove(); }
	}
	
	// Ctrl+cmd+f or +z to open search in a new tab
	else if ((event.keyCode == 70||event.code=="KeyF") && event.ctrlKey && (event.metaKey||event.altKey))
	{
		event.preventDefault();
		var match = pageCommand.url.match(/\?.+/i);
		var pos = match==null ? pageCommand.url.length : match['index'];
		window.open(pageCommand.url.slice(0, pos)+'?n=Site.Search', '_blank');
	}
	
	// Ctrl+cmd+r to open all recent changes
// 	else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && (event.metaKey||event.altKey))
	else if ((event.keyCode == 82||event.code=="KeyR") && event.ctrlKey && event.metaKey)
	{
		event.preventDefault();
		var match = pageCommand.url.match(/\?.+/i);
		var pos = match==null ? pageCommand.url.length : match['index'];
		window.open(pageCommand.url.slice(0, pos)+'?n=Site.Allrecentchanges', '_blank');
	}
	
	// Ctrl+cmd+u to open the upload page
	else if ((event.keyCode == 85||event.code=='KeyU') && event.ctrlKey && (event.metaKey||event.altKey))
	{
		event.preventDefault();
		if (pageCommand.url.indexOf('?n=') == -1) { window.open(pageCommand.url + '?n=Main.Homepage?action=upload', '_blank'); }
		else
		{
			var pos = pageCommand.url.indexOf('?action=');
			if (pos != -1) { window.open(pageCommand.url.slice(0,pos+8) + 'upload', '_blank'); }
			else { window.open(pageCommand.url + '?action=upload', '_blank'); }
		}
	}
	
	// Ctrl+cmd+h to open the history
	else if ((event.keyCode == 72||event.code=='KeyH') && event.ctrlKey && (event.metaKey||event.altKey))
	{
		event.preventDefault();
		if (pageCommand.url.indexOf('?n=') == -1) { window.open(pageCommand.url + '?n=Main.Homepage?action=diff', '_blank'); }
		else
		{
			var pos = pageCommand.url.indexOf('?action=');
			if (pos != -1) { window.open(pageCommand.url.slice(0,pos+8) + 'diff', '_blank'); }
			else { window.open(pageCommand.url + '?action=diff', '_blank'); }
		}
	}
	
	// Ctrl+cmd+b to open the backlink
	else if ((event.keyCode == 66||event.code=='KeyB') && event.ctrlKey && (event.metaKey||event.altKey))
	{
		event.preventDefault();
		var match = pageCommand.url.match(/\?.+/i);
		var pos = match==null ? pageCommand.url.length : match['index'];
		window.location = pageCommand.url.slice(0, pos)+'?n=Site.Search?action=search&q=link='+pageCommand.pagename;
	}
	
	// Ctrl+cmd+a to open the attribute
	else if ((event.keyCode == 65||event.code=='KeyA') && event.ctrlKey && (event.metaKey||event.altKey))
	{
		event.preventDefault();
		if (pageCommand.url.indexOf('?n=') == -1) { window.open(pageCommand.url + '?n=Main.Homepage?action=attr', '_blank'); }
		else
		{
			var pos = pageCommand.url.indexOf('?action=');
			if (pos != -1) { window.open(pageCommand.url.slice(0,pos+8) + 'attr', '_blank'); }
			else { window.open(pageCommand.url + '?action=attr', '_blank'); }
		}
	}

	// Ctrl+alt+g for goto page
	// Kind of abandonded
	else if (event.keyCode == 71 && event.metaKey && event.altKey)
	{
	  var pagename = prompt("Go to page...");
	  if (pagename)
	  {
			var pagenamePos = pageCommand.url.indexOf('?n=');
			if (pagenamePos == -1) {  }
			else { window.open(pageCommand.url.slice(0,pagenamePos+3)+pagename, '_blank'); }
	  }
	}

	// Tab/~ to traverse the hyperlinks in the wikitext element
  else if (pageCommand.action != 'edit' && pageCommand.inputElementLen == 0 &&
   ((event.keyCode == 9 || event.keyCode == 192) &&
   !(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)))
  {
		event.preventDefault();

		// Some initialization
		if (pageCommand.tabCount === undefined)
		{
			pageCommand.tabCount = -1;
			pageCommand.hyperLinkElementWikiText = [];
			for (var i=0;i<pageCommand.hyperLinkElement.length;i++)
			{
        // Only capture those hyperlinks that's a children of wikitext
				if (document.getElementById('wikitext').contains(pageCommand.hyperLinkElement[i]) &&
				pageCommand.hyperLinkElement[i].className != 'createlink' &&
				pageCommand.hyperLinkElement[i].href != "")
				{ pageCommand.hyperLinkElementWikiText.push(pageCommand.hyperLinkElement[i]); }
			}
		}

		// Loop count for the highlighted link element
		if (event.keyCode == 9)
		{
			pageCommand.tabCount++;
			if (pageCommand.tabCount == pageCommand.hyperLinkElementWikiText.length)
			{ pageCommand.tabCount -= pageCommand.hyperLinkElementWikiText.length; }
		}
		else if (pageCommand.tabCount == -1)
		{ pageCommand.tabCount += pageCommand.hyperLinkElementWikiText.length; }
		else
		{
			pageCommand.tabCount--;
			if (pageCommand.tabCount < 0)
			{ pageCommand.tabCount += pageCommand.hyperLinkElementWikiText.length; }
		}
		
		// Remove the previous highlight box
		if (pageCommand.box) { pageCommand.box.remove(); }
		
		pageCommand.selectLink = pageCommand.hyperLinkElementWikiText[pageCommand.tabCount];
		
		// Scroll in to view the link & then adjust the position a bit
		if (pageCommand.selectLink)
		{
			pageCommand.selectLink.scrollIntoView(true);
			var screenHeightAdj = Math.round(window.innerHeight/3);
			var idPosRelBrowser = Math.floor(pageCommand.selectLink.getBoundingClientRect().top);
			screenHeightAdj = Math.max(0, screenHeightAdj - idPosRelBrowser);
			document.body.scrollTop -= screenHeightAdj;
		
			// Get the dimension of the link element
			var bound = pageCommand.selectLink.getBoundingClientRect();
			var width = Math.ceil(bound.right - bound.left);
			var height = Math.ceil(bound.bottom - bound.top);
			
			// Prepare the highlight box element
			pageCommand.box = document.createElement('div');
			pageCommand.box.style.top = Math.floor(bound.top-1+document.body.scrollTop)+'px';
			pageCommand.box.style.left = Math.floor(bound.left-1)+'px';
			pageCommand.box.style.width = width+1+'px';
			pageCommand.box.style.height = height+1+'px';
			pageCommand.box.style.position = 'absolute';
			pageCommand.box.style.border = '1px solid blue';
			pageCommand.box.style.webkitFilter = 'drop-shadow(0 0 3px blue)';
			document.body.appendChild(pageCommand.box);
			
			// Since the box element shadows the original hyperlink, the clicking behavior
			// has to be defined again. Somehow "onclick" cannot detect a click when ctrl is
			// pressed; while "onmouseup" works fine.
			pageCommand.box.onmouseover = function()	{ this.style.cursor = 'pointer'; };
			pageCommand.box.onmouseup = function()
			{
				if (pageCommand.selectLink)
				{
					event.preventDefault();
					var link = pageCommand.selectLink.href;
					
					if (event.shiftKey)
					{
						if (link.toLowerCase().indexOf('pmwiki.php') != -1)
						{ link = pageCommand.getEditLink(link); }
						
						var option = '_self';
						if (event.ctrlKey || event.metaKey)	{	option = '_blank'; }
						window.open(link, option);
					}
					else
					{
						if (event.ctrlKey || event.metaKey)	{	window.open(link, '_blank'); }
						else { pageCommand.selectLink.click(); }
					}
				}
			};
		}
  }
  
  // Handle the enter key press when a link is selected; simply call the onmouseup routine
  // since the procedure is completely the same
  else if (pageCommand.action != 'edit' && event.keyCode == 13 && !event.altKey && pageCommand.selectLink)
  { pageCommand.box.onmouseup(); }
}, false);

