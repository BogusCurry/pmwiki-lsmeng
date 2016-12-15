<?php if (!defined('PmWiki')) exit();
/*  Copyright 2004-2016 Patrick R. Michaud (pmichaud@pobox.com)
    This file is part of PmWiki; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.  See pmwiki.php for full details.

    This script adds upload capabilities to PmWiki.  Uploads can be
    enabled by setting
        $EnableUpload = 1;
    in config.php.  In addition, an upload password must be set, as
    the default is to lock uploads.  In some configurations it may also
    be necessary to set values for $UploadDir and $UploadUrlFmt,
    especially if any form of URL rewriting is being performed.
    See the PmWiki.UploadsAdmin page for more information.
    
    Script maintained by Petko YOTOV www.pmwiki.org/petko
*/

// Meng. Append the JS file for downloading the image using AJAX.
// Reply the client with the requested image file.
if ($action =='upload')
{	
	$HTMLHeaderFmt['getAndShowImgFile'] = "
  <script src='$PubDirUrl/getAndShowImgFile.js'></script>";
  
  if (isset($_GET["show"]))
  {
		global $UploadDir, $UploadPrefixFmt;
		$uploaddir = FmtPageName("$UploadDir$UploadPrefixFmt", $pagename);
		
		if (file_exists($uploaddir.'/'.$_GET["show"]))
		{
			$file = $_GET["show"];
			$imgSrc = getImgFileContent($uploaddir.'/'.$file);
			header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1.
			header("Pragma: no-cache"); // HTTP 1.0.
			header("Expires: 0"); // Proxies.
			
			// Explicitly indicating the content type as plaintext to avoid the client wasting 
			// effort parsing the content into XML
			header("Content-type: text/plain");
			echo $imgSrc;
			
			exit;
		}    
  }
}


## $EnableUploadOverwrite determines if we allow previously uploaded
## files to be overwritten.
SDV($EnableUploadOverwrite,1);

## $UploadExts contains the list of file extensions we're willing to
## accept, along with the Content-Type: value appropriate for each.
SDVA($UploadExts,array(
  'gif' => 'image/gif', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
  'png' => 'image/png', 'bmp' => 'image/bmp', 'ico' => 'image/x-icon',
  'wbmp'=> 'image/vnd.wap.wbmp', 'svg' => 'image/svg+xml', 'svgz' => 'image/svg+xml', 'xcf' => 'image/x-xcf',
  'mp3' => 'audio/mpeg', 'au' => 'audio/basic', 'wav' => 'audio/x-wav',
  'ogg' => 'audio/ogg', 'flac' => 'audio/x-flac',
  'ogv' => 'video/ogg', 'mp4' => 'video/mp4',
  'mpg' => 'video/mpeg', 'mpeg' => 'video/mpeg',
  'zip' => 'application/zip', '7z' => 'application/x-7z-compressed',
  'gz'  => 'application/x-gzip', 'tgz' => 'application/x-gzip',  
  'mov' => 'video/quicktime', 'qt' => 'video/quicktime',
  'avi' => 'video/x-msvideo',
  'doc' => 'application/msword', 'ppt' => 'application/vnd.ms-powerpoint',
  'xls' => 'application/vnd.ms-excel',
  'ico' => 'image/x-icon',
  'wbmp'=> 'image/vnd.wap.wbmp', 'svg' => 'image/svg+xml', 'xcf' => 'image/x-xcf',
  'webm' => 'video/webm',
  'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'pdf' => 'application/pdf', 
  'txt' => 'text/plain', 'rtf' => 'application/rtf', 
/*  'wmf' => 'text/plain', 
  'rpm' => 'application/x-rpm', 
  'hqx' => 'application/mac-binhex40', 'sit' => 'application/x-stuffit',
   'mdb' => 'text/plain',
  'exe' => 'application/octet-stream',
  'psd' => 'text/plain', 
  'ps'  => 'application/postscript', 'ai' => 'application/postscript',
  'eps' => 'application/postscript',
  'htm' => 'text/html', 'html' => 'text/html', 'css' => 'text/css', 
  'fla' => 'application/x-shockwave-flash', 
  'swf' => 'application/x-shockwave-flash',
  'tex' => 'application/x-tex', 'dvi' => 'application/x-dvi',
  'odt' => 'application/vnd.oasis.opendocument.text',
  'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
  'odp' => 'application/vnd.oasis.opendocument.presentation',
  'odg' => 'application/vnd.oasis.opendocument.graphics',
  'epub'=> 'application/epub+zip',
  'kml' => 'application/vnd.google-earth.kml+xml',
  'kmz' => 'application/vnd.google-earth.kmz',*/
  '' => 'text/plain'));

