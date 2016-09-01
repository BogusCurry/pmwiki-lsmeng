<?php if (!defined('PmWiki')) exit();

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
 * Version 20160729
 */

$RecipeInfo['Pagetimer']['Version'] = '20160729';

// Countdown timer for URL redirect. Default to 10 minutes.
SDV($PageTimerExpDuration, 600);

// Countdown timer for URL redirect in case the compute goes to sleep. Default to 5 minutes.
SDV($PageTimerExpDurationSleep, 300);

// The URL to redirect after the timer expires. Default to the Pmwiki logout page.
SDV($PageTimerRedirectUrl, "$ScriptUrl?n=$pagename&action=logout");

// Control the font size of the timer.
SDV($PageTimerFontSize, '14px');

$HTMLHeaderFmt['pagetimer'] = "
  <div id='pageTimerID' style='position:fixed; cursor:move; z-index:9; font-size:$PageTimerFontSize'></div>
  <script type='text/javascript' src='$PubDirUrl/pagetimer/pagetimer.js'></script>
	<script type='text/javascript'>
	PageTimer.ExpDuration = $PageTimerExpDuration;
	PageTimer.ExpDurationSleep = $PageTimerExpDurationSleep;
	PageTimer.RedirectUrl = '$PageTimerRedirectUrl';
	</script>";
