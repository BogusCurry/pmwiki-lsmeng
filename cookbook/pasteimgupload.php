<?php if (!defined('PmWiki')) exit();

/*
 * Enable direct copy & paste to upload an image. Works in Chrome only. 
 * Upload image courtesy at http://www.unionpaper.net
 *
 * Enable drag & drop upload of multiple files. 
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170602
 */

$RecipeInfo['pasteimgupload']['Version'] = '20170525';

if ($action == 'edit')
{
// For publication, remove the following
  if (isDiaryPage() === 2 && $AuthorLink == 'MBA')
  {
    preg_match('/[\.\/](\d{4})/', $pagename, $match);
    $year = $match[1];
    preg_match('/\d\d$/', $pagename, $match);
    $mon = (string)intval($match[0]);
    $uploadDirUrlHeader = "Photo}$year/$mon/";
  }
  else
  {
		preg_match('/(\w+)[\.\/]/', $pagename, $match);
    $groupName = $match[1];
    $uploadDirUrlHeader = "PhotoPub}$groupName/";
  }

// Remove "uploadDirUrlHeader" for publication
  $HTMLHeaderFmt['pasteimgupload'] = '
  <script type="text/javascript" src="$PubDirUrl/pasteimgupload/pasteimgupload.js"></script>
  <script type="text/javascript">
  PasteImgUploadImgSrc = "<img height=\'50\' src=\'$PubDirUrl/pasteimgupload/upload.png\' >";
  PasteImgUploadUrl = "$ScriptUrl/$pagename?action=postupload";
  uploadDirUrlHeader = "{$" + "$uploadDirUrlHeader";
  </script>';
}

else if ($action == 'postupload')
{
  $UploadRedirectFunction = 'UploadRedirectPasteImg';
  function UploadRedirectPasteImg($pagename, $urlfmt)
  {
    if (isset($_SERVER['HTTP_AJAXUPLOAD']))
    {
      preg_match('/(?<=upresult=)[^&]*/', $urlfmt, $match);

      $upresultCode = 'UL'.$match[0];
      $upresultCode = $upresultCode=='ULtoobigext' ? 'ULtoobig' : $upresultCode;
      global $XL;
      $upresult = $XL['en'][$upresultCode];
      $upresult = $upresult==null ? $upresultCode : $upresult;
      header("UpResult: $upresult");
    }
    else { Redirect($pagename, $urlfmt); }
  }
}