# Array containing forbidden strings in a filename, array('.php', '.cgi')
SDV($UploadBlacklist, array());

// Meng. Configure this in config.php
SDV($UploadMaxSize,$maxUploadSize);
SDV($UploadPrefixQuota,0);
SDV($UploadDirQuota,0);
foreach($UploadExts as $k=>$v) 
  if (!isset($UploadExtSize[$k])) $UploadExtSize[$k]=$UploadMaxSize;

SDV($UploadDir,'uploads');
SDV($UploadPermAdd,0444);
SDV($UploadPermSet,0);
// Meng. Remove the default behavior where the uploaded files must go to a folder named 
// after the current group name. The upload folder is now configured in config.php
//SDV($UploadPrefixFmt,'/$Group');
SDV($UploadPrefixFmt,'');
SDV($UploadFileFmt,"$UploadDir$UploadPrefixFmt");
$v = preg_replace('#^/(.*/)#', '', $UploadDir);
SDV($UploadUrlFmt,preg_replace('#/[^/]*$#', "/$v", $PubDirUrl, 1));
SDV($LinkUploadCreateFmt, "<a rel='nofollow' class='createlinktext' href='\$LinkUpload'>\$LinkText</a><a rel='nofollow' class='createlink' href='\$LinkUpload'>&nbsp;&Delta;</a>");
SDVA($ActionTitleFmt, array('upload' => '| $[Attach]'));

SDV($PageUploadFmt,array("
  <div id='wikiupload'>
  <h2 class='wikiaction'>$[Attachments for] {\$FullName}</h2>
  <h3>\$UploadResult</h3>
  <form enctype='multipart/form-data' action='{\$PageUrl}?action=postupload' method='post'>
  <input type='hidden' name='n' value='{\$FullName}' />
  <input type='hidden' name='action' value='postupload' />
  <table border='0'>
    <tr><td align='right'>$[File to upload:]</td><td><input
      name='uploadfile' type='file' /></td></tr>
    <tr><td align='right'>$[Name attachment as:]</td>
      <td><input type='text' name='upname' value='\$UploadName' /><input 
        type='submit' value=' $[Upload] ' /><br />
        </td></tr></table></form></div>",
  'wiki:$[{$SiteGroup}/UploadQuickReference]'));
XLSDV('en',array(
  'ULsuccess' => 'successfully uploaded',
  'ULbadname' => 'invalid attachment name or wrong extension',
  'ULbadtype' => '\'$upext\' is not an allowed file extension',
  'ULtoobig' => 'file is larger than maximum allowed by webserver',
  'ULtoobigext' => 'file is larger than allowed maximum of $upmax
     bytes for \'$upext\' files',
  'ULpartial' => 'incomplete file received',
  'ULnofile' => 'no file uploaded',
  'ULexists' => 'file with that name already exists',
  'ULpquota' => 'group quota exceeded',
  'ULtquota' => 'upload quota exceeded'));
SDV($PageAttributes['passwdupload'],'$[Set new upload password:]');
SDV($DefaultPasswords['upload'],'@lock');
SDV($AuthCascade['upload'], 'read');
SDV($FmtPV['$PasswdUpload'], 'PasswdVar($pn, "upload")');

Markup_e('attachlist', 'directives',
  '/\\(:attachlist\\s*(.*?):\\)/i',
  "Keep('<ul>'.FmtUploadList('$pagename',\$m[1]).'</ul>')");
