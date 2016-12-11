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
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20161211
 */

// Main function handling the popup effects.
window.addEventListener('load', ImgfocusPopupImgOnClick, false);

function ImgfocusClickHandle(element)
{
	if (document.getElementById('ImgfocusPopupImage') == null)
	{ 						
		// Create the popup image
		var imgEnlarge = document.createElement('img');	
		imgEnlarge.src = element.src;

		// Blur and dim the background and then show the popup image on image load.
		imgEnlarge.onerror = function() { imgEnlarge.remove(); }
		imgEnlarge.onload = function()
		{
			// Blur all the direct children of the document body.
			var bodyElementLen = documentBodyElement.length;
			for (var i=0;i<bodyElementLen;i++)
			{ ImgfocusBlurElement(documentBodyElement[i]); }

			// Overlay the dimmer					
			document.body.appendChild(dimmer);

			imgEnlarge.id = 'ImgfocusPopupImage';
			imgEnlarge.style.zIndex = dimmer.style.zIndex+1;
			imgEnlarge.style.position = 'fixed';
			
			// Place the image right at the center of the browser.
			imgEnlarge.style.left = window.innerWidth/2 + 'px';
			imgEnlarge.style.top  = window.innerHeight/2 + 'px';
			imgEnlarge.style.transform = 'translate(-50%, -50%)';
			
			// Shrink the image if it's bigger than the browser screen
			var browserShrinkRatio = 1.0;
			var aspectRatio = imgEnlarge.width/imgEnlarge.height;          
			var screenAspectRatio = window.innerWidth/window.innerHeight;
			if (aspectRatio < screenAspectRatio)
			{
				imgEnlarge.style.height = window.innerHeight*browserShrinkRatio +'px';
				imgEnlarge.style.width = 'auto';
			}
			else
			{
				imgEnlarge.style.width = window.innerWidth*browserShrinkRatio +'px';
				imgEnlarge.style.height = 'auto';
			}

			// Apply shadow effect & fade in the popup image
			imgEnlarge.style.webkitFilter = 'drop-shadow(20px 20px 10px black)';

			// Hide it first for later fading in           
			imgEnlarge.style.visibility = 'hidden';
			
			document.body.appendChild(imgEnlarge);

			ImgfocusFadeElement(imgEnlarge, 0, 1, ImgfocusFadeInTime, NaN);

			// On mouse down, if the popup image is not oversized, implement drag and move
			// Otherwise, the image is removed by a click.
			window.addEventListener('mouseup', ImgfocusMouseUpStopDragOrRemoveImg, false);
			imgEnlarge.onmousedown = function(e)
			{
				if (this.height>=window.innerHeight || this.width>=window.innerWidth)
				{  							
					var mouseCoordX = e.clientX;
					var mouseCoordY = e.clientY;
					
					var imgCoordX = parseInt(this.style.left);
					var imgCoordY = parseInt(this.style.top);

					window.onmousemove = function(e)
					{
						imgEnlarge.style.left = imgCoordX+e.clientX-mouseCoordX+'px';
						imgEnlarge.style.top  = imgCoordY+e.clientY-mouseCoordY+'px';
					};
					return false;
				}
			}

			// On wheel, zoom the pop up image
			window.addEventListener('wheel', ImgfocusWheelZoom, false);
		}
	}	
}

