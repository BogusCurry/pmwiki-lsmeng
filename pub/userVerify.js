
function setCookie(c_name,value,expiredays)
{
  // 不指定expire date, 則離開browser, cookie即失效
  var exdate = new Date();
  exdate.setDate(exdate.getDate()+expiredays);
  document.cookie = c_name+ "=" +escape(value)+
  ((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
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
  document.getElementById('text').scrollTop = y;
}

// Add the action of checking position cookies in the event of window.onload
window.addEventListener('load', checkCookie, false);
