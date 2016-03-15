<?php 
/* 
 * Various enhancements for pmWiki written by Ling-San Meng (Sam Meng).
 * If the function follows a line beginning with "FmtPV," the function is callable
 * from within wiki pages using markup language {$nameOfFunction}
 *
 * Email: f95942117@gmail.com
 * Last Modified: 2015/12/16
 */

/****************************************************************************************/

// Return a string of a random line from the wiki page "$pagename"
function getRandLine($pagename)
{
  $page = RetrieveAuthPage($pagename, 'read', false, READPAGE_CURRENT);
  $textContent = $page['text'];
  $textLineArray = explode("\n", $textContent);  
  $NumLine = count($textLineArray);
  $randLineNum = rand(0, $NumLine-1);

  return "$textLineArray[$randLineNum]";
}

// Return a string of a random nonempty line from the wiki page "$pagename"
// If the end of line is the newline markup "\\", remove it
$FmtPV['$getNoEmptyRandLine'] = 'getNoEmptyRandLine($pn)';
function getNoEmptyRandLine($pagename)
{
  $count = 0;
  while (1)
  {
    $str = getRandLine($pagename);
    $strStripSpace = preg_replace('/\s+/', '', $str);
    if ($strStripSpace !== "\n" && $strStripSpace !== "" && $strStripSpace !== "	" 
       && $strStripSpace !== "\\")
    {
      if (substr($str, strlen($str)-2,2) == "\\\\") { return substr($str,0,strlen($str)-2); }
      else { return $str; }
    }
    
    $count++;
    if ($count>1000) { return "This is an almost empty page!"; }
  }
}

// Return 2 strings of random characters serving as passwords of fixed length 6 and 8.
$FmtPV['$RandomPwd'] = 'RandomPwd()';
function RandomPwd()
{
  $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $charactersLength = strlen($characters);
    
  $length = 6;
  $randomString6 = '';
  for ($i = 0; $i < $length; $i++)
  {
    $randomString6 .= $characters[rand(0, $charactersLength - 1)];
  }
    
  $length = 8;
  $randomString8 = '';
  for ($i = 0; $i < $length; $i++)
  {
    $randomString8 .= $characters[rand(0, $charactersLength - 1)];
  }
  return $randomString6."\\\\\n".$randomString8;
}


/****************************************************************************************/

// Return a string containing past diary corresponding to today's date. 
function printOnThisDay()
{
  $today = getdate();
  $onThisDayStr = "";

  for($i=$today[year]-1; $i>=2003; $i--)
  {
    $pageName = "Main.".$i;
    if ($today[mon]<10) { $pageName .= "0"; } 
    $pageName .= $today[mon];

    $page = RetrieveAuthPage($pageName, 'read', false, READPAGE_CURRENT);
    $textContent = $page['text'];
    $textDateArray = explode("\n* ", $textContent);  

    $onThisDayStr .= "\n'''".$i."/".$today[mon]."'''\n\n";    

    if ($today[mday] == 1)
    {
      if (substr($textDateArray[0],0,4) == "* 1," || substr($textDateArray[0],0,6) == "* 1，")
      { $onThisDayStr .= $textDateArray[0]; }
    }
    else
    {
      for ($j=1; $j<=31; $j++)
      {
        if (substr($textDateArray[$j],0,strlen($today[mday])) == $today[mday] &&
            (substr($textDateArray[$j],strlen($today[mday]),1) == "," ||
             substr($textDateArray[$j],strlen($today[mday]),3) == "，"))
        {
          $onThisDayStr .= "* ".$textDateArray[$j];
          break; 
        }
      }
    }
  }

  return "$onThisDayStr";
}

