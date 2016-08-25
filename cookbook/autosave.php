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

if($action == "edit")
{
	global $PubDirUrl, $AutoSaveFmt, $AutoSavePubDirUrl, $AutoSaveDelay;

	SDV( $AutoSavePubDirUrl, "$PubDirUrl/autosave" );

  // Meng: Autosave timer. Setting to 1 sec pretty much means saving continuously.
  global $UrlScheme, $autoSaveDelayHttp, $autoSaveDelayHttps;
  if ($UrlScheme == 'http') { SDV( $AutoSaveDelay, $autoSaveDelayHttp); }
  else { SDV( $AutoSaveDelay, $autoSaveDelayHttps); }

  global $ScriptUrl;
  $url = "$ScriptUrl?n=$pagename&action=autosave";
  
	SDVA( $AutoSaveFmt, array(
		'info' => "<div style='position:fixed; z-index:9;' id='autosaveStatus'></div>",
		'js' => "<script type='text/javascript' src='$AutoSavePubDirUrl/autosave.js'></script>
		<script type='text/javascript'>
		AS.pagename = '$pagename';
		</script>",
		'config' => "
		<script type='text/javascript'>
		AS.enableDrag = $AutoSaveDrag;
		AS.delay = $AutoSaveDelay;
		AS.url = '$url';
		</script>"
	));

	$HTMLHeaderFmt['autosave'] = "
	{$AutoSaveFmt['info']}\n{$AutoSaveFmt['js']}\n{$AutoSaveFmt['config']}
  <link rel=\"stylesheet\" href=\"$PubDirUrl/autosave/autosave.css\" type=\"text/css\">
	";
}

function HandleAutoSave( $pagename, $auth = 'edit' )
{
	global
		$EditFunctions,
		$EditFields, $Charset, $ChangeSummary, $Now, $IsPagePosted;

	Lock(2);
		$page = RetrieveAuthPage($pagename, $auth, false);
		if (!$page) { echo 'Autosave read error'; return; }
		
  // Meng: The following controls simultaneous editing. 
	if ( ( $page['time'] != $Now) && ( $_POST['basetime'] < $page['time'] ) )
	{
	  echo 'Simultaneous editing';
	  return;
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
