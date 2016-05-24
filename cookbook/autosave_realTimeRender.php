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

// Meng. Comment out the line below as it quits autosave if draft is not enabled.
//if ( !IsEnabled($EnableDrafts,0) ) return;

$DraftSuffix = "";

SDVA( $HandleAuth, array(
	'deldraft' => $HandleAuth['edit'],
	'autosave' => $HandleAuth['edit'] ));
SDVA( $HandleActions, array(
	'deldraft' => 'HandleDeleteDraft',
	'autosave' => 'HandleAutoSave' ));

XLSDV( 'en', array(
	'ASnosuffix' => '<span  style=\'background-color: red; color: white;\'>Autosave error: non-empty $DraftSuffix required</span>',
	'ASnoread' => '<span  style=\'background-color: red; color: white;\'>Autosave read error</span>',
	'ASnowrite' => '<span  style=\'background-color: red; color: white;\'>Autosave write error</span>',
	'ASsimuledit' => '<span  style=\'background-color: red; color: white;\'>Autosave disabled: simultaneous editing</span>'
));


SDVA($InputTags['e_deldraftbutton'], array(
    ':html' => "<input type='button' \$InputFormArgs onclick=\"self.location='{\$PageUrl}?action=deldraft';\" />",
    'name' => 'deldraft',
	'value' => ' '.XL('Delete draft').' ',
    'accesskey' => XL('ak_deldraft') ));

// based on Cookbook/DeleteAction
function HandleDeleteDraft( $pagename, $auth = 'edit' ) {
	global $WikiDir, $LastModFile, $DraftSuffix;
	if (empty( $DraftSuffix )) { Abort('?action=deldraft requires a non-empty $DraftSuffix'); return; }
	$basename = preg_replace("/$DraftSuffix\$/", '', $pagename);
	$draftname = $basename . $DraftSuffix;
	$page = RetrieveAuthPage( $draftname, $auth, true, READPAGE_CURRENT );
	if (!$page) { Abort("?cannot delete $draftname"); return; }
	Lock(2);
		$WikiDir->delete($draftname);
		if ($LastModFile) { touch($LastModFile); fixperms($LastModFile); }
	Lock(0);
	Redirect("$basename?action=edit");
	exit;
}


Markup( 'autosave', 'directives', '/\\(:autosave:\\)/ei', "Keep(AutoSaveMarkup(\$pagename))" );
function AutoSaveMarkup( $pagename ) {
	global $PubDirUrl, $AutoSaveFmt, $AutoSavePubDirUrl, $AutoSaveDelay;

	$url = PageVar($pagename,'$PageUrl');
	$url .= ( strpos($url,'?') ? '&' : '?' ) . "action=autosave";

	SDV( $AutoSavePubDirUrl, "$PubDirUrl/autosave" );
/****************************************************************************************/
/*Meng: Autosave timer. Setting to 1 sec pretty much means saving continuously.*/
  global $UrlScheme, $autoSaveDelayHttp, $autoSaveDelayHttps;
  if ($UrlScheme == 'http') { SDV( $AutoSaveDelay, $autoSaveDelayHttp); }
  else { SDV( $AutoSaveDelay, $autoSaveDelayHttps); }
/****************************************************************************************/
	SDVA( $AutoSaveFmt, array(
//		'info' => "<label id='autosave-label'><input type='checkbox' checked='1' id='autosave-cb' /><span id='autosave-status'>Ready</span></label>",
		'info' => "<label id='autosave-label'><span id='autosave-status'>Ready</span></label>",
		'util' => "<script type='text/javascript' src='$AutoSavePubDirUrl/util.js'></script>",
		'js' => "<script type='text/javascript' src='$AutoSavePubDirUrl/autosave.js'></script>",
		'config' => "<script type='text/javascript'>AS.url='$url'; AS.delay=$AutoSaveDelay;</script>"
	));

	return "{$AutoSaveFmt['info']}\n{$AutoSaveFmt['util']}\n{$AutoSaveFmt['js']}\n{$AutoSaveFmt['config']}";
}

function HandleAutoSave( $pagename, $auth = 'edit' )
{
  if (substr($_POST['text'],0,4) == "SAVE")
  {
    echo MarkupToHTML($pagename, $_POST['text']);
    return;
  }

	global
		$DraftRecentChangesFmt, $DraftSuffix, $EditFunctions, $DeleteKeyPattern,
		$EditFields, $Charset, $ChangeSummary, $Now, $IsPagePosted;

// Meng. Comment out the line below as it quits autosave on empty draft suffix.
//	if (empty( $DraftSuffix )) { echo XL('ASnosuffix'); return; }

	$basename = preg_replace("/$DraftSuffix\$/", '', $pagename);
	$draftname = $basename . $DraftSuffix;
	$draftmodtime = PageVar($draftname,'$LastModifiedTime');

/* Meng: The following controls simultaneous editing. */
	if ( ( $draftmodtime != $Now) && ( $_POST['basetime'] < $draftmodtime ) )
	{
	  echo XL('ASsimuledit');
	  return;
//    redirect($pagename."?action=edit");
	}	
		
	$pagename = $basename;
	$_POST['postdraft'] = 1;
	SDV( $DraftRecentChangesFmt, array(''=>'') );

// Meng. Comment out the line below as it causes errors.
//	array_unshift( $EditFunctions, 'EditDraft' );

	$DeleteKeyPattern = '.^'; // page deletion disabled

	Lock(2);
		$page = RetrieveAuthPage($pagename, $auth, false);
		if (!$page) { echo XL('ASnoread'); return; }
		PCache($pagename,$page);

		$new = $page;
		foreach((array)$EditFields as $k)
			if (isset( $_POST[$k] )) {
				$new[$k]=str_replace("\r",'',stripmagic($_POST[$k]));
				if ($Charset=='ISO-8859-1') $new[$k] = utf8_decode($new[$k]);
			}
		$new["csum:$Now"] = $new['csum'] = "[autosave] $ChangeSummary";

		UpdatePage($pagename, $page, $new);
	Lock(0);

//global $simultEdit;
//echo $simultEdit;

  
	if ($IsPagePosted || true)
	{
		$url = PageVar($draftname,'$PageUrl');
		$url .= ( strpos($url,'?') ? '&' : '?' ) . "action=edit";
		header("X-AutoSaveAction: $url" );
		header("X-AutoSavePage: $draftname");
		header("X-AutoSaveTime: $Now");
		echo 'ok';
	} 
	else
	{

	  global $simultEdit;

//	  if ($simultEdit == true) { echo "simjl"; }
//    else

	  echo XL('ASnowrite');
	}
}


function HandleAutoSaveRender( $pagename, $auth = 'edit' )
{
    echo MarkupToHTML($pagename, $_POST['text']);
}
