var url =  document.location.href;
var y_name = url.substring(url.lastIndexOf('pmwiki.php?n=')+13, url.lastIndexOf('?')) + "-scrollY";

function setPosCookies()
{
  cookieName = y_name;
  value = document.getElementById('text').scrollTop;
  
  // 不指定expire date, 則離開browser, cookie即失效
//  var exdate = new Date();
//  exdate.setDate(exdate.getDate()+expiredays);
//  document.cookie = c_name + "=" + escape(value) + ((expiredays==null) ? "" : ";expires=" + exdate.toGMTString());
  document.cookie = cookieName + "=" + escape(value);  
}

function getCookie(c_name)
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
}

function checkCookie()
{
  var y = getCookie(y_name);
  if (y == null || y == "") { y = 0; }

  document.getElementById('text').scrollTop = y;
}

// Add the action of checking position cookies in the event of window.onload
window.addEventListener('load', checkCookie, false);

// Add the action of setting position cookies in the following events
window.addEventListener('click', setPosCookies, false);
window.addEventListener('keydown', setPosCookies, false);
//window.addEventListener('scroll', setPosCookies, false);
//window.addEventListener('keypress', setPosCookies, false);
//window.addEventListener('keyup', setPosCookies, false);
//window.addEventListener('mousemove', setPosCookies, false);
window.addEventListener('wheel', setPosCookies, false);