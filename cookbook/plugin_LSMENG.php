<?php

/* 
* Various enhancements for pmWiki.
* If the function follows a line beginning with "FmtPV," the function is callable
* from within wiki pages using markup language {$nameOfFunction}
*
* Author: Ling-San Meng
* Email: f95942117@gmail.com
*/

// Return a string of the current operating system.
// Mac, Windows, Linux, etc.
function getOS()
{
  $obj = new OS_BR();
  return $obj->showInfo('os');
}

function echo_($str) { echo $str."<br>"; }

/****************************************************************************************/

// Return the name of the page that you are browsing from analyzing the URI.
function getPageNameFromURI()
{
  global $URI;
  $URI = str_replace('LOCK','',$URI);
  
  $pos = strpos($URI,"?n=");
  if ($pos === false) { return "Main.HomePage"; }
  
  $pagename = substr($URI,$pos+3);
  $pos = strpos($pagename,"?");
  if ($pos !== false) { $pagename = substr($pagename,0,$pos); }
  
  return $pagename;
}

// Return a string of a given number of nonempty random line.
// Usage: {N-pagename$getNoEmptyRandLine}
// N is the number of nonempty random line; pagename is the complete pagename
// including group and name.
$FmtPV['$getNoEmptyRandLine'] = 'getNoEmptyRandLine($pn)';
function getNoEmptyRandLine($pagename)
{
  $pos = strpos($pagename,'-');
  if ($pos === false) { $N_randLine = 1; }
  else
  {
    $str = substr($pagename,0,$pos);
    if ($str != (string)(int)$str)
    { echo_("Format error in getNoEmptyRandLine()!"); return; }
    $N_randLine = (int)$str;
    $pagename = substr($pagename,$pos+1);
  }
  
  $page = RetrieveAuthPage($pagename, 'read', false, READPAGE_CURRENT);
  if (!$page)	{ echo_("Page doesn't exist in getNoEmptyRandLine()!"); return; }
  $textContent = $page['text'];
  $textLineArray = explode("\n", $textContent);
  
  $outputStr = "";
  for ($iRandLine=0;$iRandLine<$N_randLine;$iRandLine++)
  {
    $count = 0;
    while (1)
    {
      // get a random line
      $NumLine = count($textLineArray);
      if ($NumLine == 0) { return $outputStr; }
      $randLineNum = rand(0, $NumLine-1);
      $str = $textLineArray[$randLineNum];
      unset($textLineArray[$randLineNum]);
      
      // This condition determines whether this is an "empty" line.
      $strStripSpace = preg_replace('/\s+/', '', $str);
      if ($strStripSpace !== "\n" && $strStripSpace !== "" && $strStripSpace !== "	"
      && $strStripSpace !== "\\")
      {
        if (substr($str, strlen($str)-2,2) == "\\\\")
        { $outputStr .= substr($str,0,strlen($str)-2); }
        else { $outputStr .= $str; }
        $outputStr .= "\\\\\n";
        break;
      }
      
      $count++;
      if ($count>1000)
      { echo_("\"$pagename\" is almost empty in getNoEmptyRandLine()!"); return; }
    }
  }
  
  return $outputStr;
}

