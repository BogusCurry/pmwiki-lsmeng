<?php if (!defined('PmWiki')) exit();
/* Various enhancements written by Ling-San Meng (Sam Meng).
 * If the function follows a line beginning with "FmtPV," the function is ready to be\
 * called within the wiki page using markup language {$nameOfFunction}
 *
 * Email: f95942117@gmail
 * Date: 2015/11/8
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
  
  $pageName = "Main.".$i;
  if ($today[mon]<10) { $pageName .= "0"; } 
  $pageName .= $today[year].$today[mon]."-Draft?action=edit";

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

// Write the current Unix time in second into a text file.
function updateTimeStamp() { file_put_contents('../../pmwikiTimeStamp.txt', time()); } 

// Check the stored time stamp status in a text file on each wiki view/edit with
// successful authentication. If the wiki hasn't been accessed for a duration longer than
// a prespecified timer (in "config.php"), the wiki builtin logout function is called to request a site-wide 
// password. In this case the time stamp is changed to some special values as detailed below
//   Time stamp = 0 means the specified keep alive timer has expired.
//   Time stamp = -1 means the specified keepalive timer has expired, and you are currently
//   editing something.
// So after typing the correct password (so this function is called again), we can recover
// the original page according to the time stamp status.
function checkTimeOnAuthSuccess()
{
  $file = '../../pmwikiTimeStamp.txt';
  $lastTimeStamp = file_get_contents($file);
  global $logoutTimerInSec;
  
  // Timer hasn't expired.
  $elapsedTime = time()-$lastTimeStamp;
  if ($elapsedTime < $logoutTimerInSec && $elapsedTime > 0) { updateTimeStamp(); }

  // Timer has expired and user has successfully logged in.
  else if ($lastTimeStamp <= 0)
  {
    updateTimeStamp(); 
   
    if ($lastTimeStamp == -1)
    {
      $actual_link = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
      $pos1 = strpos($actual_link,"=");

      $currentPagename = substr($actual_link,$pos1+1,strlen($actual_link)-$pos1);
      redirect($currentPagename."?action=edit");
    }
  }
  
  // Timer has expired.
  else if ($elapsedTime >= $logoutTimerInSec) 
  {
    $actual_link = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
    $pos1 = strpos($actual_link,"=");
    $pos2 = strpos($actual_link,"?action");
    $currentPagename = "";
    if ($pos2 === false) { $currentPagename = substr($actual_link,$pos1+1,strlen($actual_link)-$pos1); }
    else { $currentPagename = substr($actual_link,$pos1+1,$pos2-$pos1-1); }

    $isEditing = strpos($actual_link,"?action=edit");
    if ($isEditing === false) { file_put_contents($file, "0"); }
    else { file_put_contents($file, "-1"); } 
    HandleLogoutA($currentPagename);
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
      if ($text[$pos-7] == "_" && $charBeforeFileName !== "/" && $charBeforeFileName !== "}")// && $text[$pos-14] == "0" && $text[$pos-15] == "2")
      {
        $originalFileName = substr($text,$pos-15,19);

        $filePath = "%height=".$imgHeightPx."px%http://localhost/pmwiki/Photo/".substr($originalFileName,0,4)."/";
        if (strcmp(substr($originalFileName,4,1),"0")==0)
        { $filePath .= substr($originalFileName,5,1)."/"; } 
        else { $filePath .= substr($originalFileName,4,2)."/"; }

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
        
        $filePath .= "http://localhost/pmwiki/Photo/".substr($originalFileName,0,4)."/";
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
