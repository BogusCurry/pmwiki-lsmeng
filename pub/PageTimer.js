/* 
 * A counter timer which redirects to an invalid URL consisting of only the pagename at
 * expiration. This serves as a simple mechanism of "hiding page". In addition, the timer
 * is able to detect computer sleep on resume. The user is directed to the logout url
 * automatically if the computer sleeps longer than a prespecified time duration.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var PageTimer = 
{
  TIMER_EXP_DURATION: 0,
  STANDBY_LOGOUT_DURATION: 0,
  TIMER_UPDATE_TICK: 0,
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
    var diff = PageTimer.timer - Math.ceil(clock.getTime()/1000);

    // Check computer standby and logout
		if (PageTimer.lastDiff - diff >= PageTimer.STANDBY_LOGOUT_DURATION)
		{	
      window.location = PageTimer.ScriptUrl + '?n=CLICKLOGOUT' + PageTimer.pagename + '?action=' + PageTimer.action;
	    return;
		}

    // Timer expires
		if (diff <= 0)
		{
		  window.location = 'http://' + PageTimer.pagename;
		  return;
		}

		PageTimer.lastDiff = diff;
		  	
		hour = parseInt(diff / 3600, 10);
		minutes = parseInt((diff-hour*3600) / 60, 10);
		seconds = parseInt(diff % 60, 10);

		hour = hour < 10 ? "0" + hour : hour;
		minutes = minutes < 10 ? "0" + minutes : minutes;
		seconds = seconds < 10 ? "0" + seconds : seconds;
    
    display = document.querySelector('#ID_LOGOUTTIMER');	  
    display.textContent = hour +":" + minutes + ":" + seconds;
	},

  // Reset the timer.
  resetTimer: function()
  {
		var clock = new Date();    
		PageTimer.timer = Math.ceil(clock.getTime()/1000) + PageTimer.TIMER_EXP_DURATION;
		display = document.querySelector('#ID_LOGOUTTIMER');	  
		display.textContent = PageTimer.hourInit + ":" + PageTimer.minutesInit + ":" + PageTimer.secondsInit;
  },
  
  init: function()
  {
 		PageTimer.lastDiff = PageTimer.TIMER_EXP_DURATION;

		hour = parseInt(PageTimer.TIMER_EXP_DURATION / 3600, 10);
		minutes = parseInt((PageTimer.TIMER_EXP_DURATION-hour*3600) / 60, 10);
		seconds = parseInt(PageTimer.TIMER_EXP_DURATION % 60, 10);

 		PageTimer.hourInit = hour < 10 ? "0" + hour : hour;
		PageTimer.minutesInit = minutes < 10 ? "0" + minutes : minutes;
		PageTimer.secondsInit = seconds < 10 ? "0" + seconds : seconds;

 	  PageTimer.resetTimer();
	  setInterval(PageTimer.updateClock, PageTimer.TIMER_UPDATE_TICK*1000);
  }
};

window.addEventListener('load', PageTimer.init, false);

// On focus, check for logout and shutdown immediately in addition to resetting the timer
window.addEventListener('focus', PageTimer.updateClock, false);

//window.addEventListener('focus', PageTimer.resetTimer, false);
//window.addEventListener('wheel', PageTimer.resetTimer, false);
//window.addEventListener('click', PageTimer.resetTimer, false);
window.addEventListener('input', PageTimer.resetTimer, false);
