<?php if (!defined('PmWiki')) exit();
/* Various enhancements written by Ling-San Meng (Sam Meng).
 * If the function follows a line beginning with "FmtPV," the function is callable
 * from within wiki pages using markup language {$nameOfFunction}
 *
 * Email: f95942117@gmail.com
 * Last Modified: 2015/11/15
*/

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
$FmtPV['$getNoEmptyRandLine'] = 'getNoEmptyRandLine($pn)';
function getNoEmptyRandLine($pagename)
{
  $count = 0;
  while (1)
  {
    $str = getRandLine($pagename);
    $strStripSpace = preg_replace('/\s+/', '', $str);
    if ($strStripSpace !== "\n" && $strStripSpace !== "" && $strStripSpace !== "	" 
       && $strStripSpace !== "\\") { return "$str"; }
    
    $count++;
    if ($count>1000) { return "This is an almost empty page!"; }
  }
}

// Return a string containing past diary corresponding to today's date number. 
$FmtPV['$printOnThisDay'] = 'printOnThisDay($pn)';
function printOnThisDay($pagename)
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

// Return a string of the pagename for editing today's diary.
$FmtPV['$editToday'] = 'editToday()';
function editToday()
{    
  $today = getdate();
  
  $pageName = "Main.".$today[year];
  if ($today[mon]<10) { $pageName .= "0"; } 
  $pageName .= $today[mon]."-Draft?action=edit";

  return "[[".$pageName."|"."'''Diary''']]";
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

// Set the entry "$parameter" of user "$IP" to "$value".
// A new entry "$parameter" will be created in case that the entry doesn't exist.
// A new entry "$parameter" of user "$IP" will be created in case the user "$IP" doesn't 
// exist.
function setParameterValue($IP,$parameter,$value)
{
  global $timeStampFile;
  $file = $timeStampFile;
  $text = file_get_contents($file);
  $pos = strpos($text,$IP);
  $newText = "";  

  // If the IP already exists
  if ($pos !== false)
  {
    $parameterPos = strpos($text,$parameter,$pos+1);
    $parameterLen = strlen($parameter);
    // If the field already exists
    if ($parameterPos !== false)
    {
      $oldValue = getParameterValue($IP,$parameter);
      $oldValueLen = strlen($oldValue);

      $newText = substr($text,0,$parameterPos+$parameterLen).$value.substr($text,$parameterPos+$parameterLen+$oldValueLen,strlen($text)-$parameterPos-$parameterLen-$oldValueLen);
    }
    else
    {      
      $endOfLinePos = strpos($text,"\n",$pos+1);
      $newText = substr($text,0,$endOfLinePos).$parameter.$value." ".substr($text,$endOfLinePos,strlen($text)-$endOfLinePos);
    }
  }
  // This is a new IP
  else
  {  
    $newText = $text."IP_".$IP." ".$parameter.$value." \n";
  }
  file_put_contents($file, $newText);
}

// Get the entry "$parameter" of user "$IP", then return its current value.
// Empty string is return in case the entry doesn't exist.
function getParameterValue($IP,$parameter)
{
  global $timeStampFile;
  $file = $timeStampFile;
  $text = file_get_contents($file);
  $pos = strpos($text,$IP);

  // If the IP already exists
  if ($pos !== false)
  {
    $parameterPos = strpos($text,$parameter,$pos+1);
    $parameterLen = strlen($parameter);
    $valueEndPos = strpos($text," ",$parameterPos+$parameterLen);
    return substr($text,$parameterPos+$parameterLen,$valueEndPos-$parameterPos-$parameterLen);
  }
  else { return ""; }
}

// Check the stored time stamp status in a text file on each wiki view/edit with
// successful authentication. If the wiki hasn't been accessed for a duration longer than
// a prespecified timer (in "config.php"), the wiki builtin logout function is called to request a site-wide 
// password. In this case the time stamp is changed to some special values as detailed below
//   Time stamp = 0 means the user just logged in using an unseen IP.
//   Time stamp = -1 means the specified keep alive timer has expired.
//   Time stamp = -2 means the specified keepalive timer has expired, and you are currently
//   editing something.
// So after typing the correct password (so this function is called again), we can recover
// the original page according to the time stamp status.
function checkTimeOnAuthSuccess($IP,$loginStatus)
{
  $lastTimeStamp = getParameterValue($IP,"TimeStamp_");
  global $logoutTimerInSec;

  $today = getdate();
  $minStr = $today[minutes];
  if ($minStr<10) { $minStr = "0".$today[minutes]; }
  $secStr = $today[seconds];
  if ($secStr<10) { $secStr = "0".$today[seconds]; }
  $formatTime = $today[year]."/".$today[mon]."/".$today[mday]."_".$today[hours].":".$minStr.":".$secStr;

  // If the user was previously authenticated, and is using a cached password
  // or there is a sudden IP change
  if ($loginStatus == 1 || "$loginStatus" == "")
  {
    // Timer hasn't expired.
    $elapsedTime = time()-$lastTimeStamp;
    if ($elapsedTime < $logoutTimerInSec)
    {
      setParameterValue($IP,"TimeStamp_",time());
      setParameterValue($IP,"LastSeen_",$formatTime);
    }

    // Timer has expired.
    else
    {
      // Rare case; an authenticated user suddenly changes his IP
      if ("$loginStatus" == "")
      { sendAlertEmail($IP." (same browser but unseen IP; a sudden IP change)"); }

      $actual_link = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
      $pos1 = strpos($actual_link,"=");
      $pos2 = strpos($actual_link,"?action");
      $currentPagename = "";
      if ($pos1 === false) { $currentPagename = "Main.HomePage"; }
      else if ($pos2 === false) { $currentPagename = substr($actual_link,$pos1+1,strlen($actual_link)-$pos1); }
      else { $currentPagename = substr($actual_link,$pos1+1,$pos2-$pos1-1); }

      $isEditing = strpos($actual_link,"?action=edit");
      if ($isEditing === false) { setParameterValue($IP,"TimeStamp_",-1); setParameterValue($IP,"LastSeen_",$formatTime); }
      else { setParameterValue($IP,"TimeStamp_",-2); setParameterValue($IP,"LastSeen_",$formatTime); } 
      HandleLogoutA($currentPagename);
    }
  }
  // The user just logged in by typing a correct password
  else
  {
    setParameterValue($IP,"TimeStamp_",time());
    setParameterValue($IP,"LastSeen_",$formatTime);
    
    if ($lastTimeStamp == "") { sendAlertEmail($IP." (unseen browser and IP)"); }

    // The IP was previously
    else if ($lastTimeStamp == -2)
    {
      $actual_link = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
      $pos1 = strpos($actual_link,"=");

      $currentPagename = substr($actual_link,$pos1+1,strlen($actual_link)-$pos1);
      redirect($currentPagename."?action=edit");
    }
    else if ($lastTimeStamp > 0)
    { sendAlertEmail($IP." (existing IP but unseen browser)"); }
  }  
}



// Replace the image filenames with their full URL.
// The filename has to follow a specific format as YYYYMMDD_HHMMSS.jpg
// The URL is preceded by a image height setting provided in "config.php"
function replaceImgWithUrl($text)
{
  global $imgHeightPx;
  
  $pos = 0;
  while(1)
  {
    $pos = strpos($text, ".jpg", $pos);
    
    if ($pos !== false)
    {
      // Format check by examining the underscore and the character right before the filename. 
      // Remove checking "}" after I get rid of all the old image heading {$imgPx}
      $charBeforeFileName = $text[$pos-16];
// Loosening the check after cleaning up all the old img headings
      if ($text[$pos-7] == "_" && $charBeforeFileName !== "/" && $charBeforeFileName !== "}" && $text[$pos-14] == "0" && $text[$pos-15] == "2")
      {
        $originalFileName = substr($text,$pos-15,19);

        $filePath = "%height=".$imgHeightPx."px%http://localhost/Photo/".substr($originalFileName,0,4)."/";
        if (strcmp(substr($originalFileName,4,1),"0")==0)
        { $filePath .= substr($originalFileName,5,1)."/"; } 
        else { $filePath .= substr($originalFileName,4,2)."/"; }

// NO BUG???
        $text = substr($text,0,$pos-15).$filePath.substr($text,$pos-15,strlen($text));

        $pos = $pos+strlen($filePath)+4;
      }    
      else { $pos = $pos+4; }
    }
    else { break; }
  }

  return $text;
}

// Replace the video filenames with the full command for calling the neo flv media player.
// The video size setting is in "config.php"
// The filename has to follow a specific format as YYYYMMDD_HHMMSS.mp4
// If the filename is preceded by "V", the vertical version of neo player will be called
// The player size settings are in "config.php"
function replaceVideoWithUrl($text)
{
  $pos = 0;
  while(1)
  {
    $pos = strpos($text, ".mp4", $pos);
    
    if ($pos !== false)
    {
      // Format check by examining the underscore and the character right before the filename. 
      $charBeforeFileName = $text[$pos-16];

      if ($text[$pos-7] == "_" && $charBeforeFileName !== "/")// && $text[$pos-14] == "0" && $text[$pos-15] == "2")
      {
        $originalFileName = substr($text,$pos-15,19);
        
        // Take care of the vertical video heading.
        $filePath = "";
        if ($charBeforeFileName == "V") { $filePath = "(:neo_flv_V-player "; }
        else { $filePath = "(:neo_flv-player "; }
        
        $filePath .= "http://localhost/Photo/".substr($originalFileName,0,4)."/";
        if (strcmp(substr($originalFileName,4,1),"0")==0)
        { $filePath .= substr($originalFileName,5,1)."/"; } 
        else { $filePath.= substr($originalFileName,4,2)."/"; }

        if ($charBeforeFileName == "V")
        {
          $text = substr($text,0,$pos-16).$filePath.$originalFileName." :)".substr($text,$pos+4,strlen($text));
        }
        else
        {  
          $text = substr($text,0,$pos-15).$filePath.$originalFileName." :)".substr($text,$pos+4,strlen($text));
        }
        
        $pos = $pos+strlen($filePath)+4;
      }    
      else { $pos = $pos+4; }
    }
    else { break; }
  }

  return $text;
}

// Should be clear.
function sendAlertEmail($clientIP)
{
  global $emailAddress;
  
  // Get browser and OS info.
  $obj = new OS_BR();
  $browser = $obj->showInfo('browser');
  $browserVersion = $obj->showInfo('version');
  $OS = $obj->showInfo('os');   
  $str = "From\n".$clientIP."\n\nUsing\n".$OS.", ".$browser." ".$browserVersion;

  // Call shell script to send an email with the above info.      
  shell_exec("echo \"".$str."\" | mail -s \"Pmwiki Login Alert\" ".$emailAddress." -f donotreply");
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


$srcFile = "pub/test/phpSrc.txt";
$outputFile = "pub/test/phpOutput.txt";

function runPHP($pagename)
{
  global $srcFile, $outputFile;
  $page = RetrieveAuthPage("Main.Phpsrc", 'read', false, READPAGE_CURRENT);
  $text = $page['text'];
  $newText = " ".str_replace("\n","\n ",$text);
  
  // PHP
  // Actually php execution can be made even more secure by bypassing the file read/write
  // step directly. For better similarity with C and also because I'm lazy, let's leave 
  // it for now.
  if (file_exists($srcFile) !== false) { shell_exec("rm -f ".$srcFile); }
  $fp=fopen($srcFile,"w");
  fputs($fp,$newText);
  fclose($fp);

  if (file_exists($outputFile) !== false) { shell_exec("rm -f ".$outputFile); }
  $result = shell_exec('php '.$srcFile);
  $fp=fopen($outputFile,"w");
  fputs($fp,$result);
  fclose($fp);

  // Due to security issue, comment out C++ execution mechanism.
  // Since php executes the shell script "g++" with the directory path of the very first
  // php script called, which is pmwiki.php in this case, a.out can't be generated if the 
  // parent directory is not writable. To put the source code in a folder other than "pmwik"
  // and to be able to compile it, we have to redirect the browser to another php
  // script in that folder to force the php change its execution path (hence a.out will
  // be generated in that folder). To achieve this, the folder has to be accessible 
  // through http, i.e., .htaccess deny from all cannot be placed in the folder. I believe 
  // this causes security holes.
  // Remove .htaccess from "pmwiki/pub/test" if you do want to activate this feature.
  
/*
// C++
# Create a readonly main.cpp with $newText
if (file_exists('pub/test/main.cpp') !== false) { shell_exec("rm -f pub/test/main.cpp"); }
if (file_exists('pub/test/compileAndRedirect.php') !== false) { shell_exec("rm -f pub/test/compileAndRedirect.php"); }
if (file_exists('pub/test/a.out') !== false) { shell_exec("rm -f pub/test/a.out"); }
$fp=fopen("pub/test/main.cpp","w");
fputs($fp,$newText);
fclose($fp);

# Create a readonly textfile and inject with source code "calling g++ and redirect back"
$fp=fopen("pub/test/compileAndRedirect.php","w");
$str = "<?php\nshell_exec(\"g++ main.cpp\");\n\$pageurl = \"http://localhost/pmwiki/pmwiki.php?n=Main.Phpsrc\";\n\$RedirectDelay=0;\nheader(\"Location: \$pageurl\");\necho \"<html><head><meta http-equiv=\'Refresh\' Content=\'\$RedirectDelay; URL=\$pageurl\' /><title>Redirect</title></head><body></body></html>\";";
fputs($fp,$str);
fclose($fp);
*/
}
