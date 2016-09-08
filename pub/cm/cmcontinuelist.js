/* CodeMirror - An enhanced page editor for PmWiki
 * Please refer to the main source module for copyright and license info.
 * Latest required version: 2016-05-24
 */
(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  var listRE = /^([*#]+\s*)(.*)$/;

  CodeMirror.commands.newlineAndIndentContinuePmWikiList = function (cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    var ranges = cm.listSelections(), replacements = [];
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].head,
          eolState = cm.getStateAfter(pos.line),
          inBlock = eolState.tokenize == "blockHandler",
          match;

      if (!ranges[i].empty() || inBlock || !(match = cm.getLine(pos.line).match(listRE))) {
        cm.execCommand("newlineAndIndent");
        return;
      }
      if (match[2].length) {
        replacements[i] = "\n" + match[1];
      } else {
        cm.replaceRange("", { line: pos.line, ch: 0 }, { line: pos.line, ch: pos.ch + 1 });
        replacements[i] = "\n";
      }
    }
    cm.replaceSelections(replacements);
  };
});
