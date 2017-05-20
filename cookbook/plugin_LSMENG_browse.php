<?php

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
  if (!$page) { echo_("Page doesn't exist in getNoEmptyRandLine()!"); return; }
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
      if ($strStripSpace !== "\n" && $strStripSpace !== "" && $strStripSpace !== "  "
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

/*
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
*/

/****************************************************************************************/

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

// Take the text of the given page and execute it as a PHP script
// The execution result is returned
// The character ' is not allowed in the text. At least writing the text to a file and 
// then execute the file as a PHP script can get around this problem. 
// This mechanism is meant to be lightweight. Use runCode page for something more serious.
$FmtPV['$runPHP'] = 'runPHP($pn)';
function runPHP($pagename)
{
  $page = RetrieveAuthPage($pagename, 'read', false, READPAGE_CURRENT);
  $text = $page['text'];
  if (strpos($text, "'") !== false) { return "Character ' detected. Don't use it!"; }
  $result = shell_exec("php -r '$text'");
  return $result;
}
