<?php if (!defined('PmWiki')) exit();
/*
 * FlashMediaPlayer - Embed the flash players into PmWiki 2.x pages
 * Copyright 2007 by D.Faure (dfaure@cpan.org)
 * Copyright 2009 by Ed Wildgoose (info (at) mailasail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * See http://www.pmwiki.org/wiki/Cookbook/FlashMediaPlayer for info.
 */
$RecipeInfo['FlashMediaPlayer']['Version'] = '2009-01-31';

include_once("$FarmD/cookbook/extlinkedres.php");
if(version_compare($RecipeInfo['LinkedResourceExtras']['Version'], '20070215') < 0)
  Abort('?FlashMediaPlayer requires an updated LinkedResourceExtras');

SDVA($FlashMediaPlayerInfo, array(
'#objparms' => array('quality' => 'autohigh', # medium,low
                     'wmode' => 'transparent', # opaque
                     'allowfullscreen' => 'true',
                     'allowscriptaccess' => 'always',
                     'bgcolor' => '#ffffff',
                     'menu' => 'false'),
'#link' => "<a class='medialink' href='\$url' rel='nofollow'>\$txt</a>",
'#block' => "<span class='flashmediaplayer'>\$obj \$link</span>",
));

Markup('flashmediaplayer', 'directives',
       "/\\(:((\\w+)-player\\s+(\\S+)(.*?)):\\)/ie",
       "Keep(FlashMediaPlayer(\$pagename,'$2','$3',PSS('$4')))");

SDV($FlashMediaPlayerAction, 'mediadownload');
if(IsEnabled($EnableFlashMediaPlayerForceAttachement, 1)
   && $action == $FlashMediaPlayerAction)
  $HandleActions[$FlashMediaPlayerAction] = 'HandleFlashMediaPlayerDownload';

if(IsEnabled($EnableFlashMediaPlayerEnclosure, 1) && isset($FeedFmt)) {
  $FeedFmt['rss']['item']['mediaenclosure'] = 'FlashMediaPlayerRSSEnclosure';
# see http://www.xs4all.nl/~foz/mod_enclosure.html for some convenient specs
#  $FeedFmt['rdf']['item']['mediaenclosure'] = 'FlashMediaPlayerRDFEnclosure';
}

function SRPF(&$opt, $flag, $def) { /*Set&RemoveParameterFlag*/
  $ret = (@is_array($def['-']) && !is_int(array_search($flag, $def['-']))) ||
         (@is_array($def['+']) && is_int(array_search($flag, $def['+'])));
  foreach(array('+' => true, '-' => false) as $o => $v) {
    $k = @array_search($flag, (array)$opt[$o]);
    if(is_int($k)) {
      unset($opt[$o][$k]);
      $ret = $v;
    }
  }
  return $ret;
}

function SRPV(&$opt, $arg, &$v, $n = NULL) { /*Set&RemoveParameterValue*/
  if(@$opt[$arg]) {
    if(is_array($v)) $v[is_null($n) ? $arg : $n] = $opt[$arg];
    else $v = $opt[$arg];
    unset($opt[$arg]);
  }
}

