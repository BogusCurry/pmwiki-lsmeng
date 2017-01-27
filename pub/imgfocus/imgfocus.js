/* 
* This recipe finds all the images on the page and set hover/active styles
* to them. On clicking an image, a copy of it pops up at the center of the browser with
* fade-in effect, and the background is dimmed and blurred. The
* popup image is removed with another click or esc, also with fading effect. On
* keydown, 'M', the image is zoomed to fit the browser, with fading and blur effects. On
* wheel, the popup image size can be adjusted freely. When either the width or the
* height exceed the browser size, the popup image can be dragged.
*
* This program is free software; you can redistribute it
* and/or modify it under the terms of the GNU General
* Public License as published by the Free Software
* Foundation; either version 3 of the License, or (at your
* option) any later version. Available at
* https://www.gnu.org/licenses/gpl.txt
*
* Copyright 2017 Ling-San Meng (f95942117@gmail.com)
* Version 20170127
*/

var imgfocus = {};

imgfocus.clickHandle = function(element)
{
	// Create the popup image
	if (!imgfocus.imgEnlarge) { imgfocus.imgEnlarge = document.createElement('img'); }
	imgfocus.imgEnlarge.element = element;
	
	// if the filename indicates it's a thumbnail, load its original content
	// Replace the image element by creating another one
	if (element.name.indexOf("_thumb.") != -1)
	{
		var req = new XMLHttpRequest();
		var uploadUrl = window.location.href+'&show='+element.name.replace("_thumb","");
		req.open('GET',uploadUrl,true);
		req.send();
		
		req.onreadystatechange = function()
		{
			if (this.readyState == 4)
			{ if (this.status == 200)	{ imgfocus.imgEnlarge.src = this.responseText; } }
		}
	}
	else { imgfocus.imgEnlarge.src = element.src; }
	
	// Blur and dim the background and then show the popup image on image load.
	imgfocus.imgEnlarge.onerror = function() { console.log('on load error'); }
	imgfocus.imgEnlarge.onload = function()
	{
		// A fix for hiding the glowing effect immediately after showing the pop-up 
		// image, and recover it afterwards
		element.style.webkitFilter = 'drop-shadow(0 0 0 gray)';
		element.onmouseout = function()
		{ element.style.webkitFilter = 'drop-shadow(0 0 0 gray)'; };
		element.onmouseover = function()
		{ element.style.webkitFilter = 'drop-shadow(0 0 3px gray)'; };

		// Blur all the direct children of the document body.
		var bodyElementLen = imgfocus.documentBodyElement.length;
		for (var i=0;i<bodyElementLen;i++)
		{ imgfocus.blurElement(imgfocus.documentBodyElement[i]); }
		
		// Overlay the dimmer
		document.body.appendChild(imgfocus.dimmer);
		
		this.style.zIndex = imgfocus.dimmer.style.zIndex+1;
		this.style.position = 'fixed';
		
		// Place the image right at the center of the browser.
		this.style.left = Math.floor(window.innerWidth/2) + 'px';
		this.style.top  = Math.floor(window.innerHeight/2) + 'px';
		this.style.transform = 'translate(-50%, -50%)';
		
		// Cache the translation. This is used for zooming
		this.translateX = -50;
		this.translateY = -50;

		// Shrink the image if it's bigger than the browser screen. Skip this step if its
		// dimension fits into the current screen size
//  			if (this.naturalWidth > window.innerWidth || this.naturalHeight > window.innerHeight)
		{	imgfocus.zoomToFit();	}
					
		// Apply shadow effect & fade in the popup image
		this.style.webkitFilter = 'drop-shadow(20px 20px 10px black)';
		
		// Hide it first for later fading in
		this.style.visibility = 'hidden';
		
		document.body.appendChild(this);
		
		// Smooth transition for width
// 			this.style.width = this.width + 'px';
// 			this.style.webkitTransition = "width 0.015s linear";
		
		imgfocus.fadeElement(this, 0, 1, imgfocus.fadeInTime, null);
		
		// On mouse down, if the popup image is not oversized, implement drag and move
		// Otherwise, the image is removed by a click.
		window.addEventListener('mouseup', imgfocus.mouseUpStopDragOrRemoveImg, false);
		
		// On mouse down, record the time to determine its dragging or clicking
		window.addEventListener('mousedown', function()
		{
			if (imgfocus.imgEnlarge)
			{ imgfocus.imgEnlarge.mousedownTimeStamp = event.timeStamp; }
		}
		, false);
		
		this.onmousedown = function(e)
		{
			if (!this.fadeTimerID && (this.height>window.innerHeight || this.width>window.innerWidth))
			{
				var mouseCoordX = event.clientX;
				var mouseCoordY = event.clientY;
				var imgCoordX = parseInt(this.style.left);
				var imgCoordY = parseInt(this.style.top);
				this.onmousemove = function(event)
				{
					// Sometimes the image still tracks the mouse even no button is pressed.
					// Remove itself and stop in this case
					if (event.buttons == 0) { this.onmousemove = ''; return; }
					
					this.style.left = imgCoordX+event.clientX-mouseCoordX+'px';
					this.style.top  = imgCoordY+event.clientY-mouseCoordY+'px';
				}
				return false;
			}
		}
		
		// On wheel, zoom the pop up image
		window.addEventListener('wheel', imgfocus.wheelZoom, false);
	}
}

