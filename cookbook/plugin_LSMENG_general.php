<?php

require_once("$FarmD/cookbook/encrypt.php");

// Return a string of the current operating system.
// Mac, Windows, Linux, etc.
function getOS()
{
  $obj = new OS_BR();
  return $obj->showInfo('os');
}

function echo_($str) { echo $str."<br>"; }

// Return a string of the properly formatted current time 
function getFormatTime()
{
  $today = getdate();
  $minStr = $today[minutes];
  if ($minStr<10) { $minStr = "0".$today[minutes]; }
  $secStr = $today[seconds];
  if ($secStr<10) { $secStr = "0".$today[seconds]; }
  $formatTime = $today[year]."/".$today[mon]."/".$today[mday]."_".$today[hours].":".$minStr.":".$secStr;
  return $formatTime;
}

// Create a file or kill it if existent, and then write "content" to it.
// Wait a random amount of time if other processes are writing this file.
// A maximum number of retry limit can be set.
// No return values. File write error is considered critical and the whole system
// will be aborted.
function filePutContentsWait($file, $content, $N_TRY=3)
{
  // check if it's already locked
  // if yes wait a random time then retry
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  $nTry = 1;
  while (1)
  {
    // if unlocked, lock it
    if (file_exists($file.",new") === false)
    {
      $fp = @fopen($file.",new","w");
      if ($fp !== false) { break; }
    }

    $nTry++;
    global $pagename;
    if ($nTry>$N_TRY) { Abort("Retry limit reached in filePutContentsWait() for $file!"); }

    $waitMicroSec = rand($minWaitMicroSec,$maxWaitMicroSec);
    usleep($waitMicroSec);
  }

  fputs($fp,$content);
  fclose($fp);

  // Check for the existence of ",new" again since things can go wrong when opening lots
  // of pages at the same time.
  if (file_exists($file.",new") === true)
  {
    @unlink($file);
    @rename($file.",new", $file);
  }
  else
  {
    // Leave a backup if things go wrong.
    echo ",new does not exist in filePutContentsWait() for $file. Backup file generated!";
    $fp2 = @fopen($file."_backup","w");
    if ($fp2 !== false)
    {
      fputs($fp2,$content);
      fclose($fp2);
    }
  }
}

// Handle a timeStamp for different users (uniquely identified by SESSION).
// Builtin authentication check is performed each time pmwiki is executed. The major 
// functionality of this function is: if the user is authenticated, and pmwiki hasn't been
// accessed for a duration longer than a prespecified timer (in "config.php"), passwords
// are cleared depending on the time duration that the user has been idle.
function checkTimeStamp()
{
  // It appears that session_start() has to be called first even for reading operation.
  // checkTimeStamp() can be the 1st function to call $_SESSION, therefore session_start()
  // has to be called at the outset.
//   @session_start();
//   @session_write_close();
  if (isset($_SESSION['MASTER_KEY']))
  {
    $hasSuccAuthCookie = true;
    $hasReqAuthCookie = false;
    if (!$hasSuccAuthCookie && $hasReqAuthCookie)
    {
//      promote to auth
//      write timeStamp
    }
    else if ($hasSuccAuthCookie && !$hasReqAuthCookie)
    {
      global $siteLogoutIdleDuration, $pageLockIdleDuration;
      $currentTime = time();
      $lastTime = isset($_SESSION['timeStamp']) ? $_SESSION['timeStamp'] : $currentTime;
      $timeDiff = $currentTime - $lastTime;
//       @session_start();
      $_SESSION['timeStamp'] = $currentTime;
//       @session_write_close();

      // Timer expires
      if ($timeDiff >= $pageLockIdleDuration)
      {
        global $pagename, $actionStr;

        // Long timer expires, log out the user and shut down the site.
        if ($timeDiff >= $siteLogoutIdleDuration)
        {
          global $sysLogFile;
          file_put_contents($sysLogFile, strftime('%Y%m%d_%H%M%S', time())." Long timer expired while accessing $pagename. Site shut down\n",  FILE_APPEND);
          file_put_contents($sysLogFile, "Dumping variables: $siteLogoutIdleDuration $pageLockIdleDuration $currentTime $lastTime $timeDiff ".$_SESSION['timeStamp']."\n",  FILE_APPEND);

//          write temp cookie

          HandleLogoutA($pagename.$actionStr);
        }

        // Short timer expires, redirect to a special page which purges all the page
        // reading passwords.
        else
        {
          global $sysLogFile;
          file_put_contents($sysLogFile, strftime('%Y%m%d_%H%M%S', time())." Short timer expired while accessing $pagename. Pages locked\n",  FILE_APPEND);

          file_put_contents($sysLogFile, "Dumping variables: $siteLogoutIdleDuration $pageLockIdleDuration $currentTime $lastTime $timeDiff ".$_SESSION['timeStamp']."\n",  FILE_APPEND);

//           @session_start();
          unset($_SESSION['authpw']);
          $_SESSION['passwordCount'] = 0;
//           @session_write_close();
        }
      }
    }
    else { Abort("Unexpected case in checkTimeStamp()!"); }
  }
  else
  {
/*
    if (there is no authenticated record or temp record by cookie)
    {
      write a temp cookie
      email notification
    }
*/
  }
}

