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
#$EnablePathInfo = 1;

## $PageLogoUrl is the URL for a logo image -- you can change this
## to your own logo if you wish.
# $PageLogoUrl = "$PubDirUrl/skins/pmwiki/pmwiki-32.gif";

## If you want to have a custom skin, then set $Skin to the name
## of the directory (in pub/skins/) that contains your skin files.
## See PmWiki.Skins and Cookbook.Skins.
$Skin = pmwiki_gray;

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

/****************************************************************************************/

// Configurations for PmWiki plugins/enhancements written by LSMeng

// Set the station name and path for public wiki.d
// On MAC, it appears the environment variable is not working.
$AuthorLink = getenv('COMPUTERNAME');
if ($AuthorLink == '')
{
  $AuthorLink = 'MBA';
  $WorkDir = '/Users/Shared/Dropbox/pmwiki/wiki.d';
}
else if ($AuthorLink == 'SAM_MENG_W7N')
{ $WorkDir = 'D:\Dropbox\pmwiki\wiki.d'; }
else {}

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

// Abort if encryption related extension is not enabled
if (!function_exists(openssl_encrypt)) { Abort("\"openssl_encrypt\" is not supported!"); }

// Abort if compression related extension is not enabled
if (!function_exists(bzcompress)) { Abort("\"bzcompress\" is not supported!"); }

// Various enhancements written by me
$URI = $_SERVER['REQUEST_URI'];
$homeSSID = "Sam Base";
$currentSSID = shell_exec("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'");
$isAtHome = ($UrlScheme == "http" && trim($currentSSID) == trim($homeSSID)) ? 1 : 0;
$isAtHome = 0;

$diaryImgDirURL = ($AuthorLink == "MBA") ? $UrlScheme.'://'.$_SERVER['HTTP_HOST'].'/photo/' : "";
$PhotoPub = str_replace('wiki.d','uploads',$WorkDir).'/';
$Photo = '/Volumes/wiki/www/pmWiki/Photo/';
$runCodePath = "pub/runCode";

$emailAddress1 = "f95942117@gmail.com";
$emailAddress2 = "lsmeng@ece.gatech.edu";

// Php login password. Have to be correct at the $pwRetryLimit th time
$pwRetryLimit = 3;

// Idle timer duration for logging out & shutting down the site.
$siteLogoutIdleDuration = ($isAtHome) ? INF : 7200;
// Idle timer duration for locking sensitive pages.
$pageLockIdleDuration = 1200;

// The default image size and enlarged size on click.
$imgHeightPx = 330;

// Update the page history and store the difference if the following time period has 
// elapsed since last editing. 
$pageHistoryUpdateInterval = 3600;

// If set to 1, unencrypted page files will be encrypted on editing/viewing.
// If set to 0,   encrypted page files will be decrypted on editing/viewing.
// The encryption key for a particular page is set to "a certain passphrase appended by
// its pagename and then hashed using crypt() with crypt($OPENSSL_METHOD) being its salt".
// The passphrase is "DefaultPasswords", and will be set automatically right after a
// successful login.
// To encrypt/decrypt all the pages at once, simply perform a search for " ".
$EnableEncryption = 1;
$OPENSSL_METHOD = "AES-256-CBC";

require_once("$FarmD/cookbook/plugin_LSMENG.php"); 

// Max allowable upload size in bytes. Currently set to 100 MB.
$maxUploadSize = 100000000;
$groupName = substr($pagename, 0, strpos($pagename,'.'));
// The folder for storing the uploaded files. Default to the "$WorkDir" in dropbox.
// For diary pages, the uploaded files go to the diary photo folder if it's MBA.
$UploadDir = str_replace('wiki.d','uploads',$WorkDir)."/$groupName";
if (isDiaryPage() === 2 && $AuthorLink == 'MBA') 
{
  // Use regex to get year & mon from pagename. Not satisfied with the mon; there should 
  // be a way not to repeat the look behind part (?<=\.\d{4}0)
  preg_match('/(?<=\.)\d{4}/', $pagename, $match); $year = $match[0];
  preg_match('/(?<=\.\d{4}0)[1-9]|(?<=\.\d{4})1[0-2]/', $pagename, $match); $mon = $match[0];
  $UploadDir = "$Photo$year/$mon";
}

