/* 
 * This recipe enables youtube-like keyboard and mouse control of HTML5 video and audio. 
 * Click on the control panel or the image to gain control over a video or audio. Click to
 * toggle play/pause; double click to toggle fullscreen. Press space to toggle
 * play/pause. Press left/right keys to go backward/forward 5 seconds. Press 
 * up/dn to change volume. Press the number keys for a quick jump. Pressing f to toggle
 * fullscreen. Press j to scroll to the video currently under control.
 *
 * This recipe also dynamically creates an image element serving as the play icon for each
 * video.
 * 
 * In Chrome Version 55.0.2883.95 (64-bit) on MAC, video sometimes gets unresponsive
 * by preloading metadata. This is solved by continuous polling using an interval 
 * timer. The polling timer runs until the video actually start playing.
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170507
 */

// Arrange the play icon so that it situates at the center of the given video element.
function Html5AVCtrlArrangePlayIcon(element)
{
		// Position the play icon
		var playIconElement = element.playIconElement;
		if (typeof playIconElement != 'undefined')
		{
			var rectObject = element.getBoundingClientRect();
			playIconElement.style.top = rectObject.top+document.body.scrollTop+rectObject.height/2 + 'px';
			playIconElement.style.left = rectObject.left+rectObject.width/2 + 'px';  
			playIconElement.style.display = 'initial';
		}
}

// Toggle between play & pause for a video or audio element
function Html5AVCtrlToggleFC(element) {
	if (document.webkitFullscreenElement !== null &&
		document.webkitFullscreenElement.tagName.toLowerCase() == 'video') {
		document.webkitFullscreenElement.webkitExitFullscreen();
	} else {
		element.webkitRequestFullscreen();
	}
}

// Toggle between play & pause for a video or audio element
function Html5AVCtrlTogglePlay(element) {
  if (element.paused) {
    element.play();
  } else {
    element.pause();
  }
}

// A routine for playing the video element for the very 1st time; removing its play icon
// and then keep polling until the video actually starts 
function Html5AVCtrlRemoveIconAndPlay(element)
{
	Html5AVCtrlElement = element;
	element.play();
	element.controls = true;
	var playIcon = element.playIconElement;
	playIcon.style.height = 1.2*playIcon.clientHeight + 'px';
	playIcon.style.opacity = 0;
	playIcon.addEventListener('webkitTransitionEnd', function()
	{ playIcon.remove(); delete element.playIconElement; }, false );

	// Keep polling until the video actually starts 
	var playPollTimerID = setInterval(function()
	{
		if (element.currentTime == 0)
		{
			element.currentTime = 0.01;
			element.play();
		}
		else { clearInterval(playPollTimerID); }
	}, 100);
}

