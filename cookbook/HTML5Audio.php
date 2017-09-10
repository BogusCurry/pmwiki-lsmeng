<?php if (!defined('PmWiki')) exit();
/*
This file is HTML5Audio.php; you
can redistribute it and/or modify it under the
terms of the GNU General Public License as
published by the Free Software Foundation
http://www.fsf.org either version 2 of the
License, or (at your option) any later version.

Copyright 2007-2016 GNUZoo (guru@gnuzoo.org)

http://www.pmwiki.org/wiki/Profiles/GNUZoo

Please donate to the author:

http://gnuzoo.org/GNUZooPayPal/
*/

$RecipeInfo['HTML5Audio']['Version'] = '20160205';

// Whether to include this module is controled in config.php
if (function_exists('Markup_e'))
{ Markup_e('HTML5Audio', 'fulltext', '/\\(:(html5audio)(\\s.*?)?:\\)/i', "HTML5Audio(\$m[1],\$m[2])"); }
else
{ Markup('HTML5Audio', 'fulltext', '/\\(:(html5audio)(\\s.*?)?:\\)/ie', "HTML5Audio('$1',PSS('$2'))"); }

/*
switch ($action)
{
  case "edit"   :
  case "print"  :
  if (! @$_POST['preview']) break;
  case "browse" :
  if (function_exists('Markup_e'))
  {
    Markup_e('HTML5Audio', 'fulltext', '/\\(:(html5audio)(\\s.*?)?:\\)/i', "HTML5Audio(\$m[1],\$m[2])");
  } else
  {
    Markup('HTML5Audio', 'fulltext', '/\\(:(html5audio)(\\s.*?)?:\\)/ie', "HTML5Audio('$1',PSS('$2'))");
  }
}
*/

function HTML5Audio($name, $args)
{
  global $HTML5AudioDir;
  $args = ParseArgs($args);

  // Meng. Remove the extension if found
  $filename = $args['filename'];
  $dotPos = strrpos($filename,'.');
  if ($dotPos !== false) { $filename = substr($filename, 0, $dotPos); }

//	$poster   = $args['poster'  ];
  $width    = $args['width'   ];
  $height   = $args['height'  ];

  // Meng. Set the height to be equal to the global image height
  global $imgHeightPx;
  $height = $imgHeightPx;

//	if ($width  == '') $width  = 480;
//	if ($height == '') $height = 360;

  return Keep('<audio controls="controls" >
  <source src="'.$filename.'.mp3"  type="audio/mpeg"/>
  <br />Your browser does not allow HTML5 audio.
  </audio>');
}