$ImgfocusFadeInTime = 0;
$ImgFocusFadeOutTime = 0;
$ImgfocusZoomToFitTime = 0;
$ImgfocusZoomScreenRatio = 0.95;
$ImgfocusAlwaysZoom = true;
$ImgfocusExceptionList = array('check_.png', 'checkx.png', 'bg.jpg', 'trashCanOpen.png', 'trashCanClose.png', 'googleCalendar.png', 'searchBoxImg.png');
include_once("$FarmD/cookbook/imgfocus.php"); 

# For autosave. Delay is in milliseconds.
$autoSaveDelayHttp = 5000;
$autoSaveDelayHttps = 1000;
// Autosave defaults to off if the last modification time of the page is older than 
// $autoSaveOffDay days
$autoSaveOffDay = 30;
include_once("$FarmD/cookbook/autosave.php");

$pageindexTimeDir = "wiki.d/pageindex";
$localLastModFile = "$pageindexTimeDir/.localLastmod";
$pageindexSyncFile = "$pageindexTimeDir/.lastsync";
$pageindexSyncInterval = 3600; // The interval for checking all the pages to keep their pageindex up to date.
// A script to trigger pageindex update request on page saving.
// This has to go after Autosave.
if ($action == 'edit' && substr($pagename,0,4) != 'LOCK')
{
	$HTMLHeaderFmt["pageindexUpdate"] = 
	"<script type='text/javascript' src='$PubDirUrl/pageindexUpdate.js'></script>";
}

if ($action == 'edit' || $action == 'browse')
{
  if (substr($pagename,0,4) != 'LOCK')
  {
    $isDiaryPage = isDiaryPage();
		// Memorize and set the scroll position.
		$HTMLHeaderFmt[] .= "
		<script src='$PubDirUrl/scrollPositioner.js'></script>
		<script> scrollPositioner.isDiaryPage = '$isDiaryPage';	</script>";
	}
}

include_once("$FarmD/cookbook/pasteimgupload.php");

if ($action == 'browse' || $_REQUEST['preview'])
{
  $HTMLHeaderFmt['html5avctrl'] = "
  <script type='text/javascript' src='$PubDirUrl/html5avctrl/html5avctrl.js'></script>";

//   $HTMLHeaderFmt['flashCtrl.js'] = "
//   <script type='text/javascript' src='$PubDirUrl/neolao/flashCtrl.js'></script>";
}

if ($action == 'browse' || $_REQUEST['preview'])
{
	include_once("$FarmD/cookbook/HTML5Audio.php");
	include_once("$FarmD/cookbook/HTML5Video.php");
}

// Run the memcached service for storing PHP session, and specify to listen to localhost
// only, and prevent the memory from being paged.
if (getOS() == 'Mac') { shell_exec("memcached -d -l localhost -k"); }

// Rich edit commands
if ($action == 'edit' && substr($pagename,0,4) != 'LOCK')
{	
  $HTMLHeaderFmt['editEnhance'] = "
  <script type='text/javascript' src='$PubDirUrl/editEnhance.js'></script>";
}

// Rich universal page commands
$HTMLHeaderFmt['pageCommand'] = "
<script type='text/javascript' src='$PubDirUrl/pageCommand.js'></script>
<script type='text/javascript'>
	pageCommand.pagename = '$pagename';
  pageCommand.action = '$action';
</script>";

// Some aux functions for the upload page
if ($action == 'upload')
{
  $trashOpenImgUrl = "$PubDirUrl/skins/trashCanOpen.png";
  $trashCloseImgUrl = "$PubDirUrl/skins/trashCanClose.png";
  $HTMLHeaderFmt['uploadAux'] = "
  <script>
  var uploadAux = {};
	uploadAux.trashCloseImgUrl = '$trashCloseImgUrl';
	uploadAux.trashOpenImgUrl = '$trashOpenImgUrl';
  </script>
  <script src='$PubDirUrl/uploadAux.js'></script>";
}

// Google map integration
if ($action == 'browse' && strcasecmp($pagename,"Main.Map") == 0)
{
  $HTMLHeaderFmt['map'] = "
  <script src='$PubDirUrl/map/OSC.js'></script>
  <script src='https://maps.googleapis.com/maps/api/js?key=AIzaSyBu_UeviWEEHI8-BwpJbG2OtsvI7z8TJPM'></script>
  <script src='$PubDirUrl/map/map.js'></script>";
}

// Google calendar integration
if ($action =='browse' && isDiaryPage() == 2)
{
	include_once("$FarmD/cookbook/googleCalendar.php");
	$GCImgUrl = "$PubDirUrl/googleCalendar.png";
  $HTMLHeaderFmt['googleCalendar'] = "<script>window.GCImgUrl = '$GCImgUrl';</script>
  <script src='$PubDirUrl/googleCalendar.js'></script>";
}


