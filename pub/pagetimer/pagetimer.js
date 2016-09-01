/* 
 * A countdown timer which redirects to a designated URL on timer expiration. The URL to 
 * redirect defaults to the PmWiki logout page. The timer is written in a way such that
 * computer sleep can also be taken into account; on resuming from computer sleep, the 
 * timer immediately updates the correct remaining time and redirects if necessary.
 * The timer can be dragged and moved, and its position will be memorized.
 * 
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160726
 */

var PageTimer = 
{
  ExpDuration: 0,
  ExpDurationSleep: 0,
  RedirectUrl: '',
  timer: 0,
  lastDiff: 0,
  hourInit: 0,
  minInit: 0,
  secInit: 0,
  
  // Counting down the timer by comparing the system clock and the last recorded time
  // instant.
	updateClock: function()
	{
	  // In case that the initialization is not completed, return immediately.
	  if (PageTimer.timer == 0) { return; }
	  
    var clock = new Date();
    var diff = PageTimer.timer - clock.getTime()/1000;
    
    // Check computer standby and logout
		if (PageTimer.lastDiff - diff >= PageTimer.ExpDurationSleep)
		{	
      window.location = PageTimer.RedirectUrl;
	    return;
		}

		PageTimer.lastDiff = diff;
		
    // Timer expires
		if (diff <= 0)
		{
      window.location = PageTimer.RedirectUrl;
		  return;
		}

    // Update timer display
    diff = Math.round(diff);
		hour = Math.floor(diff/3600);
		diff -= hour*3600;
		min = Math.floor(diff/60);
		diff -= min*60;		
		sec = Math.round(diff);

		hour = hour<10 ? "0" + hour : hour;
		min = min<10 ? "0" + min : min;
		sec = sec<10 ? "0" + sec : sec;
    
    document.querySelector('#pageTimerID').textContent = hour +":" + min + ":" + sec;
	},

  // Reset the timer.
  resetTimer: function()
  {
		document.querySelector('#pageTimerID').textContent = PageTimer.hourInit + ":" + PageTimer.minInit + ":" + PageTimer.secInit;
		  
		var clock = new Date();    
		PageTimer.timer = clock.getTime()/1000 + PageTimer.ExpDuration;
  },
  
  init: function()
  {
    // Compute the hour/min/sec from the given timer exp duration
    var totSec = PageTimer.ExpDuration;
		var hour = Math.floor(totSec/3600);
		totSec -= hour*3600;
		var min = Math.floor(totSec/60);
		totSec -= min*60
		var sec = Math.floor(totSec);

 		PageTimer.hourInit = hour<10 ? '0' + hour : hour;
		PageTimer.minInit = min<10 ? '0' + min : min;
		PageTimer.secInit = sec<10 ? '0' + sec : sec;
  
 	  PageTimer.resetTimer();
	  setInterval(PageTimer.updateClock, 1000);
	  
    // Read from local storage to set the pagetimer position
    // If not set, or the position goes out of the visible area,
    // a default position is set.
    var top = localStorage.getItem('PageTimerTop');
		var left = localStorage.getItem('PageTimerLeft');
		if (top != null &&
		    parseInt(top)>0  && parseInt(top) <window.innerHeight &&
	      parseInt(left)>0 && parseInt(left)< window.innerWidth)
		{		
			document.getElementById('pageTimerID').style.top = top;
		  document.getElementById('pageTimerID').style.left = left;
		}
		else
		{
		  top = document.getElementById('pageTimerID').style.top = window.innerHeight-25+'px';
		  left = document.getElementById('pageTimerID').style.left = '10px';
		  
      localStorage.setItem('PageTimerTop', top);
      localStorage.setItem('PageTimerLeft', left);
		}
  }
};

window.addEventListener('load', PageTimer.init, false);
window.addEventListener('keydown', PageTimer.resetTimer, false);
window.addEventListener('click', PageTimer.resetTimer, false);

// Implement drag and move of the countdown timer
document.getElementById('pageTimerID').onmouseup = function()
{
  var top = this.style.top;
  var left = this.style.left;
  
	localStorage.setItem('PageTimerTop', top);
	localStorage.setItem('PageTimerLeft', left);
	window.onmousemove = '';
}

document.getElementById('pageTimerID').onmousedown = function(e)
{
  var mouseCoordX = e.clientX;
	var mouseCoordY = e.clientY;
								
	var imgCoordX = parseInt(this.style.left);
	var imgCoordY = parseInt(this.style.top);
	
	window.onmousemove = function(e)
	{
	  document.getElementById('pageTimerID').style.left = imgCoordX+e.clientX-mouseCoordX+'px';
		document.getElementById('pageTimerID').style.top  = imgCoordY+e.clientY-mouseCoordY+'px';
	};
	return false;
}