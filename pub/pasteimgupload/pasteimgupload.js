/*
 * Enable direct copy & paste to upload an image. Works in Chrome only. 
 * Upload image courtesy at http://www.unionpaper.net
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160729
 */
 
window.addEventListener('load', function ()
{
	var _PasteImgUploadPubUrl = PasteImgUploadPubUrl + '/pasteimgupload/upload.png';

	var uploadImgInnerHTML = '<img height="50" src="'+_PasteImgUploadPubUrl+'">';
	var uploadImgDiv = document.createElement('div');
	uploadImgDiv.style.position = 'fixed';
	uploadImgDiv.style.bottom = '10px';
	uploadImgDiv.style.display = 'none';
	uploadImgDiv.style.left = Math.round(window.innerWidth/5) + 'px';
	document.body.appendChild(uploadImgDiv);

  document.getElementById('text').onpaste = function(e)
	{
		var items = e.clipboardData.items;

    if (typeof items === 'undefined') { return true; }
    
    var idx = -1;
		if (items.length == 1 && items[0].kind == 'file') { idx = 0; }
		else if (items.length == 2 && items[1].kind == 'file') { idx = 1; }
    
    if (idx != -1)
		{
			var fileName = PasteImgUploadGetFormatTime() + '.png';
			var files = items[idx].getAsFile();
			if (files.size == 0) { return true; }
			
			var formData = new FormData();
			formData.append('uploadfile', files, fileName);
			
			var req = new XMLHttpRequest();
			req.open('POST',PasteImgUploadUrl,true);
   		req.setRequestHeader('AJAXUPLOAD','TRUE');
			req.send(formData);
			req.onreadystatechange = function()
			{
				if (this.readyState == 4)
				{
					if (this.status == 200)
					{
						var response = this.getResponseHeader("UpResult");
						if (response == 'successfully uploaded')
						{
  						document.execCommand("insertText", false, 'Attach:'+fileName);
							uploadImgDiv.innerHTML = uploadImgInnerHTML;
             	PasteImgUploadSlideUpElement(uploadImgDiv, -50, 10, 0.4);
						}
						else { alert('Upload failed: '+response+'!'); }
					}
					else { alert('Upload failed: HTTP error!'); }
				}
			}

			return false;
		}
	};
}, false);

// Move up an element by changing its style property "bottom" from "startPx" px to "endPx"
// px within "duration" When it's finished, it fades out the element by calling another
// function.
function PasteImgUploadSlideUpElement(element, startPx, endPx, duration)
{
	try { clearInterval(slideTimerID); }
	catch(errorMsg) {}
	try { clearInterval(fadeTimerID); }
	catch(errorMsg2) {}
	
  var stepDuration = 20;
	element.style.display = 'initial';
	var position = startPx;
	var diff = endPx-startPx;
	element.style.bottom = position+'px';	
  element.style.opacity = 1;
  var stepPosition = diff*(stepDuration/(duration*1000));
  
	slideTimerID = setInterval(function ()
	{	
		if (position > endPx)
		{
			clearInterval(slideTimerID);
      PasteImgUploadFadeElement(element, 'out', 4);
		}

		element.style.bottom = position+'px';
		position += stepPosition;
	}, stepDuration);
}

// Fade out an element by changing its style property "opacity" from 1.0 to 0 within 
// "duration".
function PasteImgUploadFadeElement(element, style, duration)
{
  var stepDuration = 20;
	var op = 0;
	if (style == 'out') { op = 1; }
	element.style.opacity = op;
	element.style.display = 'initial';
  var stepOp = stepDuration/(duration*1000);

	fadeTimerID = setInterval(function ()
	{	
		if (op > 1 || op < 0) { clearInterval(fadeTimerID); }

		element.style.opacity = op;
   	if (style == 'in') { op += stepOp; }
   	else               { op -= stepOp; }		
	}, stepDuration);
}

// Return a formatted date/time as YYYYMMDD_HHMMSS
function PasteImgUploadGetFormatTime()
{
	var clock = new Date();
	var year = clock.getFullYear(), mon = clock.getMonth()+1, date = clock.getDate(),
	    hour = clock.getHours(), min = clock.getMinutes(), sec = clock.getSeconds();

	return year+(mon<10?'0'+mon:mon)+(date<10?'0'+date:date)+'_'+
	       (hour<10?'0'+hour:hour)+(min<10?'0'+min:min)+(sec<10?'0'+sec:sec);
}