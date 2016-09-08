/* CodeMirror - An enhanced page editor for PmWiki
 * Please refer to the main source module for copyright and license info.
 * Latest required version: 2016-05-24
 */

function cmblock(txtId, cmId, cmModespec, cmOpts, olOffset) {
  var txt = document.getElementById(txtId),
      pre = document.createElement('pre');
  CodeMirror.runMode(txt.value, { name: cmModespec }, pre, cmOpts );
  var out = (olOffset != null) ? (function () {
    var ol = document.createElement('ol');
    pre = pre.innerHTML.split(/\r\n?|\n\r?/);
    if (pre.length) {
      for (var i = 0; i < pre.length; ++i) {
        if (!pre[i].length) pre[i] = '&nbsp;';
        pre[i] = '<pre>' + pre[i] + '</pre>';
      }
      ol.innerHTML = '<li value="' + olOffset + '" class="CodeMirror-linenumber">'
                   + pre.join('</li><li class="CodeMirror-linenumber">')
                   + '</li>';
    }
    return ol;
  }()) : pre;
  out.setAttribute('class', 'cm-s-default');
  out.setAttribute('id', cmId);
  txt.parentNode.replaceChild(out, txt);
}

function cmmodelist(preId, opts) {
  var node = document.getElementById(preId),
      out = [ '<table><tr><th>Language</th><th>Mode</th><th>Mime-Type</th></tr>' ];
  for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
    var info = CodeMirror.modeInfo[i],
        mime = info.mimes ? info.mimes.join(', ') : ((info.mime == 'null') ? '' : info.mime);
    out.push('<tr><td>' + info.name + '</td><td>' + info.mode + '</td><td>' + mime + '</td></tr>');
  }
  out.push('</table>');
  node.innerHTML = out.join('\n');
}
