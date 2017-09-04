<?php if (!defined('PmWiki')) exit();
##  This is a sample config.php file.  To use this file, copy it to
##  local/config.php, then edit it for whatever customizations you want.
##  Also, be sure to take a look at http://www.pmichaud.com/wiki/Cookbook
##  for more details on the types of customizations that can be added
##  to PmWiki.

##  $WikiTitle is the name that appears in the browser's title bar.
$WikiTitle = 'PmWiki';

##  $ScriptUrl is your preferred URL for accessing wiki pages
##  $PubDirUrl is the URL for the pub directory.
# $ScriptUrl = 'http://www.mydomain.com/path/to/pmwiki.php';
# $PubDirUrl = 'http://www.mydomain.com/path/to/pub';

##  If you want to use URLs of the form .../pmwiki.php/Group/PageName
##  instead of .../pmwiki.php?p=Group.PageName, try setting
##  $EnablePathInfo below.  Note that this doesn't work in all environments,
##  it depends on your webserver and PHP configuration.  You might also
##  want to check http://www.pmwiki.org/wiki/Cookbook/CleanUrls more
##  details about this setting and other ways to create nicer-looking urls.
$EnablePathInfo = 1;

// Meng. The default behavior of opening the homepage for empty url is not allowed.
// Explicitly redirect it to the homepage.
// if ($pagename === "") { Redirect("Main/HomePage".$actionStr); }

## $PageLogoUrl is the URL for a logo image -- you can change this
## to your own logo if you wish.
# $PageLogoUrl = "$PubDirUrl/skins/pmwiki/pmwiki-32.gif";

## If you want to have a custom skin, then set $Skin to the name
## of the directory (in pub/skins/) that contains your skin files.
## See PmWiki.Skins and Cookbook.Skins.
$Skin = "pmwiki_gray";

## You'll probably want to set an administrative password that you
## can use to get into password-protected pages.  Also, by default
## the "attr" passwords for the PmWiki and Main groups are locked, so
## an admin password is a good way to unlock those.  See PmWiki.Passwords
## and PmWiki.PasswordsAdmin.
#$DefaultPasswords['admin'] = crypt('secret');

##  PmWiki comes with graphical user interface buttons for editing;
##  to enable these buttons, set $EnableGUIButtons to 1.
# $EnableGUIButtons = 1;

##  If you want uploads enabled on your system, set $EnableUpload=1.
##  You'll also need to set a default upload password, or else set
##  passwords on individual groups and pages.  For more information
##  see PmWiki.UploadsAdmin.
$EnableUpload = 1;
$EnableUploadOverwrite = 1;
$DefaultPasswords['upload'] = '';

##  Setting $EnableDiag turns on the ?action=diag and ?action=phpinfo
##  actions, which often helps the PmWiki authors to troubleshoot
##  various configuration and execution problems.
# $EnableDiag = 1;                         # enable remote diagnostics

##  By default, PmWiki doesn't allow browsers to cache pages.  Setting
##  $EnableIMSCaching=1; will re-enable browser caches in a somewhat
##  smart manner.  Note that you may want to have caching disabled while
##  adjusting configuration files or layout templates.
# $EnableIMSCaching = 1;                   # allow browser caching

##  Set $SpaceWikiWords if you want WikiWords to automatically
##  have spaces before each sequence of capital letters.
# $SpaceWikiWords = 1;                     # turn on WikiWord spacing

##  Set $LinkWikiWords if you want to allow WikiWord links.
# $LinkWikiWords = 1;                      # enable WikiWord links

##  If you want only the first occurrence of a WikiWord to be converted
##  to a link, set $WikiWordCountMax=1.
# $WikiWordCountMax = 1;                   # converts only first WikiWord
# $WikiWordCountMax = 0;                   # another way to disable WikiWords

##  The $WikiWordCount array can be used to control the number of times
##  a WikiWord is converted to a link.  This is useful for disabling
##  or limiting specific WikiWords.
# $WikiWordCount['PhD'] = 0;               # disables 'PhD'
# $WikiWordCount['PmWiki'] = 1;            # convert only first 'PmWiki'

##  By default, PmWiki is configured such that only the first occurrence
##  of 'PmWiki' in a page is treated as a WikiWord.  If you want to
##  restore 'PmWiki' to be treated like other WikiWords, uncomment the
##  line below.
# unset($WikiWordCount['PmWiki']);

