/* 
 * This recipe enables youtube-like keyboard and mouse control of HTML5 video and audio. 
 * Click on the control panel or the image to gain control over a video or audio. Click to
 * toggle play/pause; double click to toggle fullscreen. Press space to toggle
 * play/pause. Press left/right keys to go backward/forward 5 seconds. Press 
 * up/dn to change volume. Press the number keys for a quick jump. Pressing f to toggle
 * fullscreen. Press v to scroll to the video currently under control.
 *
 * In chrome, loading too many videos results in browser hanging; it appears to be a bug.
 * This recipe fixes this by a quick play then pause all videos.
 *
 * This recipe also dynamically creates an image element serving as the play icon for each
 * video.
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20161223
 */

// Arrange all the play icons so that they situate at the center of associated video 
// elements.
function Html5AVCtrlArrangePlayIcon()
{
  var videoElement = document.getElementsByTagName('video');

  // Manually set preload and then play/pause to get around Chrome's socket bug.
  // Also introduce the play icon
  var videoElementLen = videoElement.length;
  for (var i = 0; i < videoElementLen; i++)
  {
		// Position the play icon
		var playIconElement = videoElement[i].playIconElement;
		if (typeof playIconElement != 'undefined')
		{
			var rectObject = videoElement[i].getBoundingClientRect();
			playIconElement.style.top = rectObject.top+document.body.scrollTop+rectObject.height/2 + 'px';
			playIconElement.style.left = rectObject.left+rectObject.width/2 + 'px';  
			playIconElement.style.display = 'initial';
		}
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

window.addEventListener('load', function() {
  // Capture the audio/video element by changing the controls
  var videoElement = document.getElementsByTagName('video');
  var videoElementLen = videoElement.length;
  var audioElement = document.getElementsByTagName('audio');
  var audioElementLen = audioElement.length;

  // Manually set preload and then play/pause to get around Chrome's socket bug.
  // Also introduce the play icon
  for (var i = 0; i < videoElementLen; i++)
  {  
    videoElement[i].preload = 'metadata';
    
    videoElement[i].onloadedmetadata = function()
    {
      this.poster = '';

      this.style.width = Math.round(this.clientHeight*this.videoWidth/this.videoHeight) + 'px';
        
			this.play();
			this.pause();
      setTimeout("delete(Html5AVCtrlElement);", 0);
      
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
      {
        Html5AVCtrlTogglePlay(playIcon.videoElement);
        playIcon.videoElement.controls = true;
        Html5AVCtrlElement = playIcon.videoElement;
				playIcon.style.height = 1.2*playIcon.clientHeight + 'px';
				playIcon.style.opacity = 0;
				playIcon.addEventListener('webkitTransitionEnd', function()
				{ playIcon.remove(); }, false );
      }

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
      
      // Check if this is the last one processed. Actually the arrangement runs for 3 
      // times to ensure nothing goes wrong. This is lame.
      Html5AVCtrlNumLoad = (typeof Html5AVCtrlNumLoad == 'undefined') ? 1 : Html5AVCtrlNumLoad+1;
      if (Html5AVCtrlNumLoad >= videoElementLen-2)
      {
        Html5AVCtrlArrangePlayIcon();
        window.addEventListener('resize', Html5AVCtrlArrangePlayIcon, false);
      }
    }

    // On error, also check if this is the last one processed
    videoElement[i].addEventListener('error', function()
    {
      Html5AVCtrlNumLoad = (typeof Html5AVCtrlNumLoad == 'undefined') ? 1 : Html5AVCtrlNumLoad+1;
      if (Html5AVCtrlNumLoad >= videoElementLen-2)
      {
        Html5AVCtrlArrangePlayIcon();
        window.addEventListener('resize', Html5AVCtrlArrangePlayIcon, false);
      }
    }, true);
  }


  // Capture the video element on clicking or altering its control panel 
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

      // Click on the other part of the video, remove the play icon
			if (this.playIconElement != null)
			{
				this.playIconElement.style.height = 1.2* this.playIconElement.clientHeight + 'px';
				this.playIconElement.style.opacity = 0;
				this.playIconElement.addEventListener('webkitTransitionEnd', function()
				{ this.remove(); }, false );
			}

      Html5AVCtrlTogglePlay(this);
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
