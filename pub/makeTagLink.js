
// Find all the hash tag elements and modify their text & href
document.addEventListener('DOMContentLoaded', function()
{
  var linkElementList = document.querySelectorAll("a");
  var linkElementListLen = linkElementList.length;
  for (var i = 0; i < linkElementListLen; i++)
  {
    // A hash tag is identified by the following condition
    var id = linkElementList[i].id;
    if (id !== "" && id === linkElementList[i].name && linkElementList[i].href === "")
    {
      linkElementList[i].textContent = "#" + id;
      linkElementList[i].href = location.origin + "/Site/SearchE?q=%23" + id +
      "&unit=bullet&markup=on&header=full&title=Search+Results%3A&matchnum=1&timer=1&action=search&fmt=extract";
    }
  }
});