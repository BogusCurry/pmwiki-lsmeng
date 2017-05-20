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
 * Version 20170520
 */

"use strict";

var html5AVCtrl = html5AVCtrl || (function()
{
  /* Dependencies */

  /* Private properties */
  var _html5Element;
  var _eventCallBack;
  var _isVideoLoad = false;

  // Arrange the play icon so that it situates at the center of the given video element.
  function arrangePlayIcon(element)
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
  function toggleFC(element)
  {
    if (document.webkitFullscreenElement !== null &&
    document.webkitFullscreenElement.tagName == 'VIDEO')
    { document.webkitFullscreenElement.webkitExitFullscreen(); }
    else { element.webkitRequestFullscreen(); }
  }

  // Toggle between play & pause for a video or audio element
  function togglePlay(element)
  {
    if (element.paused) { element.play(); }
    else { element.pause(); }
  }

  // A routine for playing the video element for the very 1st time; removing its play icon
  // and then keep polling until the video actually starts
  function removeIconAndPlay(element)
  {
    _html5Element = element;
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

  // Provide a subscribe method for registering callback on certain events.
  function subscribe(event, callback)
  {
    if (_eventCallBack[event] !== undefined)
    {
      if (typeof callback !== "function")
      { throw "Unexpected param: " + callback; return; }

      _eventCallBack[event].push(callback);
      return callback;
    }
    else { throw "Unexpected event: " + event; }
  }

  // Return true if all the videos are loaded; false otherwise
  function isVideoLoad() { return _isVideoLoad; }

  // Declare the onmetadata loaded routine
  function loadVideoMetadataOneByOne(element)
  {
    var videoName = element.children[0].src;
    console.log(videoName.slice(videoName.lastIndexOf("/")+1) + " meta loaded");

    // Use the existence of the playIconElement to prevent running this twice
    // This is needed for a workaround of failing to play video occasionally in Chrome
    // with metadata preloaded
    if (element.playIconElement) { return; }

    element.poster = '';

    element.style.width = Math.round(element.clientHeight*element.videoWidth/element.videoHeight) + 'px';

    //     element.play(); element.pause();
    //     setTimeout(function() { _html5Element = undefined; }, 0);

    // On load remove the control bar
    element.controls = false;

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
    element.playIconElement = playIcon;

    // Click on the play icon, fade out
    playIcon.videoElement = element;
    playIcon.onclick = function() { removeIconAndPlay(playIcon.videoElement); }

    // Set visual effects for the play icons
    element.onmouseover = function()
    {
      playIcon.style.opacity = 0.8;
      playIcon.style.height = 1.1*playIcon.naturalHeight + 'px';
    }
    element.onmouseout = function()
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

    arrangePlayIcon(element); // Add its play icon

    // If there is a next video element, load its metadata and process on loaded
    if (element.nextVideoElement)
    {
      element.nextVideoElement.preload = 'metadtata';
      element.nextVideoElement.onloadedmetadata = function() { loadVideoMetadataOneByOne(this); }
    }
    // This is the last video element
    else
    {
      _isVideoLoad = true;

      // "Video load complete" is open for registering callback
      // Process them here
      if (_eventCallBack["videoLoad"].length)
      { _eventCallBack["videoLoad"].forEach(function(fn) { fn(); }); }
    }
  }

  function init()
  {
    // Queue for callback functions on saved event
    _eventCallBack = { "videoLoad": [] };

    // Load video
    var videoElement = document.getElementsByTagName('video');
    var videoElementLen = videoElement.length;
    if (videoElementLen > 0)
    {
      for (var i = 0; i < videoElementLen; i++)
      {
        if (i === videoElementLen - 1) {  }
        else { videoElement[i].nextVideoElement = videoElement[i + 1]; }
      }

      // Load the metadata for the very first video element
      videoElement[0].preload = 'metadata';
      videoElement[0].onloadedmetadata = function() { loadVideoMetadataOneByOne(this); }

      // On window resize, adjust the play icon for all the video elements
      window.addEventListener('resize', function()
      {
        Array.prototype.forEach.call(videoElement, function(element)
        { arrangePlayIcon(element); });
      });
    }
    else { _isVideoLoad = true; }
  }

  document.addEventListener('DOMContentLoaded', init);

  // On mouse click, get the clicked element
  // If it's an av element, initialize it with my recipes
  window.addEventListener('click', function(e)
  {
    var element = e.target;

    // If the clicked element is not an av element or a play icon
    if (element.tagName != 'VIDEO' && element.tagName != 'AUDIO' && !element.videoElement)
    { _html5Element = undefined; }

    // Else if it's uinitialized
    else if (element.isInit === undefined)
    {
      // If it's a play icon, replace it with the video element and remove the icon
      if (element.videoElement)
      {
        element = element.videoElement;
        removeIconAndPlay(element);
      }

      if (element.tagName == "VIDEO") { element.controls = true; }

      element.onplay = function() { _html5Element = this; }
      element.onpause = function() { _html5Element = this; }
      element.onseeking = function() { _html5Element = this; }
      element.onseeking = function() { _html5Element = this; }
      element.onvolumechange = function() { _html5Element = this; }
      element.onclick = function()
      {
        _html5Element = this;

        // Click on the other part of the video, remove the play icon & play
        if (this.playIconElement) { removeIconAndPlay(this); }
        else { togglePlay(this); }
      }
      element.onclick();

      if (element.tagName === "VIDEO")
      {
        element.ondblclick = function()
        {
          _html5Element = this;
          toggleFC(_html5Element);
        }
      }

      element.isInit = true;
    }
  });

  window.addEventListener('keydown', function(e)
  {
    // Deal with the case where fullscreen is fired right at the start
    if (document.webkitFullscreenElement !== null &&
    document.webkitFullscreenElement.tagName == 'VIDEO')
    { _html5Element = document.webkitFullscreenElement; }

    // Handle various keyboard commands if there is a captured audio/video element
    if (_html5Element)
//     if (_html5Element && (_html5Element.tagName == 'VIDEO' || _html5Element.tagName == 'AUDIO'))
    {
      // Space key: toggle play
      if (e.keyCode == 32)
      {
        e.preventDefault();
        togglePlay(_html5Element);
      }
      // Left key: backward 5 sec
      else if (e.keyCode == 37)
      {
        e.preventDefault();
        _html5Element.currentTime -= 5;
      }
      // Right key: forward 5 sec
      else if (e.keyCode == 39)
      {
        e.preventDefault();
        _html5Element.currentTime += 5;
      }
      // Up key: volume up
      else if (e.keyCode == 38)
      {
        e.preventDefault();
        _html5Element.volume = Math.min(_html5Element.volume + 0.1, 1);
      }
      // Dn key: volume down
      else if (e.keyCode == 40)
      {
        e.preventDefault();
        _html5Element.volume = Math.max(_html5Element.volume - 0.1, 0);
      }
      // Number key: jump to sections
      else if (48 <= e.keyCode && e.keyCode <= 57)
      {
        e.preventDefault();
        var numKey = e.keyCode - 48;
        _html5Element.currentTime = _html5Element.duration / 10 * numKey;
      }

      // J: Scroll into view the current captured element
      else if (e.keyCode == 74)
      {
        e.preventDefault();
        _html5Element.scrollIntoView(true);
      }

      // F: toggle fullscreen
      else if (e.keyCode == 70 && _html5Element.tagName == 'VIDEO')
      {
        e.preventDefault();
        toggleFC(_html5Element);
      }
    }
  });

  // Reveal public API
  var returnObj =
  {
    subscribe: subscribe,
    isVideoLoad: isVideoLoad
  };
  return returnObj;
})();
