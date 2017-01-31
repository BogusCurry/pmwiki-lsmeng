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
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170127
 */

var pageTimer = 
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
	  if (pageTimer.timer == 0) { return; }
	  
    var clock = new Date();
    var diff = pageTimer.timer - clock.getTime()/1000;
    
    // Check computer standby and logout
		var timeDiff = pageTimer.lastDiff - diff;
		if (timeDiff >= pageTimer.STANDBY_LOGOUT_DURATION)
		{	
			// For debugging
			var clock = new Date();
			var year = clock.getFullYear(), mon = clock.getMonth()+1, date = clock.getDate(),
	    hour = clock.getHours(), min = clock.getMinutes(), sec = clock.getSeconds();
      var timeStr = year.toString()+(mon<10?'0'+mon:mon)+(date<10?'0'+date:date)+'_'+
	       (hour<10?'0'+hour:hour)+(min<10?'0'+min:min)+(sec<10?'0'+sec:sec);
	    var msg = 'Standby for '+Math.round(timeDiff)+' seconds @ '+timeStr;
      localStorage.setItem('StandbyLogout', msg);
      
      window.location = pageTimer.ScriptUrl + '?n=CLICKLOGOUT' + pageTimer.pagename + '?action=' + pageTimer.action;
	    return;
		}
		// For debugging purpose
		else if (timeDiff > 5)
		{
		  var clock = new Date();
			var year = clock.getFullYear(), mon = clock.getMonth()+1, date = clock.getDate(),
	    hour = clock.getHours(), min = clock.getMinutes(), sec = clock.getSeconds();
      var timeStr = year.toString()+(mon<10?'0'+mon:mon)+(date<10?'0'+date:date)+'_'+
	       (hour<10?'0'+hour:hour)+(min<10?'0'+min:min)+(sec<10?'0'+sec:sec);
		  var msg = 'Standby for '+Math.round(timeDiff)+' seconds @ '+timeStr;
		  console.log(msg);
		}

		pageTimer.lastDiff = diff;
		
    // Timer expires
		if (diff <= 0)
		{
		  window.location = 'http://' + pageTimer.closePagename;
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
		if (document.querySelector('#ID_LOGOUTTIMER'))
		{ document.querySelector('#ID_LOGOUTTIMER').textContent = pageTimer.hourInit + ":" + pageTimer.minutesInit + ":" + pageTimer.secondsInit; }

		var clock = new Date();    
		pageTimer.timer = clock.getTime()/1000 + pageTimer.TIMER_EXP_DURATION;
  },
  
  init: function()
  {
		var hour = parseInt(pageTimer.TIMER_EXP_DURATION / 3600, 10);
		var minutes = parseInt((pageTimer.TIMER_EXP_DURATION-hour*3600) / 60, 10);
		var seconds = parseInt(pageTimer.TIMER_EXP_DURATION % 60, 10);

 		pageTimer.hourInit = hour < 10 ? "0" + hour : hour;
		pageTimer.minutesInit = minutes < 10 ? "0" + minutes : minutes;
		pageTimer.secondsInit = seconds < 10 ? "0" + seconds : seconds;
  
 	  pageTimer.resetTimer();
	  setInterval(pageTimer.updateClock, 1000);
  }
};

window.addEventListener('load', pageTimer.init, false);
//window.addEventListener('focus', pageTimer.updateClock, false);
// window.addEventListener('input', pageTimer.resetTimer, false);
window.addEventListener('keydown', pageTimer.resetTimer, false);
window.addEventListener('scroll', pageTimer.resetTimer, false);