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
 * Version 20170103
 */

var imgfocus = {};

imgfocus.clickHandle = function(element)
{
	if (!imgfocus.imgEnlarge)
	{ 						
		// Create the popup image
		imgfocus.imgEnlarge = document.createElement('img');	
		imgfocus.imgEnlarge.src = element.src;

		// Blur and dim the background and then show the popup image on image load.
		imgfocus.imgEnlarge.onerror = function() { this.imgEnlarge.remove(); }
		imgfocus.imgEnlarge.onload = function()
		{
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
			
			// Shrink the image if it's bigger than the browser screen
			var browserShrinkRatio = 1.0;
			var aspectRatio = this.width/this.height;          
			var screenAspectRatio = window.innerWidth/window.innerHeight;
			if (aspectRatio < screenAspectRatio)
			{
				this.style.height = window.innerHeight*browserShrinkRatio +'px';
				this.style.width = 'auto';
			}
			else
			{
				this.style.width = window.innerWidth*browserShrinkRatio +'px';
				this.style.height = 'auto';
			}

			// Apply shadow effect & fade in the popup image
			this.style.webkitFilter = 'drop-shadow(20px 20px 10px black)';

			// Hide it first for later fading in           
			this.style.visibility = 'hidden';
			
			document.body.appendChild(this);

			imgfocus.fadeElement(this, 0, 1, imgfocus.fadeInTime, NaN);

			// On mouse down, if the popup image is not oversized, implement drag and move
			// Otherwise, the image is removed by a click.
			window.addEventListener('mouseup', imgfocus.mouseUpStopDragOrRemoveImg, false);
			this.onmousedown = function(e)
			{
				if (!imgfocus.imgEnlarge.fadeTimerID && (this.height>=window.innerHeight || this.width>=window.innerWidth))
				{  							
					imgfocus.mouseCoordX = event.clientX;
					imgfocus.mouseCoordY = event.clientY;
					imgfocus.imgCoordX = parseInt(imgfocus.imgEnlarge.style.left);
					imgfocus.imgCoordY = parseInt(imgfocus.imgEnlarge.style.top);				
					imgfocus.trackMouse = function(event)
					{
						imgfocus.imgEnlarge.style.left = imgfocus.imgCoordX+event.clientX-imgfocus.mouseCoordX+'px';
						imgfocus.imgEnlarge.style.top  = imgfocus.imgCoordY+event.clientY-imgfocus.mouseCoordY+'px';							  
					}
					window.addEventListener('mousemove', imgfocus.trackMouse, false);
					return false;
				}
			}
			
			// On wheel, zoom the pop up image
			window.addEventListener('wheel', imgfocus.wheelZoom, false);
		}
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
			if (filename == imgfocus.exceptionList[j])
			{ isException = true; break; }
		}  
		if (isException) { continue; }
		
		// Skip images that are hyperlinks
		if (imgElement[i].parentNode.tagName.toLowerCase() == 'a') { continue; }

		// Apply the popup function on clicking the image
		imgElement[i].onclick = function() { imgfocus.clickHandle(this); }
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

	if (element.width>=window.innerWidth || element.height>=window.innerHeight)
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
imgfocus.zoomToFit = function()
{
	var element = imgfocus.imgEnlarge;
	element.style.cursor = 'move';

	// Center the image first
	element.style.left = Math.floor(window.innerWidth/2) + 'px';
	element.style.top  = Math.floor(window.innerHeight/2) + 'px';
	element.style.transform = 'translate(-50%, -50%)';

	// Which direction to zoom (width or height) is determined based on comparing the
	// aspect ratio of the image and the browser.
	var dimension = window.innerWidth/window.innerHeight > element.width/element.height ? 'height' : 'width';
	var size = dimension == 'width' ? window.innerWidth : window.innerHeight;
	imgfocus.zoomElement(element, dimension, size, imgfocus.zoomToFitTime, 7, 'true');
}

// The function to call when the popup image exists and mouse up.
// This function will be used to register and deregister as an event handler, therefore
// it's best to avoid the use of "this"
imgfocus.mouseUpStopDragOrRemoveImg = function(e)
{
	// If the image is zoomed, a single click removes it	
	if (imgfocus.isZoomToFit()) { imgfocus.removeImgRecoverBackground(); return; }
	
	// The detail property of event gives the number of consecutive clicks in a short amount
	// of time. Remove the pic and leave if it's a double click.
	if (e.detail == 2) { imgfocus.removeImgRecoverBackground(); return; }

	// If the image is zoomed
	if (imgfocus.imgEnlarge.height>=window.innerHeight || imgfocus.imgEnlarge.width>=window.innerWidth)
	{ window.removeEventListener('mousemove', imgfocus.trackMouse, false); }
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
	
	var minWidth = 50;
	
	// A too small wheelDelta, therefore stepPx, seems to cause problem
	var stepPx = e.wheelDelta;
	if (imgfocus.imgEnlarge.width <= minWidth && stepPx < 0)	{ return; }
	
	if (Math.abs(stepPx) < 10) { stepPx = stepPx>0 ? 10 : -10; }

	// Call zoomElement() to smooth the size transition. The minimum possible width is 
	// set to 50px.
	var newW = imgfocus.imgEnlarge.width + stepPx;
	if (newW > minWidth)
	{ imgfocus.zoomElement(imgfocus.imgEnlarge, 'width', newW, 20, 0, 'none'); }
	else
	{
		imgfocus.imgEnlarge.style.width = minWidth + 'px';
		imgfocus.imgEnlarge.style.height = 'auto';
	}
	
	// Handle the cursor style change
	if (imgfocus.imgEnlarge.height>=window.innerHeight || imgfocus.imgEnlarge.width>=window.innerWidth)
	{ imgfocus.imgEnlarge.style.cursor = 'move'; }
	else { imgfocus.imgEnlarge.style.cursor = 'default'; }
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

		window.removeEventListener('mousemove', imgfocus.trackMouse, false);
		window.removeEventListener('mouseup', imgfocus.mouseUpStopDragOrRemoveImg, false);
		window.removeEventListener('wheel', imgfocus.wheelZoom, false);

  	if (style == 'immediately' || element.fadeTimerID != null) { removeImg(); }
		else { imgfocus.fadeElement(element, 1, 0, imgfocus.fadeOutTime, removeImg);	}

		function removeImg()
		{
// Remove this INGO
// 			window.removeEventListener('mousemove', imgfocus.trackMouse, false);
// 			window.removeEventListener('mouseup', imgfocus.mouseUpStopDragOrRemoveImg, false);
// 			window.removeEventListener('wheel', imgfocus.wheelZoom, false);
			element.remove();
			delete imgfocus.imgEnlarge;
		}
	}
}

