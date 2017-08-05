/*
 * Enable direct copy & paste to upload an image. Works in Chrome only. 
 * Upload image courtesy at http://www.unionpaper.net
 *
 * Enable drag & drop upload of multiple files. 
 *
 * This program is free software; you can redistribute it
 * and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your
 * option) any later version. Available at
 * https://www.gnu.org/licenses/gpl.txt
 *
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170709
 */

// Show an animation of a predetermined image to signify the result of file upload. 
function showUploadImg(numUploadSuccess, numUploadFail)
{
  var uploadImgDiv = document.getElementById('PasteImgUploadID');
  uploadImgDiv.innerHTML = PasteImgUploadImgSrc + ' <span style="color: green; font-size: 25px; font-weight: bold; ">&#x2713;'+ numUploadSuccess +'</span>';

  if (numUploadFail > 0)
  { uploadImgDiv.innerHTML += ' <span style="color: red; font-size: 25px; font-weight: bold;">&nbsp &#x2717;'+ numUploadFail +'</span>'; }

  PasteImgUploadSlideUpElement(uploadImgDiv, -50, 10, 0.4);
}

document.addEventListener('drop', function(e)
{
  document.getElementById('text').focus();

  e.preventDefault();
  var files = e.dataTransfer.files;
  var items = e.dataTransfer.items;

  var filesLen = files.length;
  for (var i=0;i<filesLen;i++)
  {
//    var isFile = true;
//    try { isFile = items[i].webkitGetAsEntry().isFile }
//    catch(errorMsg) {}

    var formData = new FormData();
    var fileName = files[i].name.replace(/ /g,'_');
    formData.append('uploadfile', files[i],fileName);

    // I tried to rewrite the following as a function but failed. It seems the
    // XMLHttpRequest() written in a function gets called only once even if there are
    // multiple function calls.
    // My conjecture is that here each time XMLHttpRequest() is called a new object is
    // created; and as a result multiple requests are being created and run in parallel.
    // That is also the reason that the script runs correctly without the need to wait
    // for one request to complete to run the next.
    var req = new XMLHttpRequest();
    req.open('POST',PasteImgUploadUrl,true);
    req.setRequestHeader('AJAXUPLOAD','TRUE');
    req.setRequestHeader("X_REQUESTED_WITH", "XMLHttpRequest");
    req.numUpload = 0;
    req.numFail = 0;
    req.name = fileName;
    req.onreadystatechange = function()
    {
      var error = 0;
      if (this.readyState == 4)
      {
        if (this.status == 200)
        {
          var response = this.getResponseHeader("UpResult");
          if (response == 'successfully uploaded')
          {
            document.execCommand("insertText", false, uploadDirUrlHeader+this.name+' ');
            showUploadImg(++req.numUpload, req.numFail);
          }
          else { error++; pmwiki.consoleLog('"'+this.name+'"'+' upload failed: '+response+'!'); }
        }
        else { error++; pmwiki.consoleLog('Upload failed: HTTP error!'); }
      }

      if (error > 0) { showUploadImg(req.numUpload, ++req.numFail); }
    }

    req.send(formData);
  }
}, false);

