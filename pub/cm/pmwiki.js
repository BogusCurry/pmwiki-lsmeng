/* CodeMirror - An enhanced page editor for PmWiki
 * Please refer to the main source module for copyright and license info.
 * See https://codemirror.net/demo/simplemode.html for some hints
 * and PmWiki module scripts/stdmarkup.php for markup definitions
 * Latest required version: 2016-05-27
 */

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("pmwiki", function (config, parserConfig) {

    var indentUnit = config.indentUnit;
    var tokenDefs = parserConfig.tokenDefs || [
      // PmWiki specific directives, see http://www.pmwiki.org/wiki/PmWiki/PageDirectives
      {regex: /\(:(?:table|tableend|headnr|head|cellnr|cell).*:\)/, sol:true, token: "pm-table"},
      {regex: /\(:(?:redirect|include) .+:\)/, token: "pm-backslash-eol"},
      {regex: /\(:(?:no)?(?:spacewikiwords|linkwikiwords|linebreaks):\)/, token: "pm-builtin"},
      {regex: /\(:no(?:header|footer|title|left|right|groupheader|groupfooter|action):\)/, token: "pm-builtin"},
      {regex: /\(:(?:attachlist|description|keywords|messages|title) .+:\)/, token: "pm-builtin"},
      {regex: /\(:(?:article\d*|section\d*|header|footer|aside|address|nav)(?:end)?(?: .*)?:\)/, sol:true, token: "pm-builtin"},
      //* PmWiki markup
      {regex: /\[@/, token: "pm-block-pre", next: "blockHandler", end: /@\]/},
      {regex: /\[=/, token: "pm-block-code", next: "blockHandler", end: /=\]/},
      {regex: /\{[-\w\/.\x80-\xff]*(\*|!|\$|=|<|>)?\$:?\w[-\w]*\}/, token: "pm-var"},
      {regex: /&(?:[A-Za-z0-9]+|#\d+|#[xX][A-Fa-f0-9]+);/, token: "pm-entity"},
      {regex: /\\?\\$/, token: "pm-backslash-eol"},
      {regex: /\(:comment .*:\)/, token: "pm-comment"},
      {regex: /%.*?comment[^%]*%(.*?%%|.*$)/, token: "pm-comment"},
      {regex: />>(?:.*\s)?comment(?:\s.*)?<</, sol: true, token: "pm-comment", next: "blockHandler", end:/>>.*?<</},
      {regex: /\{\(?:\w+\b.*?\)\}/, token: "pm-expr"},
      {regex: /\(:.+:\)/, token: "pm-directive"},
      // PmWiki formatting
      {regex: /'''''.*?'''''/, token: "pm-emstrong"},
      {regex: /(?:'''[^']|''''').*?(?:'''(?:(?!')|$)|''''')/, token: "pm-strong"},
      {regex: /(?:''[^']|''''').*?(?:''(?:(?!')|$)|''''')/, token: "pm-em"},
      {regex: /'~'\*.*?\*'~'/, token: "pm-italicbold"},
      {regex: /'\*'~.*?~'\*'/, token: "pm-italicbold"},
      {regex: /'\*.*?\*'/, token: "pm-bold"},
      {regex: /'~.*?~'/, token: "pm-italic"},
      {regex: /''.*?''/, token: "pm-em"},
      {regex: /@@.*?@@/, token: "pm-code"},
      {regex: /'\+.*?\+'/, token: "pm-big"},
      {regex: /'-.*?-'/, token: "pm-small"},
      {regex: /'\^.*?\^'/, token: "pm-sup"},
      {regex: /'_.*?_'/, token: "pm-sub"},
      {regex: /\[(?:\++).*?\1\]/, token: "pm-big"},
      {regex: /\[(?:-+).*?\1\]/, token: "pm-small"},
      {regex: /\{\+.*?\+\}/, token: "pm-ins"},
      {regex: /\{-.*?-\}/, token: "pm-del"},
      {regex: /\[\[(?:<<?|>)\]\]/, token: "pm-break"},
      // PmWiki links
//      {regex: /(\[\[!)(.*?)(\]\])/, token: ["pm-link", "pm-link-ref", "pm-link"]}, // category
//      {regex: /(\[\[#)([^\]]+.*?)(\]\])/, token: ["pm-link", "pm-link-ref", "pm-link"]}, // anchor
//      {regex: /(\[\[~)([^\]]+.*?)(\]\])/, token: ["pm-link", "pm-link-ref", "pm-link"]}, // author name
//      {regex: /(\[\[)([^-]+.*?)(->)([^\]]+.*?)(\]\])/, token: ["pm-link", null, "pm-link", "pm-link-ref", "pm-link"]},
//      {regex: /(\[\[)([^\|]+.*?)(\|)([^\]]+.*?)(\]\])/, token: ["pm-link", "pm-link-reg", "pm-link", null, "pm-link"]},

      {regex: /\[\[(.*?)\]\]/, token: "pm-link"},
      {regex: /~{3,4}/, token: "pm-link"},
      {regex: /(?:%%|%[A-Za-z][-,=:#\w\s'"().\[\]$]*%)/, token: "pm-style"},
      {regex: />>(?:.*?)<</, sol:true, token: "pm-style"},
      {regex: /(!{1,6}).*?$/, sol: true, handler: "levelHandler", token: "pm-header"},
      {regex: /-+[<>]/, sol: true, token: "pm-indent"},
      {regex: /[*]+/, sol: true, token: "pm-list"},
      {regex: /[#]+/, sol: true, token: "pm-list"},
      {regex: /::*[^:\r\n]+:/, sol: true, token: "pm-list"},
      {regex: /<<\|\[\[.*?\]\]\|>>/, token: "pm-trail"},
      {regex: /<\|\[\[.*?\]\]\|>/, token: "pm-trail"},
      {regex: /\^\|\[\[.*?\]\]\|\^/, token: "pm-trail"},
      {regex: /----/, sol: true, token: "pm-hr"},
      {regex: /\|\|!?/, handler: "tableHandler", token: "pm-table"},
      {regex: /(?:Path|Attach|mailto|https?|news|gopher|nap|file|tel|geo):[^<>{}|\^`()[\]'",;\s]*/, token: "pm-link-ref"}
    ];
    var tokenHandlers = parserConfig.tokenHandlers || {

      tableHandler: function (str_sol, stream, state, m, def) {
        if (str_sol)
          state.table = true;
        var token = state.table ? def.token : null;
        if (stream.eol())
          state.table = false;
        return token;
      },

      blockHandler: function (str_sol, stream, state, m, def) {
        if (stream.match(state.end)) {
          state.tokenize = null;
        } else
          stream.next();
        return state.token;
      },

      levelHandler: function (str_sol, stream, state, m, def) {
        return def.token + " " + def.token + "-" + m[1].length;
      },

      inlineHandler: function (str_sol, stream, state, matched) {
        for (var i = 0; i < tokenDefs.length; i++) {
          var def = tokenDefs[i],
              sol = ! def.sol || str_sol,
              m = stream.match(def.regex);
          if (m && sol) {
            if (def.handler)
              return tokenHandlers[def.handler](str_sol, stream, state, m, def);
            if (def.next) {
              state.tokenize = def.next;
              state.token = def.token;
              state.end = def.end;
            } else
              state.tokenize = null;
            return def.token;
          }
        }
        stream.next();
        if (stream.eol())
          state.table = false;
        return null;
      }
    };

    // Interface
    return {
      startState: function () {
        return {
          tokenize: null,
          level: 0,
          token: null,
          end: null,
          table: false
        };
      },

      token: function (stream, state) {
        var str_sol = stream.sol();
        if (state.tokenize != null) {
          return tokenHandlers[state.tokenize](str_sol, stream, state, null, state.tokenize);
        }
        return tokenHandlers.inlineHandler(str_sol, stream, state, null, null);
      },

      indent: function (state, textAfter) {
        if (state.tokenize != null) return CodeMirror.Pass;

        var level = state.level;
        //if(/(algorithm)/.test(textAfter)) level--;

        if (level > 0)
          return indentUnit*level;
        else
          return 0;
      }
    };
  });

  CodeMirror.defineMIME("text/x-pmwiki", "pmwiki");
});