##  If you want to disable WikiWords matching a pattern, you can use
##  something like the following.  Note that the first argument has to
##  be different for each call to Markup().  The example below disables
##  WikiWord links like COM1, COM2, COM1234, etc.
# Markup('COM\d+', '<wikilink', '/\\bCOM\\d+/', "Keep('$0')");

##  $DiffKeepDays specifies the minimum number of days to keep a page's
##  revision history.  The default is 3650 (approximately 10 years).
$DiffKeepDays=36500;

## By default, viewers are able to see the names (but not the
## contents) of read-protected pages in search results and
## page listings.  Set $EnablePageListProtect to keep read-protected
## pages from appearing in search results.
// Meng. That's weird. The abovementioned protection seems to be enabled by default. 
// Disable it since listing the page names is fine for me.
$EnablePageListProtect = 1;

// Meng. Exclude the sidebar from search results
$SearchPatterns['default'][] = '!^Site\.SideBar$!';
// Meng. Exclude RecentChanges pages from search results
$SearchPatterns['default'][] = '!\\.(All)?RecentChanges$!';

##  The refcount.php script enables ?action=refcount, which helps to
##  find missing and orphaned pages.  See PmWiki.RefCount.
# if ($action == 'refcount') include_once('scripts/refcount.php');

##  The feeds.php script enables ?action=rss, ?action=atom, ?action=rdf,
##  and ?action=dc, for generation of syndication feeds in various formats.
# if ($action == 'rss') include_once('scripts/feeds.php');   # RSS 2.0
# if ($action == 'atom') include_once('scripts/feeds.php');  # Atom 1.0
# if ($action == 'dc') include_once('scripts/feeds.php');    # Dublin Core
# if ($action == 'rdf') include_once('scripts/feeds.php');   # RSS 1.0

##  PmWiki allows a great deal of flexibility for creating custom markup.
##  To add support for '*bold*' and '~italic~' markup (the single quotes
##  are part of the markup), uncomment the following lines.
##  (See PmWiki.CustomMarkup and the Cookbook for details and examples.)
# Markup("'~", "inline", "/'~(.*?)~'/", "<i>$1</i>");        # '~italic~'
# Markup("'*", "inline", "/'\\*(.*?)\\*'/", "<b>$1</b>");    # '*bold*'

##  If you want to have to approve links to external sites before they
##  are turned into links, uncomment the line below.  See PmWiki.UrlApprovals.
##  Also, setting $UnapprovedLinkCountMax limits the number of unapproved
##  links that are allowed in a page (useful to control wikispam).
# include_once('scripts/urlapprove.php');
# $UnapprovedLinkCountMax = 10;

##  The following lines make additional editing buttons appear in the
##  edit page for subheadings, lists, tables, etc.
# $GUIButtons['h2'] = array(400, '\\n!! ', '\\n', '$[Heading]',
#                     '$GUIButtonDirUrlFmt/h2.gif"$[Heading]"');
# $GUIButtons['h3'] = array(402, '\\n!!! ', '\\n', '$[Subheading]',
#                     '$GUIButtonDirUrlFmt/h3.gif"$[Subheading]"');
# $GUIButtons['indent'] = array(500, '\\n->', '\\n', '$[Indented text]',
#                     '$GUIButtonDirUrlFmt/indent.gif"$[Indented text]"');
# $GUIButtons['outdent'] = array(510, '\\n-<', '\\n', '$[Hanging indent]',
#                     '$GUIButtonDirUrlFmt/outdent.gif"$[Hanging indent]"');
# $GUIButtons['ol'] = array(520, '\\n# ', '\\n', '$[Ordered list]',
#                     '$GUIButtonDirUrlFmt/ol.gif"$[Ordered (numbered) list]"');
# $GUIButtons['ul'] = array(530, '\\n* ', '\\n', '$[Unordered list]',
#                     '$GUIButtonDirUrlFmt/ul.gif"$[Unordered (bullet) list]"');
# $GUIButtons['hr'] = array(540, '\\n----\\n', '', '',
#                     '$GUIButtonDirUrlFmt/hr.gif"$[Horizontal rule]"');
# $GUIButtons['table'] = array(600,
#                       '||border=1 width=80%\\n||!Hdr ||!Hdr ||!Hdr ||\\n||     ||     ||     ||\\n||     ||     ||     ||\\n', '', '',
#                     '$GUIButtonDirUrlFmt/table.gif"$[Table]"');