// Should be clear.
function sendAlertEmail($subject = "Pmwiki Login Alert", $content = "")
{
  global $emailAddress1;
  global $emailAddress2;
  $formatTime = getFormatTime();

  // Get browser and OS info.
  $obj = new OS_BR();
  $browser = $obj->showInfo('browser');
  $browserVersion = $obj->showInfo('version');
  $OS = $obj->showInfo('os');
  $IP = get_client_ip();
  $str = $formatTime."\n\nIP:\n".$IP."\n\nUsing:\n".$OS.", ".$browser." ".$browserVersion;

  $country = @file_get_contents('http://ip-api.com/line/'.$IP);
  $str .= "\n\nLocation details: \n".$country."\n".$content;

  // Call shell script to send an email with the above info.
  shell_exec("echo \"".$str."\" | mail -s \"".$subject."\" ".$emailAddress1." ".$emailAddress2." -f donotreply");
}

// Borrowed from the Internet.
// It appears that the IP of localhost will be shown as "::1". Replace it with the string 
// "localhost".
$IP = get_client_ip();
function get_client_ip()
{
  $ipaddress = '';
  if ($_SERVER['HTTP_CLIENT_IP'])
  $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
  else if($_SERVER['HTTP_X_FORWARDED_FOR'])
  $ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
  else if($_SERVER['HTTP_X_FORWARDED'])
  $ipaddress = $_SERVER['HTTP_X_FORWARDED'];
  else if($_SERVER['HTTP_FORWARDED_FOR'])
  $ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
  else if($_SERVER['HTTP_FORWARDED'])
  $ipaddress = $_SERVER['HTTP_FORWARDED'];
  else if($_SERVER['REMOTE_ADDR'])
  $ipaddress = $_SERVER['REMOTE_ADDR'];
  else
  $ipaddress = 'UNKNOWN';

  if ($ipaddress == "::1") { return "localhost"; }
  else { return $ipaddress; }
}

// Borrowed from the Internet.
// It shows that the mobile phone browser as "Linux". Need improvement obviously.
class OS_BR
{
  private $agent = "";
  private $info = array();

  function __construct()
  {
    $this->agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : NULL;
    $this->getBrowser();
    $this->getOS();
  }

