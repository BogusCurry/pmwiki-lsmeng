/* 
 * Auto refresh the page and scroll to the location #lastEdit on focus
 * if the page has been modified since it was loaded.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */
 
var AutoRefresher = 
{
  basetime: 0,
  pagename: '',

  // Get the value of the cookie "c_name"
  // Return the cookie value if it exists.
  //        an empty string otherwise.
	getCookie: function(c_name)
	{
		if (document.cookie.length>0)
		{
			c_start=document.cookie.indexOf(c_name + "=");
			if (c_start!=-1)
			{
				c_start=c_start + c_name.length+1;
				c_end=document.cookie.indexOf(";",c_start);
				if (c_end==-1) { c_end=document.cookie.length;}
				return unescape(document.cookie.substring(c_start,c_end));
			}
		}
		return "";
	},
  
  // Refresh and scroll to the location #lastEdit if the last modified time is later 
  // than the time the page was loaded.
  reloadIfUpdate: function()
  {
  	// Get cookie to obtain the lastModTime;
  	var lastModTime = AutoRefresher.getCookie(AutoRefresher.pagename.toUpperCase() + '-LastMod');
  	if (lastModTime > AutoRefresher.basetime)
  	{	
  	  // On update, auto scroll to the lastEdit position  
			if (window.location.href.indexOf('#lastEdit') == -1)
			{ window.location = window.location.href + '#lastEdit'; }
  	  
  	  // With or w/o lastEdit mark, we will need a page refresh to take effect.
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