# Include traditional chinese language
include_once("$FarmD/scripts/xlpage-utf-8.php");
# Apply Chinese to link names
//XLPage('zhtw','PmWikiZhTw.XLPage');

/****************************************************************************************/
// Meng. PHP related configurations/functions.

// Set the station name and path for public wiki.d
// On MAC, it appears the environment variable is not working.
if ($AuthorLink == 'MBA') { $WorkDir = '/Users/Shared/Dropbox/pmwiki/wiki.d'; }
else if ($AuthorLink == 'MBP') { $WorkDir = '/Users/Shared/Dropbox/pmwiki/wiki.d'; }
else if ($AuthorLink == 'sam_meng_w7n') { $WorkDir = 'D:\Dropbox\pmwiki\wiki.d'; }

if (!file_exists("$WorkDir"))
{ Abort("Create a folder named \"wiki.d\" following the specified path \"$WorkDir\"!"); }

// See if local wiki.d folder exists.
if (!file_exists("wiki.d"))
{
  if (mkdir("wiki.d") === false)
  { Abort("Create a folder named \"wiki.d\" under the folder pmwiki!"); }
  // Note that the Owner and Group of the foleder created by Apache is assumed to be
  // both "_www". For ease of file operations (read/copy/paste) by the account user,
  // add your account to the Group "_www".
  // If $WorkDir is the local wiki.d, the permission of wiki.d has to be rwx by user _www
  if (chmod("wiki.d", 0370) === false)
  { Abort("Permission change for \"wiki.d\" failed!"); }
}

// See if local wiki.d backup folder exists.
if (!file_exists("wiki.d/backup"))
{
  if (mkdir("wiki.d/backup") === false)
  { Abort("Create a folder named \"backup\" under local folder \"wiki.d\"!"); }
  if (chmod("wiki.d/backup", 0770) === false)
  { Abort("Permission change for \"wiki.d/backup\" failed!"); }
}

/*
$homeSSID = "Sam Base";
$currentSSID = shell_exec("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'");
$isAtHome = ($UrlScheme == "http" && trim($currentSSID) == trim($homeSSID)) ? 1 : 0;
$isAtHome = 0;
*/

$emailAddress1 = "f95942117@gmail.com";
$emailAddress2 = "lsmeng@ece.gatech.edu";

// Idle timer duration (sec) for logging out & shutting down the site.
$siteLogoutIdleDuration = 7200;
// Idle timer duration (sec) for locking sensitive pages.
$pageLockIdleDuration = 1200;
// Php login password. Have to be correct at the $pwRetryLimit th time
$pwRetryLimit = 3;

// Logout will be triggered by the pageTimer.js module after the computer enters standby
// longer than this duration (sec).
$standbyLogoutDuration = 300;

// Construct a system log file
$sysLogFile = "wiki.d/systemLog.txt";
if (!file_exists($sysLogFile))
{
  file_put_contents($sysLogFile, strftime('%Y%m%d_%H%M%S', time())." Init\n",  FILE_APPEND);
}

// Update the page history and store the difference if the following time period has
// elapsed since last editing.
$pageHistoryUpdateInterval = 3600;

// Pageindex related config
$pageindexTimeDir = "wiki.d/pageindex";
$localLastModFile = "$pageindexTimeDir/.localLastmod";
$pageindexSyncFile = "$pageindexTimeDir/.lastsync";
$pageindexSyncInterval = 3600; // The interval for checking all the pages to keep their pageindex up to date.
require_once("$FarmD/cookbook/pageindex.php");

// If set to 1, unencrypted page files will be encrypted on editing/viewing.
// If set to 0,   encrypted page files will be decrypted on editing/viewing.
// To encrypt/decrypt all the pages at once, simply perform a search for " ".
$EnableEncryption = 1;
require_once("$FarmD/cookbook/encrypt.php");

// General functions.
require_once("$FarmD/cookbook/plugin_LSMENG_general.php");

/************************DO NOT LOAD THE FOLLOWING IF PAGE LOCKED************************/
if (strcasecmp(substr($pagename, 0, 4), "LOCK") === 0) { return; }

