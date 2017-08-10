<?php if (!defined('PmWiki')) exit();

/**	=== AutoSave ===
 *	Copyright 2009 Eemeli Aro <eemeli@gmail.com>
 *
 *	Autosave pages in the background while editing
 *
 *	Developed and tested using PmWiki 2.2.x
 *
 *	To install, add at least the following to your configuration file:
$EnableDrafts = 1;
include_once("$FarmD/cookbook/autosave.php");
 *	and the directive (:autosave:) to your Site.EditForm page.
 *
 *	For more information, please see the online documentation at
 *		http://www.pmwiki.org/wiki/Cookbook/AutoSave
 *
 *	This program is free software; you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation; either version 2 of the License, or
 *	(at your option) any later version.
 */

$RecipeInfo['AutoSave']['Version'] = '2009-05-28-2';

SDV($AutoSaveDrag, 0);

SDVA( $HandleAuth, array(
'autosave' => $HandleAuth['edit'] ));
SDVA( $HandleActions, array(
'autosave' => 'HandleAutoSave' ));

// if ($action === "edit")
if ($action === "browse" || $action === "edit")
{
  global $PubDirUrl, $AutoSaveFmt, $AutoSavePubDirUrl, $AutoSaveDelay;

  SDV( $AutoSavePubDirUrl, "$PubDirUrl/autosave" );

  // Meng: Autosave timer. Setting to 1 sec pretty much means saving continuously.
  global $UrlScheme, $autoSaveDelayHttp, $autoSaveDelayHttps;
  if ($UrlScheme == 'http') { SDV( $AutoSaveDelay, $autoSaveDelayHttp); }
  else { SDV( $AutoSaveDelay, $autoSaveDelayHttps); }

  global $ScriptUrl;
  $url = "$ScriptUrl/$pagename?action=autosave";

  SDVA( $AutoSaveFmt, array(
  'info' => "<div style='position:fixed; z-index:9;' id='autosaveStatus'></div>",
  'js' => "<script type='text/javascript' src='$AutoSavePubDirUrl/autosave.js'></script>
  <script type='text/javascript'>
  </script>",
  'config' => "
  <script type='text/javascript'>
  AS.enableDrag = $AutoSaveDrag;
  AS.delay = $AutoSaveDelay;
  AS.saveOffDay = $autoSaveOffDay;
  AS.url = '$url';
  </script>"
  ));

  $HTMLHeaderFmt['autosave'] =
  "{$AutoSaveFmt['info']}\n{$AutoSaveFmt['js']}\n{$AutoSaveFmt['config']}
  <link rel=\"stylesheet\" href=\"$PubDirUrl/autosave/autosave.css\" type=\"text/css\">
  ";
}