imgfocus.popupImgOnClick = function()
{
  // Get the exception list length
  imgfocus.exceptionList = JSON.parse(imgfocus.exceptionList);
  var ImgfocusExceptionListLen = imgfocus.exceptionList.length;
  
  // Get the list of the direct children of the document body.
  var bodyElementLen = document.body.children.length;
  imgfocus.documentBodyElement = [];
  for (var i=0;i<bodyElementLen;i++)
  { imgfocus.documentBodyElement[i] = document.body.children[i]; }
  
  // Prepare a div element for overlaying the page as the dimmer.
  imgfocus.dimmer = document.createElement('div');
  imgfocus.dimmer.style.background = '#000';
  imgfocus.dimmer.style.opacity = 0.5;
  imgfocus.dimmer.style.position = 'fixed';
  imgfocus.dimmer.style.top = 0;
  imgfocus.dimmer.style.left = 0;
  imgfocus.dimmer.style.width = '100%';
  imgfocus.dimmer.style.height = '100%';
  imgfocus.dimmer.style.zIndex = 9;
  
  // Get all the image elements
  var imgElement = document.getElementsByTagName("img");
  var _imgElement = [];
  var imgElementLen = imgElement.length;
  for (var i=0;i<imgElementLen;i++)
  {
    // Get the image filename. If the image is directly presented with its contents, 
    // get the filename from the corresponding secretly inserted field. Otherwise parse
    // it from the src URL.
    var src = imgElement[i].src;
    if (src.slice(0,10) == "data:image")
    { var filename = src.slice(src.indexOf(';filename=')+10,src.indexOf(";base64")); }
    else
    {
			var pos = src.lastIndexOf('/');
			var filename = src.slice(pos+1);  
    }
    imgElement[i].name = filename;
    
    // Skip the images specified in the exception list
    var isException = false
    for (var j=0;j<ImgfocusExceptionListLen;j++)
    {
      if (filename == imgfocus.exceptionList[j]) { isException = true; break; }
    }
    if (isException) { continue; }
    
    // Skip images that are hyperlinks
    if (imgElement[i].parentNode.tagName.toLowerCase() == 'a') { continue; }
    
    _imgElement.push(imgElement[i]);
  }
  
  imgElementLen = _imgElement.length;
  for (var i=0;i<imgElementLen;i++)
  {
    // Apply the popup function on clicking the image
    _imgElement[i].onclick = function() { imgfocus.clickHandle(this); }

		if (i == 0)
		{
			_imgElement[i].nextElement = _imgElement[i+1];
			_imgElement[i].preElement = _imgElement[imgElementLen-1];
		}
		else if (i == imgElementLen-1)
		{
			_imgElement[i].nextElement = _imgElement[0];
			_imgElement[i].preElement = _imgElement[i-1];
		}
		else
		{
			_imgElement[i].nextElement = _imgElement[i+1];
			_imgElement[i].preElement = _imgElement[i-1];
		}
  }
}

// Blur and opaque the element. Note that 'webkitFilter' is a browser dependent method.
imgfocus.blurElement = function(element)
{
  if (typeof element === 'undefined')
  { console.log('Error: element undefined in ImgfocusBlurElement()!'); return; }
  
  // Set blur and opacity
  element.originalFilterEffect = document.defaultView.getComputedStyle(element)['webkitFilter'];
  element.style.webkitFilter = 'blur(2.0px)';
  element.originalOpacity = element.style.opacity;
  element.style.opacity = 0.8;
}