if ($action === "browse") { $isBrowse = true; } else { $isBrowse = false; }
if ($action === "edit") { $isEdit = true; } else { $isEdit = false; }

// Functions related to the browse/edit/diff action.
if ($isBrowse)
{
  // The default image size and enlarged size on click.
  $imgHeightPx = 330;
  require_once("$FarmD/cookbook/plugin_LSMENG_browse.php");
}

else if ($action === "diff") { require_once("$FarmD/cookbook/plugin_LSMENG_diff.php"); }

// Paths for images
$PhotoPub = preg_replace("/[\/\\\]wiki\.d/i", "/uploads", $WorkDir);
$Photo = preg_replace("/\/$/", '', $_SERVER["DIARY_PHOTO_PATH"]);

// Functions related to the diary pages.
if (isDiaryPage() !== 0)
{
  global $PubDirUrl;
  $diaryImgDirURL = preg_replace("/\/pub$/i", '/photo/', $PubDirUrl);
  require_once("$FarmD/cookbook/handleDiary.php");
}
// Functions related to the runCode page.
else if (preg_match("/Main[\.\/]Runcode/i", $pagename))
{
  $runCodePath = "pub/runCode";
  require_once("$FarmD/cookbook/runCode.php");
}

// Max allowable upload size in bytes. Currently set to 100 MB.
$maxUploadSize = 100000000;
// The folder for storing the uploaded files. Default to the "$WorkDir" in dropbox.
// For diary pages, the uploaded files go to the diary photo folder if it's MBA or MBP.
preg_match("/(\w+)[\.\/]?/", $pagename, $match);
$groupName = !$match[1] ? "Main" : $match[1];
$UploadDir = str_replace('wiki.d','uploads',$WorkDir)."/$groupName";
if (isDiaryPage() === 2 && ($AuthorLink == 'MBA' || $AuthorLink == 'MBP'))
{
  preg_match("/[\.\/](\d{4})0?(\d+)$/", $pagename, $match);
  $year = $match[1];
  $mon = $match[2];
  $UploadDir = "$Photo/$year/$mon";
}

/****************************************************************************************/
// Meng. Javascript related config/scripts.

// Some most basic pmwiki page related information.
$isDiaryPage = isDiaryPage();
$HTMLHeaderFmt['pmwiki'] =
"<script>
window.pmwiki = {};
pmwiki.base = '$base';
pmwiki.pagename = '$pagename';
pmwiki.action = '$action';
pmwiki.isDiaryPage = '$isDiaryPage';
pmwiki.consoleLog = function (){};
</script>";
if (DEBUG)
{ $HTMLHeaderFmt['pmwiki'] .= "<script> pmwiki.consoleLog = console.log; </script>"; }

if ($AuthorLink === "MBA" || $AuthorLink === "MBP") { $ChromeExtPath = "/Users/Shared/Chrome extensions"; }
else { $ChromeExtPath = 'D:\Chrome extensions'; }

// Some enhancements for both browse and edit pages
$fromPath = "$ChromeExtPath/editViewEnhance";
$toPath = "$FarmD/pub/editViewEnhance";
syncFile($fromPath, $toPath);
$HTMLHeaderFmt['editViewEnhance'] = "
<script type='text/javascript' src='$PubDirUrl/editViewEnhance/editViewEnhance.js'></script>";

// Rich universal page commands
$HTMLHeaderFmt['pageCommand'] = "
<script type='text/javascript' src='$PubDirUrl/pageCommand.js'></script>";

// Enhanced search & replace
$fromPath = "$ChromeExtPath/searchReplace";
$toPath = "$FarmD/pub/searchReplace";
syncFile($fromPath, $toPath);
$searchBoxImgUrl = "$PubDirUrl/searchReplace/searchBoxImg.png";
$HTMLHeaderFmt['searchReplace'] = "
<script src='$PubDirUrl/searchReplace/mark.js'></script>
<script src='$PubDirUrl/searchReplace/searchReplace.js'></script>
<script> searchReplace.imgUrl = '$searchBoxImgUrl'; </script>";