// Zoom in/out an element with animation. Parameters:
// element: The element to be zoomed
// zoom: Accept 'width' or 'height'; the dimension based on which the element is zoomed
// targetSize: The target size in pixel to zoom to
// duration: The zooming duration to animate
// springOutTick: The extent to overzoom to provide a springing-like feel
// filterEffect: The filter effect to apply during zooming
imgfocus.zoomElement = function(element, zoom, targetSize, duration, springOutTick, filterEffect)
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
			return;
		}
	}, stepDuration);
}

window.addEventListener('load', function() { imgfocus.popupImgOnClick(); }, false);

window.addEventListener('keydown', function()
{  
	if (imgfocus.imgEnlarge)
	{ 
		// On pressing ESC, remove the pop up image immediately without any special effects.
		if (event.keyCode == 27) { imgfocus.removeImgRecoverBackground('immediately'); }

		// On pressing M, zoom the popup image to fit the browser.
		else if (event.keyCode == 77)
		{
			if (imgfocus.isZoomOverFit())
			{ imgfocus.removeImgRecoverBackground(); }
			else { imgfocus.zoomToFit(); }
		}

		// Up or Down
		else if (event.keyCode == 38 || event.keyCode == 40)
		{
			if (imgfocus.isZoomOverFit())
			{
				event.preventDefault();
				imgfocus.imgEnlarge.style.top = parseInt(imgfocus.imgEnlarge.style.top)+(event.keyCode-39)*10+'px';
			}
		}
		
		// Left or Right
		else if (event.keyCode == 37 || event.keyCode == 39)
		{
			if (imgfocus.isZoomOverFit())
			{
				event.preventDefault();
				imgfocus.imgEnlarge.style.left = parseInt(imgfocus.imgEnlarge.style.left)+(event.keyCode-38)*10+'px';
			}
		}
	}
}, false);
