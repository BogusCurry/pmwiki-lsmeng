<?php

require_once("$FarmD/cookbook/plugin_LSMENG_edit.php");

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

//   $lastPageUpdateTime = $page['time'].'<br>';
  global $WorkDir;
  $lastPageUpdateTime = filemtime("$WorkDir/$pagename");
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
//   else { $text = fileGetContentsWait($srcFile); }
  else { $text = file_get_contents($srcFile); }
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

/*
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
*/