SDV($GUIButtons['attach'], array(220, 'Attach:', '', '$[file.ext]',
  '$GUIButtonDirUrlFmt/attach.gif"$[Attach file]"'));
SDV($LinkFunctions['Attach:'], 'LinkUpload');
SDV($IMap['Attach:'], '$1');
SDVA($HandleActions, array('upload' => 'HandleUpload',
  'postupload' => 'HandlePostUpload',
  'download' => 'HandleDownload'));
SDVA($HandleAuth, array('upload' => 'upload',
  'download' => 'read'));
SDV($HandleAuth['postupload'], $HandleAuth['upload']);
SDV($UploadVerifyFunction, 'UploadVerifyBasic');

function MakeUploadName($pagename,$x) {
  global $UploadNameChars, $MakeUploadNamePatterns;

  // Meng. UploadNameChars controls the set of characters allowed in upload names.
  // Defaults to "-\w. ", which means alphanumerics, hyphens, underscores, dots, and
  // spaces can be used in upload names, and everything else will be stripped.
  // The line below allows Unicode  
  $UploadNameChars = "-\\w. \\x80-\\xff";
  
  SDV($UploadNameChars, "-\\w. ");
  SDV($MakeUploadNamePatterns, array(
    "/[^$UploadNameChars]/" => '',
    '/\\.[^.]*$/' => PCCF('return strtolower($m[0]);'),
    '/^[^[:alnum:]_]+/' => '',
    '/[^[:alnum:]_]+$/' => ''));
//die(PPRA($MakeUploadNamePatterns, $x));
   return PPRA($MakeUploadNamePatterns, $x);
}

function LinkUpload($pagename, $imap, $path, $alt, $txt, $fmt=NULL) {
  global $FmtV, $UploadFileFmt, $LinkUploadCreateFmt,
    $UploadUrlFmt, $UploadPrefixFmt, $EnableDirectDownload;
  if (preg_match('!^(.*)/([^/]+)$!', $path, $match)) {
    $pagename = MakePageName($pagename, $match[1]);
    $path = $match[2];
  }
  $upname = MakeUploadName($pagename, $path);
  $encname = rawurlencode($upname);
  $filepath = FmtPageName("$UploadFileFmt/$upname", $pagename);
  $FmtV['$LinkUpload'] =
    FmtPageName("\$PageUrl?action=upload&amp;upname=$encname", $pagename);
  $FmtV['$LinkText'] = $txt;
      
  if (!file_exists($filepath)) 
    return FmtPageName($LinkUploadCreateFmt, $pagename);
  $path = PUE(FmtPageName(IsEnabled($EnableDirectDownload, 1) 
                            ? "$UploadUrlFmt$UploadPrefixFmt/$encname"
                            : "{\$PageUrl}?action=download&amp;upname=$encname",
                          $pagename));
  return LinkIMap($pagename, $imap, $path, $alt, $txt, $fmt);
}

# Authenticate group downloads with the group password
function UploadAuth($pagename, $auth, $cache=0){
  global $GroupAttributesFmt, $EnableUploadGroupAuth;
  if (IsEnabled($EnableUploadGroupAuth,0)){
    SDV($GroupAttributesFmt,'$Group/GroupAttributes');
    $pn_upload = FmtPageName($GroupAttributesFmt, $pagename);
  } else $pn_upload = $pagename;
  $page = RetrieveAuthPage($pn_upload, $auth, true, READPAGE_CURRENT);
  if (!$page) Abort("?No '$auth' permissions for $pagename");
  if ($cache) PCache($pn_upload,$page);
  return true;
}

function HandleUpload($pagename, $auth = 'upload') {
  global $FmtV,$UploadExtMax, $EnableReadOnly,
    $HandleUploadFmt,$PageStartFmt,$PageEndFmt,$PageUploadFmt;
  UploadAuth($pagename, $auth, 1);
  $FmtV['$UploadName'] = MakeUploadName($pagename,@$_REQUEST['upname']);
  $upresult = PHSC(@$_REQUEST['upresult']);
  $uprname = PHSC(@$_REQUEST['uprname']);
  $FmtV['$upext'] = PHSC(@$_REQUEST['upext']);
  $FmtV['$upmax'] = PHSC(@$_REQUEST['upmax']);
  $FmtV['$UploadResult'] = ($upresult) ?
    FmtPageName("<i>$uprname</i>: $[UL$upresult]",$pagename) : 
      (@$EnableReadOnly ? XL('Cannot modify site -- $EnableReadOnly is set'): '');
  SDV($HandleUploadFmt,array(&$PageStartFmt,&$PageUploadFmt,&$PageEndFmt));
  PrintFmt($pagename,$HandleUploadFmt);
}

