<?php if (!defined('PmWiki')) exit();

/* 
 * This recipe finds all the images on the page and apply visual effects to the hovered
 * and/or clicked images. On clicking an image, a copy of it pops up at the center of the
 * browser with fade-in effect, with dimmed and blurred background to give the image a
 * focused feel. The popup image is removed with another click or by pressing Esc, also
 * with fading effect. The image size can be adjusted freely simply by scrolling. By
 * pressing 'M', the image is zoomed to fit the browser visible area. When either the
 * width or the height exceed the browser border, the popup image can be dragged.
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170129
 */

$RecipeInfo['Imgfocus']['Version'] = '20170129';

// The popup image fadein time in milliseconds.
SDV($ImgfocusFadeInTime, 125);

// The popup image fadeout time in milliseconds.
SDV($ImgFocusFadeOutTime, 200);

// The popup image zoom to fit browser time in milliseconds.
SDV($ImgfocusZoomToFitTime, 100);

// The target zoom size in terms of the proportion of the screen size measured in ratio of
// the width/height dimension depending on the aspect ratio.
SDV($ImgfocusZoomScreenRatio, 0.9);

// If set to true, the image will always be zoomed to the specified size
// otherwise, the image will be zoomed only if it's oversized
SDV($ImgfocusAlwaysZoom, false);

SDVA($ImgfocusExceptionList, array(''));
$ImgfocusExceptionList = json_encode($ImgfocusExceptionList);

if($action == "browse" || $action == "upload" || $_REQUEST['preview'])
{
  $HTMLHeaderFmt['imgfocus'] = "
  <script src='$PubDirUrl/imgfocus/imgfocus.js'></script>
  <script>
  imgfocus.fadeInTime = $ImgfocusFadeInTime;
  imgfocus.fadeOutTime = $ImgFocusFadeOutTime;
  imgfocus.zoomToFitTime = $ImgfocusZoomToFitTime;
  imgfocus.zoomScreenRatio = $ImgfocusZoomScreenRatio;
  imgfocus.alwaysZoom = '$ImgfocusAlwaysZoom';
  imgfocus.exceptionList = '$ImgfocusExceptionList';
  </script>
  <link rel='stylesheet' href='$PubDirUrl/imgfocus/imgfocus.css' type='text/css'>";
}

