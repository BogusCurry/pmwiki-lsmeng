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
* Version 20170511
*/

var imgfocus = {};

// Queue for callback functions on "image remove" event
imgfocus.eventCallback = {"imgRm": []};

// Provide a subscribe method for registering callback on certain events.
imgfocus.subscribe = function(event, callback)
{
	if (imgfocus.eventCallback[event] !== undefined)
	{
		if (typeof callback !== "function")
		{ throw "Unexpected param: " + callback; return; }
		
		imgfocus.eventCallback[event].push(callback);
		return callback;
	}
	else { throw "Unexpected event: " + event; return; }
};

// Provide an unsubscribe method for registering callback on certain events.
imgfocus.unsubscribe = function(event, callback)
{
	if (imgfocus.eventCallback[event] !== undefined)
	{
		if (typeof callback !== "function")
		{ throw "Unexpected param: " + callback; return; }
		
		var idx = imgfocus.eventCallback[event].indexOf(callback);
		if (idx !== -1) { console.log("unsubsribed");imgfocus.eventCallback[event].splice(idx, 1); }
	}
	else { throw "Unexpected event: " + event; return; }
};

imgfocus.clickHandle = function(element, idx)
{
  // If the popup image element is still absent, i.e., manually clicking on an image,
  // create the element
  // First time, init
  // Store the index of this image element as a property to facilitate image switching
  if (!imgfocus.popupImgElement)
  {
    imgfocus.popupImgElement = document.createElement('img');
    imgfocus.popupImgElement.imgElementIdx = idx;
  }
  // Else, the click is triggered by program for switching image. Create another temp
  // element to load the image temporarily for smoothing the transition
  else
  {
    imgfocus.popupImgElementTemp = document.createElement('img');
    imgfocus.popupImgElementTemp.imgElementIdx = idx;
  }
  
  // If the filename indicates it's a thumbnail, load its original content by using AJAX
  // Dynamically request the original image file from the server.
  // Ajax has to be used here instead of simply assigning the url to .src because
  // pmwiki.php has already set related http headers, which causes image load error.
  if (element.name.indexOf("_thumb.") != -1)
  {
    var req = new XMLHttpRequest();
    var uploadUrl = window.location.href+'&show='+element.name.replace("_thumb","");
    req.open('GET',uploadUrl,true);
    req.send();
    
    req.onreadystatechange = function()
    {
      if (this.readyState == 4 && this.status == 200)
      {
				// Load the image src to the temp element if present
				if (imgfocus.popupImgElementTemp)
				{ imgfocus.popupImgElementTemp.src = this.responseText; }
				else { imgfocus.popupImgElement.src = this.responseText; }
      }
    }
  }
  // Else the source of the popup image is the same as the original image element
  else
  {
    // Load the image src to the temp element if present
    if (imgfocus.popupImgElementTemp)
    { imgfocus.popupImgElementTemp.src = element.src; }
    else { imgfocus.popupImgElement.src = element.src; }
  }
  
  // Blur and dim the background and then show the popup image on image load.
  imgfocus.popupImgElement.onerror = function() { console.log('on load error'); }
  imgfocus.popupImgElement.onload = function()
  {
    // A fix for hiding the glowing effect immediately after showing the pop-up
    // image, and recover it afterwards
    element.style.webkitFilter = 'drop-shadow(0 0 0 gray)';
    element.onmouseout = function()
    { element.style.webkitFilter = 'drop-shadow(0 0 0 gray)'; };
    element.onmouseover = function()
    { element.style.webkitFilter = 'drop-shadow(0 0 3px gray)'; };
    
    // Get the list of the direct children of the document body.
    // Blur all the direct children of the document body. Then overlay the dimmer
    var bodyElementLen = document.body.children.length;
    imgfocus.documentBodyElement = [];
    for (var i=0;i<bodyElementLen;i++)
    {
      var _element = imgfocus.documentBodyElement[i] = document.body.children[i];
      imgfocus.blurElement(_element);
    }
    document.body.appendChild(imgfocus.dimmer);
    
    // Hide the scroll bar
// 		document.body.style.overflow = 'hidden';
    
    // Zoom and position the image properly on screen, along with some basic configurations
    imgfocus.zoomToFit(imgfocus.alwaysZoom);
    
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
      if (imgfocus.popupImgElement)
      { imgfocus.popupImgElement.mousedownTimeStamp = event.timeStamp; }
    }
    , false);
    
    // For image dragging
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

