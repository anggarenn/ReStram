function apiBase(){
  var s = localStorage.getItem("restram_server") || localStorage.getItem("tatap_server");
  if(s) return s.replace(/\/+$/,"");
  if(location.protocol === "file:" || !location.origin || location.origin === "null"){
    return "http://127.0.0.1:8767";
  }
  return "";
}

function mockJget(u){
  var d = window.NET27_DATA;
  if(!d) return { success: false, error: "offline_no_fallback" };
  var parsedUrl = u.split("?")[0];
  var qs = u.indexOf("?") >= 0 ? u.substring(u.indexOf("?") + 1) : "";
  var params = {};
  qs.split("&").forEach(function(pair){
    var p = pair.split("=");
    if(p[0]) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
  });

  if(parsedUrl === "/api/seasonal"){
    var which = params.which || "now";
    var items = (which === "airing") ? (d.rails[1] ? d.rails[1].items : d.items) : (d.hero.concat(d.items.slice(0, 10)));
    return { success: true, data: { items: items, season: "WINTER 2025", page: 1, total_pages: 1, cached: true } };
  }
  if(parsedUrl === "/api/catalog" || parsedUrl === "/api/browse"){
    return { success: true, data: { items: d.items, page: 1, total_pages: 1, cached: true } };
  }
  if(parsedUrl === "/api/schedule" || parsedUrl === "/api/upcoming-episodes"){
    var day = params.day || "today";
    return { success: true, data: { items: d.items.slice(0, 7), weekday: day, current_day: day, is_today: true } };
  }
  if(parsedUrl === "/api/search" || parsedUrl === "/api/hianime/search" || parsedUrl === "/api/otakudesu/search"){
    var q = params.q || "";
    return { success: true, data: { results: d.search(q), cached: true } };
  }
  if(parsedUrl.indexOf("/api/anime/") === 0){
    var rest = parsedUrl.replace("/api/anime/", "");
    var parts = rest.split("/");
    var slug = decodeURIComponent(parts[0]);
    var subaction = parts[1];
    var item = d.getItem(slug);
    if(subaction === "episodes"){
      return { success: true, data: { episodes: d.getEpisodes(slug), detail: item, synopsis: item ? item.synopsis : "" } };
    }
    if(subaction === "detail"){
      return { success: true, data: item || {} };
    }
    if(subaction === "relations"){
      return { success: true, data: { relations: [] } };
    }
  }
  if(parsedUrl === "/api/stream/resolve"){
    var slug = params.slug || "";
    var ep = parseInt(params.ep) || 1;
    var mode = params.mode || "sub";
    return d.resolveStream(slug, ep, mode);
  }
  if(parsedUrl === "/api/bookmarks"){
    var b = [];
    try { b = JSON.parse(localStorage.getItem("restram_bookmarks") || "[]"); } catch(e){}
    return { success: true, data: b };
  }
  if(parsedUrl === "/api/bookmarks/check"){
    var slug = params.slug || "";
    var b = [];
    try { b = JSON.parse(localStorage.getItem("restram_bookmarks") || "[]"); } catch(e){}
    var isBk = b.some(function(x){ return x.slug === slug; });
    return { success: true, data: { bookmarked: isBk } };
  }
  if(parsedUrl === "/api/history"){
    var h = [];
    try { h = JSON.parse(localStorage.getItem("restram_history") || "[]"); } catch(e){}
    return { success: true, data: h };
  }
  if(parsedUrl === "/api/progress"){
    var slug = params.slug || "";
    var ep = params.ep || "";
    var key = "restram_prog_" + slug + "_" + ep;
    var pObj = null;
    try { pObj = JSON.parse(localStorage.getItem(key) || "null"); } catch(e){}
    if(pObj) return { success: true, data: pObj };
    return { success: true, data: { should_resume: false, progress: 0, duration: 0 } };
  }
  if(parsedUrl === "/api/genres"){
    return { success: true, data: { list: [
      { slug: "action", title: "Action" },
      { slug: "adventure", title: "Adventure" },
      { slug: "comedy", title: "Comedy" },
      { slug: "drama", title: "Drama" },
      { slug: "fantasy", title: "Fantasy" },
      { slug: "sci-fi", title: "Sci-Fi" },
      { slug: "supernatural", title: "Supernatural" }
    ]}};
  }
  if(parsedUrl === "/api/filters"){
    return { success: true, data: {} };
  }
  if(parsedUrl === "/api/health"){
    return { success: true, data: { status: "ready (static-fallback)", reachable: true } };
  }
  return { success: true, data: {} };
}

function mockJpost(u, b){
  var parsedUrl = u.split("?")[0];
  if(parsedUrl === "/api/bookmarks"){
    var list = [];
    try { list = JSON.parse(localStorage.getItem("restram_bookmarks") || "[]"); } catch(e){}
    list = list.filter(function(x){ return x.slug !== b.slug; });
    list.unshift(b);
    try { localStorage.setItem("restram_bookmarks", JSON.stringify(list)); } catch(e){}
    return { success: true };
  }
  if(parsedUrl === "/api/history"){
    var list = [];
    try { list = JSON.parse(localStorage.getItem("restram_history") || "[]"); } catch(e){}
    list = list.filter(function(x){ return !(x.slug === b.slug && x.episode === b.episode); });
    list.unshift(b);
    try { localStorage.setItem("restram_history", JSON.stringify(list)); } catch(e){}
    return { success: true };
  }
  if(parsedUrl === "/api/progress"){
    var key = "restram_prog_" + b.slug + "_" + b.episode;
    var dur = b.duration || 0;
    var prog = b.progress || 0;
    var obj = { should_resume: (prog >= 15), progress: prog, duration: dur };
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch(e){}
    return { success: true };
  }
  if(parsedUrl === "/api/settings"){
    try { localStorage.setItem("restram_settings", JSON.stringify(b || {})); } catch(e){}
    return { success: true };
  }
  return { success: true };
}

