<?php if (!defined('PmWiki')) exit();
/*
 * LinkedResourceExtras - Linked resource helper functions and scripts for
 * markup/module writers
 * Copyright 2006-2007 by D.Faure (dfaure@cpan.org)
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
 * See http://www.pmwiki.org/wiki/Cookbook/LinkedResourceExtras for info.
 */
$RecipeInfo['LinkedResourceExtras']['Version'] = '20070215';

function ResolveLinkResource($pagename, $tgt, &$url, &$txt,
                             &$upname, &$filepath, &$size, &$mime) {
  global $EnableUpload, $UploadFileFmt, $UploadExts, $EnableExternalResource;
  $txt = ExplodeLinkResource($pagename, $tgt, $imap, $path);
  $ok = false;
  if($imap == 'Attach:' && IsEnabled($EnableUpload, 0)) {
    if (preg_match('!^(.*)/([^/]+)$!', $path, $match)) {
      $pagename = MakePageName($pagename, $match[1]);
      $path = $match[2];
    }
    $upname = MakeUploadName($pagename, $path);
    $filepath = FmtPageName("$UploadFileFmt/$upname", $pagename);
    $ok = file_exists($filepath);
    if($ok) {
      $size = filesize($filepath);
      $mime = @$UploadExts[preg_replace('/.*\\./', '', $filepath)];
    }
    $url = LinkUpload($pagename, $imap, $path, NULL, $path, $ok ? '$LinkUrl' : NULL);
  } else {
    $ok = IsEnabled($EnableExternalResource, 1) && ($imap != '<:page>');
    $url = LinkIMap($pagename, $imap, $path, NULL, $path, '$LinkUrl');
  }
  return $ok;
}

function ExplodeLinkResource($pagename, $tgt, &$imap, &$path) {
  global $LinkPattern;
  $t = preg_replace('/[()]/', '', trim($tgt));
  preg_match("/^($LinkPattern)?(.+?)(\"(.*)\")?$/", $t, $m);
  $imap = $m[1]; $path = $m[2];
  if(!$imap) $imap = '<:page>';
  $txt = preg_replace('/\\([^)]*\\)/', '', $tgt);
  if($imap == '<:page>')
    $txt = preg_replace(array('!/\\s*$!', '!^.*[^<]/!'), '', $txt);
  return $txt;
}

function ObjectAutoActivationWrapper($pagename, $obj) {
  global $EnableObjectAutoActivation, $ObjectAutoActivationScript, $PCache,
         $FarmPubDirUrl, $HTMLHeaderFmt;
  if(!IsEnabled($EnableObjectAutoActivation, 1)) return $obj;
  $script = '';
  if(!isset($PCache[$pagename]['extlinkedres'])) {
#    SDV($ObjectAutoActivationScript, "$FarmPubDirUrl/extlinkedres.js");
    $script = "\n<script type='text/javascript' src='$ObjectAutoActivationScript'></script>";
    $PCache[$pagename]['extlinkedres'] = true;
  }
  return "$script\n<script type='text/javascript'><!--
WriteObjectElement(\"" . rawurlencode($obj) . "\");
//--></script>
<noscript>
$obj
</noscript>";
}
