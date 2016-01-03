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
#$Skin = jh;

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
$EnableUploadOverwrite = 0;             
# $DefaultPasswords['upload'] = crypt('secret');

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
# $EnablePageListProtect = 1;

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
// Meng. Configurations for my own plugins/enhancements for PmWiki.

// My default password; oz
$DefaultPasswords['admin'] = '';

// Various enhancements written by me
$homeSSID = "Sam Base";
$currentSSID = shell_exec("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'");
$isAtHome = ($UrlScheme == "http" && trim($currentSSID) == trim($homeSSID)) ? 1 : 0;
$DefaultPasswords['read']  = ($isAtHome) ? '' : '$1$/lyhKjN4$KTund6xDvfna6K0CpTzJK.'; // No global site pw at home
$pubImgDirURL = ($UrlScheme == "http") ? $UrlScheme.'://'.$_SERVER['HTTP_HOST'].'/pmwiki/uploads/' : $UrlScheme.'://'.$_SERVER['HTTP_HOST'].'/uploads/';
$diaryImgDirURL = ($UrlScheme == "http") ? $UrlScheme.'://'.$_SERVER['HTTP_HOST'].'/photo/' : "";
$runCodePath = "pub/runCode";
$timeStampFile = '../../pmwikiTimeStamp/pmwikiTimeStamp.txt';
$emailAddress1 = "lsmeng@ece.gatech.edu";
$emailAddress2 = "";

// Php login password. Have to be correct at the $pwRetryLimit+1 th time
$pwRetryLimit = 1; 
// Php logout timer. Pw will be requested after the timer expires.
$phpLogoutTimer = 3600; 
// Java logout timer for closing webpages. Set to 3/an hour if not/at home
$javaLogoutTimer = ($isAtHome) ? 3600*3 : 3600;
// Define the sensitive pages, which will be closed by java after a very short time.
// Currently set to 10 min.
$sensitivePage = array('Main.OnThisDay','Main.PickUp','Main.Girls','Main.NLPickUp','Main.AccountAndPassword');
$javaSensitivePageLogoutTimer = 600;

// The default image size and enlarged size on click.
$imgHeightPx = 330;
$imgHeightPxL = 660;

// Max allowable upload size in bytes. Currently set to 10 MB.
$maxUploadSize = 10000000; 

// Update the page history and store the difference if the following time period has 
// elapsed since last editing. 
$pageHistoryUpdateInterval = 3600;

// If set to 1, unencrypted page files will be encrypted on editing/viewing.
// If set to 0,   encrypted page files will be decrypted on editing/viewing.
// The encryption key for a specific page is set to the following pass phrase appended by
// its pagename and then hashed using crypt() with crypt($OPENSSL_METHOD) being its salt.
// => encryption key is crypt($OPENSSL_PASS.$pagename,crypt($OPENSSL_PASS)) 
// To encrypt/decrypt all the pages at once, simply perform a search for " ".
// CRC is used for checking if the encryption key is correct.
$EnableEncryption = 1;
$OPENSSL_PASS = "lsmeng";
$OPENSSL_METHOD = "AES-256-CBC";
$EnableCRC = 1;

// Pageindex
$pageIndexUpdateInterval = 60;

include_once("$FarmD/cookbook/plugin_LSMENG.php"); 

/****************************************************************************************/

# Include traditional chinese language
include_once("scripts/xlpage-utf-8.php"); # optional
XLPage('zhtw','PmWikiZhTw.XLPage');

# Latex
include_once("$FarmD/cookbook/MathJax.php");

# For autosave
$EnableDrafts = 0;
$autoSaveDelayHttp = 1;
$autoSaveDelayHttps = 1;
include_once("$FarmD/cookbook/autosave.php");

# For flipbox
include_once($FarmD.'/cookbook/flipbox.php');

# For wpap mp3 player
$wpap_initialvolume = "1";
$wpap_width = "500";
include_once("$FarmD/cookbook/wpap/wpap.php");

# Youtube (the older one).
include_once("$FarmD/cookbook/swf-sites.php");

/* Neo mp3 and video player. */
$EnableDirectDownload = 1;
include_once('cookbook/flashmediaplayer.php');
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
$FlashMediaPlayerInfo['neo_flv'] = array(
  'swf' => "neolao/player_flv_maxi.swf",
  'objparms' => array(
    'flashvars' => array('flv=$url',
                         '$parms')),
  'defaults' => array('align' => 'top',
                      'width' => 579,
                      'height' => 330,
                      'showstop'=>1,
#'showvolume'=>1,
'autoload'=>0,
'showtime'=>2,
'showfullscreen'=>1,
#'showswitchsubtitles'=>1,
#'srt'=>1
));
$FlashMediaPlayerInfo['neo_flv_V'] = array(
  'swf' => "neolao/player_flv_maxi.swf",
  'objparms' => array(
    'flashvars' => array('flv=$url',
                         '$parms')),
  'defaults' => array('align' => 'top',
                      'width' => 190,
                      'height' => 330,
                      'showstop'=>1,
#'showvolume'=>1,
'autoload'=>0,
'showtime'=>2,
'showfullscreen'=>1,
#'showswitchsubtitles'=>1,
#'srt'=>1
));

# Replace some never-used full-width characters on saving.
$ROSPatterns ['/＊/'] = "*";
$ROSPatterns ['/＃/'] = "#";
$ROSPatterns ['/＋/'] = "+";
$ROSPatterns ['/＼/'] = "\\";
$ROSPatterns ['/，/'] = ", ";
$ROSPatterns ['/。/'] = ". ";
$ROSPatterns ['/：/'] = ":";
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
$ROSPatterns ['/？/'] = "?";
$ROSPatterns ['/～/'] = "~";
$ROSPatterns ['/todo_/'] = "%bgcolor=lightgreen%";
$ROSPatterns ['/gold_/'] = "%bgcolor=gold%";
$ROSPatterns ['/red_/'] = "%color=red%";