function HandleDownload($pagename, $auth = 'read') {
  global $UploadFileFmt, $UploadExts, $DownloadDisposition, $EnableIMSCaching;
  SDV($DownloadDisposition, "inline");
  UploadAuth($pagename, $auth);
  $upname = MakeUploadName($pagename, @$_REQUEST['upname']);
  $filepath = FmtPageName("$UploadFileFmt/$upname", $pagename);
  if (!$upname || !file_exists($filepath)) {
    header("HTTP/1.0 404 Not Found");
    Abort("?requested file not found");
    exit();
  }
  if (IsEnabled($EnableIMSCaching, 0)) {
    header('Cache-Control: private');
    header('Expires: ');
    $filelastmod = gmdate('D, d M Y H:i:s \G\M\T', filemtime($filepath));
    if (@$_SERVER['HTTP_IF_MODIFIED_SINCE'] == $filelastmod)
      { header("HTTP/1.0 304 Not Modified"); exit(); }
    header("Last-Modified: $filelastmod");
  }
  preg_match('/\\.([^.]+)$/',$filepath,$match); 
  if ($UploadExts[@$match[1]]) 
    header("Content-Type: {$UploadExts[@$match[1]]}");
  header("Content-Length: ".filesize($filepath));
  header("Content-disposition: $DownloadDisposition; filename=\"$upname\"");
  $fp = fopen($filepath, "rb");
  if ($fp) {
    while (!feof($fp)) echo fread($fp, 4096);
    flush();
    fclose($fp);
  }
  exit();
}

// Meng. Should be obvious. Borrowed from the Internet. 
function png2jpg($originalFile, $outputFile, $quality)
{
    $image = imagecreatefrompng($originalFile);
    imagejpeg($image, $outputFile, $quality);
    imagedestroy($image);
}

// Meng. Check if the given image has transparency information.
function hasAlphaColour($r)
{
	$x = imagesx($r);
	$y = imagesy($r);
	
	// We only check some of the pixels
	for ($i = 0; $i < $x; $i += $x/10)
	{
		for ($j = 0; $j < $y; $j += $y/10)
		{	
			$index = imagecolorat($r, $i, $j);
			$colors = imagecolorsforindex($r, $index);
			if (isset($colors['alpha']) && $colors['alpha'] > 0)
			{ return true; }
		}
	}
	
	return false;
}