// The main function
imgfocus.popupImgOnClick = function()
{
  // Get the exception list length
  imgfocus.exceptionList = JSON.parse(imgfocus.exceptionList);
  var ImgfocusExceptionListLen = imgfocus.exceptionList.length;
  
  // Prepare a div element for overlaying the page as the dimmer.
  imgfocus.dimmer = document.createElement('div');
  imgfocus.dimmer.style.background = '#000';
  imgfocus.dimmer.style.opacity = 0.5;
  imgfocus.dimmer.style.position = 'fixed';
  imgfocus.dimmer.style.top = 0;
  imgfocus.dimmer.style.left = 0;
  imgfocus.dimmer.style.width = '100%';
  imgfocus.dimmer.style.height = '100%';
  imgfocus.dimmer.style.zIndex = 2147483609;
  
  // Get all the image elements, then filter out the images specified in the exception
  // list, and the images that are hyperlinks
  var imgElement = document.images;
  var imgElementLen = imgElement.length;
  imgfocus.imgList = [];
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
    // Add a new property "name" to store the image's filename for later use
    imgElement[i].name = filename;
    
    // Skip the images specified in the exception list
    var isException = false
    for (var j=0;j<ImgfocusExceptionListLen;j++)
    { if (filename == imgfocus.exceptionList[j]) { isException = true; break; } }
    if (isException) { continue; }
    
    // Skip images that are hyperlinks
    if (imgElement[i].parentNode.tagName.toLowerCase() == 'a') { continue; }
    
    imgfocus.imgList.push(imgElement[i]);
  }
	
	// Apply the popup function on clicking the image
	imgfocus.imgList.forEach(function(item, idx)
	{ item.onclick = function() { imgfocus.clickHandle(this, idx); } });
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
  }
  , stepDuration);
}

// An aux function that returns true if the img element is zoomed beyond and including
// the default zooming size
imgfocus.isZoomOverFit = function()
{
  var element = imgfocus.popupImgElement;
  
  if (!element) { return false; }
  
  if (element.width > Math.round(imgfocus.zoomScreenRatio*window.innerWidth) ||
  element.height > Math.round(imgfocus.zoomScreenRatio*window.innerHeight))
  { return true; }
  else { return false; }
};

// An aux function that returns true if the img element is zoomed and centered
imgfocus.isZoomToFit = function()
{
  var element = imgfocus.popupImgElement;
  
  if (!element) { return false; }
  
  if ((element.height==Math.round(imgfocus.zoomScreenRatio*window.innerHeight) ||
  element.width==Math.round(imgfocus.zoomScreenRatio*window.innerWidth)) &&
  element.style.left == Math.floor(window.innerWidth/2) + 'px' &&
  element.style.top == Math.floor(window.innerHeight/2) + 'px') { return true; }
  else { return false; }
}