// Return a string of the pagename for editing today's diary.
$FmtPV['$editToday'] = 'editToday()';
function editToday()
{    
  $today = getdate();
  
  $pageName = "Main.".$today[year];
  if ($today[mon]<10) { $pageName .= "0"; } 
  $pageName .= $today[mon]."?action=edit";

  return "[[".$pageName."|"."EditDay]]";
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

function renameWait($oldFile, $newFile, $N_TRY=3)
{ 
  // check if it's already locked
  // if yes wait a random time then retry
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  $nTry = 1;
  while (1)
  {
    // if unlocked, lock it
    if (@rename($oldFile,$newFile) === true) { return true; }
    
    $nTry++;
    if ($nTry>$N_TRY) { echo("Retry limit reached in renameWait() for $oldFile!"); return false; }
   
    $waitMicroSec = rand($minWaitMicroSec,$maxWaitMicroSec);
    usleep($waitMicroSec); 
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

// Check the stored timeStamp and previous state in a text file on authentication success.
// Builtin authentication check is performed each time wiki is viewed/edited.
// If the wiki hasn't been accessed for a duration longer than a prespecified timer
// (in "config.php"), the wiki builtin logout function is called to request a site-wide 
// password. 
// LoginStatus=1: Logged in.
// LoginStatus=0: Actually this means no record, and won't be seen in the timeStamp file.
// LoginStatus=-1: Logged out when viewing due to timer expiration, or manually clicked logout.
// LoginStatus=-2: Logged out when editing due to timer expiration.
// LoginStatus=-3: Logged out for a first-time user trying to log in.
// LoginStatus=-4: Logged out by manually clicking.
// LoginStatus=-5: Logged out for not encrypted when encryption is on.
// LoginStatus=-6: Logged out for no timeStampFile.
//
// The timeStampFile will be encrypted if encryption is on, and will not get modified
// before a successful login. If encryption is off, the information of new IP trying to 
// log in and last seen will still get recorded. The user will be logged out immediately
// if the timeStampFile does not exist, decryption fails, and unencrypted when encryption
// is on.
function handleTimeStampOnLogin()
{
  // If the timeStampFile does not exist, generate, encrypt, log out.
  global $timeStampFile;
  $file = $timeStampFile;

  global $phpLogoutTimer;
  $currentUnixTime = time();
  $formatTime = getFormatTime(); 
  $IP = get_client_ip(); 
  
  global $pagename, $EnableEncryption;
  $text = fileGetContentsWait($file);
  // Time stamp file exists
  if ($text !== false)
  {
	  $isFileExist = true;

    // If content encrypted
    if (isEncryptStr($text) == true)
    {
      $isPageEncrypt = true;
      $text = decryptStr($text);
      
      // If decryption fails, the file has probably been tampered with. Log out.
      if ($text === -1) { Abort("TimeStampFile decryption fails in handleTimeStampOnLogin()!"); HandleLogoutA($pagename); }
      // Empty passphrase. Shouldn't happen.
      else if ($text === 0) { Abort("Empty passphrase in handleTimeStampOnLogin()"); }
    }
    else { $isPageEncrypt = false; }
        
    // If encryption is on and content was not encrypted, the file could have been replaced 
    // with a plain text. Encrypt then log out.
    if ($EnableEncryption == 1 && $isPageEncrypt == false)
    {
      $text = setParameterValue($text,$IP,"LastSeen=",$formatTime);
      $text = setParameterValue($text,$IP,"LoginStatus=", -5);  
      $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
      $text = encryptStr($text);
      filePutContentsWait($file, $text);
      HandleLogoutA($pagename);
    }
  }
  // Time stamp file missing
  else
  {
    $isFileExist = false;
    $text = setParameterValue($text,$IP,"LastSeen=",$formatTime);
    $text = setParameterValue($text,$IP,"LoginStatus=", -6);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
    if ($EnableEncryption == 1) { $text = encryptStr($text); }
    filePutContentsWait($file,$text);
    HandleLogoutA($pagename);
  }
   
  // If successfully decrypted, or not encrypted
  $lastTimeStamp = getParameterValue($text,$IP,"TimeStamp=");
  $loginStatus = getParameterValue($text,$IP,"LoginStatus=");  
  $text = setParameterValue($text,$IP,"LastSeen=",$formatTime);

  // The IP was previously logged in.
  if ($loginStatus == 1)
  {
    // Timer has expired, log out the IP.
    $elapsedTime = $currentUnixTime-$lastTimeStamp;
    if ($elapsedTime >= $phpLogoutTimer)
    {
      global $action;
      if ($action == 'edit') { $text = setParameterValue($text,$IP,"LoginStatus=",-2); } 
      else { $text = setParameterValue($text,$IP,"LoginStatus=",-1); }

      if ($EnableEncryption == 1) { $text = encryptStr($text); }
      filePutContentsWait($file,$text);
      HandleLogoutA($pagename);
    }
    // Else update TS.
    else { $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime); }
  }
  // The IP goes from no record in an existing time stamp file to logged in directly.
  else if ($loginStatus == 0 && $isFileExist == true)
  {
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);  
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
    if ($EnableEncryption == 1)
    { sendAlertEmail("Pmwiki Login Alert (new IP)"); }
    else
    { sendAlertEmail("Pmwiki Login Alert (logged in browser changes IP, or entry gets deleted manually)"); }
  }
  // The IP got logged out when viewing due to timer expiration, or multi-login by another IP
  else if ($loginStatus == -1)
  {  
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);

    // Timer hasn't expired.
    $elapsedTime = $currentUnixTime-$lastTimeStamp;
    if ($elapsedTime < $phpLogoutTimer) { sendAlertEmail("Pmwiki Login Alert (multiple login)"); }
  }
  // The IP got logged out when editing due to timer expiration, or multi-login by another IP
  else if ($loginStatus == -2)
  {
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);

    // Timer hasn't expired.
    $elapsedTime = $currentUnixTime-$lastTimeStamp;
    if ($elapsedTime < $phpLogoutTimer) { sendAlertEmail("Pmwiki Login Alert (multiple login)"); }
    
    if ($EnableEncryption == 1) { $text = encryptStr($text); }
    filePutContentsWait($file, $text);
    redirect(substr($pagename,strlen("LOGOUT"))."?action=edit");     
  }
  // The IP is a new IP
  else if ($loginStatus == -3)
  {  
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
    sendAlertEmail("Pmwiki Login Alert (new IP)");
  }
  // The IP clicked logout manually previously
  else if ($loginStatus == -4)
  {  
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
  }
  // Previously logged out by not encrypted when encryption is on.
  else if ($loginStatus == -5)
  {  
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
    sendAlertEmail("Pmwiki Login Alert (time stampe file unencrypted)");
  }
  // Previously logged out by having no timeStampFile
  else if ($loginStatus == -6)
  {  
    $text = setParameterValue($text,$IP,"LoginStatus=", 1);
    $text = setParameterValue($text,$IP,"TimeStamp=",$currentUnixTime);
    sendAlertEmail("Pmwiki Login Alert (time stamp file missing)");
  }
  
  if ($EnableEncryption == 1) { $text = encryptStr($text); }
  filePutContentsWait($file,$text);
}