/*
// Enhanced search & replace
$searchBoxImgUrl = "$PubDirUrl/searchReplace/searchBoxImg.png";
$HTMLHeaderFmt['searchReplace'] = "
<script src='$PubDirUrl/searchReplace/mark.js'></script>
<script src='$PubDirUrl/searchReplace/searchReplace.js'></script>
<script> searchReplace.imgUrl = '$searchBoxImgUrl'; </script>";
*/

/*
// Plugin for Merriam-Webster API
// if ($action =='browse')
{
	$merriamApiKey = file_get_contents("$PubDirUrl/merriamWebster/apiKey");
  $HTMLHeaderFmt['merrianWebster'] = "
  <script> var merriamWebster = {}; merriamWebster.apiKey = '$merriamApiKey'; </script>
  <script src='$PubDirUrl/merriamWebster/merriamWebster.js'></script>";
}
*/

/*
// For debugging
file_put_contents('/Volumes/wiki/www/pmWiki/pmwiki/untitled.txt', "called\n".$fileName.' '.$fileType.' '.$fileContent);
file_put_contents('C:\Apache24\htdocs\pmWiki\untitled.txt', "called\n".$postdata.$fileName.' '.$fileType.' '.$fileContent);
*/

/****************************************************************************************/

// Configurations for PmWiki plugins/enhancements written by other developers.

# Include traditional chinese language
include_once("$FarmD/scripts/xlpage-utf-8.php");
# Apply Chinese to link names
//XLPage('zhtw','PmWikiZhTw.XLPage');

# Latex
if ($action == 'browse')
//if (!stripos($URI, '?action=edit') && !stripos($URI, '?action=diff'))
{ include_once("$FarmD/cookbook/MathJax.php"); }

// Embed youtube, TED, facebook, and vimeo videos, as well as pdfs.
if($action=="browse" || $_REQUEST['preview']) {
   $HTMLHeaderFmt['ape'] = '<script type="text/javascript" 
     src="$PubDirUrl/ape/ape.js"></script>';
}

# For flipbox
include_once("$FarmD/cookbook/flipbox.php");

# For wpap mp3 player
// $wpap_initialvolume = "1";
// $wpap_width = "500";
// include_once("$FarmD/cookbook/wpap/wpap.php");

# Youtube (the older one).
include_once("$FarmD/cookbook/swf-sites.php");

# Advanced global search & replace
include_once("$FarmD/cookbook/extract.php");

/*
# Neo mp3 and video player.
$EnableDirectDownload = 1;
include_once("$FarmD/cookbook/flashmediaplayer.php");
$FlashMediaPlayerInfo['neo_mp3'] = array(
  'swf' => "neolao/player_mp3_maxi.swf",
  'objparms' => array(
    'flashvars' => array('mp3=$url',
                         '$parms')),
  'defaults' => array('align' => 'middle',
                      'width' => 500,
                      'height' => 20,
'showstop'=>1,
#'showvolume'=>1,
));
$FlashMediaPlayerInfo['neo_flv_V'] = array(
  'swf' => "neolao/player_flv_maxi.swf",
  'objparms' => array(
    'flashvars' => array('flv=$url',
                         '$parms')),
  'defaults' => array('align' => 'top',
//                      'width' => 190,
                      'width' => 330,
                      'height' => 330,
                      'showstop'=>1,
#'showvolume'=>1,
'autoload'=>1,
'margin'=>1,
'buffer'=>1,
'buffermessage'=> '',
'showiconplay'=>1,
'iconplaybgalpha'=>20,
'showtime'=>2,
'showfullscreen'=>1,
'ondoubleclick' => 'fullscreen',
#'showswitchsubtitles'=>1,
#'srt'=>1
));
*/

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
$ROSPatterns ['/agree_/'] = "%bgcolor=rgb(106,235,19)%";
$ROSPatterns ['/comment_/'] = "%bgcolor=pink%";
$ROSPatterns ['/‘/'] = "'";
$ROSPatterns ['/’/'] = "'";
$ROSPatterns ['/“/'] = "\"";
$ROSPatterns ['/”/'] = "\"";
$ROSPatterns ['/	/'] = " ";
$ROSPatterns ["/ *\n/"] = "\n";
$ROSPatterns ["//"] = "";
$ROSPatterns ["//"] = "";
$ROSPatterns ["//"] = "";