function ImgfocusPopupImgOnClick()
{
  // Get the exception list length
  ImgfocusExceptionList = JSON.parse(ImgfocusExceptionList);
  var ImgfocusExceptionListLen = ImgfocusExceptionList.length;
 
  // Get the list of the direct children of the document body.
	var bodyElementLen = document.body.children.length;
	window.documentBodyElement = [];
	for (var i=0;i<bodyElementLen;i++)
	{ documentBodyElement[i] = document.body.children[i]; }

	// Prepare a div element for overlaying the page as the dimmer.
	window.dimmer = document.createElement('div');
	dimmer.id = 'ImgfocusDimmer';
	dimmer.style.background = '#000';
	dimmer.style.opacity = 0.5;
	dimmer.style.position = 'fixed';
	dimmer.style.top = 0;
	dimmer.style.left = 0;
	dimmer.style.width = '100%';
	dimmer.style.height = '100%';
	dimmer.style.zIndex = 9;
		  
  // Get all the image elements
 	var imgElement = document.getElementsByTagName("img"); 
 	var imgElementLen = imgElement.length;
 	for (var i=0;i<imgElementLen;i++)
 	{
 	  // Get the image filename
 	  var pos = imgElement[i].src.lastIndexOf('/');
 	  var filename = imgElement[i].src.slice(pos+1);

 	  // Skip the images specified in the exception list
 	  var isException = false
 	  for (var j=0;j<ImgfocusExceptionListLen;j++)
 	  {
 	    if (filename == ImgfocusExceptionList[j])
 	    { isException = true; break; }
 	  }  
 	  if (isException) { continue; }
 	  
		// Skip images that are hyperlinks
		if (imgElement[i].parentNode.tagName.toLowerCase() == 'a') { continue; }

		// Apply the popup function on clicking the image
// 		imgElement[i].onclick = ImgfocusClickHandle(imgElement[i], dimmer);
		imgElement[i].onclick = function() { ImgfocusClickHandle(this); }
 	}
}

// Blur and opaque the element. Note that 'webkitFilter' is a browser dependent method.
function ImgfocusBlurElement(element)
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
function ImgfocusUnBlurElement(element)
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
function ImgfocusFadeElement(element, startOpacity, endOpacity, duration)
{
  if (typeof element === 'undefined') { console.log('Error: element undefined in ImgfocusFadeElement()!'); return; }
  else if (startOpacity == endOpacity) { return; }
  
  var initialWidth = element.clientWidth;
  
  var stepDuration = 5;
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
				if (endOpacity == 0) { element.remove(); }
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


// Zoom the image to fit the browser visible area
function ImgfocusZoomToFit()
{
	var imgEnlarge = document.getElementById('ImgfocusPopupImage');
  imgEnlarge.style.cursor = 'move';
        
  // Center the image first
	imgEnlarge.style.left = window.innerWidth/2 + 'px';
	imgEnlarge.style.top  = window.innerHeight/2 + 'px';
	imgEnlarge.style.transform = 'translate(-50%, -50%)';

  // Which direction to zoom (width or height) is determined based on comparing the
  // aspect ratio of the image and the browser.
  var dimension = window.innerWidth/window.innerHeight > imgEnlarge.clientWidth/imgEnlarge.clientHeight ? 'height' : 'width';
  var size = dimension == 'width' ? window.innerWidth : window.innerHeight;
  ImgfocusZoomElement(imgEnlarge, dimension, size, ImgfocusZoomToFitTime, 7, 'true');
}

// The function to call when the popup image exists and mouse up.
function ImgfocusMouseUpStopDragOrRemoveImg(e)
{	
	if (e.target.id != 'ImgfocusPopupImage')
	{ ImgfocusRemovePopupImg(); return; }
	var imgEnlarge = document.getElementById('ImgfocusPopupImage');
		
	// The detail property of event gives the number of consecutive clicks in a short amount
	// of time. Remove the pic and leave if it's a double click.
	if (e.detail == 2) { ImgfocusRemovePopupImg(); return; }
	
	if (imgEnlarge.height>=window.innerHeight || imgEnlarge.width>=window.innerWidth)
	{ window.onmousemove = ''; }
  else { ImgfocusZoomToFit(); }
}
						
// Zoom the pop up image on wheel. The visual experience of directly modifying the image
// size by wheel delta is not so satisfying for mouses (fine for trackpad though); 
// therefore ImgfocusZoomElement() is called to kinda "fill the gap" to smooth the
// transition
function ImgfocusWheelZoom(e)
{
  e.preventDefault();
  
  var imgEnlarge = document.getElementById('ImgfocusPopupImage');
	var minWidth = 50;
  
  // A too small wheelDelta, therefore stepPx, seems to cause problem
	var stepPx = e.wheelDelta;
	if (imgEnlarge.clientWidth <= minWidth && stepPx < 0)	{ return; }
	
  if (Math.abs(stepPx) < 10) { stepPx = stepPx>0 ? 10 : -10; }

	// Call zoomElement() to smooth the size transition. The minimum possible width is 
	// set to 50px.
	var newW = imgEnlarge.clientWidth + stepPx;
	if (newW > minWidth)
	{ ImgfocusZoomElement(imgEnlarge, 'width', newW, 20, 0, 'none'); }
  else
  {
    imgEnlarge.style.width = minWidth + 'px';
    imgEnlarge.style.height = 'auto';
  }
  
  // Handle the cursor style change
	if (imgEnlarge.height>=window.innerHeight || imgEnlarge.width>=window.innerWidth)
	{ imgEnlarge.style.cursor = 'move'; }
	else { imgEnlarge.style.cursor = 'default'; }
}

// Remove the popup image element and restore the page style. The restoring is pretty much
// the reverse of the adding process.
function ImgfocusRemovePopupImg(style)
{  
  var imgEnlarge = document.getElementById('ImgfocusPopupImage');
  if (imgEnlarge != null)
	{ 
	  // Cancel the timers on removing popup image
	  try { clearInterval(imgEnlarge.fadeTimerID); } catch(e) {}
    
    var dimmer = document.getElementById('ImgfocusDimmer');
	  try { dimmer.remove(); } catch(e) {}
    
		var bodyElementLen = document.body.children.length;
		for (var i=0;i<bodyElementLen;i++)
		{ ImgfocusUnBlurElement(document.body.children[i]); }

    if (style == 'immediately' || imgEnlarge.fadeTimerID != null)
    { imgEnlarge.remove(); }
    else
    { ImgfocusFadeElement(imgEnlarge, 1, 0, ImgFocusFadeOutTime); }

    window.removeEventListener('mouseup', ImgfocusMouseUpStopDragOrRemoveImg, false);
    window.removeEventListener('wheel', ImgfocusWheelZoom, false);
  }
}

// Zoom in/out an element with animation. Parameters:
// element: The element to be zoomed
// zoom: Accept 'width' or 'height'; the dimension based on which the element is zoomed
// targetSize: The target size in pixel to zoom to
// duration: The zooming duration to animate
// springOutTick: The extent to overzoom to provide a springing-like feel
// filterEffect: The filter effect to apply during zooming
function ImgfocusZoomElement(element, zoom, targetSize, duration, springOutTick, filterEffect)
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

  var stepDuration = 4;
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

  if (zoom == 'width') { var originalSize = element.clientWidth; }
  else { var originalSize = element.clientHeight; }
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
			{
  			element.style.opacity = element.originalOpacity;
			}

			clearInterval(element.zoomTimerID);
			delete element.zoomTimerID;
			delete element.originalOpacity;
			return;
		}
	}, stepDuration);
}