  function getBrowser()
  {
    $browser = array("Navigator"            => "/Navigator(.*)/i",
    "Firefox"              => "/Firefox(.*)/i",
    "Internet Explorer"    => "/MSIE(.*)/i",
    "Google Chrome"        => "/chrome(.*)/i",
    "MAXTHON"              => "/MAXTHON(.*)/i",
    "Opera"                => "/Opera(.*)/i",
    );
    foreach($browser as $key => $value)
    {
      if(preg_match($value, $this->agent))
      {
        $this->info = array_merge($this->info,array("Browser" => $key));
        $this->info = array_merge($this->info,array(
        "Version" => $this->getVersion($key, $value, $this->agent)));
        break;
      }
      else
      {
        $this->info = array_merge($this->info,array("Browser" => "UnKnown"));
        $this->info = array_merge($this->info,array("Version" => "UnKnown"));
      }
    }
    return $this->info['Browser'];
  }

  function getOS()
  {
    $OS = array("Windows"   =>   "/Windows/i",
    "Linux"     =>   "/Linux/i",
    "Unix"      =>   "/Unix/i",
    "Mac"       =>   "/Mac/i"
    );

    foreach($OS as $key => $value)
    {
      if(preg_match($value, $this->agent))
      {
        $this->info = array_merge($this->info,array("Operating System" => $key));
        break;
      }
    }
    return $this->info['Operating System'];
  }

  function getVersion($browser, $search, $string)
  {
    $browser = $this->info['Browser'];
    $version = "";
    $browser = strtolower($browser);
    preg_match_all($search,$string,$match);
    switch($browser)
    {
      case "firefox": $version = str_replace("/","",$match[1][0]);
      break;

      case "internet explorer": $version = substr($match[1][0],0,4);
      break;

      case "opera": $version = str_replace("/","",substr($match[1][0],0,5));
      break;

      case "navigator": $version = substr($match[1][0],1,7);
      break;

      case "maxthon": $version = str_replace(")","",$match[1][0]);
      break;

      case "google chrome": $version = substr($match[1][0],1,10);
    }
    return $version;
  }

  function showInfo($switch)
  {
    $switch = strtolower($switch);
    switch($switch)
    {
      case "browser": return $this->info['Browser'];
      break;

      case "os": return $this->info['Operating System'];
      break;

      case "version": return $this->info['Version'];
      break;

      case "all" : return array($this->info["Version"],
      $this->info['Operating System'], $this->info['Browser']);
      break;

      default: return "Unknown";
      break;
    }
  }
}

// Return 3 if this is onThisDay page
// Return 2 if this is a diary page
// Return 1 if this is a diary year page
// Return 0 otherwise
function isDiaryPage()
{
  global $pagename;

  if (preg_match("/^Main[\.\/]OnThisDay$/i", $pagename)) { return 3; }

  $pageGroup = substr($pagename,0,5);
  if (!preg_match("/^Main[\.\/]$/i", $pageGroup)) { return 0; }

  $diaryYear = substr($pagename,5,4);
  $pagenameLen = strlen($pagename);

  if ($pagenameLen == 9)
  {
    if ((int)$diaryYear < 2003 || (int)$diaryYear > 2100) { return 0; }
    else { return 1; }
  }
  else if ($pagenameLen == 11)
  {
    $diaryMonth = substr($pagename,9,2);
    if ((int)$diaryYear < 2003 || (int)$diaryYear > 2100) { return 0; }
    if ((int)$diaryMonth < 1 || (int)$diaryMonth > 12) { return 0; }
    return 2;
  }
  else { return 0; }
}

// Configure and add pageTimer.js. To be called in pmwikiAuth()
// $standbyLogoutDuration has to be > 2 for correct behavior due to jitters in the timer
// update.
function addpageTimerJs($countdownTimer)
{
  global $HTMLHeaderFmt, $PubDirUrl, $pagename, $ScriptUrl, $action,
  $standbyLogoutDuration;

  // Determine the dummy pagename to redirect upon timer expiration
  preg_match("/[\.\/](\w+)$/", $pagename, $match); $_pagename = $match[1];
  preg_match("/^(\w+)[\.\/]/", $pagename, $match); $groupname = $match[1];
  $closeRedirectName = $_pagename.'/'.$groupname;
  $logoutUrl = "$ScriptUrl/CLICKLOGOUT$pagename/$action";

  $HTMLHeaderFmt[] .= "<script type='text/javascript' src='$PubDirUrl/pageTimer.js'></script>
  <script type='text/javascript'>
  pageTimer.TIMER_EXP_DURATION = $countdownTimer;
  pageTimer.STANDBY_LOGOUT_DURATION = $standbyLogoutDuration;
  pageTimer.closePagename = '$closeRedirectName';
  pageTimer.logoutUrl = '$logoutUrl';
  </script>";
}
// echo $ScriptUrl;

