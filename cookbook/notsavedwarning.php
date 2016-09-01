<?php if(!defined('PmWiki'))exit;
/**
  Page Not Saved Warning for PmWiki
  Written by (c) Petko Yotov 2009-2015

  This text is written for PmWiki; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published
  by the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version. See pmwiki.php for full details
  and lack of warranty.

  Copyright 2009-2015 Petko Yotov www.pmwiki.org/petko
*/
$RecipeInfo['NotSavedWarning']['Version'] = '20150828';

SDV($NsWarning, '$[Content was modified, but not saved!]');
SDVA($HTMLFooterFmt, array('Notsaved' => '<script type="text/javascript"><!--
(function() {
  function aE(el, ev, fn) {
    return window.addEventListener
      ? el.addEventListener(ev, fn, false)
      : el.attachEvent("on" + ev, fn);
  }

  function NsSubmit() {
    if(NsForm.text && NsForm.nsscroll)
      NsForm.nsscroll.value = NsForm.text.scrollTop;

    if(NsPromptAuthor && typeof(NsForm.author)!="undefined" && NsForm.author.value=="") {
      var r = uPrompt(NsPromptAuthor, "");
      if(typeof(r)=="string")NsForm.author.value=r;
      else {NsForm.author.focus(); return false;}
    }
    if(NsPromptSum && typeof(NsForm.csum)!="undefined" && NsForm.csum.value=="") {
      var r = uPrompt(NsPromptSum, "");
      if(typeof(r)=="string")NsForm.csum.value=r;
      else {NsForm.csum.focus(); return false;}
    }
    NsMessage="";
    return true;
  }

  function uPrompt(msg) {
    var ua = navigator.userAgent;
    var idx = ua.indexOf("MSIE ");
    var sel = false;
    if(NsForm.author.type == "select-one") {
      if(NsForm.author.options[NsForm.author.selectedIndex].value == "") sel = true;
    }
    if(sel || (idx>0 && parseFloat( ua.substring(idx+4) )>=7) ) {
      alert(msg);
      return false;
    }
    else return prompt(msg, "");
  }

  var NsMessage = "";
  var NsForm = false;
  var NsPreview = false;
  var NsPromptSum = false;
  var NsPromptAuthor = false;

  for(var i=0; i<document.forms.length; i++) {
    var f = document.forms[i];
    for(var j=0; j<f.elements.length; j++) {
      var e = f.elements[j];
      if(e.type == "submit" && e.name.match(/^post(edit|draft)?$/)) {
        NsForm = f;
      }
      else if(e.type == "submit" && e.name.match(/^(preview|cancel)$/))
        e.onclick = function(){NsMessage="";return true;};
    }
    if(NsForm) break;
  }

  if(NsForm) {
    if(NsForm.text && NsForm.nsscroll && NsForm.nsscroll.value>0)
      NsForm.text.scrollTop = NsForm.nsscroll.value;

    window.onbeforeunload = function(ev) {
      if(NsMessage=="") return;
      if (typeof ev == "undefined") ev = window.event;
      var tarea = document.getElementById("text");
      if (tarea && tarea.codemirror) tarea.codemirror.save();

      for(var i=0; i<NsForm.elements.length; i++) {
        var e = NsForm.elements[i];
        if (NsPreview || (e.type.match(/^text(area)?$/) && e.value != e.defaultValue)) {
          if (ev) {ev.returnValue = NsMessage;}
          return NsMessage;
        }
      }
    }
    aE(NsForm, "submit", NsSubmit);
  }
})();
//--></script>'));

if(@$_REQUEST['preview']>'') $HTMLFooterFmt['Notsaved']
  = str_replace('var NsPreview = false;', 'var NsPreview = true;', $HTMLFooterFmt['Notsaved']);

if(IsEnabled($NsPromptSum, false)) $HTMLFooterFmt['Notsaved']
  = str_replace('var NsPromptSum = false;', "var NsPromptSum = \"".addslashes($NsPromptSum)."\";",
  $HTMLFooterFmt['Notsaved']);
if(IsEnabled($NsPromptAuthor, false)) $HTMLFooterFmt['Notsaved']
  = str_replace('var NsPromptAuthor = false;',
  "var NsPromptAuthor = \"".addslashes($NsPromptAuthor)."\";", $HTMLFooterFmt['Notsaved']);
if(IsEnabled($NsWarning, false)) $HTMLFooterFmt['Notsaved']
  = str_replace('var NsMessage = "";',
  "var NsMessage = \"".addslashes($NsWarning)."\";", $HTMLFooterFmt['Notsaved']);

$PostConfig['NsScroll'] = 120;

function NsScroll() {
  global $InputTags;
  if( @$InputTags['e_form'][':html'] ) {
    $InputTags['e_form'][':html'] .= '<input type="hidden" name="nsscroll" value="'.intval(@$_REQUEST['nsscroll']).'"/>';
  }
}