// Dictionary
$fromPath = "$ChromeExtPath/dictionary";
$toPath = "$FarmD/pub/dictionary";
syncFile($fromPath, $toPath);
/*
$merriamApiKey = file_get_contents("$PubDirUrl/dictionary/apiKey");
$merriamApiKeyThesaurus = file_get_contents("$PubDirUrl/dictionary/apiKeyThesaurus");
$HTMLHeaderFmt['dictionary'] = "
<script src='$PubDirUrl/dictionary/dictionary.js'></script>
<script> dictionary.apiKey = '$merriamApiKey'; dictionary.apiKeyThesaurus = '$merriamApiKeyThesaurus'; </script>";
*/

if ($isBrowse || $isEdit)
{
  // Memorize and set the scroll position.
  $HTMLHeaderFmt["scrollPositioner"] =
  "<script src='$PubDirUrl/scrollPositioner.js'></script>";
}

if ($isBrowse)
{
  $fromPath = "$ChromeExtPath/html5avctrl";
  $toPath = "$FarmD/pub/html5avctrl";
  syncFile($fromPath, $toPath);
  $HTMLHeaderFmt['html5avctrl'] = "
  <script type='text/javascript' src='$PubDirUrl/html5avctrl/html5avctrl.js'></script>";

  include_once("$FarmD/cookbook/HTML5Audio.php");
  include_once("$FarmD/cookbook/HTML5Video.php");

  $HTMLHeaderFmt['autoRefresher'] =
  "<script type='text/javascript' src='$PubDirUrl/autoRefresher.js'></script>";

  // Google calendar integration
  if (isDiaryPage() === 2)
  {
    include_once("$FarmD/cookbook/googleCalendar.php");
    $GCImgUrl = "$PubDirUrl/googleCalendar/googleCalendar.png";
    $HTMLHeaderFmt['googleCalendar'] = "<script>window.GCImgUrl = '$GCImgUrl';</script>
    <script src='$PubDirUrl/googleCalendar/googleCalendar.js'></script>";
  }

  // Google map integration
  if (preg_match("/Main[\.\/]Map/i", $pagename))
  {
    $HTMLHeaderFmt['map'] = "
    <script src='$PubDirUrl/map/OSC.js'></script>
    <script src='https://maps.googleapis.com/maps/api/js?key=AIzaSyBu_UeviWEEHI8-BwpJbG2OtsvI7z8TJPM'></script>
    <script src='$PubDirUrl/map/map.js'></script>";
  }
}

if ($isEdit || isset($_GET["updatePageIndex"]))
{
  // A script to trigger pageindex update request on page saving.
  $HTMLHeaderFmt["pageindexUpdate"] =
  "<script type='text/javascript' src='$PubDirUrl/pageindexUpdate.js'></script>";
}

// if ($isBrowse || $isEdit || $action === "autosave")
if ($isEdit || $action === "autosave")
{
  # For autosave. Delay is in milliseconds.
  $autoSaveDelayHttp = 5000;
  $autoSaveDelayHttps = 1000;
  // Autosave defaults to off if the last modification time of the page is older than
  // $autoSaveOffDay days
  $autoSaveOffDay = 30;

  include_once("$FarmD/cookbook/autosave.php");
}

if ($isBrowse || $action === "upload")
{
  $ImgfocusFadeInTime = 0;
  $ImgFocusFadeOutTime = 0;
  $ImgfocusZoomToFitTime = 0;
  $ImgfocusZoomScreenRatio = 0.95;
  $ImgfocusAlwaysZoom = true;
  $ImgfocusExceptionList = array('check_.png', 'checkx.png', 'bg.jpg', 'trashCanOpen.png', 'trashCanClose.png', 'googleCalendar.png', 'searchBoxImg.png', 'playIcon.png');
  include_once("$FarmD/cookbook/imgfocus.php");
}

if ($isEdit || $action === "postupload")
{ include_once("$FarmD/cookbook/pasteimgupload.php"); }

if ($isEdit)
{
  // Rich edit commands
  $HTMLHeaderFmt['editEnhance'] = "
  <script type='text/javascript' src='$PubDirUrl/editEnhance.js'></script>";
}

// Some aux functions for the upload page
if ($action == 'upload')
{
  $trashOpenImgUrl = "$PubDirUrl/skins/trashCanOpen.png";
  $trashCloseImgUrl = "$PubDirUrl/skins/trashCanClose.png";
  $HTMLHeaderFmt['uploadAux'] = "
  <script>
  var uploadAux = {  };
  uploadAux.trashCloseImgUrl = '$trashCloseImgUrl';
  uploadAux.trashOpenImgUrl = '$trashOpenImgUrl';
  </script>
  <script src='$PubDirUrl/uploadAux.js'></script>";
}

