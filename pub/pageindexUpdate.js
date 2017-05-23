var pageindexUpdater = (function()
{
  /* Dependencies */
  // window.AS;

  /* Private variables */
  var _idx = window.location.href.indexOf("?action=edit");
  var _updateUrl = window.location.href.slice(0, _idx) + "&updatePageIndex=1";
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

  window.addEventListener("beforeunload", requestPageindexUpdate);

  document.addEventListener('DOMContentLoaded', init);

  // Reveal public API
  var returnObj = { requestPageindexUpdate: requestPageindexUpdate };
  return returnObj;
})();