function HandlePostUpload($pagename, $originalAction = 'upload' ,$auth = 'upload') {
  global $UploadVerifyFunction, $UploadFileFmt, $LastModFile, 
    $EnableUploadVersions, $Now, $RecentUploadsFmt, $FmtV,
    $NotifyItemUploadFmt, $NotifyItemFmt, $IsUploadPosted,
    $UploadRedirectFunction, $UploadPermAdd, $UploadPermSet,
    $EnableReadOnly;
    
  if (IsEnabled($EnableReadOnly, 0))
    Abort('Cannot modify site -- $EnableReadOnly is set', 'readonly');

  UploadAuth($pagename, $auth);
  $uploadfile = $_FILES['uploadfile'];
  $upname = $_REQUEST['upname'];
  if ($upname=='') $upname=$uploadfile['name'];
  $upname = MakeUploadName($pagename,$upname);

  // Meng. Image processing. For png/gif, if the image is determined not to have 
  // transparency, the transparency information (alpha) will not be saved.
  // Next if either the height or the width exceeds a maximum value, the image is resized
  // to fit the size limit. 
  if (function_exists(imagecreatetruecolor))
  {
		$ext = strtolower(substr($upname, strrpos($upname, '.')+1));

    // If this is an image
		if ($ext == 'jpg' || $ext == 'jpeg' || $ext == 'png' || $ext == 'bmp' || $ext == 'gif')
		{
			$imgFile = $uploadfile['tmp_name'];
      
      // Check if the image type and its extension matches
			if (function_exists(exif_imagetype))
			{
				$imgType = exif_imagetype($imgFile);
				if ((($ext == 'jpg' || $ext == 'jpeg') && $imgType != 2) ||
				($ext == 'png' && $imgType != 3) ||
				($ext == 'bmp' && $imgType != 6) ||
				($ext == 'gif' && $imgType != 1) 	)
				{
				  $UploadRedirectFunction($pagename,"{\$PageUrl}?action=upload&uprname=$upname&upresult=badname");
				  return;
				}
			}
			
  		// For png/gif, check for transparency first
  		if ($ext == 'png' || $ext == 'gif')
			{
        // See if alpha info is stored
        $colorType = ord(file_get_contents($imgFile, NULL, NULL, 25, 1));
        if ($colorType == 4 || $colorType == 6)
        { $isAlphaStored = true; }

			  // See if the file actually has transparency
        if ($ext == 'png') { $src = imagecreatefrompng($imgFile); }
				else               { $src = imagecreatefromgif($imgFile); }
				$hasTransparency = hasAlphaColour($src);
			}

      // If the image is oversized
			// Turns out resizing gif will remove its animation. Skip gif as mostly it's for
			// animation
			$MAXWHPX = 720;
			list($width,$height)=getimagesize($imgFile);
			$maxWH = max($width,$height);
			if ($maxWH > $MAXWHPX && $ext != 'gif')
			{
				$scale = $MAXWHPX/$maxWH;	
				$newwidth=round($width*$scale);
				$newheight=round($height*$scale);
				$tmp=imagecreatetruecolor($newwidth,$newheight);

				if ($ext == 'jpg' || $ext == 'jpeg') { $src = imagecreatefromjpeg($imgFile); }

        // Preserve transparency
        if (($ext == 'png' || $ext == 'gif') && $hasTransparency)
        { imagealphablending( $tmp, false ); imagesavealpha( $tmp, true ); }
				
        // Resize
				imagecopyresampled($tmp,$src,0,0,0,0,$newwidth,$newheight,$width,$height);

        // Sharpen
        imageconvolution($tmp, array(array(-1, -1, -1), array(-1, 16, -1), array(-1, -1, -1)), 8, 0);

				if ($ext == 'jpg' || $ext == 'jpeg') { $result = imagejpeg($tmp,$imgFile,75); }
				else if ($ext == 'png') { $result = imagepng($tmp,$imgFile); }
				else if ($ext == 'gif') { $result = imagegif($tmp,$imgFile); }
				if ($result === true) { $uploadfile['tmp_name'] = $imgFile; }
				imagedestroy($src);
				imagedestroy($tmp);
			}
			
			// Else if the image is png/gif without transparency, but alpha info is stored
			// remove the alpha info
			else if (($ext == 'png' || $ext == 'gif') && !$hasTransparency && $isAlphaStored)
			{
   			imagesavealpha($src, false);	
				if ($ext == 'png') { $result = imagepng($src,$imgFile); }
				else               { $result = imagegif($src,$imgFile); }
				if ($result === true) { $uploadfile['tmp_name'] = $imgFile; }
				imagedestroy($src);
			}
		}
  }

  if (!function_exists($UploadVerifyFunction))
    Abort('?no UploadVerifyFunction available');
  $filepath = FmtPageName("$UploadFileFmt/$upname",$pagename);
  
  // Meng. Deal with the Chinese filename on Windows..
  if (getOS() == 'Windows') { $filepath = iconv('UTF-8','big5',$filepath); }
  
  $result = $UploadVerifyFunction($pagename,$uploadfile,$filepath);
  if ($result=='')
  {
    $filedir = preg_replace('#/[^/]*$#','',$filepath);
    mkdirp($filedir);
    if (IsEnabled($EnableUploadVersions, 0))
      @rename($filepath, "$filepath,$Now");
    if (!@move_uploaded_file($uploadfile['tmp_name'],$filepath))
    {
/****************************************************************************************/
      // Meng. The builtin $EnableUploadOverwrite is not functioning. So I will have to 
      // delete the existing file manually on first failed attempt.
      global $EnableUploadOverwrite;
      if ($EnableUploadOverwrite==1 && file_exists($filepath)) { @unlink($filepath); }
      if (!@move_uploaded_file($uploadfile['tmp_name'],$filepath))        
      { Abort("?cannot move uploaded file to $filepath"); return; }        
/****************************************************************************************/
    }
    fixperms($filepath, $UploadPermAdd, $UploadPermSet);
    if ($LastModFile) { @touch($LastModFile); fixperms($LastModFile); }
    $result = "upresult=success";
    $FmtV['$upname'] = $upname;
    $FmtV['$upsize'] = $uploadfile['size'];
    if (IsEnabled($RecentUploadsFmt, 0)) {
      PostRecentChanges($pagename, '', '', $RecentUploadsFmt);
    }
    if (IsEnabled($NotifyItemUploadFmt, 0) && function_exists('NotifyUpdate')) {
      $NotifyItemFmt = $NotifyItemUploadFmt;
      $IsUploadPosted = 1;
      register_shutdown_function('NotifyUpdate', $pagename, getcwd());
    }
  }
  SDV($UploadRedirectFunction, 'Redirect');
  $UploadRedirectFunction($pagename,"{\$PageUrl}?action=upload&uprname=$upname&$result");
}