// Remove the blur and opacity effects. 
imgfocus.unBlurElement = function(element)
{
  if (typeof element === 'undefined')
  { console.log('Error: element undefined in ImgfocusUnBlurElement()!'); return; }
  
  // Recover the filter effect and opacity of the element
  var originalFE = element.originalFilterEffect;
  if (originalFE != null)
  {
    // The small timeout is for Safari. It seems Safari needs a small delay to transform
    // the filter effect.
    element.style.webkitFilter = 'none';
    setTimeout(function(){ element.style.webkitFilter=originalFE; }, 10);
    delete element.originalFilterEffect;
  }
  var originalOp = element.originalOpacity;
  if (originalOp != null)
  { element.style.opacity = originalOp; delete element.originalOpacity; }
}

// Fade a given element from 'startOpacity' to 'endOpacity', within the specified duration
// (ms). The fading is achieved by adjusting the opacity property. For fade out, the
// element is first shrunk
// a little bit (springDepth) and then enlarged (enlargeRatio) with a decreasing opacity;
// the element is removed when the fading is done if 'endOpacity'
// 
// For better code structure, instead of removing the element at the end of fading, a
// callback function which points to the general removing mechanism should be used here
imgfocus.fadeElement = function(element, startOpacity, endOpacity, duration, callbackF)
{
  if (typeof element === 'undefined') { console.log('Error: element undefined in ImgfocusFadeElement()!'); return; }
  else if (startOpacity == endOpacity) { return; }
  
  var initialWidth = element.width;
  
  var stepDuration = 40;
  if (duration < stepDuration) { duration = stepDuration; }
  
  var op = startOpacity;
  element.style.opacity = op;
  element.style.display = 'initial';
  element.style.visibility = 'initial';
  var stepOp = (endOpacity-startOpacity)*stepDuration/duration;
  
  // If fading out
  if (startOpacity > endOpacity)
  {
    var enlargeRatio = 1.4;
    var springDepth = 0.9;
    var width = initialWidth*springDepth;
    element.style.width = width +'px';
    element.style.height = 'auto';
    var stepWPx = (enlargeRatio-1)*width*stepDuration/duration;
  }
  
  element.fadeTimerID = setInterval(function ()
  {
    if (startOpacity > endOpacity)
    {
      if (op <= endOpacity)
      {
        element.style.opacity = endOpacity;
        clearInterval(element.fadeTimerID);
        delete element.fadeTimerID;
        if (endOpacity == 0 && callbackF) { callbackF(); }
        return;
      }
      
      width += stepWPx;
      element.style.width = width +'px';
      element.style.height = 'auto';
    }
    else if (op >= endOpacity)
    {
      element.style.opacity = endOpacity;
      clearInterval(element.fadeTimerID);
      delete element.fadeTimerID;
      return;
    }
    
    op += stepOp;
    element.style.opacity = op;
  }, stepDuration);
}

// An aux function that returns true is the img element is zoomed beyond and including
// fitting the screen
imgfocus.isZoomOverFit = function()
{
  var element = imgfocus.imgEnlarge;
  
  if (!element) { return false; }
  
  if (element.width>window.innerWidth || element.height>window.innerHeight)
  { return true; }
  else { return false; }
};

// An aux function that returns true is the img element is zoomed and centered
imgfocus.isZoomToFit = function()
{
  var element = imgfocus.imgEnlarge;
  
  if (!element) { return false; }
  
  if ((element.height==window.innerHeight || element.width==window.innerWidth) &&
  element.style.left == Math.floor(window.innerWidth/2) + 'px' &&
  element.style.top == Math.floor(window.innerHeight/2) + 'px') { return true; }
  else { return false; }
}

// Zoom the image to fit the browser visible area
// An optional callback function can be provided to pass to the zooming procedure to be 
// execute at the end of zooming
imgfocus.zoomToFit = function(callback)
{
  var element = imgfocus.imgEnlarge;
  element.style.cursor = 'default';
  
  // Center the image first
  element.style.left = Math.floor(window.innerWidth/2) + 'px';
  element.style.top  = Math.floor(window.innerHeight/2) + 'px';
  element.style.transform = 'translate(-50%, -50%)';
  element.style.webkitFilter = 'drop-shadow(20px 20px 10px black)';
  
  // Cache the translation. This is used for zooming
  element.translateX = -50;
  element.translateY = -50;
  
  // Which direction to zoom (width or height) is determined based on comparing the
  // aspect ratio of the image and the browser.
  var dimension = window.innerWidth/window.innerHeight > element.width/element.height ? 'height' : 'width';
  var size = dimension == 'width' ? window.innerWidth : window.innerHeight;
  // Cache the fitting dimension; when switching images, the image will be removed first 
  // if there is a dimension change for better experience
  element.dimension = dimension;
  imgfocus.zoomElement(element, dimension, size, imgfocus.zoomToFitTime, 2, 'none', callback);
}

