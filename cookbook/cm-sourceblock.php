<?php /*>*/ if (!defined('PmWiki')) exit();
/* CodeMirror - An enhanced page editor for PmWiki
 * Please refer to the main source module for copyright and license info.
 * Latest required version: 2016-05-26
 */
if (!isset($RecipeInfo['CodeMirror'])) Abort("?cm-sourceblock require CodeMirror");
if (!function_exists('json_decode'))  Abort("?cm-sourceblock require json_decode() function");

SDV($CodeMirrorModesDependenciesAction, "cm-dependencies");
SDV($CodeMirrorModesDependenciesFile, "$FarmD/cookbook/cm-modes-dependencies.php");
@include_once($CodeMirrorModesDependenciesFile);

function CodeMirrorHandleDependencies($pagename, $auth = 'admin') {
  global $FarmD, $CodeMirrorBaseUrl, $CodeMirrorModesDependenciesFile;

  $modedir = str_replace('$FarmPubDirUrl', "$FarmD/pub", $CodeMirrorBaseUrl) . '/mode';
  $meta = file_get_contents($modedir . '/meta.js');
  preg_match('/CodeMirror\.modeInfo\s+=\s+(\[.*?\])\s*;/s', $meta, $m);
  $json = preg_replace(array('/([{,]+\s*)([^"{]+?)\s*:/',        # quote identifiers
                             '/([\[:]\s*)\/.*?\/[ig]?([,}\]])/', # drop regexes
                             ),
                       array('$1"$2":',
                             '$1""$2',
                             ), $m[1]);
  $infos = json_decode($json, true);
  $modes = array();
  $specs = array();
  foreach ($infos as $i) {
    $modes[$i['mode']] = 1;
    if ($i['mimes'])
      foreach ($i['mimes'] as $m)
        $specs[$m] = $i['mode'];
    else
      $specs[$i['mime']] = $i['mode'];
  }

  $deps = array();
  foreach ($modes as $mode => $x) {
    $specs[$mode] = $mode;

    $fname = "$modedir/$mode/$mode.js";
    if (file_exists($fname)) {
      $code = file_get_contents($fname);
      preg_match_all("/define\\s*\\(\\s*\[\\s*([^\\]]+)\\s*\\]\\s*,/", $code, $m);
      $dep = preg_replace(array("/([\"']).*?codemirror\\1\\s*(,?)\\s*/", # self-declare
                                "/([\"'])\\.\\.(.*?)\\1\\s*(,?)\\s*/",   # dependencies as script filenames
                                 ),
                          array("/$mode/$mode.js$2",
                                "$2.js$3",
                                 ), $m[1][0]);
      $deps[$mode] = array_reverse(explode(',', $dep));
    }
  }

  $out = "\$CodeMirrorModesReferenceUrl = '$CodeMirrorBaseUrl';\n"
      . '$CodeMirrorModeSpecs = ' . var_export($specs, true) . ";\n"
      . '$CodeMirrorModes = ' . preg_replace(array("/(=>)\\s*\n/s", "/\d+\\s*=>\\s*/"), array("$1", ""), var_export($deps, true)) . ";\n";

  if (($fp = @fopen($CodeMirrorModesDependenciesFile, "w"))) {
    fwrite($fp, "<?php /*>*/ if (!defined('PmWiki')) exit();\n# Codemirror mode dependencies auto-generated file\n\n");
    fwrite($fp, $out);
    fclose($fp);
    Redirect($pagename);
    exit;
  }
  Abort("<pre># Unable to generate CodeMirror mode dependencies file ($CodeMirrorModesDependenciesFile).\n# Configuration data given below:\n\n$out</pre>");
}

$HandleActions[$CodeMirrorModesDependenciesAction] = "CodeMirrorHandleDependencies";

if (function_exists('Markup_e')) {
  Markup_e('cmblock', '>markupend',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/si",
    "CodeMirrorBlockMarkup(\$pagename, \$m[1], \$m[3])");
  Markup_e('cmblockend', '>cmblock',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:codee?nd:\\)/si",
    "CodeMirrorBlockMarkup(\$pagename, \$m[1], \$m[2])");
} else {
  Markup('cmblock', '>markupend',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/sei",
    "CodeMirrorBlockMarkup(\$pagename, PSS('$1'), PSS('$3'))");
  Markup('cmblockend', '>cmblock',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:codee?nd:\\)/sei",
    "CodeMirrorBlockMarkup(\$pagename, PSS('$1'), PSS('$2'))");
}

