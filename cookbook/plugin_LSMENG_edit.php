<?php

// Return true on success.
// Abort on error.
function copyWait($oldFile, $newFile, $N_TRY=3)
{
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  $nTry = 1;
  while (1)
  {
    if (file_exists($newFile)) { unlink($newFile); }

    if (@copy($oldFile,$newFile)) { return true; }

    $nTry++;
    if ($nTry>$N_TRY) { Abort("Retry limit reached in copyWait() for $oldFile!"); }

    usleep(rand($minWaitMicroSec,$maxWaitMicroSec));
  }
}

// Return true on success.
// Abort on error.
function renameWait($oldFile, $newFile, $N_TRY=3)
{
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  $nTry = 1;
  while (1)
  {
    if (@rename($oldFile,$newFile) === true) { return true; }

    $nTry++;
    if ($nTry>$N_TRY) { Abort("Retry limit reached in renameWait() for $oldFile!"); }

    usleep(rand($minWaitMicroSec,$maxWaitMicroSec));
  }
}

// Preserve a copy of the given page if the specified time period since the last time 
// the copy was created has elapsed. If "$pagefile" is null, the backup is deleted
function preservePageBackup($pagename, $pagefile, $backupDelayHour=6)
{
  // check the backup folder
  $dir = 'wiki.d/backup';
  global $Now;
  if (file_exists("$dir/$pagename"))
  {
    // Get the time stamp in the remaining part of the file name
    $timeStamp = filemtime("$dir/$pagename");

    // Compare Now with the time stamp, if a period of $hour has passed, write backup
    if ((($Now - $timeStamp) / 3600) > $backupDelayHour)
    {
      @unlink("$dir/$backupPage");
      return copy($pagefile, "$dir/$pagename");
    }
    else { return true; }
  }

  // No existing backup for the file
  if ($pagefile === null) { return true; }
  else { return copy($pagefile, "$dir/$pagename"); }
}