window.addEventListener('load', function()
{
	/****************************Process Video elements************************************/
	
  // Capture the audio/video element by changing the controls
  var videoElement = document.getElementsByTagName('video');
  var videoElementLen = videoElement.length;
  
  // Process if there are at least one video
  if (videoElementLen > 0)
  {
		for (var i = 0; i < videoElementLen; i++)
		{  
			if (i === videoElementLen - 1) {  }
			else { videoElement[i].nextVideoElement = videoElement[i + 1]; }
		}

		// Load the metadata for the very first video element	
		videoElement[0].preload = 'metadata';
		videoElement[0].onloadedmetadata = function() { metadataOnLoad.call(this); }
		
		// Declare the onmetadata loaded routine
		function metadataOnLoad()
		{
			var videoName = this.children[0].src;
			console.log(videoName.slice(videoName.lastIndexOf("/")+1) + " meta loaded");
	
			// Use the existence of the playIconElement to prevent running this twice
			// This is needed for a workaround of failing to play video occasionally in Chrome
			// with metadata preloaded
			if (this.playIconElement) { return; }
			
			this.poster = '';
	
			this.style.width = Math.round(this.clientHeight*this.videoWidth/this.videoHeight) + 'px';
			
	// 		this.play(); this.pause();
	// 		setTimeout(function() { delete(Html5AVCtrlElement); }, 0);
			
			// On load remove the control bar
			this.controls = false;
						
			// Overlay the play icon
			var playIcon = document.createElement('img');
			playIcon.src = 'http://localhost/pmwiki/pub/html5avctrl/playIcon.png';
			playIcon.style.transform = 'translate(-50%, -50%)';
			playIcon.style.position = 'absolute';
			playIcon.style.webkitTransition = "opacity 0.2s ease, height 0.2s ease";
			playIcon.style.opacity = 0.6;
			playIcon.style.display = 'none';
			playIcon.onload = function()
			{ playIcon.style.height = playIcon.naturalHeight + 'px'; }
			document.body.appendChild(playIcon);
			
			// Associate the play icon to the video element      	
			this.playIconElement = playIcon;
	
			// Click on the play icon, fade out
			playIcon.videoElement = this;
			playIcon.onclick = function()
			{ Html5AVCtrlRemoveIconAndPlay(playIcon.videoElement); }
	
			// Set visual effects for the play icons
			this.onmouseover = function()
			{
				playIcon.style.opacity = 0.8;
				playIcon.style.height = 1.1*playIcon.naturalHeight + 'px';
			}
			this.onmouseout = function()
			{
				playIcon.style.opacity = 0.6;
				playIcon.style.height = playIcon.naturalHeight + 'px';
			}
			playIcon.onmouseover = function()
			{
				playIcon.style.opacity = 0.8;
				playIcon.style.height = 1.1*playIcon.naturalHeight + 'px';
			}
			playIcon.onmouseout = function()
			{
				playIcon.style.opacity = 0.6;
				playIcon.style.height = playIcon.naturalHeight + 'px';
			}
			
			Html5AVCtrlArrangePlayIcon(this); // Add its play icon

			// If there is a next video element, load its metadata and process on loaded
			if (this.nextVideoElement)
			{
				this.nextVideoElement.preload = 'metadtata';
				this.nextVideoElement.onloadedmetadata = 
				function() { metadataOnLoad.call(this); }
			}
		};

		// On window resize, adjust the play icon for all the video elements
		window.addEventListener('resize', function()
		{
		  Array.prototype.forEach.call(videoElement, function(element)
		  { Html5AVCtrlArrangePlayIcon(element); });
		});
  }

  /*************************End of Video element processing******************************/
  
  // Capture the video element on clicking or altering its control panel 
	var audioElement = document.getElementsByTagName('audio');
  var audioElementLen = audioElement.length;
  var videoAudioLen = videoElementLen + audioElementLen;
  for (var i = 0; i < videoAudioLen; i++) {
    var element = (i >= videoElementLen) ? audioElement[i - videoElementLen] : videoElement[i];    
    element.onplay = function() {
      Html5AVCtrlElement = this;
    }
    element.onpause = function() {
      Html5AVCtrlElement = this;
    }
    element.onseeking = function() {
      Html5AVCtrlElement = this;
    }
    element.onseeking = function() {
      Html5AVCtrlElement = this;
    }
    element.onvolumechange = function() {
      Html5AVCtrlElement = this;
    }
    element.onclick = function() {
      Html5AVCtrlElement = this;

      // Click on the other part of the video, remove the play icon & play
			if (this.playIconElement)	{ Html5AVCtrlRemoveIconAndPlay(this); }
			else { Html5AVCtrlTogglePlay(this); }
    }
    if (i < videoElementLen) {
			element.ondblclick = function() {
  	     Html5AVCtrlElement = this;
				 Html5AVCtrlToggleFC(Html5AVCtrlElement);
      }
    }
  }

  // Add click and keydown events only if there are html5 video audio elements found
  if (videoAudioLen > 0) {
  
//    window.addEventListener('scroll', function(){delete(Html5AVCtrlElement);}, false);
  
    // On mouse click, get the clicked element
    // if it's not an audio/video, unset the captured audio/video element
    window.addEventListener('click', function(e) {
      var clickedElement = e.target;
      if (clickedElement.tagName.toLowerCase() != 'video' && clickedElement.tagName.toLowerCase() != 'audio') {
        delete(Html5AVCtrlElement);
      }

			// On click, show the built-in control panel
			else if (clickedElement.tagName.toLowerCase() == 'video')
			{ clickedElement.controls = 'true'; }
			
    }, false);

    window.addEventListener('keydown', function(e) {

      // Deal with the case where fullscreen is fired right at the start
      if (document.webkitFullscreenElement !== null &&
        document.webkitFullscreenElement.tagName.toLowerCase() == 'video') {
        Html5AVCtrlElement = document.webkitFullscreenElement;
      }

      // Handle various keyboard commands if there is a captured audio/video element
      if (typeof Html5AVCtrlElement !== 'undefined' &&
        (Html5AVCtrlElement.tagName.toLowerCase() == 'video' ||
          Html5AVCtrlElement.tagName.toLowerCase() == 'audio')) {
        // Space key: toggle play
        if (e.keyCode == 32) {
          e.preventDefault();
          Html5AVCtrlTogglePlay(Html5AVCtrlElement);
        }
        // Left key: backward 5 sec
        else if (e.keyCode == 37) {
          e.preventDefault();
          Html5AVCtrlElement.currentTime -= 5;
        }
        // Right key: forward 5 sec
        else if (e.keyCode == 39) {
          e.preventDefault();
          Html5AVCtrlElement.currentTime += 5;
        }
        // Up key: volume up
        else if (e.keyCode == 38) {
          e.preventDefault();
          Html5AVCtrlElement.volume = Math.min(Html5AVCtrlElement.volume + 0.1, 1);
        }
        // Dn key: volume down
        else if (e.keyCode == 40) {
          e.preventDefault();
          Html5AVCtrlElement.volume = Math.max(Html5AVCtrlElement.volume - 0.1, 0);
        }
        // Number key: jump to sections
        else if (48 <= e.keyCode && e.keyCode <= 57) {
          e.preventDefault();
          var numKey = e.keyCode - 48;
          Html5AVCtrlElement.currentTime = Html5AVCtrlElement.duration / 10 * numKey;
        }

        // J: Scroll into view the current captured element
        else if (e.keyCode == 74) {
          e.preventDefault();
     			Html5AVCtrlElement.scrollIntoView(true);
        }                
        
        // F: toggle fullscreen
        else if (e.keyCode == 70 && Html5AVCtrlElement.tagName.toLowerCase() == 'video') {
          e.preventDefault();
          Html5AVCtrlToggleFC(Html5AVCtrlElement);
        }
      }
    }, false);
  }
}, false);
