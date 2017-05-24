
if (!uploadAux) { var uploadAux = {}; }

// Use Ajax to send a request to the server to delete the given file
uploadAux.deleteFile = function(fileName)
{
  var req = new XMLHttpRequest();
  var uploadUrl = window.location.href+'&delete='+fileName;
  req.open('GET',uploadUrl,true);
  req.send();

  req.onreadystatechange = function()
  {
    if (this.readyState == 4 && this.status == 200)
    {
      var response = this.responseText;
      if (response == "success")
      {
        // Adjust some styles on successful deletion
        document.getElementById("file_"+fileName).style.color = 'black';
        document.getElementById("file_"+fileName).style.textDecoration = 'line-through';
        document.getElementById("file_"+fileName).style.cursor = 'default';
        document.getElementById("img_"+fileName).onclick = "";
        document.getElementById("up_"+fileName).style.visibility = "hidden";
        document.getElementById("del_"+fileName).style.visibility = "hidden";
      }
      else if (response == "fail")
      { alert("Deletion failed. Probably no write access!"); }
      else if (response == "nonexistent")
      { alert("File does not exist!"); }
    }
  }
}

uploadAux.showTrashClose = function(fileName)
{
  document.getElementById('del_'+fileName).src = uploadAux.trashCloseImgUrl;
}
uploadAux.showTrashOpen = function(fileName)
{
  document.getElementById('del_'+fileName).src = uploadAux.trashOpenImgUrl;
}
