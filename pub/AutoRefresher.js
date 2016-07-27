/* 
 * Auto refresh the page and scroll to the last modified location on focus
 * if the page has been modified since it was loaded.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */
 
var AutoRefresher = 
{
  basetime: 0,
  pagename: '',

	// Get the value of key "key" in local storage item "name"
	// If "key" is null then the whole content of "name" is returned;
	getStorageByKey(name, key)
	{
	  if (key == null) 	{ return JSON.parse(localStorage.getItem(name)); }
	  
	  try { var value = JSON.parse(localStorage.getItem(name))[key]; }
	  catch(e) {}
	  
	  return value;
	},
  
  // Refresh and scroll to the location #lastEdit if the last modified time is later 
  // than the time the page was loaded.
  reloadIfUpdate: function()
  {
  	// Get cookie to obtain the lastModTime;
  	var lastModTime = AutoRefresher.getStorageByKey('LastMod', AutoRefresher.pagename.toUpperCase());
  	if (lastModTime > AutoRefresher.basetime)
  	{	
//    window.location = window.location.href;
      location.reload();
  	}
  },
  
  init: function()
  {
    // On load, record the current time.
    var clock = new Date();
    AutoRefresher.basetime = Math.round(clock.getTime()/1000);
  }
}

window.addEventListener('load', AutoRefresher.init, false);
window.addEventListener('focus', AutoRefresher.reloadIfUpdate, false);

