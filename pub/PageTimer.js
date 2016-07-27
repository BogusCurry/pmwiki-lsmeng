/* 
 * A counter timer which redirects to an invalid URL consisting of only the pagename at
 * expiration. This serves as a simple mechanism of "hiding page". In addition, the timer
 * is able to detect computer sleep on resume. The user is directed to the logout url
 * automatically if the computer sleeps longer than a prespecified time duration.
 * 
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160725
 */

var PageTimer = 
{
  TIMER_EXP_DURATION: 0,
  STANDBY_LOGOUT_DURATION: 0,
  ScriptUrl: '',
  pagename: '',
  action: '',
  timer: 0,
  lastDiff: 0,
  hourInit: 0,
  minutesInit: 0,
  secondsInit: 0,
  
  // Counting down the timer by comparing the system clock and the last recorded time
  // instant.
	updateClock: function()
	{
	  // In case that the initialization is not completed, return immediately.
	  if (PageTimer.timer == 0) { return; }
	  
    var clock = new Date();
    var diff = PageTimer.timer - clock.getTime()/1000;
    
    // Check computer standby and logout
		if (PageTimer.lastDiff - diff >= PageTimer.STANDBY_LOGOUT_DURATION)
		{	
      window.location = PageTimer.ScriptUrl + '?n=CLICKLOGOUT' + PageTimer.pagename + '?action=' + PageTimer.action;
	    return;
		}

		PageTimer.lastDiff = diff;
		
    // Timer expires
		if (diff <= 0)
		{
		  window.location = 'http://' + PageTimer.pagename;
		  return;
		}

    diff = Math.round(diff);
		var hour = Math.floor(diff / 3600);
		diff -= hour*3600;
		var minutes = Math.floor(diff / 60);
		diff -= minutes*60;		
		var seconds = Math.round(diff);

		hour = hour < 10 ? "0" + hour : hour;
		minutes = minutes < 10 ? "0" + minutes : minutes;
		seconds = seconds < 10 ? "0" + seconds : seconds;
    
    document.querySelector('#ID_LOGOUTTIMER').textContent = hour +":" + minutes + ":" + seconds;
	},

  // Reset the timer.
  resetTimer: function()
  {
		document.querySelector('#ID_LOGOUTTIMER').textContent = PageTimer.hourInit + ":" + PageTimer.minutesInit + ":" + PageTimer.secondsInit;

		var clock = new Date();    
		PageTimer.timer = clock.getTime()/1000 + PageTimer.TIMER_EXP_DURATION;
  },
  
  init: function()
  {
		var hour = parseInt(PageTimer.TIMER_EXP_DURATION / 3600, 10);
		var minutes = parseInt((PageTimer.TIMER_EXP_DURATION-hour*3600) / 60, 10);
		var seconds = parseInt(PageTimer.TIMER_EXP_DURATION % 60, 10);

 		PageTimer.hourInit = hour < 10 ? "0" + hour : hour;
		PageTimer.minutesInit = minutes < 10 ? "0" + minutes : minutes;
		PageTimer.secondsInit = seconds < 10 ? "0" + seconds : seconds;
  
 	  PageTimer.resetTimer();
	  setInterval(PageTimer.updateClock, 1000);
  }
};

window.addEventListener('load', PageTimer.init, false);
//window.addEventListener('focus', PageTimer.updateClock, false);
window.addEventListener('input', PageTimer.resetTimer, false);