// Use PBKDF2 to derive the master key based on the input password, and
// then use the master key to decrypt "Main.Homepage"
// The decryption is successful if the string "version=pmwiki" has been found in the 
// decrypted text. Upon decryption success, the password and the derived master key are
//  cached to speed up later authentication requests. Set $cacheCorrectPw to false will
// skip the cache and force the password Return 
// true if the input password is correct
// false otherwise
function isPasswdCorrect($passwd)
{
  if (isset($_SESSION['MASTER_KEY']))
  {
    if (strcmp($passwd, $_SESSION['MASTER_KEY'][1]) === 0) { return true; }
    else { return false; }
  }

  // Derive MASTER_KEY using pbkdf2
  $MASTER_KEY = deriveMasterKey($passwd);

  // if ($HMAC_AUTH === true)
  // {
  // Derive the HMAC key
  // Read file as $text from the encrypted HMAC key file
  // $HMAC_KEY = decryptStr($text, $MASTER_KEY);

  // Use $HMAC_key to check authenticity
  // Read file as $text from Main.HomePage
  // if (passMAC($text, $HMAC_KEY) === false) { Abort("Content tampered!"); }
  // }

  global $WorkDir;
  $file = "$WorkDir/Main.HomePage";
  $text = file_get_contents($file);
  $decryptText = decryptStr($text, $MASTER_KEY);
  // If decryption is successful, or the homepage does not exist. The latter case should
  // only happen when initializing.
  if (stripos($decryptText, "version=pmwiki") !== false || $text === false)
  {
    global $sysLogFile;
    file_put_contents($sysLogFile, strftime('%Y%m%d_%H%M%S', time())." Login\n", FILE_APPEND);

//     @session_start();
//     $_SESSION['MASTER_KEY'] = [$MASTER_KEY, $passwd];

    $Now = time();
    $TimeFmt = '%Y/%m/%d at %H:%M:%S';
    $_SESSION['MASTER_KEY'] = [$MASTER_KEY, $passwd, strftime($TimeFmt, $Now)];

    unset($_SESSION['authpw']);

    // Copy the master password to the password buffer used by pmwiki. This password
    // unlocks everything, until the buffer is flushed by the pagelock timer
    // This has to work with IsAuthorized() in pmwiki.php
    $_SESSION['authpw'][base64_encode($passwd)] = 1;

//     @session_write_close();
    return true;
  }
  else
  {
    global $sysLogFile;
    file_put_contents($sysLogFile, strftime('%Y%m%d_%H%M%S', time())." Wrong decrypt key\n", FILE_APPEND);

//$firstFewWord = substr($text,0,50);
//echo "Wrong passwd. First few words: $firstFewWord<br>";
    echo "<span style='color:red; font-weight:bold;'>Password incorrect!</span>";
    return false;
  }
}

// Return the login date/time
// $FmtPV['$loginTime'] = 'getLoginTime()';
// function getLoginTime() { return $_SESSION['MASTER_KEY'][2]; }

