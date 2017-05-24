/* 
 * Auto refresh the page and scroll to the last modified location on focus
 * if the page has been modified since it was loaded.
 * 
 * Author: Ling-San Meng
 * Email: f95942117@gmail.com
 */

var autoRefresher =
{
  basetime: 0,
  pagename: '',

  // Get the value of key "key" in local storage item "name"
  // If "key" is null then the whole content of "name" is returned;
  getStorageByKey(name, key)
  {
    if (key == null) { return JSON.parse(localStorage.getItem(name)); }

    try { var value = JSON.parse(localStorage.getItem(name))[key]; }
    catch(e) {}

    return value;
  },

  // Refresh and scroll to the location #lastEdit if the last modified time is later
  // than the time the page was loaded.
  reloadIfUpdate: function()
  {
    // Get cookie to obtain the lastModTime;
    var lastModTime = autoRefresher.getStorageByKey('LastMod', autoRefresher.pagename.toUpperCase());
    if (lastModTime > autoRefresher.basetime) { window.location = location.href; }
  },

  init: function()
  {
    // On load, record the current time.
    var clock = new Date();
    autoRefresher.basetime = Math.round(clock.getTime()/1000);
  }
}

document.addEventListener('DOMContentLoaded', autoRefresher.init);
window.addEventListener('focus', autoRefresher.reloadIfUpdate, false);
