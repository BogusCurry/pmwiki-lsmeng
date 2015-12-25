<?php
/*
 * Image size toggling written by Ling-San Meng (Sam Meng).
 * Almost entirely adapted from "flipbox".
 * 
 * Email: f95942117@gmail.com
 * Last Modified: 2015/12/13
 */

SDV($imgFlipboxChoices, 'x_');
SDV($imgFlipboxHTML, '<img id="_isti%1$s" height="%2$s" src="%3$s" title="%1$s" alt="%1$s" %4$s/>'); # id, url, onclick, state
SDV($imgQualifyPatterns["/\\[([$imgFlipboxChoices])\\]/"], '[$1$1$1]');

function FmtImgSizeToggle($_x, $id, $imgFilePath)
{
  global $HTMLHeaderFmt, $imgFlipboxChoices, $imgFlipboxHTML;
  global $imgHeightPx, $imgHeightPxL;
  
  $javaSrc = "imgSizeToggleStatus = new Array();

function _idImgSizeToggle(id)
{
	if(document.getElementById(id)) { return document.getElementById(id);	}
	return false;
}

function imgSizeToggle(id, st, update)
{
	if(typeof(imgSizeToggleStatus[id]) == 'undefined') imgSizeToggleStatus[id] = st;

	var idx = imgFlipboxChoices.indexOf(imgSizeToggleStatus[id]);
	if(idx==-1) return;

	imgSizeToggleStatus[id] = imgFlipboxChoices.charAt(idx+1);
  var newst = imgSizeToggleStatus[id];
  if (! update) newst += imgSizeToggleStatus[id];
	var line = _idImgSizeToggle('_istl'+id);
	if(line)line.className = 'ist'+imgSizeToggleStatus[id];

	var icon = _idImgSizeToggle('_isti'+id);
	if(icon)
	{
    if( typeof(icon.src) != 'undefined' )
    {
      if (imgSizeToggleStatus[id] == '_') { icon.height = $imgHeightPx; }
      else if (imgSizeToggleStatus[id] == 'x') { icon.height = $imgHeightPxL; }
      
      icon.alt = newst;
    }
    else { icon.innerHTML = '['+newst+']'; }
  }
}";

  $HTMLHeaderFmt['imgSizeToggle'] = "<script type='text/javascript'><!--
  var imgFlipboxChoices = \"$imgFlipboxChoices$imgFlipboxChoices\";
  //--></script><script type='text/javascript'><!--
  ".$javaSrc."
  --></script>";

  $_y = $_x{0};

  $onclick = "";
  if(strlen($_x)==1)
  {
    $onclick = " onclick='try{imgSizeToggle($id, \"$_y\", true);}catch(e){void(0);}'";
  }
  elseif(strlen($_x)==2)
  {
    $onclick = " onclick='try{imgSizeToggle($id, \"$_y\", false);}catch(e){void(0);}'";
  }

  $html = sprintf($imgFlipboxHTML, $id, $imgHeightPx, $imgFilePath, $onclick, $_x, $_y);
  
  return $wiki.Keep(Fmtpagename($html, ''));
}

