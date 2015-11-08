/**
  Ape - Automatic embedding of video players and maps for PmWiki
  Written by (c) Petko Yotov 2014-2015    www.pmwiki.org/petko

  This text is written for PmWiki; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published
  by the Free Software Foundation version 2.

  Version 20151009a
*/

function APgrab(tag, cn, par) {
  par = par || document;
  var i, r = [], rx = new RegExp('\\b'+cn+'\\b'), x = par.getElementsByTagName(tag);
  for(i=0;i<x.length; i++) if( (!cn) || rx.test(x[i].className)) r.push(x[i]);
  return r;
}

function APE() {
  var a, W, H, player, stl, i, j, k, links, href, src, d, scripts, players = [], ApeDir = '', allspans, idcnt = 0, rx, lnk, iheight= '315px', iwidth='560px', tn;
  scripts = APgrab('script');
  for(i=0; i<scripts.length; i++) {
    a = scripts[i].src.match(/^(.*\/)ape\.js$/);
    if(! a) continue;
    ApeDir = a[1];
    break;
  }

  players = players.concat(APgrab('span', '(player|map|embed)'), APgrab('p', '(player|map|embed)'), 
                           APgrab('div', '(player|map|embed)'), APgrab('dl', '(map|embed)'));

  rx = [ // more will be added in the future
    [/^https?:\/\/www\.(ted\.com\/talks\/\w+)$/i, 'https://embed-ssl.$1.html'],
    [/^https?:\/\/www\.youtube\.com\/watch\?v=([^&]+)(&.*)?$/i, 'https://www.youtube-nocookie.com/embed/$1'],
    [/^https?:\/\/vimeo\.com\/(\d+)$/i, 'https://player.vimeo.com/video/$1?title=0&byline=0&portrait=0&autoplay=0'],
    [/^(https?:\/\/www.dailymotion.com)(\/video\/[a-z0-9-]+)_/i, '$1embed/$2'],
    [/^(https?:\/\/)dai\.ly\/([a-z0-9-]+)$/i, '$1www.dailymotion.com/embed/video/$2'],
    [/^https?:\/\/youtu\.be\/([^&?]+)([&?].*)?$/i, 'https://www.youtube-nocookie.com/embed/$1'],
    [/^https?:\/\/[a-z-]+\.facebook\.com\/photo\.php\?v=(\d+)$/i, 'https://www.facebook.com/video/embed?video_id=$1'],
    [/^https?:\/\/[a-z-]+\.facebook\.com\/\S+\/videos\/(\d+)\/?$/i, 'https://www.facebook.com/video/embed?video_id=$1'],
    [/^(https?:\/\/u\.osmfr\.org\/m\/\d+\/?)$/i, '$1'],
    [/^(http.*umap\.openstreetmap\.fr.*\/map\/[^\s]+)$/i, '$1'],
    [/^http.*openstreetmap\.org.*#map=[^\s]+$/i, ApeDir+'ape-osmap.html#'],
    [/^https?:\/\/osm\.org\/go\/\S+$/i, ApeDir+'ape-osmap.html#'],
    [/^(https?:\/\/archive\.org)\/(details|embed)\/(\w+)\/?$/i, '$1/embed/$3'],
    [/^(https?:\/\/(www\.)?teachertube\.com)\/(video|audio)\/[\w-]*-(\d+)\/?$/, '$1/embed/$3/$4'],
    [/^(https?:\/\/(www\.)?teachertube\.com)\/(video|audio)\/(\d+)\/?$/, '$1/embed/$3/$4'],
    [/^(https?.*\.google\..*\/calendar\/embed.+)$/i, '$1'],
    [/^https?.*\.youscribe\.com.*-(\d+)\/?$/i, '//www.youscribe.com/BookReader/IframeEmbed?token=&width=auto&height=auto&startPage=1&displayMode=scroll&fullscreen=0&productId=$1'],    
    [/^https?:\/\/(www\.)?vbox7\.com\/play:(\w+)/i, 'http://vbox7.com/emb/external.php?vid=$2'],
    [/^(.*\.pdf)$/i, 'http://docs.google.com/gview?embedded=true&url=$1']
  ];
   
  var rx2 = [];
  if(typeof uAPErx == 'object') {
    for(var i=0; i<uAPErx.length; i++) rx2.push(uAPErx[i]);
  }
  for(var i=0; i<rx.length; i++) rx2.push(rx[i]);
  rx = rx2;

  for (i=0; i<players.length; i++) {
    player = players[i];
    tn = player.tagName.toLowerCase();
    stl = player.getAttribute('style');
    if(stl != null && typeof stl == 'object') { // MSIE<8
      stl="width:"+player.style.width+';'+" height:"+player.style.height+';'
    }
    if(stl) {
      a = stl.match(/width: *([0-9\.]+ *(%|p[xtc]|e[mx]|[mc]?m))/i)
      W = (a) ? a[1] : ((player.className.indexOf('map')<0)? iwidth : '100%');
      a = stl.match(/height: *([\d.]+ *(%|p[xtc]|e[mx]|[mc]?m))/i)
      H = (a) ? a[1] : iheight;
    }
    else {
      W = (player.className.indexOf('map')<0)? iwidth : '100%';
      H = iheight;
    }

    if(tn=='span' || tn=='div'  || tn=='p' ) {
      links = APgrab('a', false, player);
      if(! links) continue;

      for (j=0; j<links.length; j++) {
        lnk = links[j];
        href = lnk.href;
        for(k=0; k<rx.length; k++) {
          if(! href.match(rx[k][0])) continue;

          src = href.replace(rx[k][0], rx[k][1]);
          if(src.match(/#$/)) {
            if(!lnk.id) lnk.id = 'ape_id_'+(idcnt++);
            src += lnk.id;
          }
          APFrame(lnk, src, W, H);
          break;
        }
      }
    }
    else if(tn=='dl') {
      if(!player.id) player.id = 'ape_id_'+(idcnt++);
      APFrame(player, ApeDir+'ape-osmap.html#'+player.id, W, H);
    }
  }
}

function APFrame(elm, src, W, H) {
  var d = document.createElement("iframe");
  d.frameborder=0;
  d.marginheight=0;
  d.marginwidth=0;
  d.allowfullscreen = true;
  d.src=src;
  var align = '';
  if(elm.style.textAlign.indexOf("center")>=0) align = "margin: 0 auto;";
  if(elm.style.textAlign.indexOf("right")>=0) align = "margin: 0 0 0 auto;";
  
  d.setAttribute('style', "border: 1px solid black; display: block; width: "+W+"; height: "+H+";"+align);
  if(elm.id) d.id = 'iframe_'+elm.id;

  elm.parentNode.insertBefore(d, elm);
  elm.style.display = 'none';
}

setTimeout("APE()", 50);