window.addEventListener('keydown', function()
{  
  var imgEnlarge = document.getElementById('ImgfocusPopupImage')
  if (imgEnlarge !== null)
  { 
    // On pressing ESC, remove the pop up image immediately without any special effects.
		if (event.keyCode == 27) { ImgfocusRemovePopupImg('immediately'); }

    // On pressing M, zoom the popup image to fit the browser.
		else if (event.keyCode == 77)
		{
      if ((imgEnlarge.clientWidth>=window.innerWidth || imgEnlarge.clientHeight>=window.innerHeight))
      { ImgfocusRemovePopupImg(); }
      else { ImgfocusZoomToFit(); }
		}

		// Up or Down
	  else if (event.keyCode == 38 || event.keyCode == 40)
		{
      if ((imgEnlarge.clientWidth>=window.innerWidth || imgEnlarge.clientHeight>=window.innerHeight))
		  { imgEnlarge.style.top = parseInt(imgEnlarge.style.top)+(event.keyCode-39)*10+'px'; }
		}
		// Left or Right
		else if (event.keyCode == 37 || event.keyCode == 39)
		{
      if ((imgEnlarge.clientWidth>=window.innerWidth || imgEnlarge.clientHeight>=window.innerHeight))
		  { imgEnlarge.style.left = parseInt(imgEnlarge.style.left)+(event.keyCode-38)*10+'px'; }
		}
	}
}, false);

