<?php

// Provide a wiki method for syncing pageindex immediately
$FmtPV['$syncPageindexNow'] = 'syncPageindexNow()';
function syncPageindexNow()
{
  syncPageindex(true);
  Redirect("Main.SiteAdmin");
}

// Aux function for removing a folder & every thing within it recursively
function removeFolder($folder)
{
  if (is_Dir($folder) === false) { return; }

  $ignored = array('.', '..');
  foreach (scandir($folder) as $item)
  {
    if (in_array($item, $ignored)) { continue; }
    if (is_Dir("$folder/$item")) { removeFolder("$folder/$item"); }
    else { unlink("$folder/$item"); }
  }

  rmdir($folder);
}

// Reset pageindex file & folder.
$FmtPV['$resetPageindex'] = 'resetPageindex()';
function resetPageindex()
{
  global $pageindexTimeDir;
  removeFolder($pageindexTimeDir);

  initPageindex();
}

// Reconstruct pageindex by first deleting the current file and then performing an empty
// search.
function rebuildPageindexFile()
{
  global $PageIndexFile;
  if (file_exists($PageIndexFile)) { unlink($PageIndexFile); }

  $opt['action'] = 'search';
  MakePageList("Main.Homepage", $opt, 0, 1);

  global $sysLogFile;
  file_put_contents($sysLogFile, strftime('%Y%m%d_%H%M%S', time())." Pageindex rebuilt\n",  FILE_APPEND);
}

function getPageindexUpdateTime($pagename)
{
  global $pageindexTimeDir;
  $pagefile = "$pageindexTimeDir/$pagename";
  if (file_exists($pagefile)) { return filemtime($pagefile); }
  else { return 0; }
}

function setPageindexUpdateTime($pagename)
{
  global $pageindexTimeDir;
  file_put_contents("$pageindexTimeDir/$pagename", "");
}

// Reconstruct the whole pageindex stuff including the pagindex itself in case
// the local pageindex time stamp folder is missing
function initPageindex()
{
  global $pageindexTimeDir;
  if (!file_exists($pageindexTimeDir))
  {
    mkdir($pageindexTimeDir, 0770);
    global $localLastModFile, $pageindexSyncFile;
    file_put_contents($localLastModFile, "");
    file_put_contents($pageindexSyncFile, "");;
// DEBUG
    file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Init\n", FILE_APPEND);
    rebuildPageindexFile();
    return true;
  }
  else { return false; }
}