function handleTimeStampOnLogout()
{
	global $timeStampFile;
  $file = $timeStampFile;

  $IP = get_client_ip();
  $formatTime = getFormatTime();
  
  $text = @file_get_contents($file);
  // Time stamp file exists
  if ($text !== false)
  {
    // If content encrypted, nothing can be done since passphrase is not available.
    if (isEncryptStr($text))
    {
      $text = decryptStr($text);
      if ($text === -1) { Abort("TimeStampFile decryption fails in handleTimeStampOnLogout()!"); }
      else if ($text === 0) {} // No phassphrase captured. Normal case when encryption is on
      else { Abort("Decryption succeeds during logout. Shouldn't happen!"); }
    }
    // Content plain text. Record new connection attempts in plain text, even when 
    // encryption is on.
    else
    {
      $loginStatus = getParameterValue($text,$IP,"LoginStatus=");
      $text = setParameterValue($text,$IP,"LastSeen=",$formatTime);  

      // There is no record for this IP. New IP tries to log in.
      if ($loginStatus == 0)
      {
        $text = setParameterValue($text,$IP,"LoginStatus=", -3);
        sendAlertEmail("Pmwiki Login Alert (new IP trying to log in)");
      }
      else if ($loginStatus == 1) { Abort("loginStatus=1 in handleTimeStampOnLogout(). Shouldn't happen!"); }
      else {}

      filePutContentsWait($file,$text);
    }
  }
}