function HandleAutoSave( $pagename, $auth = 'edit' )
{
  global
  $EditFunctions,
  $EditFields, $Charset, $ChangeSummary, $Now, $IsPagePosted;

  // Since I change the mechanism of Autosave from posting with content-type:
  // application/x-www-form-urlencoded to text/plain, the variable $_POST is not working
  // and is simply filled in manually with corresponding information.
  // Particularly, the basetime is replaced by a specific header sent by the client
  // the text content is then the raw input sent using text/plain
  $_POST['action'] = 'edit';
  $_POST['n'] = $pagename;
  $_POST['basetime'] = $_SERVER['HTTP_BASETIME'];
  $postMsg = $_POST['text'] =  file_get_contents('php://input');

  Lock(2);
  $page = RetrieveAuthPage($pagename, $auth, false);
  if (!$page) { echo 'Autosave read error'; return; }

  // Meng: The following controls simultaneous editing.
  if ( ( $page['time'] != $Now) && ( $_POST['basetime'] < $page['time'] ) )
  {
    echo 'Simultaneous editing';
    return;
  }

  // If "WYSIWYG" request header is present, this is from wysiwyg.js
  if (isset($_SERVER["HTTP_WYSIWYG"]))
  {
    // Parse msg
    $postMsg = json_decode($postMsg);
    $bulletIdx = $postMsg -> {"bulletIdx"};
    $prevValue = $postMsg -> {"prevValue"};
    $newValue = $postMsg -> {"newValue"};

    // Get the bullet's text
    $numBullet = $bulletIdx + 1;
    $charOffset = computeCharOffsetForBullet($page["text"], $numBullet);
    $charOffset2 = computeCharOffsetForBullet($page["text"], $numBullet + 1);
    if ($charOffset2 === -1) { $charOffset2 = strlen($page["text"]); }
    $length = $charOffset2 - $charOffset - 1;
    $bulletText = substr($page["text"], $charOffset, $length);

    // if the preValue is UNIQUE in the bullet element's textContent, it's safe
    // Else, including the case it can't be found, it's unsafe
    $pos = strpos($bulletText, $prevValue);
//     file_put_contents('/Volumes/wiki/www/blog/pmwiki/lsmeng/untitled.txt', "called\n".$pos);

    // The text can't even be found
    if ($pos === false)
    {
      return;
    }
    // The text is not unique
    else if (strpos($bulletText, $prevValue, $pos + 1) !== false)
    {
      return;
    }
    else { $newBulletText = str_replace($prevValue, $newValue, $bulletText); }

//     file_put_contents('/Volumes/wiki/www/blog/pmwiki/lsmeng/untitled.txt', "called\n".$testStr."\nend");
//     file_put_contents('/Volumes/wiki/www/blog/pmwiki/lsmeng/untitled.txt', "called\n".$numBullet."\n".$charOffset2);

    $_POST['text'] = substr_replace($page["text"], $newBulletText, $charOffset, $length);

// 		    file_put_contents('/Volumes/wiki/www/blog/pmwiki/lsmeng/untitled.txt', "called\n".$_POST['text']."\nend");
//     return;
  }

  PCache($pagename,$page);

  $new = $page;
  foreach((array)$EditFields as $k)
  if (isset( $_POST[$k] ))
  {
    $new[$k]=str_replace("\r",'',stripmagic($_POST[$k]));
    if ($Charset=='ISO-8859-1') $new[$k] = utf8_decode($new[$k]);
  }
  $new["csum:$Now"] = $new['csum'] = "[autosave] $ChangeSummary";

  UpdatePage($pagename, $page, $new);
  Lock(0);

  if ($IsPagePosted)
  {
    header("X-AutoSaveTime: $Now");
    echo 'Saved';
  }
  else { echo 'Autosave write error'; }
}

// Get the indexOf the nth occurrence of either "pat1" or "pat2"
function nthIndex($str, $pat1, $pat2, $n)
{
  $L = strlen($str);
  $i = -1;
  while ($n-- && $i++ < $L)
  {
    $pos1 = strpos($str, $pat1, $i);
    $pos2 = strpos($str, $pat2, $i);

    // If i j both found, take the smaller one
    if ($pos1 !== false && $pos2 !== false) { $i = min($pos1, $pos2); }

    // if only i found, work with i
    else if ($pos1 !== false && $pos2 === false) { $i = $pos1; }

    // if only j found, work with j
    else if ($pos1 === false && $pos2 !== false) { $i = $pos2; }

    // nothing, break
    else
    {
      if ($n === 0) { return -1; }
      break;
    }
  }

  return $i;
}

function computeCharOffsetForBullet($text, $numBullet)
{
  $isFirstLineBullet = false;
  if ($text[0] === "*" || $text[0] === "#") { $isFirstLineBullet = true; }

  if ($numBullet === 1)
  {
    if ($isFirstLineBullet) { $charOffset = 0; }
    else { $charOffset = nthIndex($text, "\n*", "\n#", 1); }
  }
  else
  {
    if ($isFirstLineBullet) { $numBullet--; }
    $charOffset = nthIndex($text, "\n*", "\n#", $numBullet);
  }

  if ($charOffset === -1) { return -1; }
  else { return $charOffset + 1; }
}