// Zoom and position the image properly on screen, along with some basic configurations
// 
// alwaysZoom: if set to true, the image will always be zoomed to the specified size
//             otherwise, the image will be zoomed only if it's oversized
// callback: callback function to invoke at the end of zooming
// element: the image element to process. If not provided, default to the global popup
//          image element
// ratio: the target zoom size in terms of the proportion of the screen size measured in 
//        ratio of the width/height dimension depending on the aspect ratio. If not
//        provided, a default value is set
imgfocus.zoomToFit = function(alwaysZoom, element, callback, ratio)
{
  if (!alwaysZoom) { alwaysZoom = false; }
  if (!element) { element = imgfocus.popupImgElement; }
  if (!ratio) { ratio = imgfocus.zoomScreenRatio; }
  
  // Some necessary settings
  if (imgfocus.dimmer) { element.style.zIndex = imgfocus.dimmer.style.zIndex+1; }
  element.style.position = 'fixed';
  element.style.cursor = 'default';
  
  // Center the image first
  element.style.left = Math.floor(window.innerWidth/2) + 'px';
  element.style.top  = Math.floor(window.innerHeight/2) + 'px';
  element.style.transform = 'translate(-50%, -50%)';
  imgfocus.addShadow(element);
  
  // Cache the translation. This is used for zooming
  element.translateX = -50;
  element.translateY = -50;
  
  var targetWidth = Math.round(ratio*window.innerWidth);
  var targetHeight = Math.round(ratio*window.innerHeight);
  
  if (alwaysZoom || element.naturalWidth > targetWidth || element.naturalHeight > targetHeight)
  {
    // Which direction to zoom (width or height) is determined based on comparing the
    // aspect ratio of the image and the browser.
    var dimension = window.innerWidth/window.innerHeight > element.naturalWidth/element.naturalHeight ? 'height' : 'width';
    var size = dimension == 'width' ? targetWidth : targetHeight;
    
    // Cache the fitting dimension; when switching images, the image will be removed first
    // if there is a dimension change for better experience
    imgfocus.zoomElement(element, dimension, size, imgfocus.zoomToFitTime, 2, 'none', callback);
  }
  else if (callback) { callback(); }
}

// The function to call when the popup image exists and mouse up.
// This function will be used to register and deregister as an event handler, therefore
// it's best to avoid the use of "this"
imgfocus.mouseUpStopDragOrRemoveImg = function(e)
{
  // The detail property of event gives the number of consecutive clicks in a short amount
  // of time. For some reason, a mouse up event can occur immediately following a key
  // press. Simply ignore it.
  if (e.detail==0 || (e.detail==1 && imgfocus.popupImgElement.keydownTimeStamp &&
  e.timeStamp-imgfocus.popupImgElement.keydownTimeStamp<700))
  { return; }
  
  if (imgfocus.isZoomToFit()) { imgfocus.removeImgRecoverBackground(); return; }
  
  // A slow click
  if (e.timeStamp - imgfocus.popupImgElement.mousedownTimeStamp > 150)
  {
    // If the img is shrunk, remove
    if (!imgfocus.isZoomOverFit())
    {
      if (e.target != imgfocus.popupImgElement ) { imgfocus.removeImgRecoverBackground(); }
      else { imgfocus.zoomToFit(true); }
    }
  }
  // A quick click
  else
  {
    if (e.target != imgfocus.popupImgElement) { imgfocus.removeImgRecoverBackground(); }
    else { imgfocus.zoomToFit(true); }
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
// console.log(event);
  
  e.preventDefault();
  
  var element = imgfocus.popupImgElement;
  
  // For zooming
  if (event.ctrlKey || event.metaKey)
  {
    if (event.target != element) { return; }
    
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
    //   var stepPx = -e.deltaY;
    
    // Call zoomElement() to smooth the size transition. The minimum possible width is
    // set to 50px.
    var newW = currentWidth + stepPx;
    var minWidth = 50;
    if (newW > minWidth)
    // 	{ imgfocus.zoomElement(imgfocus.popupImgElement, 'width', newW, 20, 0, 'none'); }
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
      if (element.style.webkitFilter == '') { imgfocus.addShadow(element); }
    }
  }
  
  // Moving
  else
  {
    if (imgfocus.isZoomOverFit())
    {
      var height = element.height;
      var width = element.width;
      var top = parseInt(element.style.top);
      var left = parseInt(element.style.left);
      var vTranslate = Math.round(element.translateX/100*width);
      var hTranslate = Math.round(element.translateY/100*height);

			var margin = 8;

      // For the vertical scroll
      if (e.deltaY < 0)
      {
        hTranslate -= margin;
        var _top = top+hTranslate;
        if (_top < 0)
        {
					if (_top-e.deltaY > 0) { element.style.top = -hTranslate + "px"; }
        	else { element.style.top = top - e.deltaY + "px"; }
        }
      }
      else
      {
        hTranslate += margin;
        var wHeight = window.innerHeight;
        var bottom = top + height + hTranslate;
				if (bottom > wHeight)
			  {
			  	if (bottom-e.deltaY < wHeight) 
			  	{ element.style.top = wHeight-hTranslate-height + "px"; }
			  	else { element.style.top = top - e.deltaY + "px"; }
			  }
      }

			// For the horizontal scroll      
      if (e.deltaX < 0)
      {
        vTranslate -= margin;
        var _left = left+vTranslate;
        if (_left < 0)
        {
					if (_left-e.deltaX > 0)
					{	element.style.left = -vTranslate + "px";	}
        	else { element.style.left = left - e.deltaX + "px"; }
        }
      }
      else
      {
				vTranslate += margin;
        var wWidth = window.innerWidth;
        var right = left + width + vTranslate;
				if (right > wWidth)
			  {
			  	if (right-e.deltaX < wWidth)
			  	{ element.style.left = wWidth-vTranslate-width + "px"; }
			  	else { element.style.left = left - e.deltaX + "px"; }
			  }
      }
    }
  }
}

