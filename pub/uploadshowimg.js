
function getImg(fileName)
{
  var req = new XMLHttpRequest();
	var uploadUrl = window.location.href+'&show='+fileName;
	req.open('GET',uploadUrl,true);
	req.setRequestHeader('REQUESTIMG','TRUE');
	req.name = fileName;
	req.onreadystatechange = function()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
			{
				var imgSrc = this.responseText;
				
				// create an image element, and append this thing
				if (window.uploadImg) { window.uploadImg.remove(); }
				window.uploadImg = document.createElement('img');	
				uploadImg.src = imgSrc;
				uploadImg.style.position = 'fixed';
				uploadImg.style.maxWidth = '500px';
				uploadImg.style.maxHeight = '500px';
				uploadImg.style.right = '0';
				uploadImg.style.bottom = '50px';

				document.body.appendChild(uploadImg);
				uploadImg.onclick = function() { ImgfocusClickHandle(this); }
			}
			else { console.log('Upload failed: HTTP error!'); }
		}
	}

	req.send();
}