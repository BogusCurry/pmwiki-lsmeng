// Defunct after integrating the whole mechanism into imgfocus.js

// Request an image file from server using Ajax in the background. Dynamically create
// an image element for it after receiving the image
function getAndShowImgFile(fileName)
{
  var req = new XMLHttpRequest();
	var uploadUrl = window.location.href+'&show='+fileName;
	req.open('GET',uploadUrl,true);
	req.setRequestHeader("X_REQUESTED_WITH", "XMLHttpRequest");
	req.send();

	// Show download progress
// 	req.onprogress = function(e)
//   { console.log("Downloading... " + Math.round(100*e.loaded/e.total) + "%"); }
	
	req.onreadystatechange = function()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
			{
// var headers = this.getAllResponseHeaders();
// console.log(headers);
				var imgSrc = this.responseText;
				
				// create an image element, and append this thing
				if (window.uploadImg) { window.uploadImg.remove(); }
				window.uploadImg = document.createElement('img');	
				uploadImg.src = imgSrc;
				uploadImg.style.position = 'fixed';
				uploadImg.style.maxWidth = window.innerWidth*0.75 + 'px';
				uploadImg.style.maxHeight = window.innerHeight*0.75 + 'px';
				uploadImg.style.right = '0';
				uploadImg.style.bottom = '50px';
				document.body.appendChild(uploadImg);

				// Apply imgfocus.js if defined
				uploadImg.onclick = function()
				{ if (window.imgfocus) { imgfocus.clickHandle(this); } }
			}
		}
	}
}

window.addEventListener('keydown', function()
{  
	if (event.keyCode == 27 && window.uploadImg) { window.uploadImg.remove(); }
},false);