// Remove the popup image element and restore the page style. The restoring is pretty much
// the reverse of the adding process.
imgfocus.removeImgRecoverBackground = function(style)
{
  var element = imgfocus.popupImgElement;
  if (element)
  {
    // Cancel the timers on removing popup image
    try { clearInterval(element.fadeTimerID); } catch(e) {}
    
    try { imgfocus.dimmer.remove(); } catch(e) {}
    
    var bodyElementLen = imgfocus.documentBodyElement.length;
    for (var i=0;i<bodyElementLen;i++)
    { imgfocus.unBlurElement(imgfocus.documentBodyElement[i]); }
    
		// Working with the GC recipe. Although this could be a general solution for all the 
		// procedures that have to be put off after the popup image is removed.
		if (imgfocus.callback) { imgfocus.callback(); delete imgfocus.callback; }
    
// 		document.body.style.overflow = 'auto';
    
    window.removeEventListener('mouseup', imgfocus.mouseUpStopDragOrRemoveImg, false);
    window.removeEventListener('wheel', imgfocus.wheelZoom, false);
    element.onmousemove = '';
    
    if (style == 'immediately' || element.fadeTimerID != null) { removeImg(); }
    else { imgfocus.fadeElement(element, 1, 0, imgfocus.fadeOutTime, removeImg);	}
    
    function removeImg()
    { element.remove();	delete imgfocus.popupImgElement; }
    
		// Img rm event is open for registering callback
		// Process them here
		if (imgfocus.eventCallback["imgRm"].length)
		{ imgfocus.eventCallback["imgRm"].forEach(function(fn) { fn(); }); }
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
  
  // If the element is already zooming, cancel the zooming then continue.
  if (element.zoomTimerID != null)
  {
    clearInterval(element.zoomTimerID);
    delete element.zoomTimerID;
    element.style.opacity = element.originalOpacity;
  }
  
  // An aux function for defining the procedure at the end of zooming
  var _zoomAndCallback = function()
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
    
    // Run the callback function if given
    if (callback) { callback(); }
  };
  
  // Special case for zooming immediately
  if (duration == 0) { _zoomAndCallback(); return; }
  
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
  
  element.zoomTimerID = setInterval(function()
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
      _zoomAndCallback();
      
      if (filterEffect != 'none')
      { element.style.opacity = element.originalOpacity; }
      
      clearInterval(element.zoomTimerID);
      delete element.zoomTimerID;
      delete element.originalOpacity;
      
      return;
    }
  }, stepDuration);
}

