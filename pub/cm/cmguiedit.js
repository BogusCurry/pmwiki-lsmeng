/* CodeMirror - An enhanced page editor for PmWiki
 * Please refer to the main source module for copyright and license info.
 * Latest required version: 2016-05-24
 */

function insButton(mopen, mclose, mtext, mlabel, mkey) {
  if (mkey > '') key = 'accesskey="' + mkey + '" ';
  document.write("<a tabindex='-1' " + mkey + "onclick=\"insMarkup('"
    + mopen + "','" + mclose + "','" + mtext + "');\">" + mlabel + "</a>");
}

function insMarkup(mopen, mclose, mtext) {
  var cm = document.getElementById('text').codemirror;
  if (cm) {
    if (cm.somethingSelected()) mtext = cm.getSelection();
    cm.replaceSelection(mopen + mtext + mclose);
    return;
  }

  var tarea = document.getElementById('text');
  if (tarea.setSelectionRange > '') {
    var p0 = tarea.selectionStart,
        p1 = tarea.selectionEnd,
        top = tarea.scrollTop,
        str = mtext,
        cur0 = p0 + mopen.length,
        cur1 = p0 + mopen.length + str.length;
    while (p1 > p0 && tarea.value.substring(p1-1, p1) == ' ') p1--; 
    if (p1 > p0) {
      str = tarea.value.substring(p0, p1);
      cur0 = p0 + mopen.length + str.length + mclose.length;
      cur1 = cur0;
    }
    tarea.value = tarea.value.substring(0,p0)
      + mopen + str + mclose
      + tarea.value.substring(p1);
    tarea.focus();
    tarea.selectionStart = cur0;
    tarea.selectionEnd = cur1;
    tarea.scrollTop = top;
  } else if (document.selection) {
    var str = document.selection.createRange().text;
    tarea.focus();
    range = document.selection.createRange();
    if (str == '') {
      range.text = mopen + mtext + mclose;
      range.moveStart('character', -mclose.length - mtext.length );
      range.moveEnd('character', -mclose.length );
    } else {
      if (str.charAt(str.length - 1) == " ") {
        mclose = mclose + " ";
        str = str.substr(0, str.length - 1);
      }
      range.text = mopen + str + mclose;
    }
    range.select();
  } else { tarea.value += mopen + mtext + mclose; }
}


