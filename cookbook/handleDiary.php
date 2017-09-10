<?php

// Return the date bullet appended by its associated list of diary images of the given 
// date.
// If $dateBulletText is provided, the bullet text of the given date is assumed to be the
// given value (this is mainly for the text extract module, and avoid some unnecessary
// processing)
// If the year/mon/date is not fully specified, a string of date bullets corresponding
// to the date today for all past years is returned
function printOnThisDay($year = null, $mon = null, $date = null, $dateBulletText = null)
{
  if (!is_null($year) && !is_null($mon) && !is_null($date)) { $isDesignateDate = true; }
  else
  {
    $today = getdate();
    $year = $today[year];
    $mon = $today[mon];
    $date = $today[mday];
  }

  // Note that if year/mon/date has been assigned, the loop is executed only once
  $onThisDayStr = array();
  for($i = $year; $i >= ($isDesignateDate ? $year : 2003); $i--)
  {
    $pageName = "Main.".$i;
    if ($mon < 10) { $pageName .= "0"; }
    $pageName .= $mon;

    $page = RetrieveAuthPage($pageName, 'read', false, READPAGE_CURRENT);
		$text = $page['text'];
		
    // If year/mon/date has been assigned, and the bullet text is provided, skip further
    // processing (for extracting the date bullet text)
    if ($isDesignateDate && !is_null($dateBulletText))
    { $onThisDayStr[$i] = $dateBulletText; }

		// Else parse the the page text to extract the date bullet text
    else
    {
      // Preparing a header for showing the year/mon
      $onThisDayStr[$i] = "\n'''".$i."/".$mon."'''\n\n";
      
      $textDateArray = explode("\n* ", $text);

      if ($date == 1)
      {
        if (preg_match("/^\* *(\[\[#[\w-]*\]\])* *1(,|，)/", $textDateArray[0]))
        { $onThisDayStr[$i] .= $textDateArray[0]; }
      }

      else
      {
        for ($j=1; $j<=31; $j++)
        {
          if (preg_match("/^ *(\[\[#[\w-]*\]\])* *$date(,|，)/", $textDateArray[$j]))
          {
            $onThisDayStr[$i] .= "* ".$textDateArray[$j];
            break;
          }
        }
      }
    }
		
    $result = pasteImgURLToDiary($text, $i, $mon, $date, $onThisDayStr[$i]."\n");
    if ($result !== false) { $onThisDayStr[$i] = $result; }
  }

  return join("", $onThisDayStr);
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

// Read the image folder corresponding to the given year/mon/date; parse the image
// file names to determine their dates, compose the appropriate image urls, and insert the
// image urls under their respective date in $text
// If $bulletText is provided (supposedly the date bullet text corresponding to the given
// $date), insert the appropriate image urls in it instead of $text
// If year/mon is not fully specified, year/mon of "today" is assumed
// Return the text with image urls inserted. Return false if the operation is not
// performed for whatever reasons.
// The year and month of the image file names do not matter.
// This function is applied since Apr. 2015
function pasteImgURLToDiary($text, $diaryYear = "", $diaryMonth = "", $date = "", $bulletText = "")
{
  global $pagename;

  if (empty($diaryYear) || empty($diaryMonth))
  {
    $diaryYear = substr($pagename,5,4);
    $diaryMonth = (string)(int)substr($pagename,9,2);
  }

  // This function is applied since Apr. 2015
  if ((int)$diaryYear*12+(int)$diaryMonth < (2015*12+4)) { return false; }

  // Read the photo directory of this month
  global $Photo;
  $dir = "$Photo/$diaryYear/$diaryMonth";

  if (!file_exists($dir)) { return false; }

  if (!isFolderReadableByUserWWW($dir))
  { echo "Permission for diary photo folder incorrect. It has to be readable by user \"_www\"!<br>"; return false; }

  $file = @scandir($dir);
  $N_FILE = count($file);

  for ($iDay=1; $iDay<=31; $iDay++) { $dayImgList[$iDay] = ""; }

  // Check if this is a valid image file with correct filename format.
  for ($iFile=0; $iFile<$N_FILE; $iFile++)
  {
    $imgName = $file[$iFile];

    // Skip system files & thumbnail images
    if ($imgName === "." || $imgName === "..") { continue; }
    if (strpos($imgName,'_thumb.') !== false) { continue; }

    // If the filename has been explicitly typed on the page, skip format check &
    // skip auto pasting
    if (preg_match("/$imgName/i", $text)) { continue; }

    $imgUrl = getDiaryImgUrl($imgName, $diaryYear, $diaryMonth);

    // Get its date & hour
    // If element 8 is underscore, the filename format is YYYYMMDD_HHMMSS.jpg
    // Otherwise the number before the underscore is the date
    if (isset($imgName[8]) && $imgName[8] == "_")
    {
      // Except the page "Main.OnThisDay", check if the year/mon matches the page year/mon
      $imgYear = (int)substr($imgName,0,4);
      $imgMon = (int)substr($imgName,4,2);

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
    if (isset($imgName[8]) && $imgName[8] == "_" && $imgHour<6)
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

  // If $bulletText is provided, the text in question (to be inserted with its img list)
  // is a single date bullet corresponding to the given date. Simply append the it with
  // its list of image urls if nonempty then return.
  if (!empty($bulletText))
  {
    if ($dayImgList[$date] !== "")
    { $bulletText = rtrim($bulletText)."\n-->".$dayImgList[$date]."\n"; }

    return $bulletText;
  }

  // Else we are dealing with date bullets for a whole month
  else
  {
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
        if (preg_match("/\* (\[\[#[\w-]*\]\])* *$iDay(,|，) /", $text, $match, PREG_OFFSET_CAPTURE))
        {
          $dayHeadPos = $match[0][1];
          $dayEndPos = strpos($text,"\n\n",$dayHeadPos);
          if ($dayEndPos !== false)
          { $text = substr_replace($text, "\n-->".$dayImgList[$iDay]."\n", $dayEndPos, 0); }
        }
      }
    }

    return $text.'(:groupfooter:)';
  }
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

  if (isset($img[8]) && $img[8] == "_" && $img[0] == "2" && $img[1] == "0")
  {
    if (strlen($img) == $IMG_NAME_LEN+$EXT_LEN) {}
    else if (strlen($img) == $IMG_NAME_LEN+$EXT_LEN+1) {}
    else { echo "Unexpected filename \"$img\" in getDiaryImgUrl()!<br>"; return ""; }
  }
  // For downloaded images that cannot be automatically renamed, D_X.jpg DD_X.jpg are valid
  // image name format. The length and type of "X" is not limited, i.e., can be non-numeric.
  else if ($img[2] == "_" && is_numeric($img[0]) && is_numeric($img[1]) ) { $isImgFileNameValid = 1; }
  else if ($img[1] == "_" && is_numeric($img[0])) { $isImgFileNameValid = 1; }
  else { echo "Unexpected filename \"$img\" in getDiaryImgUrl()!<br>"; return ""; }

  global $diaryImgDirURL;
  if (strcasecmp($extension,'.mp4') == 0)
//   { $imgUrl = "(:neo_flv_V-player ".$diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img." :)"; }
  {
    $imgUrl = "(:html5video filename=".$diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img." :)";

    // The subdomain fix for the socket limit of 6 per domain for loading video.
//     $diaryImgDirURL_subDomain = str_replace("://", "://$img.", $diaryImgDirURL);
//     $imgUrl = "(:html5video filename=".$diaryImgDirURL_subDomain.$diaryYear."/".$diaryMonth."/".$img." :)"; 
  }
  else
  { $imgUrl = $diaryImgDirURL.$diaryYear."/".$diaryMonth."/".$img; }

  return $imgUrl;
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