// On clicking the logout link on the upper right corner of pages, the user will
// be directed to a page with its name being the original one preceded by "LOGOUT"
// which serves as a keyword for directing to this function.
function clickLogout()
{
	global $timeStampFile;
  $file = $timeStampFile;
  
  global $phpLogoutTimer;
  $currentUnixTime = time();
  $formatTime = getFormatTime();
  
/***************************************************************************************/
  // It turns the passphrase as well as all the session variables are visible
  // only after SessionAuth() and IsAuthorized() are called. I have no clue
  // regarding their details. As far as capturing the passphase and therefore
  // allow decryption, it works fine for now.
  global $DefaultPasswords, $pagename;
  SessionAuth($pagename, (@$_POST['authpw']) 
                           ? array('authpw' => array($_POST['authpw'] => 1))
                           : '');
  foreach($DefaultPasswords as $k => $v)
  { $acache['@site'][$k] = IsAuthorized($v, 'site', $x,1); }
/***************************************************************************************/
 
  $text = fileGetContentsWait($file);
  $text = decryptStr($text);
  if ($text === -1) { Abort("TimeStampFile decryption fails in clickLogout()!"); }
  else if ($text === 0) { Abort("No passphase in clickLogout(). Shouldn't happen!"); }
  
  $IP = get_client_ip();
  $text = setParameterValue($text,$IP,"LastSeen=",$formatTime);  
  $text = setParameterValue($text,$IP,"LoginStatus=",-4);
  
  global $EnableEncryption;
  if ($EnableEncryption == 1) { $text = encryptStr($text); }
  filePutContentsWait($file, $text);   
  HandleLogoutA($pagename);
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
function get_client_ip() {
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
class OS_BR{

    private $agent = "";
    private $info = array();

    function __construct(){
        $this->agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : NULL;
        $this->getBrowser();
        $this->getOS();
    }

    function getBrowser(){
        $browser = array("Navigator"            => "/Navigator(.*)/i",
                         "Firefox"              => "/Firefox(.*)/i",
                         "Internet Explorer"    => "/MSIE(.*)/i",
                         "Google Chrome"        => "/chrome(.*)/i",
                         "MAXTHON"              => "/MAXTHON(.*)/i",
                         "Opera"                => "/Opera(.*)/i",
                         );
        foreach($browser as $key => $value){
            if(preg_match($value, $this->agent)){
                $this->info = array_merge($this->info,array("Browser" => $key));
                $this->info = array_merge($this->info,array(
                  "Version" => $this->getVersion($key, $value, $this->agent)));
                break;
            }else{
                $this->info = array_merge($this->info,array("Browser" => "UnKnown"));
                $this->info = array_merge($this->info,array("Version" => "UnKnown"));
            }
        }
        return $this->info['Browser'];
    }

    function getOS(){
        $OS = array("Windows"   =>   "/Windows/i",
                    "Linux"     =>   "/Linux/i",
                    "Unix"      =>   "/Unix/i",
                    "Mac"       =>   "/Mac/i"
                    );

        foreach($OS as $key => $value){
            if(preg_match($value, $this->agent)){
                $this->info = array_merge($this->info,array("Operating System" => $key));
                break;
            }
        }
        return $this->info['Operating System'];
    }

    function getVersion($browser, $search, $string){
        $browser = $this->info['Browser'];
        $version = "";
        $browser = strtolower($browser);
        preg_match_all($search,$string,$match);
        switch($browser){
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

    function showInfo($switch){
        $switch = strtolower($switch);
        switch($switch){
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
  if (file_exists($srcFile) !== false) { @unlink($srcFile); }
  if (file_exists($outputFile) !== false) { @unlink($outputFile); }

  $page = RetrieveAuthPage("Main.Runcode", 'read', false, READPAGE_CURRENT);
  $text = $page['text'];

  // Write the src codes to file and remove the c exe file
  // Actually the whole process can be made even more secure by bypassing the file read/write
  // step completely. Since the current state is also acceptable, let's just leave it
  // as it is for now.
  $fp=fopen($srcFile,"w");
  fputs($fp,$text);
  fclose($fp);
  if (file_exists($cExeFile) !== false) { @unlink($cExeFile); }  

  // PHP
  if (substr($text,0,5)=="<?php")
  { 
    $result = shell_exec('php '.$srcFile);
  }
  // C++
  else
  {
    shell_exec("cd ".$runCodePath."
    g++ main.cpp");
    $result = shell_exec("./".$cExeFile);
  }
   
  // Write the results to file
  $newResult = "[@".addLineNum($result)."@]";
  $fp=fopen($outputFile,"w");
  fputs($fp,$newResult);
  fclose($fp);

  // Write the formatted src to file  
  @unlink($srcFile);
  $text = "[@".addLineNum($text)."@]";
  $fp=fopen($srcFile,"w");
  fputs($fp,$text);
  fclose($fp);
}

/****************************************************************************************/

// Copy files from the dropbox upload folder to the local upload folder in case the file
// does not exist locally.
function syncFileFromDropbox($text)
{
    global $pubImgDirURL, $WorkDir;
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

//echo $text;
//break;
        // If the file is non existent, copy from Dropbox at the same url
        if (file_exists("uploads/$url") === false)
        {
          if (file_exists("$uploadDir/$url") === false)
          { echo "File $url does not exist in either local or Dropbox side!"; }
          else { copy("$uploadDir/$url", "uploads/$url"); }
        }
        
        // Adjust position
        $pos = $posE;
      }
      else { break; }
    }
}

# For img size toggle; adapted from flipbox.
include_once($FarmD.'/cookbook/imgSizeToggle.php');

// Replace a complete image URL with the "image size toggle" function.
function replaceImgUrlWithSizeToggle($text)
{   
  $supportImgExtList = array('.jpg', '.png', '.jpeg');
  $NUM_IMGEXT = count($supportImgExtList);

  $imgCount = 1;
  
  for ($iExt=0;$iExt<$NUM_IMGEXT;$iExt++)
  {  
    $extension = $supportImgExtList[$iExt];
    $extLen = strlen($extension);
    $pos = 0;
    while(1)
    {
      $pos = @stripos($text, $extension, $pos);
    
      if ($pos !== false)
      {
        // check if this is a valid image url
        $isImgFileNameValid = 0;
        $imgUrl = "";
        $roughInterceptImgUrl = substr($text,0,$pos+$extLen);        
        global $UrlScheme;
        $httpPos = strrpos($roughInterceptImgUrl,$UrlScheme.'://'.$_SERVER['HTTP_HOST']);
        if ($httpPos !== false && $roughInterceptImgUrl[$httpPos-1]!=="%")
        {
          $spacePos = strpos($roughInterceptImgUrl," ",$httpPos);
          if ($spacePos === false)
          {
            $isImgFileNameValid = 1;
            $imgUrl = substr($roughInterceptImgUrl, $httpPos, strlen($roughInterceptImgUrl)-$httpPos);
          }
        }
      
        if ($isImgFileNameValid == 1)
        { 
          $flipboxMarkup = FmtImgSizeToggle('_',$imgCount,$imgUrl);
          $text = substr_replace($text, $flipboxMarkup, $pos-strlen($imgUrl)+$extLen, strlen($imgUrl));
        
          $pos = $pos+strlen($flipboxMarkup)-strlen($imgUrl)+$extLen;
          $imgCount++;
        }
        else { $pos = $pos+$extLen; }
      }
      else { break; }
    }

  }
  
  // This is very ugly... 
  // Add the action of setting the cursor style in the event of window.onload
  global $HTMLHeaderFmt;
  $HTMLHeaderFmt[] .= "<script type='text/javascript'><!--
  function setImgCursor()
  {
  ";
  for ($i=0;$i<$imgCount;$i++)
  {
    $j = $i+1;
    $HTMLHeaderFmt[] .= "document.getElementById('_isti$j').style.cursor = 'pointer';
    ";
  }
  $HTMLHeaderFmt[] .= "}

  window.addEventListener('load', setImgCursor, false);

  --></script>";
  
  return $text;
}

// Return the full URL of images put in the diary photo directory based on the image filename.
// The filename has to follow a specific format as YYYYMMDD_HHMMSS.jpg
// An empty string is returned if the format doesn't check.
function getDiaryImgUrl($img)
{  
  // Check if it has the correct image extension.
  $supportImgExtList = array('.jpg', '.png', '.jpeg');
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
  if ($EXT_LEN == 0) { return ""; }

  // Format check by examining the underscore and the character right before the filename. 
  // "sameTimeChar" is to handle photos taken at exactly the same time so that the file name
  // is appended by an English letter.
  $isImgFileNameValid = 0;
  $IMG_NAME_LEN = strlen("YYYYMMDD_HHMMSS");
  $sameTimeChar = "";
  if ($img[8] == "_" && $img[0] == "2" && $img[1] == "0")
  {
    if (strlen($img) == $IMG_NAME_LEN+$EXT_LEN)
    {
      $isImgFileNameValid = 1;
    }
    else if (strlen($img) == $IMG_NAME_LEN+$EXT_LEN+1)
    {
      $isImgFileNameValid = 1;
      $sameTimeChar = $img[$IMG_NAME_LEN];
    }
    else { return ""; }
  }
  // For downloaded images that cannot be automatically renamed, D_X.jpg DD_X.jpg are valid 
  // image name format. The length and type of "X" is not limited, i.e., can be non-numeric.
  else if ($img[2] == "_" && is_numeric($img[0]) && is_numeric($img[1]) ) { $isImgFileNameValid = 1; }
  else if ($img[1] == "_" && is_numeric($img[0])) { $isImgFileNameValid = 1; }
  else { return ""; }

  if ($isImgFileNameValid == 1)
  { 
    global $diaryImgDirURL;
    global $pagename;
    $diaryYear = substr($pagename,5,4);  
    $diaryMonth = (string)(int)substr($pagename,9,2);

    $imgUrl = $diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img;

    return $imgUrl;
  }
  else { return ""; }
}

// Return the full URL of video put in the diary photo directory based on the video filename.
// The video size setting is in "config.php"
// The filename has to follow a specific format as YYYYMMDD_HHMMSS.mp4
// An empty string is returned if the format doesn't check.
function getDiaryVideoUrl($img)
{  
  // Check if it has the correct video extension.
  $pos = stripos($img, ".mp4");
  if ($pos === false) { return ""; }

  // Format check by examining the underscore and the character right before the filename. 
  // "sameTimeChar" is to handle photos taken at exactly the same time so that the file name
  // is appended by an English letter.
  $isImgFileNameValid = 0;
  if ($img[8] == "_" && $img[0] == "2" && $img[1] == "0")
  {
    if (strlen($img) == 19)
    {
      $isImgFileNameValid = 1;
    }
    else { return ""; }
  }
  // DD_X.mp4 is also a valid file name format
  // And the length of "X" is not limited.
  else if ($img[2] == "_") { $isImgFileNameValid = 1; }
  else if ($img[1] == "_") { $isImgFileNameValid = 1; }
  else { return ""; }

  if ($isImgFileNameValid == 1)
  {        
    // Take care of the vertical video heading.
    global $diaryImgDirURL;
    
    global $pagename;
    $diaryYear = substr($pagename,5,4);  
    $diaryMonth = (string)(int)substr($pagename,9,2);

//    $imgUrl = "(:neo_flv_V-player ".$diaryImgDirURL.$diaryYear."/".$diaryMonth.$img." :)";
   $imgUrl = "(:neo_flv_V-player ".$diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img." :)";
    
    return $imgUrl;
  }
  else { return ""; }
}

// Return 2 if this is a diary page
// Return 1 if this is a diary year page
// Return 0 otherwise
function isDiaryPage()
{
  global $pagename;

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

// For diary pages, automatically read the corresponding photo directory and list the file
// names of all the images and videos under their recorded date.
// The year and month of the file name of the image will be ignored actually.
function pasteImgURLToDiary($text)
{
  if (isDiaryPage() != 2) { return $text; }

  global $pagename;
  
  $diaryYear = substr($pagename,5,4);
  $diaryMonth = (string)(int)substr($pagename,9,2);

  // This function is applied since Nov. 2015
  if ((int)$diaryYear*12+(int)$diaryMonth < (2015*12+11)) { return $text; }
  
  // Read the photo directory of this month
  $dir = "../Photo/".$diaryYear."/".$diaryMonth;
  $file = @scandir($dir);
  $N_FILE = count($file);
  
  for ($iDay=1; $iDay<=31; $iDay++) { $dayImgList[$iDay] = ""; }

  for ($iFile=1; $iFile<=$N_FILE; $iFile++)
  {
    // Check if this is a valid image file with correct filename format.
    $imgName = $file[$iFile];
    $imgUrl = getDiaryImgUrl($imgName);
    if ($imgUrl == "")
    {
      $imgUrl = getDiaryVideoUrl($imgName);
      if ($imgUrl == "") { continue; }
    }
  
    // Get its date & hour
    // If the 3rd or 2nd position is "_", it's a downloaded pic with manually typed filename.     
    // Else the file name is automatically given as YYYYMMDD_HHMMSS.jpg
    if ($imgName[2] == "_")
    {
      $imgDay = (int)substr($imgName,0,2);
      $imgHour = (int)substr($imgName,3,2);
    }
    else if ($imgName[1] == "_")
    {
      $imgDay = (int)substr($imgName,0,1);
      $imgHour = (int)substr($imgName,2,2);
    }
    else
    {
      $imgDay = (int)substr($imgName,6,2);
      $imgHour = (int)substr($imgName,9,2);
    }
    
    // Before 6am, it's still the same day...    
    // If the image is a downloaded one with a manually typed filename, the 6am rule 
    // is not applied.
    if ($imgName[2] == "_" || $imgName[1]) { $imgHour = ($imgHour+6) % 24; }
    if ($imgHour<6)
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
        {
          $text = substr_replace($text, "\n** ".$dayImgList[$iDay]."\n", $dayEndPos, 0);
        }
        // Deal with the last day of the month without enough newline.
        else
        { $text .= "\n** ".$dayImgList[$iDay]."\n"; }
      }
    }
  }
  
  return $text;
}

/****************************************************************************************/

// Java logout timer is more accommodative if physically connected to the home wifi BS and
// accessed locally.  
// Sensitive page rule is not applied if connected to the home BS
$_javaLogoutTimer = $javaLogoutTimer;
if ($isAtHome == 0)
{ 
  // Apply the sensitive page timer to diary pages
  if (isDiaryPage() != 0) { $_javaLogoutTimer = $javaSensitivePageLogoutTimer; }
  
  // Apply the sensitive page timer to specified sensitive pages
  else
  {
    for ($i=0;$i<count($sensitivePage);$i++)
    {  
      if (strcasecmp($sensitivePage[$i],substr($pagename,0,strlen($sensitivePage[$i]))) == 0)
      {
        $_javaLogoutTimer = $javaSensitivePageLogoutTimer;
        break;
      }
    }
  }
}

$timerJavaSrc = "  

//import java.util.Calendar;
//Date dateobj = new Date();

  var TIMER_EXP_DURATION = $_javaLogoutTimer;
  var timer;

  function startTimer()
  {
      display = document.querySelector('#ID_LOGOUTTIMER');
      
      var clock = new Date();
      timer = Math.ceil(clock.getTime()/1000) + TIMER_EXP_DURATION;
      
      setInterval(function ()
      {
        var clock = new Date();          
        var diff = timer - Math.ceil(clock.getTime()/1000);

        if (diff < 0)
        {
          httpPageName = 'http://"."$pagename"."';
          window.location = httpPageName;
        }
        
        hour = parseInt(diff / 3600, 10);
        minutes = parseInt((diff-hour*3600) / 60, 10);
        seconds = parseInt(diff % 60, 10);

        hour = hour < 10 ? \"0\" + hour : hour;
        minutes = minutes < 10 ? \"0\" + minutes : minutes;
        seconds = seconds < 10 ? \"0\" + seconds : seconds;

        display.textContent = hour +\":\" + minutes + \":\" + seconds;
    }, 1000);
  }";

$HTMLHeaderFmt[] .= "<script type='text/javascript'><!--
  ".$timerJavaSrc."
  
  window.addEventListener('load', startTimer, false);

  function resetJavaTimer() { var clock = new Date(); timer = Math.ceil(clock.getTime()/1000) + TIMER_EXP_DURATION; }
  window.addEventListener('focus', resetJavaTimer, false);
  window.addEventListener('scroll', resetJavaTimer, false);
  window.addEventListener('click', resetJavaTimer, false);
  window.addEventListener('keypress', resetJavaTimer, false);
  --></script>";
  
/****************************************************************************************/
  
// Remember the text edit area scroll position.
if ($action == 'edit')
{ $HTMLHeaderFmt[] .= "<script type='text/javascript' src='$PubDirUrl/rememberScroll.js'></script>"; }

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

        // This supports negative numbers but not decimal
        preg_match_all('/-?[0-9]+/', $_line, $matches);

        // This supports decimal numbers but not negative
//        preg_match_all('#\d+(?:\.\d{1,2})?#', $_line, $matches);
                
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

function isEncryptStr($text)
{
  global $ENC_KEYWORD, $ENC_KEYWORD_LEN;
  	
  // See if the given text has been encrypted by checking the enc keyword
  // "CRC" is another keyword which means that the string is first protected by CRC before
  // the encryption
  $heading = substr($text,0,$ENC_KEYWORD_LEN);
  if ($heading === $ENC_KEYWORD) { return 1; }
  else if ($heading === "CRC") { return 2; }
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
	
/*
  $noEncryptPageName = array("SiteAdmin.Status");
  
  $NUM = count($noEncryptPageName);

  for ($i=0;$i<$NUM;$i++)
  {
    $partPagename = substr($pagename,0,strlen($noEncryptPageName[$i]));
    if (strcasecmp($partPagename, $noEncryptPageName[$i]) == 0)
    { return 1; }
    // The dot will be replaced by slash and called by the system. Have to deal with this
    // case too.
    else if (strcasecmp($partPagename, str_replace('.','/',$noEncryptPageName[$i])) == 0)
    { return 1; }
  }
  
  return 0;
*/
}

// String encryption. The content of the encrypted string will be preceded by a predefined
// keyword for indicating the fact that it has been encrypted, followed
// by its encryption method, which is also encrypted using a one-way encryption mechanism,
// followed by the initialization vector used for encryption.
// Return
// encrypted text if successfully encrypted;
// false on error, already encrypted, or empty string provided.
function encryptStr($text)
{
  // Get the pass phrase. It should be set right after a successful login.
  global $OPENSSL_PASS;
  if ($OPENSSL_PASS == "") { return false; }
//  { echo "empty pass no encrypt for $file! "; return false; }

  global $ENC_KEYWORD, $ENC_KEYWORD_LEN, $OPENSSL_METHOD;

  // Configure whether CRC is used for checking if the encryption key is correct.
  $EnableCRC = 0;
  
  if ($text == "") { return false; }
  else
  {    
    // Don't encrypt the page if it's been encrypted already.
    if (substr($text,0,$ENC_KEYWORD_LEN) == $ENC_KEYWORD) { return false; }
    else
    {
      // Using pagename as part of the passphrase gives me some trouble. Give up this 
      // feature for the time being.
      $pagename = "";
      
      // Generate a random initialization vector. It is then put before the encrypted  
      // text.
      global $IV_LEN;
      $iv = openssl_random_pseudo_bytes($IV_LEN);
      
      // Calculate CRC if enabled. Prepend the text with the CRC.
      if ($EnableCRC) { $text = (string)crc32($text)."\n".$text; }

      // Compute the encryption key. The encryption key for a specific page is set to the 
      // following pass phrase appended by its pagename and then hashed using crypt() with
      // crypt($OPENSSL_METHOD) being its salt.
      $cryptMethod = crypt($OPENSSL_METHOD);
      $salt = $cryptMethod;  
      $encryptionKey = crypt($OPENSSL_PASS.strtoupper($pagename), $salt);
 
      $encryptText = openssl_encrypt ($text, $OPENSSL_METHOD, $encryptionKey, OPENSSL_RAW_DATA, $iv);
      if ($encryptText === false) { Abort("$pagename encryption error!"); }

      // If CRC is prepended before encrypting, prepend the encrypted text with "CRC"; 
      // otherwise prepend it with a predefined keyword for encryption, currently set to
      // "ENC" and should have the same length with "CRC".
      if ($EnableCRC) { $KEYWORD = "CRC"; }
      else { $KEYWORD = $ENC_KEYWORD; }
      $encryptText = $KEYWORD."\n".$cryptMethod."\n".$iv.$encryptText;
      
      return $encryptText;
    }
  }
}

// String decryption. Decrypt the string if the keyword for encryption has been found,
// and the encryption method and passphrase both check. Return
// decrypted text if decrypted
// "$text" if not encrypted, i.e., "$text" is plain text/empty passphrase provided
// 0 if encrypted but empty passphrase provided
// -1 for decryption error, e.g., wrong key or settings
function decryptStr($text)
{
  global $ENC_KEYWORD_LEN, $OPENSSL_METHOD;

  // See if this page has been encrypted   
  if (isEncryptStr($text) == false) { return $text; }
  else
  {
    $cryptMethodLen = strpos($text,"\n",$ENC_KEYWORD_LEN+1) - $ENC_KEYWORD_LEN - 1; // -1 is for \n
    $cryptMethod = substr($text,$ENC_KEYWORD_LEN+1,$cryptMethodLen); 

    // Decrypt the page if the encryption method checks
    if (crypt($OPENSSL_METHOD,$cryptMethod) !== $cryptMethod)
    { echo "$file was encrypted using a different cipher!"; return -1; }
    else
    {
      // Using pagename as part of the passphrase gives me some trouble. Give up this 
      // feature for the time being.
      $pagename = "";
        
      // Retrieve the initialization vector.
      global $IV_LEN;
      $iv = substr($text,$ENC_KEYWORD_LEN+$cryptMethodLen+2, $IV_LEN);

      // Retrieve the salt and compute the encryption key; decrypt.
      $salt = $cryptMethod;
      global $OPENSSL_PASS;
      if ($OPENSSL_PASS == "") { return 0; }
      $encryptionKey = crypt($OPENSSL_PASS.strtoupper($pagename),$salt);
      $decryptText = openssl_decrypt (substr($text,$ENC_KEYWORD_LEN+$cryptMethodLen+2+$IV_LEN), $OPENSSL_METHOD, $encryptionKey, OPENSSL_RAW_DATA, $iv);
      if ($decryptText === false)
      { echo "$pagename decryption fails at openssl_decrypt(). Possibly a wrong passphrase!"; return -1; }

      // Check CRC to see if the correct passphrase is used.
      if (isEncryptStr($text) == 2)
      {
        $pos = strpos($decryptText,"\n");
        $crc = substr($decryptText,0,$pos);          
        $decryptText = substr($decryptText,$pos+1);
          
        if ((string)crc32($decryptText) != $crc)
        { echo "CRC doen't check. $file was encrypted using a different passphrase!"; return -1; }                  
      }

      return $decryptText;        
    }
  }
}

/****************************************************************************************/

// Reconstruct pageindex if nonexistent by performing an empty search.
function reconstructPageindex()
{
  global $PageIndexFile;
  if (file_exists($PageIndexFile) === false)
  {  
    $opt['action'] = 'search';
    MakePageList("Main.Homepage", $opt, 0, 1);
  }
}

// Check the last time we modify this page, and the last time we update the page index for this page
// If the last modification time is after the pageindex update time, update the pageindex,
// and replace the page with an updated pageindex update time.
// Return 
function updatePageindexOnBrowse($pagename, $page)
{
  global $WorkDir;
  $file = "$WorkDir/$pagename";
  
  global $Now;
  $pageLastModTime = $page['time'];
  $lastPageindexUpdateTime = $page['lastPageindexUpdateTime'];

  // See if the time attribute has been set. If not, then this page is most likely invalid.
  if (isset($pageLastModTime) && noEncryptPage($pagename) == 0)
  {
    // See if the "lastPageindexUpdateTime" has been set. If not, then this page is from 
    // previous releases. Update the pageindex depending on its last modified time.
    // On 2nd thought, normally lastPageindexUpdateTime should be set already when viewed
    if (!isset($lastPageindexUpdateTime) || $pageLastModTime <= $lastPageindexUpdateTime) {}
    else
    {
      // Update pageindex file.
      Meng_PageIndexUpdate($pagename);

      $pageContent = fileGetContentsWait($file);
      $pageContent = decryptStr($pageContent);
      if ($pageContent === -1) { echo "Read page error on updatePageindexOnBrowse()"; return; }

      // This field should exist according to the parent if else condition.
      $pos = strpos($pageContent,$lastPageindexUpdateTime);
      if ($pos === false) { echo "In $pagename, the field \"lastPageindexUpdateTime\" does not exist while it should!"; }
      else { $pageContent = substr_replace($pageContent, $Now, $pos, strlen($lastPageindexUpdateTime)); }

      global $EnableEncryption;      
      if ($EnableEncryption == 1) { $pageContent = encryptStr($pageContent); }
      
      filePutContentsWait("wiki.d/$pagename", $pageContent);

      unlink("$WorkDir/$pagename");        
      renameWait("wiki.d/$pagename", "$WorkDir/$pagename");
    }
  }
}

/****************************************************************************************/

// Cookie verification

//$HTMLHeaderFmt[] .= "<script type='text/javascript' src='$PubDirUrl/userVerify.js'></script>";

/****************************************************************************************/

// Insert jpg
/*
$IMG_PATH = "../../../";

function data_uri($file, $mime) 
{  
  $contents = file_get_contents($file);
  $base64   = base64_encode($contents); 
  return ('data:' . $mime . ';base64,' . $base64);
}

$test = data_uri($IMG_PATH.'20151202_999999.jpg','image/png');

*/

/****************************************************************************************/
