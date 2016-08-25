/* 
 * 
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160821
 */

function setStorageByKey(name, key, value)
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
}

// Get the value of key "key" in local storage item "name"
// If "key" is null then the whole content of "name" is returned;
function getStorageByKey(name, key)
{
	if (key == null) 	{ return JSON.parse(localStorage.getItem(name)); }
	
	try { var value = JSON.parse(localStorage.getItem(name))[key]; }
	catch(e) {}
	
	return value;
}


window.addEventListener('load', function()
{
  var flashElement = document.getElementsByTagName('object');

  // Manually set preload and then play/pause to get around Chrome's socket bug.
  // Also introduce the play icon
  for (var i = 0; i < flashElement.length; i++)
  {
    if (flashElement[i].type != 'application/x-shockwave-flash') { continue; }

		var videoName = flashElement[i].children[0].value.match(/\/[^\/]*\.mp4/)[0].slice(1);
		
		var orient = getStorageByKey('VideoOrientation', videoName);
		if (orient == null) {}
    else if (orient == 1)
    {
			flashElement[i].orientation = 1;
			flashElement[i].style.transform = 'rotate(90deg)';
    }
    else if (orient == 2)
    {
			flashElement[i].orientation = 2;
			flashElement[i].style.transform = 'rotate(180deg)';
    }
    else if (orient == 3)
    {
			flashElement[i].orientation = 3;
			flashElement[i].style.transform = 'rotate(270deg)';
    }
        

//flashElement[i].SetVariable("player:jsPlay", "");
//flashElement[i].SetVariable("player:jsPause", "");

		flashElement[i].addEventListener('keyup', function()
		{ if (event.keyCode == 91) { this.cmdKeyDn = false; } }, false);
		flashElement[i].addEventListener('keydown', function()
		{
			if (event.keyCode == 91) { this.cmdKeyDn = true; }
			else if (event.keyCode == 82 && (event.ctrlKey || this.cmdKeyDn)) { location.reload(); }
			else if (event.keyCode == 82)
			{
				event.preventDefault();
  			var videoName = this.children[0].value.match(/\/[^\/]*\.mp4/)[0].slice(1);				
  			
				if (typeof this.orientation == 'undefined' || this.orientation == 0)
				{
					this.orientation = 1;
					this.style.transform = 'rotate(90deg)';
					setStorageByKey('VideoOrientation', videoName, 1);
				}
				else if (this.orientation == 1)
				{
					this.orientation = 2;
					this.style.transform = 'rotate(180deg)';
					setStorageByKey('VideoOrientation', videoName, 2);
				}
				else if (this.orientation == 2)
				{
					this.orientation = 3;
					this.style.transform = 'rotate(270deg)';
					setStorageByKey('VideoOrientation', videoName, 3);
				}

				else if (this.orientation == 3)
				{
					this.orientation = 0;
					this.style.transform = 'rotate(0deg)';
					setStorageByKey('VideoOrientation', videoName, null);
				}
			}	
			else if (event.keyCode == 90)
			{
				event.preventDefault();
				
				if (typeof this.zoom == 'undefined' || this.zoom == 0)
				{
					this.zoom = 1;
					var size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
					this.initSize = this.clientHeight;
					this.style.width = size+'px';
					this.style.height = size+'px';

					this.scrollIntoView(true);
					if (this.orientation == 2 || this.orientation == 3)
					{ document.body.scrollTop -= size; }
				}
				else
				{
					this.zoom = 0;
					this.style.width = this.initSize+'px';
					this.style.height = this.initSize+'px';

					this.scrollIntoView(true);					
					if (this.orientation == 2 || this.orientation == 3)
					{ document.body.scrollTop -= this.initSize; }
				}
			}

		}, false);
  }
}, false);