// The main pageindex sync routine; it periodically checks whether there is any 
// page whose pagesindex is not up to date. It can also identify which pages are
// modified "not locally", i.e., modified by another computer. In this case the
// pageindex are updated immediately.
function syncPageindex($flag = false)
{
  global $Now, $pageindexSyncInterval, $localLastModFile,
  $pageindexSyncFile, $WorkDir;

  // Since the local and cloud lastmod time are updated at the same time in normal cases,
  // a diff > 10 sec means that the cloud has been modified by someone else. Sync
  // the pageindex in this case. Otherwise, perform sync periodically.
  $localLastModTime = filemtime($localLastModFile);
  $cloudLastModTime = filemtime($WorkDir);
  $lastSyncTime = filemtime($pageindexSyncFile);

  // No need for syncing
  if (!$flag && !($cloudLastModTime - $localLastModTime > 10) && !($Now - $lastSyncTime >= $pageindexSyncInterval))
  { return; }

  // Update the pageindex sync timeStamp in case of a sync
  file_put_contents($pageindexSyncFile, "");

// DEBUG
  global $pageindexTimeDir;
  if ($cloudLastModTime - $localLastModTime > 10)
  { file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Syncing pageindex (cloud)\n", FILE_APPEND); }
  else
  { file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Syncing pageindex\n", FILE_APPEND); }

  // Determine the list of pages that should be synced
  $ignored = array('.', '..', '.htaccess', '.lastmod');
  $pagelist = array();
  foreach (scandir($WorkDir) as $pagename)
  {
    // Ignore not wiki-related pages
    if (in_array($pagename, $ignored)) { continue; }
    $pagemtime = filemtime("$WorkDir/$pagename");

    // page is not modified since last sync
    if ($pagemtime <= $lastSyncTime) { continue; }

    // its pageindex is up to date
    if ($pagemtime <= getPageindexUpdateTime($pagename)) { continue; }

    // Skip recentchanges pages
    if (strcasecmp(substr($pagename, -13), "recentchanges") === 0) { continue; }

    array_push($pagelist, $pagename);
  }

  if (count($pagelist) === 0) { return; }

  $pagelistStr = implode(",", $pagelist);

// DEBUG
  file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Fixing ".$pagelistStr."\n", FILE_APPEND);

  // Since the handlePageindex procedure is embedded in the builtin browsing/editing
  // procedure, we have to come up with a pagename that does not belong to the
  // "sensitive" pages which quickly get password locked. A newly generated page group
  // by default is not a sensitive page. That's why we have the RandomPwdWord() part.
//   $url = "http://localhost".$_SERVER['SCRIPT_NAME']."?n=".RandomPwdWord(10)."&updatePageIndex=$pagelistStr";

  // On 2nd thought, now we update sync timeStamp after the sync has actually been done.
  // We simply use the currently visited page as the request pagename since even if it's
  // locked, it will be unlocked very soon as it is being visited.
  global $pagename;
  $url = "http://localhost".$_SERVER['SCRIPT_NAME']."?n=$pagename&updatePageIndex=$pagelistStr";

  // Update pageindex. Note that there is a 2048 char limit to the url length
  if (strlen($url) > 2000)
  {
// DEBUG
    file_put_contents("$pageindexTimeDir/log.txt", "Too many pages. Perform a blocking pageindex update\n", FILE_APPEND);
    foreach ($pagelist as $pagename) { setPageindexUpdateTime($pagename); }
    Meng_PageIndexUpdate($pagelist);
  }
  else { post_async($url); }
}

// Detects async request for updating pageindex in the background
function updatePageindex()
{
  $pagelistStr = $_GET["updatePageIndex"];
  if (!isset($pagelistStr)) { return; }

  // The 1st case is explict update request from the client
  //     2nd case is due to page index sync process
  if ($pagelistStr === "1") { global $pagename; $pagelist = array($pagename); }
  else { $pagelist = explode(",", $pagelistStr); }

  foreach ($pagelist as $pagename)
  {
    // Double check if the page is indeed modified after the last pageindex update
    global $WorkDir;
    $pagemtime = filemtime("$WorkDir/$pagename");
    if ($pagemtime > getPageindexUpdateTime($pagename))
    {
// DEBUG
      global $pageindexTimeDir;
      file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Updating ".$pagename."\n", FILE_APPEND);

      // Meng. Record the pageindex update time for this page
      setPageindexUpdateTime($pagename);

      // Free riding the PostRecentChanges functionality here. It appears that the 2nd and
      // 3rd input parameters are not used at all in PostRecentChanges().
      PostRecentChanges($pagename, NULL, NULL);
    }
    // Its pageindex is already up to date, remove it from the list
    else
    {
// DEBUG
      global $pageindexTimeDir;
      file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." ".$pagename." already up to date\n", FILE_APPEND);

      $key = array_search($pagename, $pagelist);
      unset($pagelist[$key]);
    }
  }

  if (sizeof($pagelist) > 0)
  {
    Meng_PageIndexUpdate($pagelist);

    global $PageIndexFile;
    file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Size after update: ".round(filesize($PageIndexFile)/1000)." KB\n", FILE_APPEND);
  }

  exit;
}

// The pageindex handling procedures as a wrapped function.
function handlePageindex()
{
  if (initPageindex()) {}
  else
  {
    updatePageindex();
    syncPageindex();
  }
}


