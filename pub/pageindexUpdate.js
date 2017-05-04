
var pageindexUpdater = (function()
{
	// Dependencies
	var _AS = window.AS;
	if (!_AS) { throw "Autosave is missing!"; return; }
	
	// Private variables
	var _idx = window.location.href.indexOf("?action=edit");
  var _updateUrl = window.location.href.slice(0, _idx) + "&updatePageIndex=1";
	var _req = new XMLHttpRequest();
	var _isSaved = false;
	
	// Subscribe to the "saved" event of Autosave.
	_AS.subscribe("saved", function(){ _isSaved = true; });
	
	// If the event "saved" has ever happened, request a pageindex update then cancel
	// the event flag.
	function requestPageindexUpdate()
	{
		if (_isSaved)
		{
			_req.open("GET", _updateUrl, true);
			_req.send();
			_isSaved = false;
		}
	}
	
	// Reveal public API	
	var returnObj =
	{
		// Methods
	  requestPageindexUpdate: requestPageindexUpdate
	};
	return returnObj;

})();


// window.addEventListener("focusout", function() { pageindexUpdater.requestPageindexUpdate(); });
window.addEventListener("beforeunload", function() { pageindexUpdater.requestPageindexUpdate(); });