function UploadVerifyBasic($pagename,$uploadfile,$filepath) {
  global $EnableUploadOverwrite,$UploadExtSize,$UploadPrefixQuota,
    $UploadDirQuota,$UploadDir, $UploadBlacklist;
  if (count($UploadBlacklist)) {
    $tmp = explode("/", $filepath);
    $upname = strtolower(end($tmp));
    foreach($UploadBlacklist as $needle) {
      if (strpos($upname, $needle)!==false) return 'upresult=badname';
    }
  }
  if (!$EnableUploadOverwrite && file_exists($filepath)) 
    return 'upresult=exists';
  preg_match('/\\.([^.\\/]+)$/',$filepath,$match); $ext=@$match[1];
  $maxsize = $UploadExtSize[$ext];
  if ($maxsize<=0) return "upresult=badtype&upext=$ext";
  if ($uploadfile['size']>$maxsize) 
    return "upresult=toobigext&upext=$ext&upmax=$maxsize";
  switch (@$uploadfile['error']) {
    case 1: return 'upresult=toobig';
    case 2: return 'upresult=toobig';
    case 3: return 'upresult=partial';
    case 4: return 'upresult=nofile';
  }
  if (!is_uploaded_file($uploadfile['tmp_name'])) return 'upresult=nofile';
  $filedir = preg_replace('#/[^/]*$#','',$filepath);
  if ($UploadPrefixQuota && 
      (dirsize($filedir)-@filesize($filepath)+$uploadfile['size']) >
        $UploadPrefixQuota) return 'upresult=pquota';
  if ($UploadDirQuota && 
      (dirsize($UploadDir)-@filesize($filepath)+$uploadfile['size']) >
        $UploadDirQuota) return 'upresult=tquota';
  return '';
}

function dirsize($dir) {
  $size = 0;
  $dirp = @opendir($dir);
  if (!$dirp) return 0;
  while (($file=readdir($dirp)) !== false) {
    if ($file[0]=='.') continue;
    if (is_dir("$dir/$file")) $size+=dirsize("$dir/$file");
    else $size+=filesize("$dir/$file");
  }
  closedir($dirp);
  return $size;
}