// The function to call when the popup image exists and mouse up.
// This function will be used to register and deregister as an event handler, therefore
// it's best to avoid the use of "this"
imgfocus.mouseUpStopDragOrRemoveImg = function(e)
{
  // The detail property of event gives the number of consecutive clicks in a short amount
  // of time. For some reason, a mouse up event can occur immediately following a key
  // press. Simply ignore it.
  if (e.detail==0 || (e.detail==1 && imgfocus.imgEnlarge.keydownTimeStamp && e.timeStamp-imgfocus.imgEnlarge.keydownTimeStamp<700))
  { return; }
  
  // It is dragging if the consecutive mouse dn up is shorter than a certain duration.
  // Do nothing in this case
  if (e.timeStamp - imgfocus.imgEnlarge.mousedownTimeStamp > 150)	{ return; }
  // If the image is zoomed
  if (imgfocus.imgEnlarge.height>=window.innerHeight || imgfocus.imgEnlarge.width>=window.innerWidth)
  { imgfocus.removeImgRecoverBackground(); return; }
  // Else the image is not zoomed
  else
  {
    // if the click is not on the image, remove it
    if (e.target != imgfocus.imgEnlarge) { imgfocus.removeImgRecoverBackground(); }
    // else zoom the image
    else { imgfocus.zoomToFit();  }
  }
}

// Zoom the pop up image on wheel. The visual experience of directly modifying the image
// size by wheel delta is not so satisfying for mouses (fine for trackpad though); 
// therefore ImgfocusZoomElement() is called to kinda "fill the gap" to smooth the
// transition
// This function will be used to register and deregister as an event handler, therefore
// it's best to avoid the use of "this"
imgfocus.wheelZoom = function(e)
{
  e.preventDefault();
  
  var element = imgfocus.imgEnlarge;
  
  var currentWidth = element.width;
  var currentHeight = element.height;
  
  // The procedure for zooming right at the mouse point
  var mouseX = event.clientX;
  var mouseY = event.clientY;
  if (element.mouseX != mouseX || element.mouseY != mouseY)
  {
    var imgBound = element.getBoundingClientRect();
    var top = imgBound.top;
    var left = imgBound.left;
    var translateX = Math.round((left-mouseX)/currentWidth*100);
    var translateY = Math.round((top-mouseY)/currentHeight*100);
    element.style.transform = 'translate('+translateX+'%, '+translateY+'%)';
    
    element.style.left = parseInt(element.style.left) + (element.translateX - translateX)/100*currentWidth + 'px';
    element.style.top = parseInt(element.style.top) + (element.translateY - translateY)/100*currentHeight + 'px';
    
    // Cache the last translation
    element.translateX = translateX;
    element.translateY = translateY;
    
    // Cache the last mouse point
    element.mouseX = mouseX;
    element.mouseY = mouseY;
  }
  
// 	var direction = e.wheelDelta>0? +1 : -1;
// 	var stepPx = Math.floor(direction*currentWidth/10);
  
  // It turns out for track pad, direct associating the pixel change with wheelDelta gives
  // the best user experience
  var stepPx = e.wheelDelta;
  
  // Call zoomElement() to smooth the size transition. The minimum possible width is
  // set to 50px.
  var newW = currentWidth + stepPx;
  var minWidth = 50;
  if (newW > minWidth)
// 	{ imgfocus.zoomElement(imgfocus.imgEnlarge, 'width', newW, 20, 0, 'none'); }
  { element.style.width = newW+'px'; element.style.height = 'auto'; }
  else
  { element.style.width = minWidth + 'px'; element.style.height = 'auto'; }
  
  // Handle the cursor style change, and the shadow
  if (element.height>=window.innerHeight || element.width>=window.innerWidth)
  {
    element.style.cursor = 'move';
    if (element.style.webkitFilter != '') { element.style.webkitFilter = ''; }
  }
  else
  {
    element.style.cursor = 'default';
    if (element.style.webkitFilter == '')
    { element.style.webkitFilter = 'drop-shadow(20px 20px 10px black)'; }
  }
}

