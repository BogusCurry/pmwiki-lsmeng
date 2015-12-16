<?php 
/* Various enhancements for pmWiki written by Ling-San Meng (Sam Meng).
 * If the function follows a line beginning with "FmtPV," the function is callable
 * from within wiki pages using markup language {$nameOfFunction}
 *
 * Email: f95942117@gmail.com
 * Last Modified: 2015/12/13
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

// Similar to file_get_contents(). Wait a random time duration if the file doesn't exist.
// A maximum number of retry limit can be set.
function fileGetContentsWait($file, $N_TRY=1)
{
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  
  $nTry = 1;
  while (1)
  {
    if (file_exists($file) !== false)
    {
      $text = file_get_contents($file);
      return $text;
    }
    else
    {
      $nTry++;
      if ($nTry>$N_TRY) { return ""; }
   
      $waitMicroSec = rand($minWaitMicroSec,$maxWaitMicroSec);
      usleep($waitMicroSec); 
    }  
  }
}

// Create a file or kill it if existent, and then write "content" to it.
// Wait a random time duration if the above steps produce error.
// A maximum number of retry limit can be set.
function filePutContentsWait($file, $content, $N_TRY=1)
{
  $minWaitMicroSec = 1000000;
  $maxWaitMicroSec = 5000000;
  
  $nTry = 1;
  while (1)
  {
    $return_var = 0;
    if (file_exists($file) !== false) { system("rm -f ".$file, $return_var); }
    $fp=@fopen($file,"w");
    if ($return_var === 0 && $fp !== false)
    {
      fputs($fp,$content);
      fclose($fp);
      break;
    }
    else
    {
      $nTry++;
      if ($nTry>$N_TRY) { break; }
   
      $waitMicroSec = rand($minWaitMicroSec,$maxWaitMicroSec);
      usleep($waitMicroSec); 
    }
  } 
}

// Set the entry "$parameter" of user "$IP" to "$value".
// A new entry "$parameter" will be created in case that the entry doesn't exist.
// A new entry "$parameter" of user "$IP" will be created in case the user "$IP" doesn't 
// exist.
function setParameterValue($IP,$parameter,$value)
{
  global $timeStampFile;
  $file = $timeStampFile;
  $text = fileGetContentsWait($file,10);
  
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
      $endOfLinePos = strpos($text,"\n",$pos+1);
      $newText = substr($text,0,$endOfLinePos).$parameter.$value." ".substr($text,$endOfLinePos,strlen($text)-$endOfLinePos);
    }
    else
    {
      $parameterLen = strlen($parameter);
      $oldValue = getParameterValue($IP,$parameter,$text);
      $oldValueLen = strlen($oldValue);
      $newText = substr($text,0,$parameterPos+$parameterLen).$value.substr($text,$parameterPos+$parameterLen+$oldValueLen,strlen($text)-$parameterPos-$parameterLen-$oldValueLen);
    }
  }
  // This is a new IP
  else
  { $newText = $text."IP_".$IP." ".$parameter.$value." \n"; }

  filePutContentsWait($file,$newText,10);
}

// Get the entry "$parameter" of user "$IP", then return its current value.
// Empty string is returned in case the entry doesn't exist.
function getParameterValue($IP,$parameter,$inputText="")
{
  $text = "";
  if ($inputText !== "") { $text = $inputText; }
  else
  {
    global $timeStampFile;
    $file = $timeStampFile;
    $text = fileGetContentsWait($file,10);
  }

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

      $actual_link = "$_SERVER[REQUEST_URI]";
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
    
    if ($lastTimeStamp == "")
    {
      sendAlertEmail($IP." (unseen browser and IP)");
    }

    // The IP was previously editing something
    else if ($lastTimeStamp == -2)
    {
      $actual_link = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
      $pos1 = strpos($actual_link,"=");

      $currentPagename = substr($actual_link,$pos1+1,strlen($actual_link)-$pos1);
      redirect($currentPagename."?action=edit");
    }
    else if ($lastTimeStamp > 0)
    {
      // Timer hasn't expired.
      $elapsedTime = time()-$lastTimeStamp;
      if ($elapsedTime < $logoutTimerInSec) { sendAlertEmail($IP." (existing IP but unseen browser)"); }
//      else { sendAlertEmail($IP." (php session timed out I guess)"); }
    }
  }  
}


# For img size toggle; adapted from flipbox.
include_once($FarmD.'/cookbook/imgSizeToggle.php');

// Replace the image filenames with their full URL.
// The filename has to follow a specific format as YYYYMMDD_HHMMSS.jpg
// The URL is preceded by a image height setting provided in "config.php"
function replaceImgWithUrl($text,$extension)
{  
  $count = 1;
  $pos = 0;
  while(1)
  {
    $pos = @strpos($text, $extension, $pos);
    
    if ($pos !== false)
    {
      // Format check by examining the underscore and the character right before the filename. 
      // Remove checking "}" after I get rid of all the old image heading {$imgPx}
      // "sameTimeChar" is to handle photos taken at exactly the same time so that the file name
      // is appended by an English letter.
// Loosening the check after cleaning up all the old img headings
      $isImgFileNameValid = 0;
      $sameTimeChar = "";
      if ($text[$pos-7] == "_" && $text[$pos-16] !== "/" && $text[$pos-16] !== "}" && $text[$pos-14] == "0" && $text[$pos-15] == "2")
      { $isImgFileNameValid = 1; }
      else if ($text[$pos-8] == "_" && $text[$pos-17] !== "/" && $text[$pos-17] !== "}" && $text[$pos-15] == "0" && $text[$pos-16] == "2")
      { $isImgFileNameValid = 1; $sameTimeChar = "a"; }
      
      if ($isImgFileNameValid == 1)
      {
        $l = strlen($sameTimeChar);
        
        $originalFileName = substr($text,$pos-15-$l,19+$l);
 
        $imgUrl = "http://localhost/Photo/".substr($originalFileName,0,4)."/";      
        if (strcmp(substr($originalFileName,4,1),"0")==0)
        { $imgUrl .= substr($originalFileName,5,1)."/"; } 
        else { $imgUrl .= substr($originalFileName,4,2)."/"; }
        $imgUrl .= $originalFileName;

        $flipboxMarkup = FmtImgSizeToggle('_',$count,$imgUrl);
        $text = substr_replace($text, $flipboxMarkup, $pos-15-$l, 19+$l);
        
        $pos = $pos+strlen($flipboxMarkup);
        $count++;
      }

      else { $pos = $pos+4; }
    }
    else { break; }
  }

  return $text;
}

// Return the full URL of images put in the diary photo directory based on the image filename.
// The filename has to follow a specific format as YYYYMMDD_HHMMSS.jpg
// An empty string is returned if the format doesn't check.
function getDiaryImgUrl($img)
{  
  // Check if it has the image extension.

  $extension = substr($img,strlen($img)-4,4);
  if ($extension !== ".jpg" && $extension !== ".png") { return ""; }
 

      // Format check by examining the underscore and the character right before the filename. 
      // "sameTimeChar" is to handle photos taken at exactly the same time so that the file name
      // is appended by an English letter.
      $isImgFileNameValid = 0;
      $sameTimeChar = "";
      if ($img[8] == "_" && $img[0] == "2" && $img[1] == "0")
      {
        if (strlen($img) == 19)
        {
          $isImgFileNameValid = 1;
        }
        else if (strlen($img) == 20)
        {
          $isImgFileNameValid = 1;
          $sameTimeChar = $img[15];
        }
        else { return ""; }
      }
      else { return ""; }

      if ($isImgFileNameValid == 1)
      {
        $l = strlen($sameTimeChar);
        
        $imgUrl = "http://localhost/Photo/".substr($img,0,4)."/";      
        if (strcmp(substr($img,4,1),"0")==0)
        { $imgUrl .= substr($img,5,1)."/"; } 
        else { $imgUrl .= substr($img,4,2)."/"; }
        $imgUrl .= $img;

        return $imgUrl;
      }
      else { return ""; }
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
function sendAlertEmail($clientIP,$subject = "Pmwiki Login Alert")
{
  global $emailAddress1;
  global $emailAddress2;
  
  $today = getdate();
  $minStr = $today[minutes];
  if ($minStr<10) { $minStr = "0".$today[minutes]; }
  $secStr = $today[seconds];
  if ($secStr<10) { $secStr = "0".$today[seconds]; }
  $formatTime = $today[year]."/".$today[mon]."/".$today[mday]." ".$today[hours].":".$minStr.":".$secStr;

  // Get browser and OS info.
  $obj = new OS_BR();
  $browser = $obj->showInfo('browser');
  $browserVersion = $obj->showInfo('version');
  $OS = $obj->showInfo('os');   
  $str = $formatTime."\n\n"."From\n".$clientIP."\n\nUsing\n".$OS.", ".$browser." ".$browserVersion;

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
  if (file_exists($srcFile) !== false) { shell_exec("rm -f ".$srcFile); }
  if (file_exists($outputFile) !== false) { shell_exec("rm -f ".$outputFile); }

  $page = RetrieveAuthPage("Main.Runcode", 'read', false, READPAGE_CURRENT);
  $text = $page['text'];

  // Write the src codes to file and remove the c exe file
  // Actually the whole process can be made even more secure by bypassing the file read/write
  // step completely. Since the current state is also acceptable, let's just leave it
  // as it is for now.
  $fp=fopen($srcFile,"w");
  fputs($fp,$text);
  fclose($fp);
  if (file_exists($cExeFile) !== false) { shell_exec("rm -f ".$cExeFile); }  

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
  shell_exec("rm -f ".$srcFile);
  $text = "[@".addLineNum($text)."@]";
  $fp=fopen($srcFile,"w");
  fputs($fp,$text);
  fclose($fp);
}

// For diary pages, automatically read the corresponding photo directory and list the file
// names of all the images and videos under their recorded date.
function addImgURLToDiary($pagename,$text)
{
  // Check if this is a diary page
  $basename = $pagename;
  $pos = strpos($pagename,"-Draft");
  if ($pos !== false) { $basename = substr($pagename,0,strlen($pagename)-6); }
  $pagenameLen = strlen($basename);
  if ($pagenameLen !== 11) { return $text; }
  $pageGroup = substr($basename,0,5);
  if ($pageGroup !== "Main.") { return $text; }
  $diaryYear = substr($basename,5,4);
  if ((int)$diaryYear < 2003 || (int)$diaryYear > 2100) { return $text; }
  $diaryMonth = substr($basename,9,2);
  if ((int)$diaryMonth < 1 || (int)$diaryMonth > 12) { return $text; }

  // This function is applied since Dec. 2015
  if ((int)$diaryYear+(int)$diaryMonth < 2027) { return $text; }
  
  // Read the photo directory of this month
// Call config.php
  $dir = "../Photo/".$diaryYear."/".$diaryMonth;
  $file = scandir($dir);
  $N_FILE = count($file);
  
  for ($iDay=1; $iDay<=31; $iDay++) { $dayImgList[$iDay] = ""; }

  for ($iFile=1; $iFile<=$N_FILE; $iFile++)
  {
    // Check if this is a valid image file with correct filename format.
    $imgName = $file[$iFile];
    $imgUrl = getDiaryImgUrl($imgName);
    if ($imgUrl == "") { continue; }
  
    // Get its date & hour
    // Before 6am, it's still the same day...
    $imgDay = (int)substr($imgName,6,2);
    $imgHour = (int)substr($imgName,9,2);
    $imgHourMinSecStr = substr($imgName,9,6);
    if ($imgHour<6 && $imgDay>1) { $imgDay--; }

/*
    // Append the image to an array having the same date
    // Use vertical mode for all the video, since I have no choice over the mode now and
    // vertical is used more often
    if ($extension == ".mp4")
    { $dayImgList[$imgDay] .= "V".$imgName." "; }
    else
    { $dayImgList[$imgDay] .= $imgName." "; }
*/
    $dayImgList[$imgDay] .= $imgUrl." ";
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