function CodeMirrorBlock($pagename, $args, $block) {
  global $CodeMirrorBaseUrl, $CodeMirrorDirUrl, $CodeMirrorAddonsFmt, $CodeMirrorStylesFmt,
         $CodeMirrorBlockParams, $CodeMirrorBlockFmt, $CodeMirrorModeListFmt, $CodeMirrorModesMissingFmt,
         $CodeMirrorModesReferenceUrl, $CodeMirrorModeSpecs, $CodeMirrorModes,
         $CodeMirrorModesDependenciesAction;

  SDVA($CodeMirrorAddonsFmt, array(
    'sourceblock' => "\n<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/runmode/runmode.js'></script>\n"
                   . "<script type='text/javascript' src='$CodeMirrorDirUrl/cmblock.js'></script>\n",
  ));
  SDV($CodeMirrorBlockFmt, "
<div class='cmblocktext \$class' \$id>
  <textarea id='cm_i\$cm_id' style='display:none;'>\$txt</textarea>
  <script>cmblock('cm_i\$cm_id', 'cm_o\$cm_id',  '\$modeSpec', { \$opts }, \$olOffset);</script>
</div>
");
  SDV($CodeMirrorStylesFmt['codemirrorblock'], "
.cmblocktext {
  border-left: 2px solid #ddd;
  padding-left: 15px;
}
.cmblocktext .CodeMirror-linenumber{
  text-align: left;
  margin: 0;
}
.cmblocktext pre {
  border: none;
  background-color: white;
  padding: 0;
  margin: 0;

  white-space: pre-wrap;      /* CSS 3 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap;     /* Opera 4-6 */
  white-space: -o-pre-wrap;   /* Opera 7 */
  word-wrap: break-word;      /* Internet Explorer 5.5+ */
}
");

  $opt = array_merge((array)$CodeMirrorBlockParams, ParseArgs($args));
  if (@in_array('modelist', $opt[''])) {
    SDV($CodeMirrorAddonsFmt['modelist'], "<script type='text/javascript' src='$CodeMirrorBaseUrl/mode/meta.js'></script>\n");
    SDV($CodeMirrorModeListFmt, "
<div id='cm_i\$cm_id'>
  <script>cmmodelist('cm_i\$cm_id', { \$opts });</script>
</div>
");
    $CodeMirrorBlockFmt = $CodeMirrorModeListFmt;
    $mode = $opts = $block = '';
    $olOffset = null;
  } else {
    $modeSpec = @$opt[''][0];
    if ($modeSpec) {
      if (isset($CodeMirrorModesReferenceUrl) && $CodeMirrorModesReferenceUrl == $CodeMirrorBaseUrl) {
        $mode = $CodeMirrorModeSpecs[$modeSpec];
        if($CodeMirrorModes[$mode])
          SDV($CodeMirrorAddonsFmt[$mode],
            "<script type='text/javascript' src='$CodeMirrorBaseUrl/mode"
            . implode("'></script>\n<script type='text/javascript' src='$CodeMirrorBaseUrl/mode", $CodeMirrorModes[$mode])
            . "'></script>");
      } else {
        SDV($CodeMirrorModesMissingFmt, "<div><pre>!!! The CodeMirror mode dependencies file is outdated or missing !!! <a href='?action=$CodeMirrorModesDependenciesAction'>generate it</a></pre></div>");
        $CodeMirrorBlockFmt = $CodeMirrorModesMissingFmt;
        $modeSpec = $opts = $block = '';
        $olOffset = null;
      }
    }
    SDV($opts, '');
    $olOffset = @in_array('linenum', $opt['']) ? 1 :
            (isset($opt['linenum']) ? (0 + $opt['linenum']) : null);
    # undo PmWiki's htmlspecialchars conversion
    $block = str_replace(array('<:vspace>', '&lt;', '&gt;', '&amp;'),
                         array('', '<', '>', '&'), $block);
  }
  if ($opt['id']) {
    $id = "id='{$opt[id]}'";
  }
  $cm_id = uniqid();
  return str_replace(
    array('$class', '$id', '$cm_id', '$modeSpec', '$opts', '$olOffset', '$txt'),
    array(@$opt['class'], $id, $cm_id, $modeSpec, $opts, IsEnabled($olOffset, 'null'), htmlspecialchars($block)),
    $CodeMirrorBlockFmt);
}

function CodeMirrorBlockMarkup($pagename, $args, $block) { return Keep(CodeMirrorBlock($pagename, $args, $block)); }

if (!IsEnabled($EnableCodeMirrorPmWikiMarkup, 1)) return;

  SDV($CodeMirrorStylesFmt['codemirror-pmwiki-markup-block'], "
.cmblocktext.cm-pmwiki-markup {
  padding: 0;
  border: none;
}
.cmblocktext.cm-pmwiki-markup pre {
  color: black;
  background-color: #fafafa;
  padding: 0.5em;
}
");

function CodeMirrorMarkupMarkup($pagename, $text, $opt = '') {
  global $CodeMirrorDirUrl, $CodeMirrorAddonsFmt, $MarkupWordwrapFunction;

  SDV($CodeMirrorAddonsFmt['pmwiki'], "
<script type='text/javascript' src='$CodeMirrorDirUrl/pmwiki.js'></script>
<link rel='stylesheet' type='text/css' href='$CodeMirrorDirUrl/pmwiki.css' />
");
  // originally 'wordwrap'
  SDV($MarkupWordwrapFunction, PCCF('return $m;'));

  $MarkupMarkupOpt = array('class' => 'vert');
  $opt = array_merge($MarkupMarkupOpt, ParseArgs($opt));
  $html = MarkupToHTML($pagename, $text, array('escape' => 0));
  if (@$opt['caption']) 
    $caption = str_replace("'", '&#039;', 
                           "<caption>{$opt['caption']}</caption>");
  $class = preg_replace('/[^-\\s\\w]+/', ' ', @$opt['class']);
  if (strpos($class, 'horiz') !== false) 
    { $sep = ''; $text = $MarkupWordwrapFunction($text, 40); } 
  else 
    { $sep = '</tr><tr>'; $text = $MarkupWordwrapFunction($text, 75); }
  $block = CodeMirrorBlock($pagename, 'pmwiki class=cm-pmwiki-markup', $text);
  return Keep(@"<table class='markup $class' align='center'>$caption
      <tr><td class='markup1' valign='top'>$block</td>$sep<td 
        class='markup2' valign='top'>$html</td></tr></table>");
}

Markup_e('markup', '<[=',
  "/\\(:markup(\\s+([^\n]*?))?:\\)[^\\S\n]*\\[([=@])(.*?)\\3\\]/si",
  "CodeMirrorMarkupMarkup(\$pagename, \$m[4], \$m[2])");
Markup_e('markupend', '>markup',
  "/\\(:markup(\\s+([^\n]*?))?:\\)[^\\S\n]*\n(.*?)\\(:markupend:\\)/si",
  "CodeMirrorMarkupMarkup(\$pagename, \$m[3], \$m[1])");