// A small script for showing & modifying the hash tag links so that they point to
// the internal search engine
if ($isBrowse || $action === "search")
{
  $HTMLHeaderFmt["makeTagLink"] =
  "<script type='text/javascript' src='$PubDirUrl/makeTagLink.js'></script>";
}

// if ($isBrowse)
// {
//   $HTMLHeaderFmt['wysiwyg'] = "<script src='$PubDirUrl/wysiwyg.js'></script>";
// }

/*
// For debugging
file_put_contents('/Volumes/wiki/www/blog/pmwiki/lsmeng/untitled.txt', "called\n");
file_put_contents('C:\Apache24\htdocs\pmWiki\untitled.txt', "called\n".$postdata.$fileName.' '.$fileType.' '.$fileContent);
*/

/****************************************************************************************/

// Configurations for PmWiki plugins/enhancements written by other developers.

if ($isBrowse || $action === "search")
{
  # Latex
  include_once("$FarmD/cookbook/MathJax.php");
}

if ($isBrowse)
{
  // Embed youtube, TED, facebook, and vimeo videos, as well as pdfs.
  $HTMLHeaderFmt['ape'] = '<script type="text/javascript"
  src="$PubDirUrl/ape/ape.js"></script>';

  # Youtube (the older one).
  include_once("$FarmD/cookbook/swf-sites.php");
}

if ($isBrowse || $action === "flipbox")
{
  # For flipbox
  include_once("$FarmD/cookbook/flipbox.php");
}

# Advanced global search & replace
if (preg_match("/Site[\.\/]SearchE/i", $pagename))
{ require_once("$FarmD/cookbook/extract.php"); }

if ($action === "autosave")
{
  # Replace some never-used full-width characters on saving.
  $ROSPatterns ['/＊/'] = "*";
  $ROSPatterns ['/＃/'] = "#"; // \uFF03
  $ROSPatterns ['/＋/'] = "+"; // \uFF0B
  $ROSPatterns ['/＼/'] = "\\"; // \uFF3C
  $ROSPatterns ['/，/'] = ", "; // \uFF0C
  $ROSPatterns ['/。/'] = ". "; // \u3002
  $ROSPatterns ['/：/'] = ": ";
  $ROSPatterns ['/；/'] = "; ";
  $ROSPatterns ['/、/'] = "'";
  $ROSPatterns ['/％/'] = "%";
  $ROSPatterns ['/＄/'] = "$";
  $ROSPatterns ['/＆/'] = "&";
  $ROSPatterns ['/＠/'] = "@";
  $ROSPatterns ['/（/'] = "(";
  $ROSPatterns ['/）/'] = ")";
  $ROSPatterns ['/「/'] = "[";
  $ROSPatterns ['/」/'] = "]";
  $ROSPatterns ['/｜/'] = "|";
  $ROSPatterns ['/！/'] = "!";
  $ROSPatterns ['/︿/'] = "^";
  $ROSPatterns ['/－/'] = "-";
  $ROSPatterns ['/？/'] = "? ";
  $ROSPatterns ['/～/'] = "~";
  $ROSPatterns ['/todo_/'] = "%bgcolor=cyan%";
  $ROSPatterns ['/gold_/'] = "%bgcolor=gold%";
  $ROSPatterns ['/red_/'] = "%color=red%";
  $ROSPatterns ['/pagree_/'] = "%bgcolor=rgb(249,255,0)%'''Possible'''%%. ";
  $ROSPatterns ['/agree_/'] = "%bgcolor=rgb(106,235,19)%";
  $ROSPatterns ['/comment_/'] = "%bgcolor=pink%";
  $ROSPatterns ['/WA_/'] = "%bgcolor=rgb(125,133,0)%'''WA'''%%. ";
  $ROSPatterns ['/‘/'] = "'";
  $ROSPatterns ['/’/'] = "'";
  $ROSPatterns ['/“/'] = "\"";
  $ROSPatterns ['/”/'] = "\"";
  $ROSPatterns ['/	/'] = " ";
  $ROSPatterns ["/ *\n/"] = "\n";
  $ROSPatterns ["//"] = "";
  $ROSPatterns ["//"] = "";
  $ROSPatterns ["//"] = "";
}