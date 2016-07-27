<?php if (!defined('PmWiki')) exit();
/**
  Simple Flip Checkbox for PmWiki
  Written by (c) Petko Yotov 2008-2011

  This text is written for PmWiki; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published
  by the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version. See pmwiki.php for full details
  and lack of warranty.

  Copyright 2008-2011 Petko Yotov www.pmwiki.org/Petko
*/

# Version date
$RecipeInfo['Flipbox']['Version'] = '20111009';

SDVA($HandleActions, array('flipbox'=>'HandleFlipbox', 
  'lockflipbox'=>'HandleLockFlipbox', 'unlockflipbox'=>'HandleUnlockFlipbox'));
SDVA($HandleAuth, array('flipbox' => 'edit', 'lockflipbox' => 'edit', 'unlockflipbox' => 'edit'));
SDV($FlipboxChoices, 'x_');

SDV($FlipboxPubDirUrl,'$FarmPubDirUrl/flipbox');//contains *.js and *.png
SDV($FlipboxIcon, array("check", ".png"));
SDV($FlipboxWikiStyle, '%%item %1$s id=%2$s%%');
SDV($FlipboxHTML, '<img id="_fbi%1$s" src="%2$s" title="%1$s" alt="%1$s" %3$s/>'); # id, url, onclick, state
SDV($QualifyPatterns["/\\[([$FlipboxChoices])\\]/"], '[$1$1$1]');

# I wish I could do this otherwise...
Markup('flipbox_pre', '<[=', "/(\\[[$FlipboxChoices]{1,3})(\\])/e", "FmtPreFlipbox('$1', '$2')");
Markup('flipbox', 'inline', "/\\[([$FlipboxChoices]{1,3})\t\t\t(\\d+)\t\t\t\\]/e",
 "FmtFlipbox(\$pagename,'$1','$2','$3')");
Markup('flipbox_post', '>restore', "/\\[([$FlipboxChoices]{1,3})\t\t\t\\d+\t\t\t\\]/", "[$1]");

function FmtPreFlipbox($_1, $_2) {
  static $id = 0;$id++;
  return "$_1\t\t\t$id\t\t\t$_2";
}

function FmtFlipbox($pagename, $_x, $id) {
  global $FlipboxPubDirUrl, $FlipboxIcon, $FlipboxWikiStyle, $HTMLHeaderFmt, $FlipboxChoices, $FlipboxHTML;
  $HTMLHeaderFmt['flipbox'] = "<script type='text/javascript'><!--
  var FlipboxPubDirUrl = \"$FlipboxPubDirUrl\";
  var FlipboxPageUrl = \"\$PageUrl?action=flipbox&box=\";
  var FlipboxChoices = \"$FlipboxChoices$FlipboxChoices\";
  var FlipboxIcon = new Array('{$FlipboxIcon[0]}', '{$FlipboxIcon[1]}');
  //--></script><script type='text/javascript' src='$FlipboxPubDirUrl/flipbox.js'></script>";

  $_y = $_x{0};
  $wiki = sprintf($FlipboxWikiStyle, "fb$_y", "_fbl$id");

  $html = "<img id='_fbi$id' src='$FlipboxPubDirUrl/{$FlipboxIcon[0]}$_y{$FlipboxIcon[1]}'";

  $onclick = "";
  if(strlen($_x)==1)
    $onclick = " onclick='try{flipbox($id, \"$_y\", true);}catch(e){void(0);}'";
  elseif(strlen($_x)==2)
    $onclick = " onclick='try{flipbox($id, \"$_y\", false);}catch(e){void(0);}'";

  $html = sprintf($FlipboxHTML, $id, "$FlipboxPubDirUrl/{$FlipboxIcon[0]}$_y{$FlipboxIcon[1]}", $onclick, $_x, $_y);
  
  return $wiki.Keep(Fmtpagename($html, $pagename));
}

function HandleFlipbox($pagename, $auth="edit") {
  global $ChangeSummary, $Now, $FlipboxChoices;
  header("Expires: Mon, 19 Jul 1999 05:00:00 GMT"); // Date in the past
  header("Content-type: image/gif");
  header("Content-length: 43");
  echo base64_decode('R0lGODlhAQABAIAAAP8AAMDAwCH5BAEAAAAALAAAAAABAAEAQAICRAEAOw==');

  $box = intval(@$_GET['box']);
  if(!$box) exit();
  $state = @$_GET['state'];
  if(!preg_match("/^[$FlipboxChoices]$/", $state) ) exit();
  $page = RetrieveAuthPage($pagename,$auth,0, 0);
  if(!$page) exit();

  $new = $page;
  $m = preg_split("/(\\[[$FlipboxChoices]{1,3}\\])/", $new['text'], -1, PREG_SPLIT_DELIM_CAPTURE);

  $s = $box*2-1;
  if(!preg_match("/^\\[[$FlipboxChoices]\\]$/", $m[$s]) ) exit();
  $m[$s] = "[$state]";

  $new['csum'] = $new["csum:$Now"] = 
    $ChangeSummary = "flipbox[$box] = {$m[$s]}";
  $_POST['diffclass']='minor';
  $new['text'] = implode('', $m);
  if($new['text']!=$page['text'])
    UpdatePage($pagename, $page, $new);
  exit;
}

function HandleLockFlipbox($pagename, $auth="edit") {
  global $ChangeSummary, $Now, $FlipboxChoices;
  $page = RetrieveAuthPage($pagename,$auth, 1);# full page, will ask for pw
  if(!$page) exit();
  $new = $page;
  $text = MarkupEscape($new['text']);
  $text = preg_replace("/\\[([$FlipboxChoices])\\]/", '[$1$1$1]', $text);
  $new['text'] = MarkupRestore($text);
  
  if($new['text']!=$page['text']) {
    $new['csum'] = $new["csum:$Now"] = 
      $ChangeSummary = XL("Flipboxes locked");
    UpdatePage($pagename, $page, $new);  
  }
  Redirect($pagename);
  exit;
}

function HandleUnlockFlipbox($pagename, $auth="edit") {
  global $ChangeSummary, $Now, $FlipboxChoices;
  $page = RetrieveAuthPage($pagename,$auth, 1);# full page, will ask for pw
  if(!$page) exit();
  $new = $page;
  $text = MarkupEscape($new['text']);
  $text = preg_replace("/\\[([$FlipboxChoices])\\1\\1\\]/", '[$1]', $text);
  $new['text'] = MarkupRestore($text);
  
  if($new['text']!=$page['text']) {
    $new['csum'] = $new["csum:$Now"] = 
      $ChangeSummary = XL("Flipboxes unlocked");
    UpdatePage($pagename, $page, $new);  
  }
  Redirect($pagename);
  exit;
}



