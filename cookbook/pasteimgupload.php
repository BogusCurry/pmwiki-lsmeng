<?php if (!defined('PmWiki')) exit();

/*
 * Enable direct copy & paste to upload an image. Works in Chrome only. 
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2016 Ling-San Meng (f95942117@gmail.com)
 * Version 20160729
 */

$RecipeInfo['pasteimgupload']['Version'] = '20160729';


if ($action == 'edit')
{
  $HTMLHeaderFmt['pasteimgupload'] = "
  <script type='text/javascript' src='$PubDirUrl/pasteimgupload/pasteimgupload.js'></script>
  <script type='text/javascript'>
    PasteImgUploadPubUrl = '$PubDirUrl';
    PasteImgUploadUrl = '$ScriptUrl?n=$pagename?action=postupload';
  </script>";
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