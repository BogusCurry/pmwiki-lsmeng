<?php if (!defined('PmWiki')) exit();
/*
This file is HTML5Video.php; you
can redistribute it and/or modify it under the
terms of the GNU General Public License as
published by the Free Software Foundation
http://www.fsf.org either version 2 of the
License, or (at your option) any later version.

Copyright 2010 GNUZoo (guru@gnuzoo.org)

	http://www.pmwiki.org/wiki/Profiles/GNUZoo

Please donate to the author:

	http://gnuzoo.org/GNUZooPayPal/

2015-08-15 : Remove hardcoded path poster + add php 5.5 support (Antony Templier)
2015-10-04 : Remove extra closing parenthesis that was causing a message under PHP 5.5. 
*/

$RecipeInfo['HTML5Video']['Version'] = '20151004';

switch ($action) {
	case "edit"   :
	case "print"  :
	if (! @$_POST['preview']) break;
	case "browse" :
    if(function_exists('Markup_e')) {
		Markup_e('HTML5Video', 'fulltext', '/\\(:(html5video)(\\s.*?)?:\\)/i', "HTML5Video(\$m[1],\$m[2])");
    } else {
        Markup('HTML5Video', 'fulltext', '/\\(:(html5video)(\\s.*?)?:\\)/ie', "HTML5Video('$1',PSS('$2'))");
    }
}
function HTML5Video($name, $args) {
	global $HTML5VideoDir;
	$args = ParseArgs($args);

  // Meng. Remove the extension if found
	$filename = $args['filename'];
	$dotPos = strrpos($filename,'.');
	if ($dotPos !== false) { $filename = substr($filename, 0, $dotPos); }
	
//	$poster   = "http://localhost/pmwiki/pub/html5avctrl/videoPoster.png";
	$width    = $args['width'   ];
	$height   = $args['height'  ];

	SDV($HTML5VideoDir, '/uploads/');

  // Meng. Set the height to be equal to the global image height
	global $imgHeightPx;
  $height = $imgHeightPx;
  $width = 190;
//	if ($width  == '') $width  = 480;
//	if ($height == '') $height = 360;

// Meng. Remove the upload link. Set a poster
return Keep('<video poster="'.$poster.'" preload="none" width="'.$width.'" height="'.$height.'" style="margin-right:0px;" controls>
  <source src="'.$filename.'.mp4" type="video/mp4"/>
  <br />Your browser does not allow HTML5 video.
</video>');
}