// Remove the popup image element and restore the page style. The restoring is pretty much
// the reverse of the adding process.
imgfocus.removeImgRecoverBackground = function(style)
{
  var element = imgfocus.imgEnlarge;
  if (element)
  {
    // Cancel the timers on removing popup image
    try { clearInterval(element.fadeTimerID); } catch(e) {}
    
    try { imgfocus.dimmer.remove(); } catch(e) {}
    
    var bodyElementLen = imgfocus.documentBodyElement.length;
    for (var i=0;i<bodyElementLen;i++)
    { imgfocus.unBlurElement(imgfocus.documentBodyElement[i]); }
    
    window.removeEventListener('mouseup', imgfocus.mouseUpStopDragOrRemoveImg, false);
    window.removeEventListener('wheel', imgfocus.wheelZoom, false);
    element.onmousemove = '';
    
    if (style == 'immediately' || element.fadeTimerID != null) { removeImg(); }
    else { imgfocus.fadeElement(element, 1, 0, imgfocus.fadeOutTime, removeImg);	}
    
    function removeImg()
    { element.remove();	delete imgfocus.imgEnlarge; }
  }
}

// Zoom in/out an element with animation. Parameters:
// element: The element to be zoomed
// zoom: Accept 'width' or 'height'; the dimension based on which the element is zoomed
// targetSize: The target size in pixel to zoom to
// duration: The zooming duration to animate
// springOutTick: The extent to overzoom to provide a springing-like feel
// filterEffect: The filter effect to apply during zooming
// callback: An optional callback function to run at the end of zooming
imgfocus.zoomElement = function(element, zoom, targetSize, duration, springOutTick, filterEffect, callback)
{
  if (typeof element === 'undefined') { console.log('Error: element undefined in ImgfocusZoomElement()!'); return; }
  
  if (element.fadeTimerID != null) { return; }
  
  // If the element is already zooming, cancel the zoom then continue.
  if (element.zoomTimerID != null)
  {
    clearInterval(element.zoomTimerID);
    delete element.zoomTimerID;
    element.style.opacity = element.originalOpacity;
  }
  
  // It turns out that the zooming effect doesn't look so good. Part of the reason is due
  // to the browser (it worked ok before). A simple solution adopted here is to abandon
  // the zooming effect but keep the opacity animation effect by the setting below.
  var stepDuration = duration+1;
// 	var stepDuration = 4;
  if (duration < stepDuration)
  {
    duration = stepDuration;
    springOutTick = 0;
  }
  
  // Handle the visual
  element.style.display = 'initial';
  element.style.visibility = 'initial';
  if (filterEffect != 'none')
  {
    element.originalOpacity = element.style.opacity;
    element.style.opacity = '0.4';
  }
  
  if (zoom == 'width') { var originalSize = element.width; }
  else { var originalSize = element.height; }
  var stepPx = (targetSize-originalSize)*stepDuration/duration;
  
  element.zoomTimerID = setInterval(function ()
  {
    originalSize += stepPx;
    if (zoom == 'width')
    {
      element.style.width = originalSize+'px';
      element.style.height = 'auto';
    }
    else
    {
      element.style.width = 'auto';
      element.style.height = originalSize+'px';
    }
    
    // Reverse the zoom direction once exceeding the springing range.
    if (stepPx>0 && originalSize>=targetSize+stepPx*springOutTick)
    { stepPx = springOutTick==0 ? 0 : -stepPx; }
    
    // End of zooming. Retore the element's style.
    else if (stepPx<=0 && originalSize<=targetSize)
    {
      if (zoom == 'width')
      {
        element.style.width = targetSize+'px';
        element.style.height = 'auto';
      }
      else
      {
        element.style.width = 'auto';
        element.style.height = targetSize+'px';
      }
      
      if (filterEffect != 'none')
      { element.style.opacity = element.originalOpacity; }
      
      clearInterval(element.zoomTimerID);
      delete element.zoomTimerID;
      delete element.originalOpacity;
      
      // Run the callback function if given
      if (callback) { callback(); }
      
      return;
    }
  }
  , stepDuration);
}

window.addEventListener('load', function() { imgfocus.popupImgOnClick(); }, false);