function mockJdel(u){
  var parsedUrl = u.split("?")[0];
  if(parsedUrl.indexOf("/api/bookmarks/") === 0){
    var slug = decodeURIComponent(parsedUrl.replace("/api/bookmarks/", ""));
    var list = [];
    try { list = JSON.parse(localStorage.getItem("restram_bookmarks") || "[]"); } catch(e){}
    list = list.filter(function(x){ return x.slug !== slug; });
    try { localStorage.setItem("restram_bookmarks", JSON.stringify(list)); } catch(e){}
    return { success: true };
  }
  return { success: true };
}

async function jget(u){
  var base = apiBase();
  try {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var tid = ctrl ? setTimeout(function(){ ctrl.abort(); }, 3500) : null;
    var r = await fetch(base + u, ctrl ? { signal: ctrl.signal } : {});
    if(tid) clearTimeout(tid);
    if(r.ok){
      return await r.json();
    }
    throw new Error("HTTP " + r.status);
  } catch(e){
    return mockJget(u);
  }
}

async function jpost(u,b){
  var base = apiBase();
  try {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var tid = ctrl ? setTimeout(function(){ ctrl.abort(); }, 3500) : null;
    var r = await fetch(base + u, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b || {}),
      signal: ctrl ? ctrl.signal : undefined
    });
    if(tid) clearTimeout(tid);
    if(r.ok){
      return await r.json();
    }
    throw new Error("HTTP " + r.status);
  } catch(e){
    return mockJpost(u, b);
  }
}

async function jdel(u){
  var base = apiBase();
  try {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var tid = ctrl ? setTimeout(function(){ ctrl.abort(); }, 3500) : null;
    var r = await fetch(base + u, {
      method: "DELETE",
      signal: ctrl ? ctrl.signal : undefined
    });
    if(tid) clearTimeout(tid);
    if(r.ok){
      return await r.json();
    }
    throw new Error("HTTP " + r.status);
  } catch(e){
    return mockJdel(u);
  }
}

window.ReStram = window.Tatap = {
  search: function(q,source){ return jget("/api/search?q="+encodeURIComponent(q)+(source?"&source="+encodeURIComponent(source):"")); },
  catalog: function(p){ return jget("/api/catalog?page="+(p||1)); },
  seasonNow: function(p){ return jget("/api/seasonal?which=now&page="+(p||1)); },
  stillAiring: function(p){ return jget("/api/seasonal?which=airing&page="+(p||1)); },
  seasonBy: function(name,year,page){ return jget("/api/seasonal?season="+encodeURIComponent(name)+"&year="+(year||0)+"&page="+(page||1)); },
  upcoming: function(days,day){ return jget("/api/upcoming-episodes?days="+(days||7)+"&day="+(day||"today")); },
  schedule: function(day){ return jget("/api/schedule?day="+(day||"today")); },
  filters: function(){ return jget("/api/filters"); },
  browse: function(params,page){
    var qs = "";
    for (var k in params) if (params[k]) qs += "&"+encodeURIComponent(k)+"="+encodeURIComponent(params[k]);
    return jget("/api/browse?page="+(page||1)+qs);
  },
  episodes: function(slug){ return jget("/api/anime/"+encodeURIComponent(slug)+"/episodes"); },
  animeDetail: function(slug){ return jget("/api/anime/"+encodeURIComponent(slug)+"/detail"); },
  relations: function(slug,title){ return jget("/api/anime/"+encodeURIComponent(slug)+"/relations?title="+encodeURIComponent(title||"")); },
  resolve: function(slug,ep,mode,q,source){ return jget("/api/stream/resolve?slug="+encodeURIComponent(slug)+"&ep="+ep+"&mode="+(mode||"sub")+"&q="+(q||"best")+(source?"&source="+encodeURIComponent(source):"")); },
  genres: function(){ return jget("/api/genres"); },
  health: function(){ return jget("/api/health"); },
  history: function(){ return jget("/api/history"); },
  saveHist: function(b){ return jpost("/api/history",b); },
  getProgress: function(slug,ep){ return jget("/api/progress?slug="+encodeURIComponent(slug)+"&ep="+encodeURIComponent(ep)); },
  saveProgress: function(slug,ep,progress,duration){ return jpost("/api/progress",{slug:slug,episode:ep,progress:progress,duration:duration||0}); },
  deleteProgress: function(slug,ep){ return jdel("/api/progress?slug="+encodeURIComponent(slug)+"&ep="+encodeURIComponent(ep)); },
  bookmarks: function(){ return jget("/api/bookmarks"); },
  addBookmark: function(b){ return jpost("/api/bookmarks",b); },
  removeBookmark: function(slug){ return jdel("/api/bookmarks/"+encodeURIComponent(slug)); },
  checkBookmark: function(slug){ return jget("/api/bookmarks/check?slug="+encodeURIComponent(slug)); },
  playMPV: function(b){ return jpost("/api/play-mpv",b); },
  getSettings: function(){ return jget("/api/settings"); },
  setSetting: function(b){ return jpost("/api/settings",b); },
  checkUpdate: function(){ return jget("/api/update/check"); },
  // net27.cc layout direct helpers
  getHeroItems: function(){ return (window.NET27_DATA && window.NET27_DATA.hero) || []; },
  getCatalogRails: function(){ return (window.NET27_DATA && window.NET27_DATA.rails) || []; },
  getFallbackData: function(){ return window.NET27_DATA || null; }
};

