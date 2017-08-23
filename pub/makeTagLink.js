
// Find all the hash tag elements and modify their text & href
document.addEventListener('DOMContentLoaded', function()
{
  // Find all the a tags, loop through it
  var linkElementList = document.querySelectorAll("a");
  var linkElementListLen = linkElementList.length;
  for (var i = 0; i < linkElementListLen; i++)
  {
    // A hash tag is identified by the following condition
    var id = linkElementList[i].id;
    if (id !== "" && id === linkElementList[i].name && linkElementList[i].href === "")
    {
      // Parse this hash tag's id, split it on dash; hash tags adopt a nested naming rule,
      // each segment is a level
      var baseTagElement = linkElementList[i];
      var tagList = id.split("-");
      var tagListLen = tagList.length;

      // Loop over all the nested levels
      for (var j = 0; j < tagListLen; j++)
      {
        // Modify the tag element's text and url
        baseTagElement.textContent = (j === 0 ? "#" : "-") + tagList[j];
        baseTagElement.href = location.origin + "/Site/SearchE?q=%5B%5B%23" +
        tagList.slice(0, j + 1).join("-") +
        "&unit=bullet&markup=on&header=full&title=Search+Results%3A&matchnum=1&timer=1&action=search&fmt=extract";

        // If this is not the last nested level, create one more a tag, insert it after
        // the current element, and assign it to become the element in question
        if (j < tagListLen - 1)
        {
          var newTagElement = document.createElement('a');
          baseTagElement.parentNode.insertBefore(newTagElement, baseTagElement.nextSibling);
          baseTagElement = newTagElement;
        }
      }
    }
  }
});