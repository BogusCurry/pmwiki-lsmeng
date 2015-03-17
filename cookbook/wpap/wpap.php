<?php if (!defined('PmWiki')) exit();
/*
 ==========================
 = WordPress Audio Player =
 ==========================
 This recipe enables embedding of the standalone version of the WordPress
 Audio Player into PmWiki pages via PmWiki Markup. Released under a
 Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
  Jess Harpur, 2012.
 View the license here: http://creativecommons.org/licenses/by-nc-sa/3.0/
 
 The WordPress Audio Player, by Martin Laine, is released under the Open Source
 MIT license. View the license here: http://wpaudioplayer.com/license/
 
 For the latest version of the recipe, installation instructions, and usage
 information, go to:

	 http://www.pmwiki.org/wiki/Cookbook/WordPressAudioPlayer 		
*/

### Initialise recipe ===
$RecipeInfo['WordPressAudioPlayer']['Version'] = '2012-09-05';

# Check if $wpap_width is defined (local/config.php)

if ($wpap_width > 0) {
	# Tell the player to use it's default settings
	# while using the specified width
	$cfg = "width: \"$wpap_width\"";
} else {
	# Get settings from user.cfg if it exists in the pub/wpap folder
	$url = $PubDirUrl ."/wpap/user.cfg";
	$settings = file_get_contents($url);
	$pos = stripos($settings, "@") + 1;
	if ($pos != 1) {
		$cfg = substr($settings, $pos);
	} else {
		# otherwise get settings from pub/wpap/wpap.cfg
		$url = $PubDirUrl ."/wpap/wpap.cfg";
		$settings = file_get_contents($url);
		$pos = stripos($settings, "@") + 1;
		$cfg = substr($settings, $pos);
	}
}

# Insert AudioPlayer's javascript stuff in <head> section
SDVA($HTMLHeaderFmt, array(
	'audio-player.js' => '<script type="text/javascript" src="' .$PubDirUrl .'/wpap/audio-player.js"></script>',
'audio-player.swf' => '<script type="text/javascript">
              AudioPlayer.setup("' .$PubDirUrl .'/wpap/player.swf", {' .$cfg .'});  
  </script>'));

# Process the wpap markup (:wpap [PlayerID]|MP3|[Title]|[Artist] :)
Markup("wpap", "directives",  "/\\(:wpap (.*?)\|(.*?)\|(.*?)\|(.*?) :\\)/e", "wpap_ShowPlayer('$1','$2','$3','$4')");

# Process the wpapx (eXtended) markup (:wpapx [PlayerID]|MP3|[Title]|[Artist]|[AudioPlayer args list] :)
Markup("wpapx", "directives",  "/\\(:wpapx (.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?) :\\)/e", "wpapx_ShowPlayer('$1','$2','$3','$4','$5')");

// End of recipe initialisation

### Convert wpap markup to html ===
function wpap_ShowPlayer($player, $path, $song, $artist) {
	global $pnum, $soundFile, $mp3url, $wpap_DefaultMp3Url, $PubDirUrl;

/* Meng: The following few lines causes error messages. */
/* 
	# Get player ID number
	if (is_nan($player)) {
		$pnum = 1;
	} else {
		$pnum = $player;
	}
	*/
	
	
	# Get default location for MP3s
	if ($wpap_DefaultMp3Url) {
		$mp3url = $wpap_DefaultMp3Url;
	} else {
		$mp3url = $PubDirUrl ."/wpap/MP3s/";
	}
	
	# Process MP3 locations
	$urls = explode(',', $path);
	foreach ($urls as $k=>&$v) {
		$v = ltrim($v);
		if (parse_url($v, PHP_URL_SCHEME)) {
			# do nothing
		} else {
			$v = $mp3url .$v;
		}
	}
	$soundFile = implode(',', $urls);
	
	# Create html from markup
	$out = "<p id=\"audioplayer_$pnum\">Adobe Flash required to play MP3s</p><script type=\"text/javascript\">AudioPlayer.embed(\"audioplayer_$pnum\", {soundFile:\"$soundFile\"";
	if ($song) {
		$out .= ", titles:\"$song\"";
	}
	if ($artist) {
		$out .= ", artists:\"$artist\"";
	}
	# Finalise html 
	$out .= "});</script>";

        return Keep($out);
}

# Convert wpapx (eXtended) markup to html ===
function wpapx_ShowPlayer($player, $path, $song, $artist, $args) {
	global $pnum, $soundFile, $mp3url, $wpap_DefaultMp3Url, $PubDirUrl;

	# Get player ID number
	if (is_nan($player)) {
		$pnum = 1;
	} else {
		$pnum = $player;
	}
	
	# Get default location for MP3s
	if ($wpap_DefaultMp3Url) {
		$mp3url = $wpap_DefaultMp3Url;
	} else {
		$mp3url = $PubDirUrl ."/wpap/MP3s/";
	}
	
	# Process MP3 locations
	$urls = explode(',', $path);
	foreach ($urls as $k=>&$v) {
		$v = ltrim($v);
		if (parse_url($v, PHP_URL_SCHEME)) {
			# do nothing
		} else {
			$v = $mp3url .$v;
		}
	}
	$soundFile = implode(',', $urls);
	
	# Create html from markup
	$out = "<p id=\"audioplayer_$pnum\">Adobe Flash required to play MP3s</p><script type=\"text/javascript\">AudioPlayer.embed(\"audioplayer_$pnum\", {soundFile:\"$soundFile\"";
	if ($song) {
		$out .= ", titles:\"$song\"";
	}
	if ($artist) {
		$out .= ", artists:\"$artist\"";
	}
	
	# Add any additional player attributes to html
	if ($args) {
		$out .= "," .$args;
	}
	
	# Finalise html 
	$out .= "});</script>";
	
        return Keep($out);
}