// Return a string of random characters for password.
// Usage: {L$RandomPwdSym}
// L is the length of password to be generated.
$FmtPV['$RandomPwdSym'] = 'RandomPwdSym($name)';
function RandomPwdSym($length)
{
  if ($length != (string)(int)$length)
  { echo_("Format error in RandomPwdSym()!"); return; }
  
  $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_-+=[{:;\'"/?<>,.';
  $charactersLength = strlen($characters);
  
  $length = (int)$length;
  $randomString = '';
  for ($i = 0; $i < $length; $i++)
  { $randomString .= $characters[rand(0, $charactersLength - 1)]; }
  
  return $randomString;
}

// Return a string of random characters for password.
// Usage: {L$RandomPwdWord}
// L is the length of password to be generated.
$FmtPV['$RandomPwdWord'] = 'RandomPwdWord($name)';
function RandomPwdWord($length)
{
  if ($length != (string)(int)$length)
  { echo_("Format error in RandomPwdWord()!"); return; }
  
  $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $charactersLength = strlen($characters);
  
  $length = (int)$length;
  $randomString = '';
  for ($i = 0; $i < $length; $i++)
  { $randomString .= $characters[rand(0, $charactersLength - 1)]; }
  
  return $randomString;
}

/****************************************************************************************/

// Return a string containing past diary corresponding to today's date. 
function printOnThisDay()
{
  $today = getdate();
  $onThisDayStr = "";
  
  $monStr = "$today[mon]";
  
  for($i=$today[year]-1; $i>=2003; $i--)
  {
    $pageName = "Main.".$i;
    if ($today[mon]<10) { $pageName .= "0"; }
    $pageName .= $monStr;
    
    $page = RetrieveAuthPage($pageName, 'read', false, READPAGE_CURRENT);
    $textContent = $page['text'];
    $textDateArray = explode("\n* ", $textContent);
    
    $onThisDayStr["$i"] = "\n'''".$i."/".$today[mon]."'''\n\n";
    
    if ($today[mday] == 1)
    {
      if (substr($textDateArray[0],0,4) == "* 1," || substr($textDateArray[0],0,6) == "* 1，")
      { $onThisDayStr["$i"] .= $textDateArray[0]; }
    }
    else
    {
      for ($j=1; $j<=31; $j++)
      {
        if (substr($textDateArray[$j],0,strlen($today[mday])) == $today[mday] &&
        (substr($textDateArray[$j],strlen($today[mday]),1) == "," ||
        substr($textDateArray[$j],strlen($today[mday]),3) == "，"))
        {
          $onThisDayStr["$i"] .= "* ".$textDateArray[$j];
          break;
        }
      }
    }
    
    $onThisDayStr["$i"] = pasteImgURLToDiary($onThisDayStr["$i"]."\n", "$i", $monStr);
  }
  
  return join("",$onThisDayStr);
}

// Return a string of the pagename for editing today's diary.
$FmtPV['$editToday'] = 'editToday()';
function editToday()
{
  $today = getdate();
  
  $pageName = "Main.".$today[year];
  if ($today[mon]<10) { $pageName .= "0"; }
  $pageName .= $today[mon]."?action=edit";
  
  return "[[".$pageName."|"."E]]";
}

// Print a symbol for redirecting to the previous diary month if the current page is a 
// diary page.
$FmtPV['$previousMonth'] = 'previousMonth()';
function previousMonth()
{
  global $pagename;
  
  if (isDiaryPage() === 2)
  {
    $diaryYear = substr($pagename,5,4);
    $diaryMonth = substr($pagename,9,2);
    if ($diaryMonth === "01")
    {
      $diaryMonth = "12";
      $diaryYear = (string)((int)$diaryYear - 1);
      $newPagename = "Main.".$diaryYear.$diaryMonth;
    }
    else
    {
      $diaryMonth = (int)$diaryMonth - 1;
      if ($diaryMonth < 10) { $diaryMonth = "0".(string)$diaryMonth; }
      else { $diaryMonth = (string)$diaryMonth; }
      $newPagename = "Main.".$diaryYear.$diaryMonth;
    }
    
    if (PageExists($newPagename)) { return "[[".$newPagename."|"."<]]"; }
    else { return ""; }
  }
  else { return ""; }
}

// Print a symbol for redirecting to the next diary month if the current page is a 
// diary page.
$FmtPV['$nextMonth'] = 'nextMonth()';
function nextMonth()
{
  global $pagename;
  
  if (isDiaryPage() === 2)
  {
    $diaryYear = substr($pagename,5,4);
    $diaryMonth = substr($pagename,9,2);
    if ($diaryMonth === "12")
    {
      $diaryMonth = "01";
      $diaryYear = (string)((int)$diaryYear + 1);
      $newPagename = "Main.".$diaryYear.$diaryMonth;
    }
    else
    {
      $diaryMonth = (int)$diaryMonth + 1;
      if ($diaryMonth < 10) { $diaryMonth = "0".(string)$diaryMonth; }
      else { $diaryMonth = (string)$diaryMonth; }
      $newPagename = "Main.".$diaryYear.$diaryMonth;
    }
    
    if (PageExists($newPagename)) { return "[[".$newPagename."|".">]]"; }
    else { return ""; }
  }
  else { return ""; }
}

// Return a string of year month date time.
$FmtPV['$showDateTime'] = 'showDateTime($pn)';
function showDateTime($pagename)
{
  $today = getdate();
  $minStr = $today[minutes];
  if ($minStr<10) { $minStr = "0".$today[minutes]; }
  $secStr = $today[seconds];
  if ($secStr<10) { $secStr = "0".$today[seconds]; }
  
  return "[[Main.onThisDay|".$today[year]."\\\\\n".$today[mon]."/".$today[mday]."\\\\\n".$today[hours].":".$minStr."]]";
}

/****************************************************************************************/

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

// Similar to file_get_contents(). Wait a random time duration if the file doesn't exist.
// A maximum number of retry limit can be set.
function fileGetContentsWait($file, $N_TRY=3)
{
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  
  $nTry = 1;
  while (1)
  {
    $text = @file_get_contents($file);
    if ($text !== false) { return $text; }
    
    $nTry++;
    if ($nTry>$N_TRY) { return false; }
    
    $waitMicroSec = rand($minWaitMicroSec,$maxWaitMicroSec);
    usleep($waitMicroSec);
  }
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

// Set the entry "$parameter" of user "$IP" to "$value".
// A new entry "$parameter" will be created in case that the entry doesn't exist.
// A new entry "$parameter" of user "$IP" will be created in case the user "$IP" doesn't 
// exist. Return
// a string of the updated text if nothing goes wrong
// false if the text is encrypted
function setParameterValue($text, $IP, $parameter, $value)
{
  // The text is still encrypted. Something must be wrong.
  if (isEncryptStr($text) == true) { return false; }
  
  $pos = strpos($text,$IP);
  $newText = "";
  
  // If the IP already exists
  if ($pos !== false)
  {
    $newLinePos = strpos($text,"\n",$pos+1);
    $parameterPos = strpos($text,$parameter,$pos+1);
    
    // If the field doesn't exist
    if ($parameterPos === false || $parameterPos>$newLinePos)
    {
      $newText = substr($text,0,$newLinePos).$parameter.$value." ".substr($text,$newLinePos,strlen($text)-$newLinePos);
    }
    else
    {
      $parameterLen = strlen($parameter);
      $oldValue = getParameterValue($text,$IP,$parameter);
      $oldValueLen = strlen($oldValue);
      $newText = substr($text,0,$parameterPos+$parameterLen).$value.substr($text,$parameterPos+$parameterLen+$oldValueLen,strlen($text)-$parameterPos-$parameterLen-$oldValueLen);
    }
  }
  // This is a new IP
  else
  { $newText = $text."IP=".$IP." ".$parameter.$value." \n"; }
  
  // Move the updated line to the top
  $pos = strpos($text,"IP=".$IP);
  $newLinePos = strpos($newText,"\n",$pos+1);
  $updatedLine = substr($newText,$pos,$newLinePos-$pos+1);
  $newText = $updatedLine.str_replace($updatedLine,"",$newText);
  return $newText;
}

// Get the entry "$parameter" of user "$IP", then return its current value. Return
// a string of the field value if nothing goes wrong
// Empty string if the IP doesn't exist, or the field doesn't exist
// false if the text is encrypted
function getParameterValue($text, $IP, $parameter)
{
  // The file is still encrypted. Something must be wrong.
  if (isEncryptStr($text) == true) { return false; }
  
  $pos = strpos($text,$IP);
  
  // If the IP already exists
  if ($pos !== false)
  {
    $newLinePos = strpos($text,"\n",$pos+1);
    $parameterPos = strpos($text,$parameter,$pos+1);
    
    // If the field doesn't exist
    if ($parameterPos === false || $parameterPos > $newLinePos) { return ""; }
    else
    {
      $parameterLen = strlen($parameter);
      $valueEndPos = strpos($text," ",$parameterPos+$parameterLen);
      return substr($text,$parameterPos+$parameterLen,$valueEndPos-$parameterPos-$parameterLen);
    }
  }
  else { return ""; }
}

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
  @session_start();
  @session_write_close();
  if (isset($_SESSION['MASTER_KEY']))
  {
    $hasSuccAuthCookie = true;
    $hasReqAuthCookie = false;
    if (!$hasSuccAuthCookie && $hasReqAuthCookie)
    {
//	    promote to auth
//	    write timeStamp
    }
    else if ($hasSuccAuthCookie && !$hasReqAuthCookie)
    {
      global $siteLogoutIdleDuration, $pageLockIdleDuration;
      $currentTime = time();
      $lastTime = isset($_SESSION['timeStamp']) ? $_SESSION['timeStamp'] : $currentTime;
      $timeDiff = $currentTime - $lastTime;
      @session_start();
      $_SESSION['timeStamp'] = $currentTime;
      @session_write_close();
      
      // Timer expires
      if ($timeDiff >= $pageLockIdleDuration)
      {
        global $pagename, $actionStr;
        
        // Long timer expires, log out the user and shut down the site.
        if ($timeDiff >= $siteLogoutIdleDuration)
        {
//          write temp cookie
          
          HandleLogoutA($pagename.$actionStr);
        }
        
        // Short timer expires, redirect to a special page which purges all the page
        // reading passwords.
        else
        {
          @session_start();
          unset($_SESSION['authpw']);
          @session_write_close();
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

/****************************************************************************************/

// Should be clear.
function addLineNum($text)
{
  // Remove the 1st space. It seems that a space character is automatically added to the
  // string if it is read from a file. This is imperfect but solves a part of the problems.
  if ($text[0] == " ") { $text = "    1|".$text; }
  else { $text = "    1| ".$text; }
  
  $i = 2;
  while (1)
  {
    $pos = strpos($text, "\n", $pos);
    
    if ($pos !== false)
    {
      if ($i<10) { $text = substr($text,0,$pos+1)."    ".$i."| ".substr($text,$pos+1,strlen($text)-$pos-1); }
      else if ($i<100) { $text = substr($text,0,$pos+1)."   ".$i."| ".substr($text,$pos+1,strlen($text)-$pos-1); }
      else if ($i<1000) { $text = substr($text,0,$pos+1)."  ".$i."| ".substr($text,$pos+1,strlen($text)-$pos-1); }
      else { $text = substr($text,0,$pos+1)." ".$i."| ".substr($text,$pos+1,strlen($text)-$pos-1); }
      
      $pos++;
      $i++;
    }
    else { break; }
  }
  
  return $text;
}

// Compile the source codes and show the execution results. Currently only PHP and C++
// are supported. Therefore the type of source codes is identified by the initial keyword
// for php "<?php". If matlab is supported in the future this has to be modified.
function runCode($pagename)
{
  global $runCodePath;
  $srcFile = $runCodePath."/main.cpp";
  $outputFile = $runCodePath."/output.txt";
  $cExeFile = $runCodePath."/a.out";
  
  $page = RetrieveAuthPage("Main.Runcode", 'read', false, READPAGE_CURRENT);
  
  $lastPageUpdateTime = $page['time'].'<br>';
  $lastFileUpdateTime = filemtime($srcFile);
  
  // If wiki page is the last edited one
  // Write the src codes to file
  // Actually the whole process can be made even more secure by bypassing the file read/write
  // step completely. Since the current state is also acceptable, let's just leave it
  // as it is for now.
  if (!$lastFileUpdateTime || $lastPageUpdateTime >= $lastFileUpdateTime)
  {
    if (file_exists($srcFile) !== false) { @unlink($srcFile); }
    if (file_exists($outputFile) !== false) { @unlink($outputFile); }
    $text = $page['text'];
    filePutContentsWait($srcFile, $text, 1);
  }
  // If the source file is the last edited one
  // Execute the file directly, and put the src file into wiki text
  else { $text = fileGetContentsWait($srcFile); }
  $text = str_replace("\t","  ",$text);
  
  // PHP
  if (substr($text,0,5)=="<?php") { $result = shell_exec('php '.$srcFile); }
  // C++
  else
  {
    // Remove the c exe file
    if (file_exists($cExeFile) !== false) { @unlink($cExeFile); }
    exec("cd ".$runCodePath."\ng++ main.cpp", $outMsg, $result);
    if ($result == 0) { $result = shell_exec("./".$cExeFile); }
    else { $result = "Syntax error! Enter the following command to see details\n"."g++ ".getcwd()."/".$runCodePath."/main.cpp"; }
  }
  
  // Write the results to file
  $newResult = "[@\n".addLineNum($result)."@]";
  filePutContentsWait($outputFile, $newResult, 1);
  
  if ($lastFileUpdateTime && $lastPageUpdateTime < $lastFileUpdateTime)
  {
    // Update the wiki text
    $new = $page;
    $new['text'] = $text;
    UpdatePage($pagename, $page, $new);
  }
}

// Create a link in site.pageactions to serve as the execute button for the special
// Main.runCode page
$FmtPV['$runCodeButton'] = 'runCodeButton()';
function runCodeButton()
{
  global $pagename;
  if (strcasecmp($pagename,"Main.Runcode") == 0)
  { return "[[".$pagename."?exe=1|"."Execute]]"; }
}

/****************************************************************************************/

// Copy files from the dropbox upload folder to the local upload folder in case the file
// does not exist locally.
function syncFileFromDropbox($text)
{
  global $pubImgDirURL, $WorkDir;
  
  if (!isset($WorkDir))
  {
    echo '$WorkDir is not set!<br>';
    return;
  }
  
  $pubImgDirURL_LEN = strlen($pubImgDirURL);
  $pos = 0;
  while(1)
  {
    // Find a pubImgDirURL
    $pos = @stripos($text, $pubImgDirURL, $pos);
    
    if ($pos !== false)
    {
      // Find the end of the URL. It could be followed by an empty space, a new line\\
      // a new line markup, end of file, and more.
      $posE1 = (@strpos($text," ", $pos) === false) ? INF : @strpos($text," ", $pos);
      $posE2 = (@strpos($text,"\n", $pos) === false) ? INF : @strpos($text,"\n", $pos);
      $posE3 = (@strpos($text,"\\", $pos) === false) ? INF : @strpos($text,"\\", $pos);
      $posE4 = (@strpos($text,"(:groupfooter:)", $pos) === false) ? INF : @strpos($text,"(:groupfooter:)", $pos);
      $posE5 = (@strpos($text,"|", $pos) === false) ? INF : @strpos($text,"|", $pos);
      $posE = min($posE1,$posE2,$posE3,$posE4,$posE5);
      
      if ($posE === false || $posE == INF) { Abort("Error in function syncFileFromDropbox()!"); }
      
      // Cut to get the url
      $url = substr($text,$pos+$pubImgDirURL_LEN,$posE-$pos-$pubImgDirURL_LEN);
      $uploadDir = str_replace("wiki.d","uploads",$WorkDir);
      
      if (file_exists("uploads/$url") === false)
      {
        if (file_exists("$uploadDir/$url") === false)
        { echo "File $url does not exist in either local or Dropbox side!"; }
        else { @copy("$uploadDir/$url", "uploads/$url"); }
      }
      
      // Adjust position
      $pos = $posE;
    }
    else { break; }
  }
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

// Search for all image elements in the given HTML and add a default size property to 
// them if no width/height specified.
function formatImgSize($HTML)
{
  // Regex: match <img, then nongreedy match any number of char except either width or
  // height, then match http
  return preg_replace_callback("/<img[^(width|height)]*?http/",function($match)
  {
    global $imgHeightPx;
    return str_replace("<img ", "<img height='$imgHeightPx' ", $match[0]);
  }
  ,$HTML);
}

// Replace a public image with its file content. Public images are identified by 
// the keyword "http://replaceWithImgData/", so that the default pmwiki markup will 
// process them as images. 
function replaceImgWithDataContent($HTML)
{
  // Regex: match http://replaceWithImgData, then nongreedy match at least one arbitrary
  // char util the the ahead being ' or "
  return preg_replace_callback("/http:\/\/replaceWithImgData\/.+?(?='|\")/",function($match)
  {
    // Replace the dummy url with the img's file content
    global $PhotoPub;
    $srcContent = getImgFileContent(str_replace('http://replaceWithImgData/', $PhotoPub, $match[0]));
    return $srcContent;
  }
  ,$HTML);
}

// Return the full URL of images put in the diary photo directory based on the image
// filename, and the given year/month.
// The filename has to follow a specific format, e.g., YYYYMMDD_HHMMSS.jpg or DD_X...XX.jpg
// An empty string is returned if the format doesn't check.
function getDiaryImgUrl($img, $diaryYear, $diaryMonth)
{
  // Check if it has the correct image extension.
  $supportImgExtList = array('.jpg', '.png', '.gif', '.jpeg', '.mp4');
  $NUM_IMGEXT = count($supportImgExtList);
  $EXT_LEN = 0;
  for ($iExt=0;$iExt<$NUM_IMGEXT;$iExt++)
  {
    $extension = $supportImgExtList[$iExt];
    $pos = stripos($img, $extension);
    if ($pos !== false)
    {
      $EXT_LEN = strlen($extension);
      break;
    }
  }
  
  // No valid extension found.
  if ($EXT_LEN == 0)
  {
//     if ($img != "" && $img != "..")
//     { echo "Unexpected extension for \"$img\" in getDiaryImgUrl()!<br>"; }
    return "";
  }
  
  // Format check by examining the underscore and the character right before the filename.
  $IMG_NAME_LEN = strlen("YYYYMMDD_HHMMSS");
  if ($img[8] == "_" && $img[0] == "2" && $img[1] == "0")
  {
    if (strlen($img) == $IMG_NAME_LEN+$EXT_LEN) {}
    else if (strlen($img) == $IMG_NAME_LEN+$EXT_LEN+1) {}
//     else { echo "Unexpected filename \"$img\" in getDiaryImgUrl()!<br>"; return ""; }
  }
  // For downloaded images that cannot be automatically renamed, D_X.jpg DD_X.jpg are valid
  // image name format. The length and type of "X" is not limited, i.e., can be non-numeric.
  else if ($img[2] == "_" && is_numeric($img[0]) && is_numeric($img[1]) ) { $isImgFileNameValid = 1; }
  else if ($img[1] == "_" && is_numeric($img[0])) { $isImgFileNameValid = 1; }
  else { echo "Unexpected filename \"$img\" in getDiaryImgUrl()!<br>"; return ""; }
  
  global $diaryImgDirURL;
  if (strcasecmp($extension,'.mp4') == 0)
// 	{ $imgUrl = "(:neo_flv_V-player ".$diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img." :)"; }
  {
    $imgUrl = "(:html5video filename=".$diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img." :)";
    
    // The subdomain fix for the socket limit of 6 per domain for loading video.
//   	$diaryImgDirURL_subDomain = str_replace("://", "://$img.", $diaryImgDirURL);
//     $imgUrl = "(:html5video filename=".$diaryImgDirURL_subDomain.$diaryYear."/".$diaryMonth."/".$img." :)"; 
  }
  else
  { $imgUrl = $diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img; }
  
  return $imgUrl;
}

// Return 3 if this is onThisDay page
// Return 2 if this is a diary page
// Return 1 if this is a diary year page
// Return 0 otherwise
function isDiaryPage()
{
  global $pagename;
  
  if (strcasecmp($pagename,"Main.OnThisDay") == 0) { return 3; }
  
  $pageGroup = substr($pagename,0,5);
  if (strcasecmp($pageGroup, "Main.") != 0) { return 0; }
  
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

function isFolderReadableByUserWWW($dir)
{
  $perms = fileperms($dir);
  
  // If readable by everyone
  if ($perms & 0x0004) { return true; }
  else if (posix_getpwuid(fileowner($dir))['name'] == "_www")
  {
    // If readable by user
    if ($perms & 0x0100)
    { return true; }
  }
  else if (posix_getpwuid(filegroup($dir))['name'] == "_www")
  {
    // If readable by group
    if ($perms & 0x0020)
    { return true; }
  }
  
  return false;
}

// For diary pages, automatically read the corresponding photo directory and list the file
// names of all the images and videos under their recorded date.
// The year and month of the file name of the image will be ignored actually.
// This function is applied since Apr. 2015
function pasteImgURLToDiary($text, $diaryYear="", $diaryMonth="")
{
  $pageType = isDiaryPage();
  if ($pageType != 2 && ($pageType!=3 || $diaryYear=="")) { return $text; }
  
  global $pagename;
  
  if ($diaryYear == "")
  {
    $diaryYear = substr($pagename,5,4);
    $diaryMonth = (string)(int)substr($pagename,9,2);
  }
  
  // This function is applied since Apr. 2015
  if ((int)$diaryYear*12+(int)$diaryMonth < (2015*12+4)) { return $text; }
  
  // Read the photo directory of this month
  $dir = "../Photo/".$diaryYear."/".$diaryMonth;
  
  if (!file_exists($dir)) { return $text; }
  
  if (!isFolderReadableByUserWWW($dir))
  { echo "Permission for diary photo folder incorrect. It has to be readable by user \"_www\"!<br>"; return $text; }
  
  $file = @scandir($dir);
  $N_FILE = count($file);
  
  for ($iDay=1; $iDay<=31; $iDay++) { $dayImgList[$iDay] = ""; }
  
  for ($iFile=1; $iFile<=$N_FILE; $iFile++)
  {
    // Check if this is a valid image file with correct filename format.
    $imgName = $file[$iFile];
    
    // Skip thumbnail images
    if (strpos($imgName,'_thumb.') !== false) { continue; }
    
    $imgUrl = getDiaryImgUrl($imgName, $diaryYear, $diaryMonth);
    
    if ($imgUrl == "") { continue; }
    
    // If the filename has been explicitly typed on the page, and the header is {$Photo}
    // skip auto pasting. Also checking for the header is to account for the older stuff
    // such as $imgpxd
//    if (strpos($text, $imgName) !== false) { continue; }
    if (preg_match("/{[$]Photo}\S*?$imgName/", $text)) { continue; }
    
    // Get its date & hour
    // If element 8 is underscore, the filename format is YYYYMMDD_HHMMSS.jpg
    // Otherwise the number before the underscore is the date
    if ($imgName[8] == "_")
    {
      $imgDay = (int)substr($imgName,6,2);
      $imgHour = (int)substr($imgName,9,2);
    }
    else
    {
      $pos = strpos($imgName,"_");
      $imgDay = (int)substr($imgName,0,$pos);
    }
    
    // Before 6am, it's still the same day...
    // This rule applies to images with filename format YYYYMMDD_HHMMSS.jpg only
    if ($imgName[8] == "_" && $imgHour<6)
    {
      if ($imgDay>1)
      {
        $imgDay--;
        $dayImgList[$imgDay] .= $imgUrl." ";
      }
      else
      {
        if ($diaryMonth == "12")
        {
          $imgDay = "31";
          $dayImgList[$imgDay] .= str_replace((string)((int)$diaryYear+1)."/1", $diaryYear."/12",$imgUrl)." ";
        }
        else
        {
          $checkVars = array('1','3','5','7','8','10');
          if (in_array($diaryMonth, $checkVars)) { $imgDay = "31"; }
          else if ($diaryMonth == "2") { $imgDay = "28"; }
          else { $imgDay = "30"; }
          $dayImgList[$imgDay] .= str_replace("/".(string)((int)$diaryMonth+1)."/", "/".$diaryMonth."/", $imgUrl)." ";
        }
      }
    }
    else { $dayImgList[$imgDay] .= $imgUrl." "; }
  }
  
  // Remove the ending mark added by default first, then remove all the empty spaces
  // and newlines at the end of the text. Finally we add two newlines to facilitate
  // the following script.
  $text = rtrim(str_replace('(:groupfooter:)', '', $text));
  $text .= "\n\n";
  
  for ($iDay=1; $iDay<=31; $iDay++)
  {
    if ($dayImgList[$iDay] !== "")
    {
      // Find on current processing date the first occurence of \n\n
      $dayHeadPos = strpos($text,"* ".$iDay.", ");
      if ($dayHeadPos !== false)
      {
        $dayEndPos = strpos($text,"\n\n",$dayHeadPos);
        if ($dayEndPos !== false)
        { $text = substr_replace($text, "\n-->".$dayImgList[$iDay]."\n", $dayEndPos, 0); }
      }
    }
  }
  
  return $text.'(:groupfooter:)';
}

/****************************************************************************************/

// Configure and add pageTimer.js. To be called in pmwikiAuth()
function addpageTimerJs($countdownTimer)
{
  // Logout is called 5 mins after the computer standby.
  // Has to be > countDownTimerUpdateInterval+1 for correct behavior due to jitters in the
  // timer update
  SDV($standbyLogoutDuration, 300);
  
  // Java logout timer update period.
  global $HTMLHeaderFmt, $PubDirUrl, $pagename, $ScriptUrl, $action;
  
  // Determine the dummy pagename to redirect upon timer expiration
  $_pagename = substr($pagename,strpos($pagename,'.')+1);
  $groupname = substr($pagename,0,strpos($pagename,'.'));
  if (substr($groupname,0,strlen("LOCK")) == "LOCK")
  { $groupname = substr($groupname,strlen("LOCK")); }
  $closeRedirectName = $_pagename.'/'.$groupname;
  
  $HTMLHeaderFmt[] .= "<script type='text/javascript' src='$PubDirUrl/pageTimer.js'></script>
  <script type='text/javascript'>
  pageTimer.TIMER_EXP_DURATION = $countdownTimer;
  pageTimer.STANDBY_LOGOUT_DURATION = $standbyLogoutDuration;
  pageTimer.pagename = '$pagename';
  pageTimer.closePagename = '$closeRedirectName';
  pageTimer.ScriptUrl = '$ScriptUrl';
  pageTimer.action = '$action';
  </script>";
}

/****************************************************************************************/

// If this is the special page "BookKeep", calculate and show the monthly expense at the
// at the top of the page.
function bookKeepProcess($pagename,&$text)
{
  $textLineArray = explode("\n", $text);
  $NumLine = count($textLineArray);
  
  $today = getdate();
  $MON = "12";
  
  for ($iMon=1;$iMon<=$MON;$iMon++)
  {
    $expense[$iMon] = 0;
    for ($i=0;$i<$NumLine;$i++)
    {
      $pos = strpos($textLineArray[$i],"* ".$iMon."/");
      if ($pos !== false)
      {
        $_line = substr($textLineArray[$i],strpos($textLineArray[$i]," ",2));
        
        // Regex
        // The leading negative sign can either be present or not
        // followed by at least one digit
        // followed by a dot which can be present or not
        // followed by digits
        preg_match_all('/\-?\d+\.?\d*/', $_line, $matches);
        
        $expense[$iMon] += array_sum($matches[0]);
      }
    }
  }
  
  for ($iMon=$MON;$iMon>0;$iMon--)
  {
    $dateObj   = DateTime::createFromFormat('!m', $iMon);
    $monthName = $dateObj->format('F'); // March
    $monthName = substr($monthName,0,3).".";
    $expenseStr .= $monthName." ".$expense[$iMon]." NTD\\\\\n";
  }
  $expenseStr .= " \\\\\n";
  
  return $expenseStr.$text;
}

/****************************************************************************************/

// Keyword used for identifying encrypted page files. If the text content of a page file
// is preceded by this keyword, the page file has been encrypted.
$ENC_KEYWORD = "ENC";
$ENC_KEYWORD_LEN = strlen($ENC_KEYWORD);
// Set the length of the initialization vector based on encryption method.
$IV_LEN = openssl_cipher_iv_length($OPENSSL_METHOD);
$SALT_LEN = 64;
$PBKDF2_ITERATION_FOR_AES = 1000;
$PBKDF2_ITERATION_FOR_MASTER_KEY = 100000;
$NUM_RECENTPAGEAESKEY = 10;

// See if the given text has been encrypted by checking the enc keyword
function isEncryptStr($text)
{
  global $ENC_KEYWORD, $ENC_KEYWORD_LEN;
  
  $heading = substr($text,0,$ENC_KEYWORD_LEN);
  if ($heading === $ENC_KEYWORD) { return 1; }
  else { return 0; }
}

// Return 1 if the page is a special site page that should not be encrypted.
//        0 otherwise.
// After numerous revision of the pmwiki src code, it turns out "SiteAdmin.Status" is
// the only page that requires this function. Simply the original function to speed up.
function noEncryptPage($pagename)
{
  if (strcasecmp("$pagename","SiteAdmin.Status") == 0) { return 1; }
  else { return 0; }
}

// Derive a key using PBKDF2 with the input $key and $salt. The derived key is used as
// the AES key for later page encryption/decryption.
function derivePageAESKey($key, $salt)
{
  // Derive the encryption key and cache it.
  global $PBKDF2_ITERATION_FOR_AES;
  $iteration = $PBKDF2_ITERATION_FOR_AES;
  $AES_KEY = hash_pbkdf2("sha512", $key, $salt, $iteration, 0, true);
  
  return $AES_KEY;
}

// Get recently used encryption key by checking the corresponding cache. Return
// Key if found
// empty string otherwise
function getRecentPageAESKey($arrayIndex)
{
  // If the key was recently used and cached, return it directly.
  if (@array_key_exists($arrayIndex, $_SESSION['recentPageAESKey']))
  { return $_SESSION['recentPageAESKey'][$arrayIndex]; }
  else { return ""; }
}

// Cache the recently used encryption key. If the key already exists in the cache, move
// it to the top of the cache. Otherwise insert it at the top of the cache.
function cacheRecentPageAESKey($AES_KEY, $arrayIndex)
{
  @session_start();
  if (@array_key_exists($arrayIndex, $_SESSION['recentPageAESKey']))
  {
    // Move the key to the top
    $_SESSION['recentPageAESKey'] = array($arrayIndex => $_SESSION['recentPageAESKey'][$arrayIndex]) + $_SESSION['recentPageAESKey'];
  }
  else
  {
    // Cache the key
    $_SESSION['recentPageAESKey'] = (!isset($_SESSION['recentPageAESKey'])) ?
    array($arrayIndex => $AES_KEY) : array($arrayIndex => $AES_KEY) + $_SESSION['recentPageAESKey'];
    global $NUM_RECENTPAGEAESKEY;
    if (count($_SESSION['recentPageAESKey']) > $NUM_RECENTPAGEAESKEY)
    { array_pop($_SESSION['recentPageAESKey']); }
  }
  @session_write_close();
}

// Get recently decrypted text by checking the corresponding cache. Return
// the decrypted text if found
// empty string otherwise
function getRecentDecryptText($arrayIndex)
{
  if (@array_key_exists($arrayIndex, $_SESSION['recentDecryptText']))
  { return $_SESSION['recentDecryptText'][$arrayIndex]; }
  
  else { return ""; }
}

// Cache the recently decrypted text for a few special pages that are loaded every time. 
// The special page is identified by finding a corresponding string in the decrypted text.
// If the string is found, which means this is a special page, remove the corresponding 
// entry in the cache if it exists; then put the new item to the top of the cache.
function cacheRecentDecryptText($decryptText, $arrayIndex)
{
  $sitePagename = array("\nname=Main.GroupAttributes\n", "\nname=Site.SideBar\n", "\nname=Site.PageActions\n", "\nname=Site.Editform\n");
  $NUM_SITEPAGE = count($sitePagename);
  
  for ($i=0;$i<$NUM_SITEPAGE;$i++)
  {
    if (stripos($decryptText, $sitePagename[$i]) !== false)
    {
      @session_start();
      
      // Run through the cache to see if the keyword has been registered already, if yes
      // remove the entry
      $textArrayValue = @array_values($_SESSION['recentDecryptText']);
      for ($j=0;$j<count($_SESSION['recentDecryptText']);$j++)
      {
        if (strpos($textArrayValue[$j], $sitePagename[$i]) !== false)
        { unset($_SESSION['recentDecryptText'][ array_search($textArrayValue[$j], $_SESSION['recentDecryptText']) ]); }
      }
      
      // Put the input decrypted text to the top of the cache.
      $_SESSION['recentDecryptText'] = (!isset($_SESSION['recentDecryptText'])) ?
      array($arrayIndex => $decryptText) : array($arrayIndex => $decryptText) + $_SESSION['recentDecryptText'];
      if (count($_SESSION['recentDecryptText']) > $NUM_SITEPAGE)
      { array_pop($_SESSION['recentDecryptText']); }
      @session_write_close();
      
      return true;
    }
  }
  
  return false;
}

// String encryption. The content of the encrypted string will be preceded by a predefined
// keyword for indicating the fact that it has been encrypted, followed
// by its encryption method, which is hashed, 
// followed by the salt used to generate the encryption key,
// followed by the initialization vector used to generate the encryption key.
// Return
// encrypted text if successfully encrypted;
// false on error, already encrypted, or empty string provided.
function encryptStr($text, $key = "")
{
  if ($text == "") { return false; }
  
  // If the passphrase for encryption is not provided, get the passphrase from cache,
  // this is the intended operation mode. The cache should be set right after a successful
  // login.
  if ($key == "")
  {
    if (!isset($_SESSION['MASTER_KEY'])) { return false; }
    else { $key = $_SESSION['MASTER_KEY'][0]; }
  }
  
  // Don't encrypt the text if it's been encrypted already.
  global $ENC_KEYWORD, $ENC_KEYWORD_LEN, $OPENSSL_METHOD;
  if (substr($text,0,$ENC_KEYWORD_LEN) == $ENC_KEYWORD) { return false; }
  
  // Insert data compression here
// 	$text = "GZCOMPRESS\n".gzcompress($text,9);
  $text = "BZCOMPRESS\n".bzcompress($text,9);
  
  // Generate a random salt for deriving the encryption key and IV
  global $SALT_LEN;
  $salt = openssl_random_pseudo_bytes($SALT_LEN);
  
  // Derive encryption key based on the salt
  $AES_KEY = derivePageAESKey($key, $salt);
  
  // Derive IV based on the salt
  global $IV_LEN;
  $iv = openssl_random_pseudo_bytes($IV_LEN);
  
  $encryptText = openssl_encrypt($text, $OPENSSL_METHOD, $AES_KEY, OPENSSL_RAW_DATA, $iv);
  if ($encryptText === false) { Abort("$pagename encryption error!"); }
  
  $KEYWORD = $ENC_KEYWORD;
  $cryptMethod = crypt($OPENSSL_METHOD);
  // Base64 encode the output so that we can copy/paste the ciphertext for debugging
  // purpose.
  $encryptText = $KEYWORD."\n".$cryptMethod."\n".base64_encode($salt.$iv.$encryptText);
  
  // Cache the AES key for quick access later. Using the concatenated string "$key.$salt"
  // as the array index.
  cacheRecentPageAESKey($AES_KEY, $key.$salt);
  
  return $encryptText;
}

// String decryption. Decrypt the string if the keyword for encryption has been found,
// and the encryption method and passphrase both check. Return
// decrypted text if decrypted
// "$text" if not encrypted, i.e., "$text" is plain text/empty passphrase provided
// 0 if encrypted but empty passphrase provided
// -1 for decryption error, e.g., wrong key or settings
function decryptStr($text, $key = "")
{
  global $ENC_KEYWORD_LEN, $OPENSSL_METHOD;
  
  // Return the original text if $text is unencrypted
  if (isEncryptStr($text) == false) { return $text; }
  
  // If the passphrase for encryption is not provided, get the passphrase from cache,
  // this is the intended operation mode. The cache should be set right after a successful
  // login.
  if ($key == "")
  {
    if (!isset($_SESSION['MASTER_KEY'])) { return 0; }
    else { $key = $_SESSION['MASTER_KEY'][0]; }
  }
  
  $cryptMethodLen = strpos($text,"\n",$ENC_KEYWORD_LEN+1) - $ENC_KEYWORD_LEN - 1; // -1 is for \n
  $cryptMethod = substr($text,$ENC_KEYWORD_LEN+1,$cryptMethodLen);
  
  // Decrypt the page if the encryption method checks
  if (crypt($OPENSSL_METHOD,$cryptMethod) !== $cryptMethod)
  { echo "$file was encrypted using a different cipher!"; return -1; }
  
  $text = substr($text,$ENC_KEYWORD_LEN+$cryptMethodLen+2);
  $text = base64_decode($text);
  
  // Retrieve the salt.
  global $SALT_LEN;
  $salt = substr($text,0,$SALT_LEN);
  
  // Get the cached recently decrypted text using the salt as the array key.
  // Basically this trades memory off the CPU usage.
  $decryptText = getRecentDecryptText($key.$salt);
  if ($decryptText != "") { return $decryptText; }
  
  // Retrieve the initialization vector.
  global $IV_LEN;
  $iv = substr($text,$SALT_LEN,$IV_LEN);
  
  // Derive the encryption key
  // See if the recently used salt equals the retrieved salt
  // If found, use the cached derived key and skip the KDF process
  $AES_KEY = getRecentPageAESKey($key.$salt);
  if ($AES_KEY == "")	{	$AES_KEY = derivePageAESKey($key, $salt); }
  
  // Run open ssl decrypt.
  $decryptText = openssl_decrypt(substr($text,$SALT_LEN+$IV_LEN), $OPENSSL_METHOD, $AES_KEY, OPENSSL_RAW_DATA, $iv);
  if ($decryptText === false)	{ return -1; }
  
  // Cache the decrypted text for some non-sensitive pmwiki builtin pages for speedup;
  // otherwise record the AES KEY as a recently used one
  if (cacheRecentDecryptText($decryptText, $key.$salt) === true) {}
  else
  { cacheRecentPageAESKey($AES_KEY, $key.$salt); }
  
  // Insert data decompression here
  if (substr($decryptText,0,10) == 'GZCOMPRESS')
  { $decryptText = gzuncompress(substr($decryptText,11)); }
  else if (substr($decryptText,0,10) == 'BZCOMPRESS')
  { $decryptText = bzdecompress(substr($decryptText,11)); }
  
  return $decryptText;
}

/********************************PAGEINDEX RELATED***************************************/

// Provide a wiki method for syncing pageindex immediately
$FmtPV['$syncPageindexNow'] = 'syncPageindexNow()';
function syncPageindexNow()
{
  syncPageindex(true);
  Redirect("Main.SiteAdmin");
}

// Reset pageindex file & folder.
$FmtPV['$resetPageindex'] = 'resetPageindex()';
function resetPageindex()
{
  global $pageindexTimeDir;
  exec('rm -rf '.$pageindexTimeDir);
  
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
}

function getPageindexUpdateTime($pagename)
{
  global $pageindexTimeDir;
  $pagefile = "$pageindexTimeDir/$pagename";
  if (file_exists($pagefile))	{	return filemtime($pagefile); }
  else { return 0;	}
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
  if ($flag || ($cloudLastModTime - $localLastModTime > 10) || ($Now - $lastSyncTime >= $pageindexSyncInterval))
  {
// DEBUG
    global $pageindexTimeDir;
    if ($cloudLastModTime - $localLastModTime > 10)
    { file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Syncing pageindex (cloud)\n", FILE_APPEND); }
    else
    { file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Syncing pageindex\n", FILE_APPEND); }
    
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
    
    file_put_contents($pageindexSyncFile, "");
    file_put_contents($localLastModFile, "");
    
    if (count($pagelist) === 0) { return; }
    
    $pagelistStr = implode(",", $pagelist);
    
// DEBUG
    file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." Fixing ".$pagelistStr."\n", FILE_APPEND);
    
    // Since the handlePageindex procedure is embedded in the builtin browsing/editing
    // procedure, we have to come up with a pagename that does not belong to the
    // "sensitive" pages which quickly get password locked. A newly generated page group
    // by default is not a sensitive page. That's why we have the RandomPwdWord() part.
    $url = "http://localhost".$_SERVER['SCRIPT_NAME']."?n=".RandomPwdWord(10)."&updatePageIndex=$pagelistStr";
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
}

// Detects async request for updating pageindex in the background
function updatePageindex()
{
  $pagelistStr = $_GET["updatePageIndex"];
  if (isset($pagelistStr))
  {
    // The 1st case is explict update request from the client
    //     2nd case is due to page index sync process
    if ($pagelistStr === "1")	{ global $pagename; $pagelist = array($pagename); }
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
        file_put_contents("$pageindexTimeDir/log.txt", strftime('%Y%m%d_%H%M%S', time())." ".$pagename." updated\n", FILE_APPEND);
        
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
    
    Meng_PageIndexUpdate($pagelist);
    
    exit;
  }
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

/****************************************************************************************/

// The change password process. Called within PmWikiAuth()
function changePassword($PageStartFmt, $PageEndFmt)
{
  $passwd = $_POST['passwdVerify'];
  $newPasswd = $_POST['newPasswd'];
  $newPasswdConfirm = $_POST['newPasswd2'];
  
  // If the current password entered last time matches, prompt for entering new password.
  if ($passwd != "" && isPasswdCorrect($passwd))
  {
    $AuthPromptFmt = array(&$PageStartFmt,
    "<p><b></b></p>
    <form name='authform' method='post'>
    Enter new PW: <input type='password' name='newPasswd' /><br><br>
    
    Confirm PW: <input hspace='19' type='password' name='newPasswd2' />
    <input type='submit' value='OK'/></form>
    
    <script language='javascript' type='text/javascript'>
    document.authform.newPasswd.focus() </script>", &$PageEndFmt);
    
    return  $AuthPromptFmt;
  }
  // Else if the new password and confirmation entered last time match, begin the change
  // password procedures.
  else if ($newPasswd != "" && ($newPasswd === $newPasswdConfirm))
  {
    // Create a folder named backup_pwChange_date under the local wiki.d
    $CurrentTime = strftime('%Y%m%d%H%M%S', time());
    $backFolder = "wiki.d/backup_pwChange_$CurrentTime";
    if (mkdir($backFolder) === false)
    { Abort("Error creating backup folder at changing password!"); }
    $log .= "Backup folder create succeeded\n";
    $logFile = $backFolder.'/log.txt';
    
    $new_MASTER_KEY = deriveMasterKey($newPasswd);
    
    $startTimeStamp = microtime(true);
    
    // For each file in $WorkDir, copy it to the backup folder
    // get its content, decrypt then encrypt using the new password
    global $WorkDir;
    $pagelist = scandir($WorkDir);
    
    $N_FILE = count($pagelist);
    for ($iFile=1; $iFile<=$N_FILE+2; $iFile++)
    {
      // The pageindex file are appended to the end of the file list.
      if ($iFile == $N_FILE+1) { $pagelist[$iFile] = '.pageindex'; $file = 'wiki.d/'.$pagelist[$iFile]; }
      else if ($iFile == $N_FILE+2) { $pagelist[$iFile] = 'myCalendarCredential.json'; $file = '.credentials/'.$pagelist[$iFile]; }
      else { $file = $WorkDir.'/'.$pagelist[$iFile]; }
      
      // Skip processing .htaccess. Somehow on MAC one of the file has an empty filename.
      if ($pagelist[$iFile] === ".htaccess" || $pagelist[$iFile] === ".lastmod" ||
      $pagelist[$iFile] === "..")
      {
        $log .= "File \"$file\" skipped\n";
        continue;
      }
      else if ($pagelist[$iFile] == "") { continue; }
      
      // On read error, simply record it in the log file then continue. Abort for pretty
      // much all other errors.
      $pageText = @file_get_contents($file);
      if ($pageText === false)
      {
        $log .= "File \"$file\" read error!\n";
        continue;
      }
      
      // Decrypt and back up the orginial pagefile if it's currently encrypted.
      $isEncrypt = isEncryptStr($pageText);
      if ($isEncrypt == true)
      {
        $log .= "File \"$file\" appears to have been encrypted\n";
        $pageText = decryptStr($pageText);
        if ($pageText===-1 || $pageText ===0)
        {
          $log .= "File \"$file\" decrypt error!\n";
          filePutContentsWait($logFile, $log);
          Abort("Error decrypting \"$file\" at changing password!");
        }
        $log .= "File \"$file\" decrypt succeeded\n";
        
        // Backup is allowed if the original pagefile is encrypted.
        if (copy($file, $backFolder.'/'.$pagelist[$iFile]) === false)
        {
          $log .= "File \"$file\" backup error!\n";
          filePutContentsWait($logFile, $log);
          Abort("Error backing up \"$file\" at changing password!");
        }
        
        $log .= "File \"$file\" back up succeeded\n";
      }
      else
      { $log .= "File \"$file\" appears to be in plain text\n"; }
      
      // Encrypt text.
      global $EnableEncryption;
      if ($EnableEncryption == 1)
      {
        $pageText = encryptStr($pageText, $new_MASTER_KEY);
        if ($pageText === false)
        {
          $log .= "File \"$file\" re-encrypt error!\n";
          filePutContentsWait($logFile, $log);
          Abort("Error re-encrypting \"$file\" at changing password!");
        }
        
        $log .= "File \"$file\" re-encrypt succeeded\n";
      }
      
      // Replace the pagefile if it has been modified, i.e., it was originally encrypted
      // or has been re-encrypted using the new password
      if ($isEncrypt == true || $EnableEncryption == 1)
      {
        filePutContentsWait($file, $pageText);
        
        // Set a very restrictive permission except the credential, which has to be
        // read/wirtten by GC related procedures.
        if ($pagelist[$iFile] == 'myCalendarCredential.json')
        { if (getOS() == 'Mac') { chmod($file, 0660); } }
        else { chmodForPageFile($file); }
        
        $log .= "File \"$file\" write succeeded\n";
      }
    }
    
    $changePWTime = (microtime(true) - $startTimeStamp);
    
    $log .= "Passwd change completed in $changePWTime sec!\n";
    filePutContentsWait($logFile, $log);
    
    HandleLogoutA("Main.HomePage");
  }
  // Prompt for entering the current password.
  else
  {
    $AuthPromptFmt = array(&$PageStartFmt,
    "<p><b></b></p>
    <form name='authform' method='post'>
    Current PW: <input type='password' name='passwdVerify' />
    <input type='submit' value='OK'/></form>
    <script language='javascript' type='text/javascript'><!--
    document.authform.passwdVerify.focus() //--></script>", &$PageEndFmt);
    
    return  $AuthPromptFmt;
  }
}

/****************************************************************************************/

function passMAC($text, $key)
{
  // Get the MAC part from $text as $MAC
  
  // Get the cipherTxt part for authentication from $text as $text
  // $hash = hash_hmac(SHA512, $text, $key);
  
  // Check if they are the same
  // if ($hash === $MAC) { return true; }
  // else { return false; }
}

$HMAC_AUTH = false;
function generate_HMAC_KEY() {}

// Derive the master key used for generating page-specific keys for AES encryption. Use
// PBKDF2 with hardcoded $salt, which in fact doesn't have too much point. 
function deriveMasterKey($passwd)
{
  // Derive MASTER_KEY using pbkdf2
  $salt = hex2bin("a5309a060550d1a3eda6c59264bfd082f584ee113e8276e0eee710868281e979706d4b606bf772b46b31577273706826ca9a214c345ff5561005f3f399084846");
  global $PBKDF2_ITERATION_FOR_MASTER_KEY;
  $iteration = $PBKDF2_ITERATION_FOR_MASTER_KEY;
  $MASTER_KEY = hash_pbkdf2("sha512", $passwd, $salt, $iteration, 0, true);
  
  return $MASTER_KEY;
}

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
    @session_start();
//     $_SESSION['MASTER_KEY'] = [$MASTER_KEY, $passwd];
    
    $Now = time();
    $TimeFmt = '%Y/%m/%d at %H:%M:%S';
    $_SESSION['MASTER_KEY'] = [$MASTER_KEY, $passwd, strftime($TimeFmt, $Now)];
    
    unset($_SESSION['authpw']);
    
    // Copy the master password to the password buffer used by pmwiki. This password
    // unlocks everything, until the buffer is flushed by the pagelock timer
    // This has to work with IsAuthorized() in pmwiki.php
    $_SESSION['authpw'][base64_encode($passwd)] = 1;
    
    @session_write_close();
    return true;
  }
  else
  {
//$firstFewWord = substr($text,0,50);
//echo "Wrong passwd. First few words: $firstFewWord<br>";
    echo "<span style='color:red; font-weight:bold;'>Password incorrect!</span>";
    return false;
  }
}

// Return the login date/time
$FmtPV['$loginTime'] = 'getLoginTime()';
function getLoginTime() { return $_SESSION['MASTER_KEY'][2]; }

// Defunct. Attempt to clear and/or authenticate the Apache htaccess passwords.
function httpAuth()
{
//	@session_start();
//	@session_write_close();	
//	if (isset($_SESSION['MASTER_KEY'])) { return; }
  
//  echo password_hash("secret", PASSWORD_DEFAULT, ['cost' => 14]);
  $username = 'Meng';
  $passwordHash = '$2y$14$Ik4w14kTQWKppNY2FMLh7ehjsvMSplovbqcgOzkrzNizVGV3/6oV6';
  
  if (isset($_SERVER['PHP_AUTH_USER']) &&
  isset($_SERVER['PHP_AUTH_PW']))
  {
    if (password_verify($_SERVER['PHP_AUTH_PW'], $passwordHash) &&
    $_SERVER['PHP_AUTH_USER'] == $username) {}
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

/****************************************************************************************/

if ($action == 'browse')
{
  $HTMLHeaderFmt[] .= "<script type='text/javascript' src='$PubDirUrl/autoRefresher.js'></script>
  <script type='text/javascript'>
  autoRefresher.pagename = '$pagename';
  </script>";
}

/****************************************************************************************/

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

/****************************************************************************************/

// Used as a page variable. Update the page history if the history is not up to date by
// setting the history update interval to 0 and then call PostPage()
// This also serves as a manual pageindex update mechanism; pageindex update will be 
// performed for the current page if called.
$FmtPV['$updatePageHistory'] = 'updatePageHistory()';
function updatePageHistory()
{
  global $URI;
  
  if (strripos($URI,'?action=diff') !== false)
  {
    // Perform an immediate history update then redirect to normal history page
    global $pagename;
    if (strripos($URI,'?action=diff&updateHistoryNow') !== false)
    {
      // get auth page => page and new
      $page = RetrieveAuthPage($pagename, 'edit');
      if (!$page) Abort("Error in updatePageHistory()!");
      
      if ($page['LastVerText'] != $page['text'])
      {
        $new = $page;
        
        // set page history update interval to 0
        global $pageHistoryUpdateInterval;
        $pageHistoryUpdateInterval = 0;
        
        PostPage($pagename, $page, $new);
      }
      
      Redirect($pagename.'?action=diff');
    }
    else
    { return "[[".$pagename."?action=diff&updateHistoryNow|"."Update]]"; }
  }
}

/****************************************************************************************/

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