// Box shadow should be more efficient, but looks bad for transparent png
imgfocus.addShadow = function(element)
{
  element.style.webkitFilter = 'drop-shadow(20px 20px 10px black)';
	
// 	element.style.boxShadow = '20px 20px 30px black';
};

window.addEventListener('load', function() { imgfocus.popupImgOnClick(); }, false);

window.addEventListener('keydown', function()
{
  if (imgfocus.popupImgElement)
  {
    // On pressing ESC, remove the pop up image immediately without any special effects.
    if (event.keyCode == 27) { imgfocus.removeImgRecoverBackground('immediately'); }
    
    // On pressing M, zoom the popup image to fit the browser.
    else if (event.keyCode == 77 || event.keyCode == 32)
    {
			event.preventDefault();
      if (imgfocus.isZoomToFit()) { imgfocus.removeImgRecoverBackground(); }
      else
      {
        // For some reason, a mouse up event can occur immediately following a key
        // press. Record the key press time to identify this case.
        imgfocus.popupImgElement.keydownTimeStamp = event.timeStamp;
        
        imgfocus.zoomToFit(true);
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
        var element = imgfocus.popupImgElement;
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
          if (element.style.webkitFilter == '') { imgfocus.addShadow(element); }
        }
      }
    }
*/
    
    // Direction keys or page up/dn
    else if (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 37 || event.keyCode == 39 ||
             event.keyCode == 33 || event.keyCode == 34)
    {
      event.preventDefault();
      
      // If isZoomOverFit, move the image
      if (imgfocus.isZoomOverFit())
      {
        if (event.keyCode == 38 || event.keyCode == 40)
        {
          imgfocus.popupImgElement.style.top =
          parseInt(imgfocus.popupImgElement.style.top)+(event.keyCode-39)*10+'px';
        }
        else if (event.keyCode == 37 || event.keyCode == 39)
        {
          imgfocus.popupImgElement.style.left =
          parseInt(imgfocus.popupImgElement.style.left)+(event.keyCode-38)*10+'px';
        }
        else { return; }
      }
      // Else, switch between images
      else
      {
        // If the temp element is still there, the last image switching has not
        // been completed yet
        if (imgfocus.popupImgElementTemp) { return; }
        
				// Get the index of the next image element in the image list stored as a property
				// of "imgfocus"
        var imgListLen = imgfocus.imgList.length;
        if (event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 33)
        {
        	var idx = imgfocus.popupImgElement.imgElementIdx-1;
        	idx = idx<0 ? imgListLen-1 : idx;
        }
        else
        {
        	var idx = imgfocus.popupImgElement.imgElementIdx+1;
        	idx = idx==imgListLen ? 0 : idx;
        }
        
        // Pressing left/right is equivalent to clicking on the previous/next image
        // No need to remove the current popup image first, since changing its src
        // property is equivalent to loading a new image for the image element
				var followingElement = imgfocus.imgList[idx];
				followingElement.scrollIntoView(true);
        followingElement.click();
        
        // When the temp element for holding the next image is loaded, zoom to fit the
        // temp element, append the temp element, remove the original element, set the
        // original element to the temp element, finally, remove the temp element
        imgfocus.popupImgElementTemp.onload = function()
        {
          imgfocus.zoomToFit(imgfocus.alwaysZoom, this, function()
          {
            document.body.appendChild(imgfocus.popupImgElementTemp);
            imgfocus.popupImgElement.remove();
            imgfocus.popupImgElementTemp.onmousedown = imgfocus.popupImgElement.onmousedown;
            imgfocus.popupImgElement = imgfocus.popupImgElementTemp;
            delete imgfocus.popupImgElementTemp;
          }
          );
        }
      }
    }
//     else { event.preventDefault(); }
  }
}
, false);