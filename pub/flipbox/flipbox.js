/**
 * Flip Checkbox Recipe for PmWiki
 * Written by (c) Petko Yotov 2008-2011
 * 
 * This text is written for PmWiki; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version. See pmwiki.php for full details
 * and lack of warranty.
 * 
 * Copyright 2008 Petko Yotov http://5ko.fr
 * 
 * Version 20110827
 * 
 * 20170701. Modified by Ling-San Meng.
 */

FlipboxStatus = new Array();

function _id(id)
{
  if(document.getElementById(id))
  return document.getElementById(id);
  return false;
}

function flipbox(id, st, update)
{
  if(typeof(FlipboxStatus[id]) == 'undefined' )FlipboxStatus[id] = st;

  var idx = FlipboxChoices.indexOf(FlipboxStatus[id]);
  if(idx==-1) return;

  FlipboxStatus[id] = FlipboxChoices.charAt(idx+1);
  var newst = FlipboxStatus[id];
  if (! update) newst += FlipboxStatus[id];
  var line = _id('_fbl'+id);
  if(line)line.className = "fb"+FlipboxStatus[id];

  var icon = _id('_fbi'+id);
  if(icon)
  {
    if( typeof(icon.src) != 'undefined' )
    {
      icon.src = FlipboxPubDirUrl+"/"+FlipboxIcon[0]+FlipboxStatus[id]+FlipboxIcon[1];
      icon.alt = newst;
    }
    else
    icon.innerHTML = "["+newst+"]";
  }

  if(update)
  {
    var ajaxdot = new Image();
    ajaxdot.src= FlipboxPageUrl + id + '&state='+FlipboxStatus[id]+'&r='+Math.random();

    // Meng. On flipbox update, modify hyperlinks' color.
    var flipboxElement = document.getElementById("_fbl" + id);
    // Get all of the children of flipboxElement
    Array.prototype.forEach.call(flipboxElement.getElementsByTagName("*"), function(item)
    {
      if (FlipboxStatus[id] === "x")
      {
        item.originalColor = window.getComputedStyle(item)['color'];
        item.originalBgColor = window.getComputedStyle(item)['background-color'];
        item.style.color = "inherit";
        item.style.backgroundColor = "transparent";
      }
      else
      {
        item.style.color = item.originalColor;
        item.style.backgroundColor = item.originalBgColor;
      }
    });
  }
}

// Meng. On document load, modify hyperlinks' color.
document.addEventListener('DOMContentLoaded', function()
{
  var flipboxElement = document.querySelectorAll(".fbx");

  Array.prototype.forEach.call(flipboxElement, function(flipboxElement)
  {
    // Get all of the children of flipboxElement
    Array.prototype.forEach.call(flipboxElement.getElementsByTagName("*"), function(item)
    {
      item.originalColor = window.getComputedStyle(item)['color'];
      item.originalBgColor = window.getComputedStyle(item)['background-color'];
      item.style.color = "inherit";
      item.style.backgroundColor = "transparent";
    });
  });
});
