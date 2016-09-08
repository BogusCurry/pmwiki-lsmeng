<?php /*>*/ if (!defined('PmWiki')) exit();
/* CodeMirror - An enhanced page editor for PmWiki
 * Copyright (C) 2013-2016 by D.Faure <dominique.faure@gmail.com>,
 * Simon Davis <nzskiwi@gmail.com> and Marijn Haverbeke <marijnh@gmail.com>
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
 * See http://www.pmwiki.org/wiki/Cookbook/CodeMirror for more info.
 */
$RecipeInfo['CodeMirror']['Version'] = '2016-05-27';

### Base configuration
SDV($CodeMirrorBaseUrl, "\$FarmPubDirUrl/codemirror-5.15.2");
SDV($CodeMirrorDirUrl,  "\$FarmPubDirUrl/cm");
SDV($CodeMirrorScriptName, 'codemirror.js');
SDV($CodeMirrorConfig, array());
SDV($CodeMirrorAddonsFmt, array());
SDV($CodeMirrorStylesFmt, array());
SDVA($HTMLHeaderFmt, array('codemirror' => array(
  "\n<script type='text/javascript' src='$CodeMirrorBaseUrl/lib/$CodeMirrorScriptName'></script>\n",
  "<link rel='stylesheet' type='text/css' href='$CodeMirrorBaseUrl/lib/codemirror.css' />\n",
  &$CodeMirrorAddonsFmt,
#  "<link rel='stylesheet' type='text/css' href='$CodeMirrorBaseUrl/doc/doc.css' />\n",
  "<style type='text/css'><!--\n",
    &$CodeMirrorStylesFmt,
  "\n--></style>\n"
)));

### Source Block Stuff
if (IsEnabled($EnableCodeMirrorBlockMarkup, 1))
  include_once("$FarmD/cookbook/cm-sourceblock.php");

### Page Editing Stuff
if ($action != 'edit' || !IsEnabled($EnableCodeMirrorPageEditing, 1)) return;

SDVA($InputTags['e_textarea'], array(
  'id' => 'text',
  ':fn' => 'InputCodeMirrorMarkup',
  ':html' => "<div><textarea \$InputFormArgs>\$EditText</textarea><div id='cm_resizer'></div></div>"));