/*
window.addEventListener('mousemove', function()
{
  imgfocus.mouseX = event.clientX;
  imgfocus.mouseY = event.clientY;
}
, false);
*/

window.addEventListener('keydown', function()
{
  if (imgfocus.imgEnlarge)
  {
    // On pressing ESC, remove the pop up image immediately without any special effects.
    if (event.keyCode == 27) { imgfocus.removeImgRecoverBackground('immediately'); }
    
    // On pressing M, zoom the popup image to fit the browser.
    else if (event.keyCode == 77)
    {
      if (imgfocus.isZoomToFit()) { imgfocus.removeImgRecoverBackground(); }
      else
      {
        imgfocus.zoomToFit();
        
        // For some reason, a mouse up event can occur immediately following a key
        // press. Record the key press time to identify this case.
        imgfocus.imgEnlarge.keydownTimeStamp = event.timeStamp;
      }
    }
    
/*
    // Abandoned. press Z to zoom 2x where the mouse is.
    else if (event.keyCode == 90)
    {
      // get mouse coord
      var mouseX = imgfocus.mouseX;
      var mouseY = imgfocus.mouseY;
      // if on img
      {
        var element = imgfocus.imgEnlarge;
        var currentWidth = element.width;
        var currentHeight = element.height;
        
        // The procedure for zooming right at the mouse point
        var imgBound = element.getBoundingClientRect();
        var top = imgBound.top;
        var left = imgBound.left;
        var translateX = Math.round((left-mouseX)/currentWidth*100);
        var translateY = Math.round((top-mouseY)/currentHeight*100);
        element.style.transform = 'translate('+translateX+'%, '+translateY+'%)';
        
        element.style.left = parseInt(element.style.left) + (element.translateX - translateX)/100*currentWidth + 'px';
        element.style.top = parseInt(element.style.top) + (element.translateY - translateY)/100*currentHeight + 'px';
        
        // Cache the last translation
        element.translateX = translateX;
        element.translateY = translateY;
        
        var newW = currentWidth << 1;
        element.style.width = newW+'px'; element.style.height = 'auto';
        imgfocus.zoomElement(element, 'width', newW, 60, 0, 'none');
        
        // Handle the cursor style change, and the shadow
        if (element.height>=window.innerHeight || element.width>=window.innerWidth)
        {
          element.style.cursor = 'move';
          if (element.style.webkitFilter != '') { element.style.webkitFilter = ''; }
        }
        else
        {
          element.style.cursor = 'default';
          if (element.style.webkitFilter == '')
          { element.style.webkitFilter = 'drop-shadow(20px 20px 10px black)'; }
        }
      }
    }
*/
    
    // Up or Down
    else if (event.keyCode == 38 || event.keyCode == 40)
    {
      event.preventDefault();
      if (imgfocus.isZoomOverFit())
      {
        imgfocus.imgEnlarge.style.top = parseInt(imgfocus.imgEnlarge.style.top)+(event.keyCode-39)*10+'px';
      }
    }
    
    // Left or Right
    else if (event.keyCode == 37 || event.keyCode == 39)
    {
      event.preventDefault();
      
      // If isZoomOverFit, move the image
      if (imgfocus.isZoomOverFit())
      {
        imgfocus.imgEnlarge.style.left = 
        parseInt(imgfocus.imgEnlarge.style.left)+(event.keyCode-38)*10+'px';
      }
      // Else, switch between images
      else
      {
        try
        {
					if (event.keyCode == 37)
					{
						var preElement = imgfocus.imgEnlarge.element.preElement;
						preElement.scrollIntoView(true);
						preElement.click();
					}
					else
					{
						var nextElement = imgfocus.imgEnlarge.element.nextElement;
						nextElement.scrollIntoView(true);
						nextElement.click();
					}
					
					// If the fitting dimension changes, the image has to be removed first and added
					// back later for better visual experience
					var dimension = window.innerWidth/window.innerHeight > 
					imgfocus.imgEnlarge.width/imgfocus.imgEnlarge.height ? 'height' : 'width';
					if (dimension != imgfocus.imgEnlarge.dimension)
					{
					  imgfocus.imgEnlarge.remove();
					  var callback = function() { document.body.appendChild(imgfocus.imgEnlarge); };
					}
        }
        catch(error) {  }
        
        imgfocus.imgEnlarge.onload = function() { imgfocus.zoomToFit(callback); }
      }
    }
  }
}
, false);