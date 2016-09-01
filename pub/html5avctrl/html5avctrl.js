/* 
 * This recipe enables youtube-like keyboard and mouse control of HTML5 video and audio. 
 * Click on the control panel or the image to gain control over a video or audio. Click to
 * toggle play/pause; double click to toggle fullscreen. Press space to toggle
 * play/pause. Press left/right keys to go backward/forward 5 seconds. Press 
 * up/dn to change volume. Press the number keys for a quick jump. Pressing f to toggle
 * fullscreen. 
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160804
 */

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
  var audioElement = document.getElementsByTagName('audio');
  for (var i = 0; i < videoElement.length + audioElement.length; i++) {
    var element = (i >= videoElement.length) ? audioElement[i - videoElement.length] : videoElement[i];
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
      Html5AVCtrlTogglePlay(this);
    }
    if (i < videoElement.length) {
			element.ondblclick = function() {
  	     Html5AVCtrlElement = this;
				 Html5AVCtrlToggleFC(Html5AVCtrlElement);
      }
    }
  }

  // Add click and keydown events only if there are html5 video audio elements found
  if (videoElement.length + audioElement.length > 0) {
    // On mouse click, get the clicked element
    // if it's not an audio/video, unset the captured audio/video element
    window.addEventListener('click', function(e) {
      var clickedElement = e.target;
      if (clickedElement.tagName.toLowerCase() != 'video' && clickedElement.tagName.toLowerCase() != 'audio') {
        delete(Html5AVCtrlElement);
      }
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
        // F key: toggle fullscreen
        else if (e.keyCode == 70 && Html5AVCtrlElement.tagName.toLowerCase() == 'video') {
          e.preventDefault();
          Html5AVCtrlToggleFC(Html5AVCtrlElement);
        }
      }
    }, false);
  }
}, false);