// Defunct. Attempt to clear and/or authenticate the Apache htaccess passwords.
function httpAuth()
{
//  @session_start();
//  @session_write_close();  
//  if (isset($_SESSION['MASTER_KEY'])) { return; }

//  echo password_hash("secret", PASSWORD_DEFAULT, ['cost' => 14]);
  $username = 'Meng';
  $passwordHash = '$2y$14$Ik4w14kTQWKppNY2FMLh7ehjsvMSplovbqcgOzkrzNizVGV3/6oV6';

  if (isset($_SERVER['PHP_AUTH_USER']) &&
  isset($_SERVER['PHP_AUTH_PW']))
  {
    if (password_verify($_SERVER['PHP_AUTH_PW'], $passwordHash) &&
    $_SERVER['PHP_AUTH_USER'] == $username) {  }
    else
    {
      header('WWW-Authenticate: Basic realm="Restricted Section"');
      header('HTTP/1.0 401 Unauthorized');
      die ("Not Authorized!");
    }
  }
  else
  {
//die ("here");
    header('WWW-Authenticate: Basic realm="Restricted Section"');
    header('HTTP/1.0 401 Unauthorized');
    die ("Not Authorized!");
  }
}

// Basically this opens a socket, send request, then close the socket before getting
// response from the server. Calling this function therefore equals visiting the given
// url in a non-blocking manner.
// For .htaccess protected sites, username/password have to be sent too. PHP session ID has 
// to be sent too for working in the same session. Set localhost in the whitelist in 
// .htaccess to avoid providing username/password.
function post_async($url)
{
  // Parse the given url into host, path, etc.
  $parts = parse_url($url);
  $port = isset($parts['port']) ? $parts['port'] : (($parts['scheme']=='http') ? 80 : 443);
  $fp = fsockopen($parts['host'], $port);//, $errno, $errstr, 30);

  // Composing the message
  $out = "POST ".$parts['path'].'?'.$parts['query']." HTTP/1.1\r\n";
  $out.= "Host: ".$parts['host']."\r\n";
  $out.= "Cookie: ".urlencode('PHPSESSID') .'='. urlencode($_COOKIE['PHPSESSID'])."; \r\n";
  $out.= "Connection: Close\r\n\n";

  fwrite($fp, $out);
  fclose($fp);
}

// Permission setting for regular page files.
// Set the permission of the pagefile to be the most restrictive one possible.
// Note that the Owner and Group of the pagefile created by Apache is assumed to be 
// both "_www". For ease of file operations (read/copy/paste) by the account user, 
// add your account to the Group "_www".
function chmodForPageFile($file)
{
  if (getOS() == 'Mac') { return chmod($file, 0440); }
  else { return true; }
}

// Return the image's file content for html display.
function getImgFileContent($file, $mime='image/png')
{
  $contents = @file_get_contents(str_replace('%20',' ',$file));
  if ($contents === false) { return ''; }
  $base64 = base64_encode($contents);

  // Parse the filename from the complete file path
  global $PhotoPub, $pagename;
  $groupname = substr($pagename,0,strpos($pagename,'.'));
  $pos = strrpos($file,'/');
  if ($pos !== false) { $filename = substr($file, $pos+1); }
  else { $filename = $file; }

  // Also insert the filename into the image data content. This serves a way to signify
  // the file name to the client side JS. Although it works, this is not a legal field.
  return ('data:' . $mime . ';filename='.$filename.';base64,' . $base64);
}

// Sync files from "fromPath" to "toPath" based on the last file modification time
function syncFile($fromPath, $toPath)
{
  if (!file_exists($fromPath)) { return; }

  // For syncing a folder
  if (!file_exists($toPath)) { mkdir($toPath, 0770); }

  $ignored = array('.', '..', '.htaccess');

  // for each file in from path
  foreach (scandir($fromPath) as $filename)
  {
    if (in_array($filename, $ignored)) { continue; }

    // get its filemtime
    // get the filemtime of the same file in toPath
    $fromFile = "$fromPath/$filename";
    $toFile = "$toPath/$filename";
    $fromTime = filemtime($fromFile);
    $toTime = @filemtime($toFile);

    // if the former >= the latter
    // copy the fomer to the latter
    if ($fromTime >= $toTime)
    {
      // Recursively sync in case it's a folder
      if (is_dir($fromFile)) { syncFile($fromFile, $toFile); }
      else { copy($fromFile, $toFile); }
    }
  }
}