function InputCodeMirrorMarkup($pagename, $type, $args) {
  global $CodeMirrorStylesFmt, $CodeMirrorScript, $CodeMirrorConfig;
  SDV($CodeMirrorStylesFmt['cm_resizer'], "
#cm_resizer {
  background-color: #ddd;
  height: 0.5em;
}");
  SDV($CodeMirrorScript, "<script type='text/javascript'>
function toggleCodeMirror() {
  var tarea = document.getElementById('text');
  if (tarea.codemirror) {
    tarea.codemirror.toTextArea();
    delete tarea.codemirror;
  } else {
    tarea.codemirror = CodeMirror.fromTextArea(tarea, { \$CodeMirrorConfig });
  }
}
toggleCodeMirror();
</script>\n");
  $cfg = implode(", ", $CodeMirrorConfig);
  $opt = NULL;
  return Keep(InputToHTML($pagename, $type, $args, $opt) .
              str_replace('$CodeMirrorConfig', $cfg,  $CodeMirrorScript));
}

if (IsEnabled($EnableGUIButtons, 0)) {
  SDVA($HTMLHeaderFmt, array('guiedit' => "<script type='text/javascript' src='$CodeMirrorDirUrl/cmguiedit.js'></script>\n"));
  SDV($GUIButtons['cm'], array(9999, '', '', '',
    "<label class='cm_check' for='cm_check'><input id='cm_check' type='checkbox' checked='checked' onclick='toggleCodeMirror()' />Highlight</label>", ''));
  SDV($CodeMirrorStylesFmt['buttons'], "
.cm_check { vertical-align: top; }
");
}

SDVA($CodeMirrorPresetParams, array(
  'maxheight' => '20em',
));
SDVA($CodeMirrorPresets, array(
  'default' => array(
    'style' => "
.CodeMirror {
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}"),
  'syntax' => array(
    'config' => "mode: 'pmwiki'",
    'addon' => "
<script type='text/javascript' src='$CodeMirrorDirUrl/pmwiki.js'></script>
<link rel='stylesheet' type='text/css' href='$CodeMirrorDirUrl/pmwiki.css' />
"),
  'selection' => array(
    'config' => "styleSelectedText: true",
    'addon' => "<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/selection/mark-selection.js'></script>",
    'style' => "
.CodeMirror-selected  { background-color: darkblue !important; }
.CodeMirror-selectedtext { color: white; }
"),
  'cursor' => array(
    'style' => "
.CodeMirror div.CodeMirror-cursor {  border-left: 2px solid darkblue; }
.CodeMirror div.CodeMirror-overwrite div.CodeMirror-cursor { border-left: 2px solid red; }
"),
  'linenumbers' => array(
   'config' => "lineNumbers: true",
),
  'linewrapping' => array(
    'config' => "lineWrapping: true",
),
  'activeline' => array(
    'config' => "styleActiveLine: true",
    'addon' => "<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/selection/active-line.js'></script>",
    'style' => "
.CodeMirror div.CodeMirror-activeline-background { background-color: #fafafa; }
"),
  'visualtab' => array(
    'style' => "
.cm-tab {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAMCAYAAAAkuj5RAAAAAXNSR0IArs4c6QAAAGFJREFUSMft1LsRQFAQheHPowAKoACx3IgEKtaEHujDjORSgWTH/ZOdnZOcM/sgk/kFFWY0qV8foQwS4MKBCS3qR6ixBJvElOobYAtivseIE120FaowJPN75GMu8j/LfMwNjh4HUpwg4LUAAAAASUVORK5CYII=);
  background-position: right;
  background-repeat: no-repeat;
}"),
  'trailingspace' => array(
    'config' => "showTrailingSpace: true",
    'addon' => "<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/edit/trailingspace.js'></script>",
    'style' => "
.cm-trailingspace {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QUXCToH00Y1UgAAACFJREFUCNdjPMDBUc/AwNDAAAFMTAwMDA0OP34wQgX/AQBYgwYEx4f9lQAAAABJRU5ErkJggg==);
  background-position: bottom left;
  background-repeat: repeat-x;
}"),
  'tabfocus' => array(
    'keys' => array('Tab' => "false", 'Shift-Tab' => "false"),
  ),
  'continuelist' => array(
    'keys' => array('Enter' => "'newlineAndIndentContinuePmWikiList'"),
    'addon' => "<script type='text/javascript' src='$CodeMirrorDirUrl/cmcontinuelist.js'></script>",
  ),
  'autoresize' => array(
    'config' => "viewportMargin: Infinity",
    'style' => "
.CodeMirror {
  border-right: 1px solid #ddd;
  height: 600px;
}
.CodeMirror-scroll {
  overflow-y: hidden;
  overflow-x: auto;
}"),
  'maxheight' => array(
    'style' => "
.CodeMirror {
  border-right: 1px solid #ddd;
  height: 600px;
  max-height: $CodeMirrorPresetParams[maxheight];
}
.CodeMirror-scroll {
  overflow-x: auto;
  max-height: $CodeMirrorPresetParams[maxheight];
}"),
  'search' => array(
    'keys' => array('Alt-F' => "'findPersistent'"),
    'addon' => "
<link rel='stylesheet' type='text/css' href='$CodeMirrorBaseUrl/addon/dialog/dialog.css' />
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/dialog/dialog.js'></script>
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/search/searchcursor.js'></script>
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/search/search.js'></script>
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/search/jump-to-line.js'></script>
"),
  'hint' => array(
    'keys' => array('Ctrl-Space' => "'autocomplete'"),
    'addon' => "
<link rel='stylesheet' type='text/css' href='$CodeMirrorBaseUrl/addon/hint/show-hint.css'>
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/hint/show-hint.js'></script>
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/hint/anyword-hint.js'></script>
<script type='text/javascript'>
  CodeMirror.commands.autocomplete = function(cm) {
    cm.showHint({hint: CodeMirror.hint.anyword});
  }
</script>"),
  'fullscreen' => array(
    'keys' => array(
      'F11' => "function(cm) { cm.setOption('fullScreen', !cm.getOption('fullScreen')); }",
      'Esc' => "function(cm) { if (cm.getOption('fullScreen')) cm.setOption('fullScreen', false); }",
    ),
    'addon' => "
<link rel='stylesheet' type='text/css' href='$CodeMirrorBaseUrl/addon/display/fullscreen.css'>
<script type='text/javascript' src='$CodeMirrorBaseUrl/addon/display/fullscreen.js'></script>
",
    'style' => "
.CodeMirror.CodeMirror-fullscreen { max-height: none; }
.CodeMirror.CodeMirror-fullscreen .CodeMirror-scroll { max-height: none; }
"),
));

SDVA($CodeMirrorActivePresets, array(
  'default' => 1,
  'syntax' => 1,
  'selection' => 1,
  'cursor' => 1,
  'linenumbers' => 1,
  'linewrapping' => 1,
  'activeline' => 1,
  'visualtab' => 1,
  'tabfocus' => 1,
  'continuelist' => 1,
));

function ActivateCodeMirrorPresets() {
  global $CodeMirrorPresets, $CodeMirrorActivePresets,
         $CodeMirrorConfig, $CodeMirrorAddonsFmt, $CodeMirrorStylesFmt;
  $extraKeys = array();
  foreach ($CodeMirrorActivePresets as $name => $enabled) {
    if (isset($CodeMirrorPresets[$name]) && $enabled) {
      $n = 'cm-' . $name;
      if (isset($CodeMirrorPresets[$name]['keys'])) {
        foreach($CodeMirrorPresets[$name]['keys'] as $k => $f)
          $extraKeys[] = "'$k': $f";
      }
      if (isset($CodeMirrorPresets[$name]['config']))
        $CodeMirrorConfig[$n] = $CodeMirrorPresets[$name]['config'];
      if (isset($CodeMirrorPresets[$name]['addon']))
        $CodeMirrorAddonsFmt[$n] = $CodeMirrorPresets[$name]['addon'];
      if (isset($CodeMirrorPresets[$name]['style']))
        $CodeMirrorStylesFmt[$n] = $CodeMirrorPresets[$name]['style'];
    }
  }
  if (count($extraKeys))
    $CodeMirrorConfig['cm-extrakeys'] = "extraKeys: { " . implode(', ', $extraKeys) . " }";
}

ActivateCodeMirrorPresets();