function FmtUploadList($pagename, $args) {
  global $UploadDir, $UploadPrefixFmt, $UploadUrlFmt, $EnableUploadOverwrite,
    $TimeFmt, $EnableDirectDownload, $IMapLinkFmt, $UrlLinkFmt, $FmtV;

  $opt = ParseArgs($args);
  if (@$opt[''][0]) $pagename = MakePageName($pagename, $opt[''][0]);
  if (@$opt['ext']) 
    $matchext = '/\\.(' 
      . implode('|', preg_split('/\\W+/', $opt['ext'], -1, PREG_SPLIT_NO_EMPTY))
      . ')$/i';

  $uploaddir = FmtPageName("$UploadDir$UploadPrefixFmt", $pagename);
  $uploadurl = FmtPageName(IsEnabled($EnableDirectDownload, 1) 
                          ? "$UploadUrlFmt$UploadPrefixFmt/"
                          : "\$PageUrl?action=download&amp;upname=",
                      $pagename);
  
  // Meng. Delete an uploaded file.
	if (isset($_GET["delete"]) && file_exists($uploaddir.'/'.$_GET["delete"]))
	{
	  $delResult = @unlink($uploaddir.'/'.$_GET["delete"]);
	  // Redirect to the current page again to check the deletion result to prevent the
	  // current link from deleting the same file again upon refreshing
	  Redirect("$pagename?action=upload&delResult=$delResult");
	}
	else if (isset($_GET["delResult"]))
	{
	  if ($_GET["delResult"] === false)
	  { echo "<span style='color: red;'>Deletion failed. Probably no write access!</span>"; }
	  else 
 	  { echo "<span style='color: green;'>Image deleted successfully!</span>"; }
 	}
	
	// Meng. Show the selected uploaded image, and the delete link.
	// Replaced by client side AJAX solution.
  else if (isset($_GET["show"]) && file_exists($uploaddir.'/'.$_GET["show"]))
	{	
// 	  $ext = strtolower(pathinfo($uploaddir.'/'.$_GET["show"], PATHINFO_EXTENSION));
// 	  if ($ext == 'jpg' || $ext == 'png' || $ext == 'gif' || $ext == 'jpeg' || $ext == 'bmp')
//     {
//       $fileName = $_GET['show'];
//       $deleteLink = FmtPageName("\$PageUrl?action=upload&amp;delete=".rawurlencode($fileName), $pagename);
//       global $PubDirUrl;
//       $trashOpenImgUrl = "$PubDirUrl/skins/trashCanOpen.png";
//       $trashCloseImgUrl = "$PubDirUrl/skins/trashCanClose.png";
// 
//       // Meng. The trash can open/close images downloaded from the Internet.
//    		$delMarkup = FmtPageName("<a rel='nofollow' class='createlink' href='$deleteLink'>&nbsp;<img id='trashCanImg' class='noImgEffect' height='28px' style=\"position: absolute; margin-top:6px; \" src='$trashCloseImgUrl' cursor='pointer' onmouseover='showTrashOpen()'; onmouseout='showTrashClose()'; }' /></a>
//    		<script>
//    		function showTrashClose()
//    		{
//      		document.getElementById('trashCanImg').src='$trashCloseImgUrl';
//    		}
//    		function showTrashOpen()
//    		{
//      		document.getElementById('trashCanImg').src='$trashOpenImgUrl';
//    		}
//    		</script>
//    		", $pagename);
//    		
// 			echo "Path: $uploaddir/$fileName $delMarkup<br><img style='position:fixed; right:0; max-height:500px; max-width:500px;' src=".getImgFileContent($uploaddir.'/'.$_GET["show"])." />";
//     }
//     else { echo 'Not an image!'; }
	}

  $dirp = @opendir($uploaddir);
  if (!$dirp) return '';

  $filelist = array();
  while (($file=readdir($dirp)) !== false) {
    if ($file{0} == '.') continue;
    if (@$matchext && !preg_match(@$matchext, $file)) continue;
    $filelist[$file] = rawurlencode($file);
  }
  closedir($dirp);
  $out = array();
  natcasesort($filelist);
  
  $overwrite = '';
  $fmt = IsEnabled($IMapLinkFmt['Attach:'], $UrlLinkFmt);
  foreach($filelist as $file=>$encfile)
  {  
    // Meng. Change the link.
    $FmtV['$LinkUrl'] = 
      FmtPageName("\$PageUrl?action=upload&amp;show=$encfile", $pagename); //PUE("$uploadurl$encfile");
    $FmtV['$LinkText'] = $file;
    $FmtV['$LinkUpload'] =
      FmtPageName("\$PageUrl?action=upload&amp;upname=$encfile", $pagename);
    // Meng. Delete an uploaded file.
    $FmtV['$LinkDel'] =
      FmtPageName("\$PageUrl?action=upload&amp;delete=$encfile", $pagename);

    $stat = stat("$uploaddir/$file");
    if ($EnableUploadOverwrite) 
      $overwrite = FmtPageName("<a rel='nofollow' class='createlink'
        href='\$LinkUpload'>&nbsp;&Delta;</a>",
        $pagename);
        
/*********************/
//       global $PubDirUrl;
//       $trashOpenImgUrl = "$PubDirUrl/skins/trashCanOpen.png";
//       $trashCloseImgUrl = "$PubDirUrl/skins/trashCanClose.png";
// 
//       // Meng. The trash can open/close images downloaded from the Internet.
//    		$delMarkup = FmtPageName("<a rel='nofollow' class='createlink' href='$deleteLink'>&nbsp;<img id='trashCanImg$file' class='noImgEffect' height='28px' style=\"position: absolute; margin-top:6px; \" src='$trashCloseImgUrl' cursor='pointer' onmouseover='showTrashOpen()'; onmouseout='showTrashClose()'; }' /></a>
//    		<script>
//    		function showTrashClose()
//    		{
//      		document.getElementById('trashCanImg$file').src='$trashCloseImgUrl';
//    		}
//    		function showTrashOpen()
//    		{
//      		document.getElementById('trashCanImg$file').src='$trashOpenImgUrl';
//    		}
//    		</script>
//    		", $pagename);
/*********************/



		$del = FmtPageName(
		"<span style=\"cursor: pointer; color:red; \"onclick=\"
		if (confirm('Delete the file?')) { window.location = '\$LinkDel'; }
		\">&nbsp;&Chi;</span>
		",$pagename);
			
// 		$lnk = FmtPageName($fmt, $pagename);

    // Meng. Get the image dimensions.
 	  $imgDimension = '';
 	  $ext = strtolower(pathinfo($uploaddir.'/'.$file, PATHINFO_EXTENSION));
	  if (function_exists(getimagesize) && 
	  ($ext == 'jpg' || $ext == 'png' || $ext == 'gif' || $ext == 'jpeg' || $ext == 'bmp'))
    {
			list($width,$height) = getimagesize($uploaddir.'/'.$file);
			if (isset($width)) { $imgDimension = $width.'x'.$height.' ... '; }
    }

  	// Meng. Download the image file on demand using getAndShowImgFile.js
		$out[$stat['mtime'].$file] = "<li>".

		"<span style=\"cursor: pointer;\"
		onclick=\"getAndShowImgFile('$file');\">".$file."</span>" .

		"$lnk$overwrite$del$delMarkup ... ". 
		
		$imgDimension.
		
		number_format($stat['size']/1000) . " KB ... " . 
		
		strftime($TimeFmt, $stat['mtime'])  . '</li>';
  }

  // Meng. Sort the filelist by date
	ksort($out);
	$out = array_reverse($out);
	
  return implode("\n",$out);
}

# this adds (:if [!]attachments filepattern pagename:) to the markup
$Conditions['attachments'] = "AttachExist(\$pagename, \$condparm)";
function AttachExist($pagename, $condparm='*') {
  global $UploadFileFmt;
  @list($fpat, $pn) = explode(' ', $condparm, 2);
  $pn = ($pn > '') ? MakePageName($pagename, $pn) : $pagename;
    
  $uploaddir = FmtPageName($UploadFileFmt, $pn);
  $flist = array();
  $dirp = @opendir($uploaddir);
  if ($dirp) {
    while (($file = readdir($dirp)) !== false)
      if ($file{0} != '.') $flist[] = $file;
    closedir($dirp);
    $flist = MatchNames($flist, $fpat);
  }
  return count($flist);
}