document.addEventListener('DOMContentLoaded', function()
{
  var uploadImgDiv = document.createElement('div');
  uploadImgDiv.id = 'PasteImgUploadID';
  uploadImgDiv.style.position = 'fixed';
  uploadImgDiv.style.bottom = '10px';
  uploadImgDiv.style.display = 'none';
  uploadImgDiv.style.left = Math.round(window.innerWidth/5) + 'px';
  document.body.appendChild(uploadImgDiv);

  var textElement = document.getElementById('text');
  if (!textElement) { return; }
  textElement.onpaste = function(e)
  {
    var items = e.clipboardData.items;

    if (typeof items === 'undefined') { return true; }

    var idx = -1;
    if (items.length == 1 && items[0].kind == 'file') { idx = 0; }
    else if (items.length == 2 && items[1].kind == 'file') { idx = 1; }

    if (idx != -1)
    {
      var fileName = PasteImgUploadGetFormatTime() + '.png';
      var files = items[idx].getAsFile();
      if (files.size == 0) { return true; }

//pmwiki.consoleLog(files.size);

      var formData = new FormData();
      formData.append('uploadfile', files, fileName);

      var req = new XMLHttpRequest();
      req.open('POST',PasteImgUploadUrl,true);
      req.setRequestHeader('AJAXUPLOAD','TRUE');
      req.setRequestHeader("X_REQUESTED_WITH", "XMLHttpRequest");
      req.send(formData);
      req.onreadystatechange = function()
      {
        if (this.readyState == 4)
        {
          if (this.status == 200)
          {
            var response = this.getResponseHeader("UpResult");
            if (response == 'successfully uploaded')
            {
              document.execCommand("insertText", false, 'Attach:'+fileName);
              uploadImgDiv.innerHTML = PasteImgUploadImgSrc;
              PasteImgUploadSlideUpElement(uploadImgDiv, -50, 10, 0.4);
            }
            else { alert('Upload failed: '+response+'!'); }
          }
          else { alert('Upload failed: HTTP error!'); }
        }
      }
      req.onreadystatechange = function()
      {
        if (this.readyState == 4)
        {
          if (this.status == 200)
          {
            var response = this.getResponseHeader("UpResult");
            if (response == 'successfully uploaded')
            {
//  						document.execCommand("insertText", false, 'Attach:'+fileName);
              document.execCommand("insertText", false, uploadDirUrlHeader+fileName);
              uploadImgDiv.innerHTML = PasteImgUploadImgSrc;
              PasteImgUploadSlideUpElement(uploadImgDiv, -50, 10, 0.4);
            }
            else
            {
              if (response == null) { response = 'check upload folder permission'; }
              alert('Upload failed: '+response+'!');
            }
          }
          else { alert('Upload failed: HTTP error!'); }
        }
      }

      return false;
    }
  };
}, false);

// Move up an element by changing its style property "bottom" from "startPx" px to "endPx"
// px within "duration" When it's finished, it fades out the element by calling another
// function.
function PasteImgUploadSlideUpElement(element, startPx, endPx, duration)
{
  try { clearInterval(slideTimerID); }
  catch(errorMsg) {}
  try { clearInterval(fadeTimerID); }
  catch(errorMsg2) {}

  var stepDuration = 25;
  element.style.display = 'initial';
  var position = startPx;
  var diff = endPx-startPx;
  element.style.bottom = position+'px';
  element.style.opacity = 1;
  var stepPosition = diff*(stepDuration/(duration*1000));

  slideTimerID = setInterval(function ()
  {
    if (position > endPx)
    {
      clearInterval(slideTimerID);
      PasteImgUploadFadeElement(element, 'out', 4);
    }

    element.style.bottom = position+'px';
    position += stepPosition;
  }, stepDuration);
}

// Fade out an element by changing its style property "opacity" from 1.0 to 0 within 
// "duration".
function PasteImgUploadFadeElement(element, style, duration)
{
  var stepDuration = 25;
  var op = 0;
  if (style == 'out') { op = 1; }
  element.style.opacity = op;
  element.style.display = 'initial';
  var stepOp = stepDuration/(duration*1000);

  fadeTimerID = setInterval(function ()
  {
    if (op > 1 || op < 0) { clearInterval(fadeTimerID); }

    element.style.opacity = op;
    if (style == 'in') { op += stepOp; }
    else { op -= stepOp; }
  }, stepDuration);
}

// Return a formatted date/time as YYYYMMDD_HHMMSS
function PasteImgUploadGetFormatTime()
{
  var clock = new Date();
  var year = clock.getFullYear(), mon = clock.getMonth()+1, date = clock.getDate(),
  hour = clock.getHours(), min = clock.getMinutes(), sec = clock.getSeconds();

  return year.toString()+(mon<10?'0'+mon:mon)+(date<10?'0'+date:date)+'_'+
  (hour<10?'0'+hour:hour)+(min<10?'0'+min:min)+(sec<10?'0'+sec:sec);
}