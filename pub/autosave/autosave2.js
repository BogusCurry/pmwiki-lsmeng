/**	Part of PmWiki AutoSave
 *	<http://www.pmwiki.org/wiki/Cookbook/AutoSave>
 *	Copyright 2009 Eemeli Aro <eemeli@gmail.com>
 *	Version: 2009-05-28
 */

  function startTimer(duration, display)
  {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? \"0\" + minutes : minutes;
        seconds = seconds < 10 ? \"0\" + seconds : seconds;

        display.textContent = minutes + \":\" + seconds;

        if (--timer < 0) {
            window.location = 'http://"."$_SERVER[REQUEST_URI]"."';
        }
    }, 1000);
  }
