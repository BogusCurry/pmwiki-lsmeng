/* 
 * A counter timer which sends an explicit request to lock page on timer expiration. 
 * In addition, the timer
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
 * Version 20170617
 */

"use strict";

var pageTimer = pageTimer || (function()
{
  /* Dependencies */
  // window.AS;
  // window.pageindexUpdater;

  /* Private properties */

  var _TIMER_EXP_DURATION = 0;
  var _timer = 0;
  var _timerID = 0;
  var _lastDiff = 0;
  var _hourInit = 0;
  var _minutesInit = 0;
  var _secondsInit = 0;

  // Counting down the timer by comparing the system clock and the last recorded time
  // instant.
  function updateClock()
  {
    var clock = new Date();
    var diff = _timer - clock.getTime()/1000;

    // Check computer standby and logout
    var timeDiff = _lastDiff - diff;
    if (timeDiff >= pageTimer.STANDBY_LOGOUT_DURATION)
    {
      // For debugging
      timeDiff = Math.round(timeDiff);
      var clock = new Date();
      var year = clock.getFullYear(), mon = clock.getMonth()+1, date = clock.getDate(),
      hour = clock.getHours(), min = clock.getMinutes(), sec = clock.getSeconds();
      var timeStr = year.toString()+(mon<10?'0'+mon:mon)+(date<10?'0'+date:date)+'_'+
      (hour<10?'0'+hour:hour)+(min<10?'0'+min:min)+(sec<10?'0'+sec:sec);
      var msg = 'Standby for '+timeDiff+' seconds @ '+timeStr+" on "+window.pmwiki.pagename+" while "+window.pmwiki.action;
      localStorage.setItem('StandbyLogout', msg);

      window.location = pageTimer.logoutUrl + '?pageTimer=true&msg=' + msg;
      return;
    }

    // Timer expires
    if (Math.round(diff) < 0)
    { window.location = 'http://' + pageTimer.closePagename; }
    else
    {
      _lastDiff = diff;

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
    }
  }

  // Reset the timer.
  function resetTimer()
  {
    if (document.querySelector('#ID_LOGOUTTIMER'))
    { document.querySelector('#ID_LOGOUTTIMER').textContent = _hourInit + ":" + _minutesInit + ":" + _secondsInit; }

    var clock = new Date();
    _timer = clock.getTime()/1000 + pageTimer.TIMER_EXP_DURATION;
  }

  function init()
  {
// DEBUG
    if (pageTimer.TIMER_EXP_DURATION == 0 || pageTimer.STANDBY_LOGOUT_DURATION == 0)
    { alert("TIMER BUG"); }

    var hour = parseInt(pageTimer.TIMER_EXP_DURATION / 3600, 10);
    var minutes = parseInt((pageTimer.TIMER_EXP_DURATION-hour*3600) / 60, 10);
    var seconds = parseInt(pageTimer.TIMER_EXP_DURATION % 60, 10);

    _hourInit = hour < 10 ? "0" + hour : hour;
    _minutesInit = minutes < 10 ? "0" + minutes : minutes;
    _secondsInit = seconds < 10 ? "0" + seconds : seconds;

    resetTimer();
    _timerID = setInterval(updateClock, 1000);
  }

  document.addEventListener('DOMContentLoaded', init);

  // If the module Autosave is included, this is editing
  if (window.AS)
  {
    AS.subscribe("saved", (function()
    {
      // If the module pageindexUpdater is included, set a timer for requesting
      // pageindex update on saved event
      if (!window.pageindexUpdater) { return function () { resetTimer(); } }
      else
      {
        var timerID;

        return function()
        {
          // On saving, update the shutdown timer as the server keeps its timer depending on
          // the saving activity. The timer value shown is then in line with the server's one
          resetTimer();

          // Right before the server restricts page access (logout timer is set to be the same
          // as the counter timer), perform a pageindex update
          if (timerID) { clearTimeout(timerID); }
          timerID = setTimeout(function()
          {
            pageindexUpdater.requestPageindexUpdate();
          }, (pageTimer.TIMER_EXP_DURATION - 5)*1000);
        };
      }
    })());
  }
  // Else this is browsing. Update the shutdown timer on any user activity
  else
  {
    window.addEventListener('click', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
  }

  return {};
})();
