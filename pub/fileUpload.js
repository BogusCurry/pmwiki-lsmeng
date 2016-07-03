/* 
 * Enable drag & drop upload of multiple files, and direct copy & paste upload of a single
 * image. 
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */
 
function insertText(text)
{ document.execCommand("insertText", false, text); }

// Show an animation of a predetermined image to signify the result of file upload. 
function showUploadImg(numUploadSuccess, numUploadFail)
{
	uploadImgDiv.innerHTML = uploadImgInnerHTML + ' <span style="color: green; font-size: 25px; font-weight: bold; ">&#x2713;'+ numUploadSuccess +'</span>';

	if (numUploadFail > 0) 
	{ uploadImgDiv.innerHTML += ' <span style="color: red; font-size: 25px; font-weight: bold;">&nbsp &#x2717;'+ numUploadFail +'</span>'; }
	
	slideUpElement(uploadImgDiv, -50, 10, 0.4);
}

document.addEventListener('drop', function(e)
{
  document.getElementById('text').focus();
  
	e.preventDefault();
  var files = e.dataTransfer.files;
  var items = e.dataTransfer.items;
  
  for (var i=0;i<files.length;i++)
  {
//    var isFile = true;
//    try { isFile = items[i].webkitGetAsEntry().isFile }
//    catch(errorMsg) {}
    
		var formData = new FormData();
		var fileName = files[i].name.replace(/ /g,'_');
		formData.append('uploadfile', files[i],fileName);
				
		// I tried to rewrite the following as a function but failed. It seems the 
		// XMLHttpRequest() written in a function gets called only once even if there are 
		// multiple function calls. 
		// My conjecture is that here each time XMLHttpRequest() is called a new object is 
		// created; and as a result multiple requests are being created and run in parallel.
		// That is also the reason that the script runs correctly without the need to wait 
		// for one request to complete to run the next. 
		var req = new XMLHttpRequest();
		req.open('POST',handleUploadUrl,true);
		req.setRequestHeader('AJAXUPLOAD','TRUE');
		req.numUpload = 0;
		req.numFail = 0;
		req.name = fileName;
		req.onreadystatechange = function()
		{
			var error = 0;
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					var response = this.getResponseHeader("UpResult");
					if (response == 'upresult=success')
					{
						insertText(uploadDirUrlHeader+this.name+' ');
					  showUploadImg(++req.numUpload, req.numFail);
					}
					else { error++; }
				}
				else { error++; }
			}
			
			if (error > 0)
			{ showUploadImg(req.numUpload, ++req.numFail); }
		}

		req.send(formData);
	}

}, false);


window.addEventListener('load', function ()
{
	var imgUrl = 'http://www.unionpaper.net/wp-content/uploads/2016/06/logo_homepage_20150714083101.png';
	uploadImgInnerHTML = '<img height="50" src="'+imgUrl+'">';
	
	uploadImgDiv = document.createElement('div');
	uploadImgDiv.style.position = 'fixed';
	uploadImgDiv.style.bottom = '10px';
	uploadImgDiv.style.display = 'none';
	uploadImgDiv.style.left = Math.round(window.innerWidth/5) + 'px';
	
	document.body.appendChild(uploadImgDiv);

	// Access to clipboard seems to be quite restricted due to security reasons, and is
	// to what extent the clipboard can be manipulated is highly browse dependent. In 
	// Chrome, only text and images copied to clipboard can be access, and clipboard
	// content is readonly. It seems Chrome will convert images copied to clipboard to png
	// automatically even if the original image format is already png (therefore
	// repeatedly copying a png and pasting to Chrome will see some loss in image quality)
	// Only one image can be copied to the clipboard at a time.
  document.getElementById('text').onpaste = function(e)
	{
		var items = e.clipboardData.items;

		// Directly copy an image on the Internet or within an image-viewing application on 
		// MAC & Windows.
    var idx = -1;
		if (items.length == 1 && items[0].kind == 'file') { idx = 0; }
		
		else if (items.length == 2 && items[1].kind == 'file')
		{
		  var name = e.clipboardData.getData('text');

  		// Directly copy an image on the Internet on Windows.
		  if (name == '') { idx = 1; }

      // Directly copy a small image (thumbnail?) on the Internet on MAC.
		  else if (name.substring(0,10) == 'data:image') { idx = 1; }
		  
      else { return false; }
		}
    
    if (idx != -1)
		{
		  // Change the last part to 'P.jpg' for working with png2jpg on the server side.
			var fileName = formatLocalDate() + '.png';
			var files = items[idx].getAsFile();
			
			var formData = new FormData();
			formData.append('uploadfile', files, fileName);
			
			var req = new XMLHttpRequest();
			req.open('POST',handleUploadUrl,true);
			req.send(formData);

  		insertText(uploadDirUrlHeader+fileName+' ');
      showUploadImg(1,0);

			return false;
		}
	};
}, false);

// Move up an element by changing its style property "bottom" from "startPx" px to "endPx"
// px within "duration" When it's finished, it fades out the element by calling another
// function.
function slideUpElement(element, startPx, endPx, duration)
{
	try { clearInterval(slideTimer); }
	catch(errorMsg) {}
	try { clearInterval(fadeTimer); }
	catch(errorMsg2) {}
	
  var stepDuration = 20;
	element.style.display = 'initial';
	var position = startPx;
	var diff = endPx-startPx;
	element.style.bottom = position+'px';	
  element.style.opacity = 1;
  
	slideTimer = setInterval(function ()
	{	
		if (position > endPx)
		{
			clearInterval(slideTimer);
      fadeElement(element, 4);
		}

		element.style.bottom = position+'px';
		position += diff*(stepDuration/(duration*1000));
	}, stepDuration);
}

// Fade out an element by changing its style property "opacity" from 1.0 to 0 within 
// "duration".
function fadeElement(element, duration)
{
  var stepDuration = 50;
	var op = 1;  // initial opacity
	element.style.display = 'initial';
	try { clearInterval(slideTimer); }
	catch(errorMsg) {}

	fadeTimer = setInterval(function ()
	{	
		if (op < 0)
		{
			clearInterval(fadeTimer);
			element.style.display = 'none';
		}

		element.style.opacity = op;
		element.style.filter = 'alpha(opacity=' + op * 100 + ")";
		op -= (stepDuration/(duration*1000));
	}, stepDuration);
}

// Return a formatted date/time as YYYYMMDD_HHMMSS
function formatLocalDate()
{
    var now = new Date(),
        tzo = -now.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.abs(Math.floor(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return now.getFullYear() 
        + pad(now.getMonth()+1)
        + pad(now.getDate())
        + '_' + pad(now.getHours())
        + pad(now.getMinutes()) 
        + pad(now.getSeconds());
}