function FlashMediaPlayer($pagename, $type, $tgt, $args = NULL) {
  global $FlashMediaPlayerInfo, $FarmPubDirUrl, $EnableFlashMediaPlayerExtraLinks,
         $EnableFlashMediaPlayerForceAttachement, $FlashMediaPlayerAction;
  if(is_null($FlashMediaPlayerInfo[$type])) return '';
  $player = "$FarmPubDirUrl/{$FlashMediaPlayerInfo[$type]['swf']}";
  if(!ResolveLinkResource($pagename, $tgt, $url, $txt, $upname, $filepath, $size, $mime))
    return isset($filepath) ? $url : '';
  $defaults = array_merge((array)($FlashMediaPlayerInfo['#defaults']),
                          (array)($FlashMediaPlayerInfo[$type]['defaults']));
  $opt = ParseArgs($args);
  SDV($EnableFlashMediaPlayerExtraLinks, 1);
  $link = $EnableFlashMediaPlayerExtraLinks && SRPF($opt, 'link', $defaults);
  $diag = SRPF($opt, 'diag', $defaults);
  $opt = array_merge($defaults, $opt);
  unset($opt['-'], $opt['+'], $opt['#'], $opt['']);
  $w  = $opt['width']; $h = $opt['height'];
  SRPV($opt, 'align', $al);
  SRPV($opt, 'text', $txt);
  $globalparms = $FlashMediaPlayerInfo['#objparms'];
  SRPV($opt, 'objbgcolor', $globalparms, 'bgcolor');
  SRPV($opt, 'wmode', $globalparms);
  SRPV($opt, 'menu', $globalparms);
  if(!$link) $link = '';
  else {
      $linkurl =
        (isset($filepath) && IsEnabled($EnableFlashMediaPlayerForceAttachement, 1)) ?
        PUE(FmtPageName("{\$PageUrl}?action=$FlashMediaPlayerAction&amp;upname=$upname",
                        $pagename))
        : $url;
    $link = str_replace(array('$url',  '$txt'),
                        array($linkurl, $txt), $FlashMediaPlayerInfo['#link']);
  }
  $parms = array();

  foreach($opt as $n => $v) {
        # Test if any param uses Attach: syntax and resolve to url
        if (preg_match("/^Attach:.*/", $v)) {
                ResolveLinkResource($pagename, $v, $u, $t, $u, $f, $s, $m);
                $v = $u;
        }
	# Allow a couple of variables to be expanded in the options array
        $v = str_replace(array('$url', '$txt'),
                                   array($url, urlencode($txt)), $v);

        $parms[] = "$n=" . urlencode($v);
  }
  $parms = implode("&amp;", $parms);
  foreach(array_merge((array)($FlashMediaPlayerInfo[$type]['objparms']),
                      $globalparms) as $n => $v) {
    if(is_array($v)) $v = implode("&amp;", $v);
    $v = str_replace(array('$FarmPubDirUrl', '$url', '$txt', '$parms'),
                           array($FarmPubDirUrl, $url, urlencode($txt), $parms), $v);
    $objparms[] = "<param name='$n' value='$v' />";
  }
  $objparms = implode("\n", $objparms);
  $out[] = "\n<!--[if !IE]> Firefox and others will use outer object -->
<object type='application/x-shockwave-flash' class='flashmediaplayer {$type}'
 width='{$w}' height='{$h}' align='{$al}' data='{$player}'>
{$objparms}
<param name='pluginurl' value='http://www.macromedia.com/go/getflashplayer' />
<!--<![endif]-->\n<!-- MSIE (Microsoft Internet Explorer) will use inner object -->";
  $out[] = ObjectAutoActivationWrapper($pagename, "
<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' class='flashmediaplayer {$type}'
 codebase='http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0'
 width='{$w}' height='{$h}' align='{$al}'>
<param name='movie' value='{$player}' />
{$objparms}
Uh oh.  The browser should have rendered a video here, not this text...  Please check that you have javascript enabled in your browser.  Otherwise, please update your version of the free Flash Player by <a href=\"http://www.adobe.com/go/getflashplayer\">downloading the latest Flash Player from here: http://www.adobe.com/go/getflashplayer</a>
</object>");
  $out[] = "\n<!--[if !IE]> close outer object -->\n</object>\n<!--<![endif]-->\n";

  $out = str_replace(array('$obj', '$link'),
                     array(implode('', $out), $link),
                     $FlashMediaPlayerInfo['#block']);
  if($diag) $out = '<pre>'.htmlspecialchars($out).'</pre>';
  return $out;
}

function HandleFlashMediaPlayerDownload($pagename, $auth = 'read') {
  global $UploadExts, $DownloadDisposition;
  if (!function_exists('HandleDownload')) exit();
  $DownloadDisposition = 'attachment';
  HandleDownload($pagename, $auth);
}

#function FlashMediaPlayerRDFEnclosure($pagename, &$page, $k) {
#  return FlashMediaPlayerEnclosure($pagename, $page,
#    "<enc:enclosure rdf:resource='\$url' enc:type='\$mime' enc:length='\$size' />\n");
#}

function FlashMediaPlayerRSSEnclosure($pagename, &$page, $k) {
  return FlashMediaPlayerEnclosure($pagename, $page,
    "<enclosure url='\$url' type='\$mime' length='\$size' />\n");
}

function FlashMediaPlayerEnclosure($pagename, &$page, $fmt) {
  global $MarkupTable, $FlashMediaPlayerInfo;
  $page = ReadPage($pagename, READPAGE_CURRENT); PCache($pagename, $page);
  preg_match_all($MarkupTable['flashmediaplayer']['pat'], $page['text'], $markups, PREG_SET_ORDER);
  $encl = '';
  foreach($markups as $m) {
    array_shift($m); list(,$type, $tgt, $args) = $m;
    if(is_null($FlashMediaPlayerInfo[$type])) continue;
    $defaults = array_merge((array)($FlashMediaPlayerInfo['#defaults']),
                            (array)($FlashMediaPlayerInfo[$type]['defaults']));
    $opt = ParseArgs($args);
    if(!SRPF($opt, 'feed', $defaults) ||
       !ResolveLinkResource($pagename, $tgt, $url, $txt, $upname, $filepath, $size, $mime))
      continue;
    $encl .= str_replace(array('$url', '$mime', '$size'), array($url, $mime, $size), $fmt);
  }
  return $encl;
}
