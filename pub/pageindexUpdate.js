/**
 * This is currently NOT used. Mainly b/c I think periodic pageindex
 * update is enough.
 * 
 * It turns out updating page index cannot be done when requesting with
 * a pagename that's currently being locked. This is solved in pageindex.php
 * by always requesting with Site.Editform; then specify the pages to be
 * updated in the get param pagelist.
 *
 */

var pageindexUpdater = (function()
{
  /* Dependencies */
  // window.AS;

  /* Private variables */
  if (window.location.href.indexOf("?") === -1)
  { var _updateUrl = window.location.href + "?updatePageIndex=1"; }
  else
  { var _updateUrl = window.location.href + "&updatePageIndex=1"; }
  
  var _isSaved = false;

  // If the event "saved" has ever happened, request a pageindex update then cancel
  // the event flag.
  function requestPageindexUpdate()
  {
    if (_isSaved)
    {
      new Image().src = _updateUrl;
      _isSaved = false;
    }
  }

  function init()
  {
    // Subscribe to the "saved" event of Autosave.
    if (!window.AS) { throw "Autosave is missing!"; return; }
    else { AS.subscribe("saved", function(){ _isSaved = true; }); }
  }

//   window.addEventListener("beforeunload", requestPageindexUpdate);

  document.addEventListener('DOMContentLoaded', init);

  // Reveal public API
  var returnObj = { requestPageindexUpdate: requestPageindexUpdate };
  return returnObj;
})();
