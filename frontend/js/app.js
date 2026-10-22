(function migrateOldStorage(){
  try{
    for(var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      if(k && k.indexOf("tatap_") === 0){
        var nk = "restram_" + k.substring(6);
        if(localStorage.getItem(nk) === null){
          localStorage.setItem(nk, localStorage.getItem(k));
        }
      }
    }
  }catch(e){}
})();
function getAppStorage(k){
  try{
    var v = localStorage.getItem("restram_" + k);
    return v !== null ? v : localStorage.getItem("tatap_" + k);
  }catch(e){return null;}
}
function setAppStorage(k, v){
  try{
    localStorage.setItem("restram_" + k, v);
  }catch(e){}
}
var cur = {slug:"", title:"", ep:1, mode:"sub", quality:"best", res:null, eps:[], watched:{}, lastWatchedEp:null,
            subLang:"Indonesian (GTX+)",    // preferensi bahasa user default Indonesian (GTX+)
            activeSub:null,       // URL track subtitle yang sedang aktif (live switch)
            cues:[],              // cue subtitle hasil parse VTT (render overlay milik app)
            subSize:"m",          // ukuran subtitle overlay: s|m|l
            translate:true,       // toggle translate subtitle Indonesia default ON
            eps_counter:""
           };
var _playTokenCounter = 0;
var PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
var currentPlaybackSpeed = 1.0;

function setPlaySpeed(spd, notify){
  var num = parseFloat(spd);
  if(isNaN(num) || num <= 0) num = 1.0;
  currentPlaybackSpeed = num;
  var v = $("vid");
  if(v){
    try {
      v.playbackRate = currentPlaybackSpeed;
    } catch(e){}
  }
  var sel = $("pm-speed-select");
  if(sel){
    sel.value = String(currentPlaybackSpeed);
  }
  if(notify){
    toast("Kecepatan: " + currentPlaybackSpeed + "x");
  }
}

function adjustPlaySpeed(dir){
  var idx = 2; // default 1.0x (index 2)
  for(var i = 0; i < PLAYBACK_SPEEDS.length; i++){
    if(Math.abs(PLAYBACK_SPEEDS[i] - currentPlaybackSpeed) < 0.05){
      idx = i;
      break;
    }
  }
  var nextIdx = idx + dir;
  if(nextIdx < 0) nextIdx = 0;
  if(nextIdx >= PLAYBACK_SPEEDS.length) nextIdx = PLAYBACK_SPEEDS.length - 1;
  setPlaySpeed(PLAYBACK_SPEEDS[nextIdx], true);
}

function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function toast(msg,ms){
  $("toast-msg").textContent=msg;
  $("toast").classList.remove("hidden");
  clearTimeout(window._toastT);
  window._toastT=setTimeout(function(){$("toast").classList.add("hidden");},ms||2200);
}
function loadPrefs(){
  try{
    if(getAppStorage("crt") === "on"){
      document.body.classList.remove("no-crt");
    } else {
      document.body.classList.add("no-crt");
    }
    if(getAppStorage("ambient") === "off"){
      document.body.classList.add("no-ambient");
    }
  }catch(e){}
}

function updateBookmarkBtn(isBookmarked){
  var btn = $("tm-bookmark-btn");
  if(!btn) return;
  btn.classList.toggle("bookmarked", !!isBookmarked);
  var label = $("tm-bookmark-label");
  if(label){
    label.textContent = isBookmarked ? "TERSIMPAN" : "+ DAFTAR TONTONAN";
  } else {
    var starSvg = isBookmarked ? '<svg class="ui-icon"><use href="#icon-star-filled"/></svg>' : '<svg class="ui-icon"><use href="#icon-star"/></svg>';
    btn.innerHTML = starSvg + " " + (isBookmarked ? "TERSIMPAN" : "+ DAFTAR TONTONAN");
  }
  btn.title = isBookmarked ? "Hapus dari daftar tontonan" : "Tambahkan ke daftar tontonan";
}

function checkModalBookmark(slug){
  (window.ReStram||window.Tatap).checkBookmark(slug).then(function(r){
    if(cur.slug !== slug) return;
    if(r && r.success && r.data){
      updateBookmarkBtn(!!r.data.bookmarked);
    }
  }).catch(function(){});
}

function toggleModalBookmark(){
  var slug = cur.slug;
  if(!slug) return;
  var btn = $("tm-bookmark-btn");
  var currentlyBookmarked = btn && btn.classList.contains("bookmarked");
  var nextState = !currentlyBookmarked;
  updateBookmarkBtn(nextState);
  if(nextState){
    (window.ReStram||window.Tatap).addBookmark({
      slug: slug,
      title: cur.title,
      poster: cur.poster || "",
      type: cur.type || "TV",
      score: 0.0
    }).then(function(){
      if(window.Tui && window.Tui.state && window.Tui.state.view === "favorit"){
        window.Tui.setView("favorit");
      }
    });
  } else {
    (window.ReStram||window.Tatap).removeBookmark(slug).then(function(){
      if(window.Tui && window.Tui.state && window.Tui.state.view === "favorit"){
        window.Tui.setView("favorit");
      }
    });
  }
}

function decodeHtmlEntities(str){
  if(!str) return "";
  try {
    var txt = document.createElement("textarea");
    txt.innerHTML = str;
    var val = txt.value;
    val = val.replace(/<[^>]*>/g, " ");
    val = val.replace(/&nbsp;/g, " ");
    return val.replace(/\s+/g, " ").trim();
  } catch(e){
    return str.replace(/&#8211;/g, "–").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&amp;/g, "&");
  }
}

function cleanSynopsis(raw){
  if(!raw) return "";
  var s = decodeHtmlEntities(raw);
  s = s.replace(/^sinopsis\s*:\s*/i, "");
  s = s.replace(/^synopsis\s*:\s*/i, "");
  return s.trim();
}

function cleanAnimeTitle(title){
  if(!title) return "";
  var t = title;
  t = t.replace(/\s*\(?sub\s*indo\)?/gi, "");
  t = t.replace(/\s*episode\s*\d+/gi, "");
  t = t.replace(/\s*ep\s*\d+/gi, "");
  t = t.replace(/\s*batch\b/gi, "");
  t = t.replace(/\s*bd\b/gi, "");
  t = t.replace(/\[.*?\]/g, "");
  return t.trim();
}

var _anilistMetaCache = {};

function enrichAnimeMetadata(title, slug){
  if(!title || !slug) return;
  var cached = _anilistMetaCache[slug];
  if(!cached){
    try {
      var s = sessionStorage.getItem("anilist_" + slug);
      if(s) cached = JSON.parse(s);
    } catch(e){}
  }
  if(cached){
    applyEnrichedMetadata(cached, slug);
    return;
  }

  var searchTitle = cleanAnimeTitle(title);
  var gqlQuery = 'query ($search: String) { Media (search: $search, type: ANIME) { id idMal title { romaji english native } bannerImage coverImage { extraLarge large } description(asHtml: false) episodes status seasonYear season averageScore genres studios(isMain: true) { nodes { name } } trailer { id site } } }';

  fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ query: gqlQuery, variables: { search: searchTitle } })
  })
  .then(function(res){
    if(!res.ok) throw new Error("AniList status " + res.status);
    return res.json();
  })
  .then(function(json){
    var m = json && json.data && json.data.Media;
    if(!m) return;
    _anilistMetaCache[slug] = m;
    try { sessionStorage.setItem("anilist_" + slug, JSON.stringify(m)); } catch(e){}
    applyEnrichedMetadata(m, slug);
  })
  .catch(function(err){});
}

function applyEnrichedMetadata(m, slug){
  if(cur.slug !== slug) return;

  // 1. Hero Backdrop
  var heroBd = $("tm-hero-backdrop");
  if(heroBd && m.bannerImage){
    heroBd.style.backgroundImage = 'url("' + m.bannerImage + '")';
  }

  // 2. Poster Image (upgrade to HD cover if available)
  var posterImg = $("tm-poster-img");
  if(posterImg && m.coverImage){
    var hdCover = m.coverImage.extraLarge || m.coverImage.large;
    if(hdCover && (!posterImg.src || posterImg.src.indexOf("placeholder") !== -1 || !cur.poster)){
      posterImg.src = hdCover;
    }
  }

  // 3. Alternative Title (Romaji / English / Native)
  var altTitleEl = $("tm-alt-title");
  if(altTitleEl && m.title){
    var alt = m.title.english || m.title.romaji || m.title.native || "";
    if(alt && alt.toLowerCase() !== cur.title.toLowerCase()){
      altTitleEl.textContent = alt;
      altTitleEl.classList.remove("hidden");
    }
  }

  // 4. Score
  if(m.averageScore){
    var scEl = $("tm-score");
    var scVal = $("tm-score-val");
    if(scVal && scEl){
      scVal.textContent = (m.averageScore / 10).toFixed(1);
      scEl.classList.remove("hidden");
    }
  }

  // 5. Studio
  var studioWrap = $("tm-studio-wrap");
  var studioVal = $("tm-studio-val");
  var studioName = m.studios && m.studios.nodes && m.studios.nodes[0] ? m.studios.nodes[0].name : "";
  if(studioVal && studioName){
    studioVal.textContent = studioName;
    if(studioWrap) studioWrap.classList.remove("hidden");
  }

  // 6. Season / Year
  var seasonWrap = $("tm-season-wrap");
  var seasonVal = $("tm-season-val");
  var seasonYearText = (m.season ? m.season.charAt(0).toUpperCase() + m.season.slice(1).toLowerCase() + " " : "") + (m.seasonYear || "");
  if(seasonVal && seasonYearText.trim()){
    seasonVal.textContent = seasonYearText.trim();
    if(seasonWrap) seasonWrap.classList.remove("hidden");
  }
  var yrBadge = $("tm-year");
  if(yrBadge && m.seasonYear){
    yrBadge.textContent = m.seasonYear;
    yrBadge.classList.remove("hidden");
  }

  // 7. Episodes Badge
  var epBadge = $("tm-eps-badge");
  if(epBadge && m.episodes){
    epBadge.textContent = m.episodes + " Episode";
    epBadge.classList.remove("hidden");
  }

  // 8. MAL Official Description / Synopsis
  if(m.description){
    cur.synopsis_mal = cleanSynopsis(m.description);
    if(!cur.synopsis_id && cur.synopsis_mal){
      setSynopsisLang("mal");
    } else if(cur.currentSynLang === "mal"){
      setSynopsisLang("mal");
    }
  }

  // 9. Trailer Button
  var trBtn = $("tm-trailer-btn");
  if(trBtn){
    if(m.trailer && m.trailer.site === "youtube" && m.trailer.id){
      cur.trailerUrl = "https://www.youtube.com/watch?v=" + m.trailer.id;
      trBtn.classList.remove("hidden");
      trBtn.onclick = function(){
        window.open(cur.trailerUrl, "_blank", "noopener,noreferrer");
      };
    }
  }

  // 10. Refine Genres if empty
  var genEl = $("tm-genres");
  if(genEl && (!genEl.children || genEl.children.length === 0) && m.genres && m.genres.length){
    genEl.innerHTML = "";
    m.genres.slice(0, 5).forEach(function(g){
      var span = document.createElement("span");
      span.className = "genre-pill";
      span.textContent = g;
      genEl.appendChild(span);
    });
    genEl.classList.remove("hidden");
  }
}

function setSynopsisLang(lang){
  cur.currentSynLang = lang;
  var synEl = $("tm-synopsis");
  var btnId = $("tm-syn-id-btn");
  var btnMal = $("tm-syn-mal-btn");
  if(!synEl) return;
  if(btnId) btnId.classList.toggle("active", lang === "id");
  if(btnMal) btnMal.classList.toggle("active", lang === "mal");

  var text = (lang === "mal") ? (cur.synopsis_mal || "Sinopsis MAL tidak tersedia untuk anime ini.") : (cur.synopsis_id || cur.synopsis_mal || "Belum ada sinopsis untuk anime ini.");
  synEl.textContent = text;
  synEl.classList.remove("expanded");
  synEl.classList.add("clamped");

  var synToggle = $("tm-synopsis-toggle");
  if(synToggle){
    synToggle.textContent = "Selengkapnya ▼";
    synToggle.style.display = text.length > 180 ? "inline-block" : "none";
  }
}

function playPrimaryEpisode(){
  if(!cur.eps || !cur.eps.length){
    toast("Memuat episode, silakan tunggu...");
    return;
  }
  var targetEp = null;
  if(cur.lastWatchedEp){
    for(var i=0; i<cur.eps.length; i++){
      var epNum = cur.eps[i].ep || cur.eps[i].episode || (i+1);
      if(parseInt(epNum) === parseInt(cur.lastWatchedEp)){
        targetEp = cur.eps[i];
        break;
      }
    }
  }
  if(!targetEp){
    targetEp = cur.eps[0];
  }
  if(targetEp){
    openPlayer(targetEp);
  }
}

function updatePlayPrimaryButton(){
  var playBtn = $("tm-btn-play-primary");
  var playLabel = $("tm-btn-play-label");
  if(!playBtn || !playLabel) return;
  if(cur.lastWatchedEp){
    playLabel.textContent = "Lanjutkan Ep " + cur.lastWatchedEp;
  } else {
    playLabel.textContent = "Putar Sekarang";
  }
}

function renderDetailMeta(meta){
  var box = $("tm-detail-meta");
  if(!box) return;
  if(!meta){
    box.classList.add("hidden");
    return;
  }
  var hasAny = false;

  // Score
  var scoreEl = $("tm-score");
  var scoreVal = $("tm-score-val");
  if(scoreEl && scoreVal){
    var sc = meta.score ? parseFloat(meta.score) : 0;
    if(sc > 0){
      scoreVal.textContent = sc.toFixed(1);
      scoreEl.classList.remove("hidden");
      hasAny = true;
    } else {
      scoreEl.classList.add("hidden");
    }
  }

  // Status
  var statEl = $("tm-status");
  if(statEl){
    var st = (meta.status || meta.badge || "").toLowerCase();
    if(st.indexOf("finish") !== -1 || st.indexOf("tamat") !== -1 || st.indexOf("completed") !== -1){
      statEl.textContent = "TAMAT";
      statEl.className = "badge-status finished";
      hasAny = true;
    } else if(st.indexOf("releas") !== -1 || st.indexOf("airing") !== -1 || st.indexOf("ongoing") !== -1){
      statEl.textContent = "ONGOING";
      statEl.className = "badge-status ongoing";
      hasAny = true;
    } else {
      statEl.className = "badge-status hidden";
    }
  }

  // Studio & Season Sidebar
  var studioWrap = $("tm-studio-wrap");
  var studioVal = $("tm-studio-val");
  if(studioVal){
    if(meta.studio){
      studioVal.textContent = meta.studio;
      if(studioWrap) studioWrap.classList.remove("hidden");
      hasAny = true;
    } else if(!studioVal.textContent || studioVal.textContent === "—"){
      if(studioWrap) studioWrap.classList.add("hidden");
    }
  }

  var seasonWrap = $("tm-season-wrap");
  var seasonVal = $("tm-season-val");
  if(seasonVal){
    var sText = meta.season || meta.year || "";
    if(sText){
      seasonVal.textContent = sText;
      if(seasonWrap) seasonWrap.classList.remove("hidden");
      hasAny = true;
    } else if(!seasonVal.textContent || seasonVal.textContent === "—"){
      if(seasonWrap) seasonWrap.classList.add("hidden");
    }
  }

  // Year & Episode Badges in Hero
  var yrBadge = $("tm-year");
  if(yrBadge && (meta.year || meta.seasonYear)){
    yrBadge.textContent = meta.year || meta.seasonYear;
    yrBadge.classList.remove("hidden");
  }
  var epBadge = $("tm-eps-badge");
  if(epBadge && (meta.episodes || meta.eps_counter)){
    epBadge.textContent = (meta.episodes ? meta.episodes + " Episode" : meta.eps_counter);
    epBadge.classList.remove("hidden");
  }

  // Genres (clean & limit to max 5)
  var genEl = $("tm-genres");
  if(genEl){
    genEl.innerHTML = "";
    var gList = meta.genres || [];
    if(typeof gList === "string"){
      try { gList = JSON.parse(gList); } catch(e){ gList = gList.split(","); }
    }
    var validGenres = [];
    if(Array.isArray(gList)){
      validGenres = gList.map(function(x){
        return decodeHtmlEntities(x || "").trim();
      }).filter(function(x){
        return x && x.toLowerCase() !== "hentai";
      });
    }
    if(validGenres.length > 0){
      validGenres.slice(0, 5).forEach(function(g){
        var span = document.createElement("span");
        span.className = "genre-pill";
        span.textContent = g;
        genEl.appendChild(span);
      });
      genEl.classList.remove("hidden");
      hasAny = true;
    } else {
      genEl.classList.add("hidden");
    }
  }

  // Synopsis setup
  if(meta.synopsis){
    cur.synopsis_id = cleanSynopsis(meta.synopsis);
  }
  setSynopsisLang(cur.currentSynLang || "id");
  if(cur.synopsis_id || cur.synopsis_mal) hasAny = true;

  // Toggle button setup
  var synToggle = $("tm-synopsis-toggle");
  var synText = $("tm-synopsis");
  if(synToggle && synText){
    synToggle.onclick = function(){
      if(synText.classList.contains("clamped")){
        synText.classList.remove("clamped");
        synText.classList.add("expanded");
        synToggle.textContent = "Tutup Sinopsis ▲";
      } else {
        synText.classList.remove("expanded");
        synText.classList.add("clamped");
        synToggle.textContent = "Selengkapnya ▼";
      }
    };
  }

  if(hasAny){
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
}

function openTitle(slug,title,poster,type,epsCounter,meta){
  cur.slug=slug;cur.title=title;cur.poster=poster||cur.poster||"";cur.type=type||cur.type||"";cur.eps=[];
  cur.eps_counter=epsCounter||"";
  cur.lastWatchedEp=null;
  cur.watched={};
  cur.activeEpRange=null;
  cur.meta=meta||null;
  cur.playerServer=null;
  cur.trailerUrl=null;
  cur.synopsis_id=meta && meta.synopsis ? cleanSynopsis(meta.synopsis) : "";
  cur.synopsis_mal="";
  cur.currentSynLang="id";
  setPlaySpeed(1.0, false);
  renderSourceUI();

  // Top Bar & Hero Elements
  var topTitle = $("tm-top-title");
  if(topTitle) topTitle.textContent = title;
  $("tm-title").textContent=title;
  var altTitle = $("tm-alt-title");
  if(altTitle){ altTitle.textContent = ""; altTitle.classList.add("hidden"); }
  $("tm-eyebrow").textContent="DETAIL ANIME";
  $("tm-count").textContent="memuat...";
  $("tm-eps").innerHTML="";
  $("ep-filter").value="";

  // Reset Badges
  var yrBadge = $("tm-year"); if(yrBadge) yrBadge.classList.add("hidden");
  var epBadge = $("tm-eps-badge"); if(epBadge) epBadge.classList.add("hidden");
  var trBtn = $("tm-trailer-btn"); if(trBtn) trBtn.classList.add("hidden");

  // Backdrop & Poster
  var heroBd = $("tm-hero-backdrop");
  if(heroBd){
    heroBd.style.backgroundImage = cur.poster ? "url('" + cur.poster + "')" : "none";
  }
  var posterImg = $("tm-poster-img");
  if(posterImg){
    posterImg.src = cur.poster || "";
    posterImg.alt = title;
  }

  // Primary Actions binding
  var playBtn = $("tm-btn-play-primary");
  if(playBtn){
    playBtn.onclick = function(){
      playPrimaryEpisode();
    };
  }
  updatePlayPrimaryButton();

  var backBtn = $("tm-back-btn");
  if(backBtn){
    backBtn.onclick = function(){
      cur.playToken = ++_playTokenCounter;
      closeTitle();
    };
  }

  // Synopsis Lang Buttons binding
  var btnId = $("tm-syn-id-btn");
  if(btnId) btnId.onclick = function(){ setSynopsisLang("id"); };
  var btnMal = $("tm-syn-mal-btn");
  if(btnMal) btnMal.onclick = function(){ setSynopsisLang("mal"); };

  var sBar=$("tm-seasons");if(sBar)sBar.classList.add("hidden");
  var sChips=$("tm-seasons-chips");if(sChips)sChips.innerHTML="";
  renderDetailMeta(meta);
  updateBookmarkBtn(false);
  checkModalBookmark(slug);
  $("title-modal").classList.remove("hidden");

  // Async loads
  loadEps();
  loadRelations();
  enrichAnimeMetadata(title, slug);
}
function loadRelations(){
  var thisSlug=cur.slug;
  (window.ReStram||window.Tatap).relations(thisSlug, cur.title).then(function(r){
    if(thisSlug!==cur.slug)return; // Stale modal
    var sBar=$("tm-seasons");
    var sChips=$("tm-seasons-chips");
    if(!sBar||!sChips)return;
    if(!r||!r.success||!r.data||!r.data.relations||!r.data.relations.length){
      sBar.classList.add("hidden");
      return;
    }
    var rels=r.data.relations;
    sChips.innerHTML="";
    var count=0;
    for(var i=0;i<rels.length;i++){
      (function(rel){
        if(!rel.slug || rel.slug === thisSlug)return; // Lewati jika belum termap ke sumber video atau menunjuk ke anime aktif
        count++;
        var b=document.createElement("button");
        var cls="season-chip";
        var icon='<svg class="ui-icon"><use href="#icon-tv"/></svg>';
        if(rel.format==="MOVIE"){cls+=" movie";icon='<svg class="ui-icon"><use href="#icon-film"/></svg>';}
        else if(rel.format==="OVA"||rel.format==="SPECIAL"||rel.format==="ONA"){cls+=" special";icon='<svg class="ui-icon"><use href="#icon-disc"/></svg>';}
        else if(rel.relation==="PREQUEL"){cls+=" prequel";icon='<svg class="ui-icon"><use href="#icon-step-prev"/></svg>';}
        else if(rel.relation==="SEQUEL"){cls+=" sequel";icon='<svg class="ui-icon"><use href="#icon-step-next"/></svg>';}
        b.className=cls;
        b.title=rel.title+(rel.year?" ("+rel.year+")":"");
        b.innerHTML="<span>"+icon+"</span> <b>"+rel.label+"</b>: "+esc(rel.title);
        b.addEventListener("click",function(e){
          if(e)e.stopPropagation();
          openTitle(rel.slug,rel.title);
        });
        sChips.appendChild(b);
      })(rels[i]);
    }
    if(count>0){
      sBar.classList.remove("hidden");
    }else{
      sBar.classList.add("hidden");
    }
  }).catch(function(){
    var sBar=$("tm-seasons");if(sBar)sBar.classList.add("hidden");
  });
}
var _epsMemCache = {};
cur.activeEpRange = null;

function recordEpisodeWatched(slug, ep){
  if(!slug || !ep) return;
  ep = parseInt(ep);
  if(isNaN(ep)) return;
  if(!cur.watched) cur.watched = {};
  if(cur.slug === slug){
    cur.watched[ep] = 1;
    cur.lastWatchedEp = ep;
    updatePlayPrimaryButton();
  }

  try {
    setAppStorage("last_ep_" + slug, String(ep));
    var wKey = "watched_" + slug;
    var wObj = {};
    try { wObj = JSON.parse(getAppStorage(wKey) || "{}"); } catch(e){}
    wObj[ep] = 1;
    setAppStorage(wKey, JSON.stringify(wObj));
  } catch(e){}

  (window.ReStram||window.Tatap).saveHist({
    slug: slug,
    title: cur.title || slug,
    episode: ep,
    mode: cur.mode || "sub",
    progress: 0,
    poster: cur.poster || "",
    type: cur.type || ""
  }).then(function(){
    renderContinue();
  }).catch(function(){});
}

function renderEpRanges(){
  var bar = $("tm-ep-ranges");
  if(!bar) return;
  if(!cur.eps || cur.eps.length <= 100){
    bar.innerHTML = "";
    bar.classList.add("hidden");
    cur.activeEpRange = null;
    return;
  }
  bar.innerHTML = "";
  bar.classList.remove("hidden");
  var total = cur.eps.length;
  var step = 100;
  var lastWatchedEp = cur.lastWatchedEp || -1;
  if(lastWatchedEp <= 0 && cur.slug){
    try {
      var sLast = getAppStorage("last_ep_" + cur.slug);
      if(sLast) lastWatchedEp = parseInt(sLast);
    } catch(e){}
  }
  if(lastWatchedEp <= 0 && cur.watched){
    for(var w in cur.watched){
      var n = parseInt(w);
      if(n > lastWatchedEp) lastWatchedEp = n;
    }
  }
  if(lastWatchedEp > 0) cur.lastWatchedEp = lastWatchedEp;

  var ranges = [];
  for(var s = 1; s <= total; s += step){
    var e = Math.min(s + step - 1, total);
    ranges.push({start: s, end: e, label: s + " - " + e});
  }
  ranges.push({start: 1, end: total, label: "Semua (" + total + ")", isAll: true});

  if(!cur.activeEpRange){
    cur.activeEpRange = ranges[0];
    if(lastWatchedEp > 0){
      for(var r = 0; r < ranges.length - 1; r++){
        if(lastWatchedEp >= ranges[r].start && lastWatchedEp <= ranges[r].end){
          cur.activeEpRange = ranges[r];
          break;
        }
      }
    }
  }

  ranges.forEach(function(rng){
    var btn = document.createElement("button");
    btn.className = "ep-range-chip" + (cur.activeEpRange && cur.activeEpRange.label === rng.label ? " active" : "");
    btn.textContent = rng.label;
    btn.addEventListener("click", function(){
      cur.activeEpRange = rng;
      renderEpRanges();
      renderEpGrid();
    });
    bar.appendChild(btn);
  });
}

function loadEps(){
  cur.activeEpRange = null;
  cur.lastWatchedEp = null;
  cur.watched = {};
  var thisSlug = cur.slug;
  if(thisSlug){
    try {
      var localWatched = JSON.parse(getAppStorage("watched_" + thisSlug) || "{}");
      cur.watched = Object.assign({}, localWatched);
      var s = getAppStorage("last_ep_" + thisSlug);
      if(s) {
        cur.lastWatchedEp = parseInt(s);
        updatePlayPrimaryButton();
      }
    } catch(e){}
  }

  var countLabel = function(){
    var base = cur.eps.length + " episode";
    if(cur.eps_counter){
      var parts = cur.eps_counter.split('/');
      if(parts.length === 2 && parts[1] && parts[1] !== '?'){
        base = cur.eps.length + "/" + parts[1] + " episode rilis";
      } else {
        base = cur.eps.length + " episode rilis";
      }
    }
    return base + " · " + cur.mode.toUpperCase();
  };
  var cached = _epsMemCache[thisSlug];
  if(cached && thisSlug === cur.slug){
    cur.eps = cached;
    $("tm-count").textContent = countLabel();
    renderEpRanges();
    renderEpGrid();
  }

  (window.ReStram||window.Tatap).episodes(thisSlug).then(function(r){
    if(thisSlug !== cur.slug) return;
    var eps = (r && r.success && r.data && Array.isArray(r.data.episodes) && r.data.episodes.length) ? r.data.episodes : null;
    if(!eps && window.NET27_DATA && window.NET27_DATA.getEpisodes){
      eps = window.NET27_DATA.getEpisodes(thisSlug);
    }
    if(!eps && cur.meta && cur.meta.episodes_list && cur.meta.episodes_list.length){
      eps = cur.meta.episodes_list.map(function(ep){
        return {
          ep: ep.ep,
          episode: ep.ep,
          title: ep.title || ("Episode " + ep.ep),
          id: thisSlug + "?ep=" + ep.ep,
          date: ep.date || "",
          stream_url: ep.stream_url,
          servers: ep.servers || [],
          drive_file_id: ep.drive_file_id || ""
        };
      });
    }
    if(!eps || !eps.length){
      if(!cached) $("tm-count").textContent = "error: " + ((r && r.error) || "tidak ada episode");
      return;
    }
    cur.eps = eps;
    _epsMemCache[thisSlug] = cur.eps;
    if(r && r.data && (r.data.detail || r.data.synopsis)){
      var detail = Object.assign({}, cur.meta || {}, r.data.detail || {});
      if(r.data.synopsis && (!detail.synopsis || r.data.synopsis.length > detail.synopsis.length)){
        detail.synopsis = r.data.synopsis;
      }
      cur.meta = detail;
      renderDetailMeta(detail);
    }
    (window.ReStram||window.Tatap).history().then(function(h){
      if(thisSlug !== cur.slug) return;
      var foundInHist = false;
      (h.data || []).forEach(function(x){
        if(x.slug === thisSlug){
          foundInHist = true;
          if(!cur.watched) cur.watched = {};
          cur.watched[x.episode] = 1;
          cur.lastWatchedEp = x.episode;
        }
      });
      if(foundInHist && thisSlug === cur.slug && cur.lastWatchedEp){
        try {
          var wKey = "watched_" + thisSlug;
          var wObj = {};
          try { wObj = JSON.parse(getAppStorage(wKey) || "{}"); } catch(e){}
          for(var k in cur.watched){ wObj[k] = 1; }
          setAppStorage(wKey, JSON.stringify(wObj));
          setAppStorage("last_ep_" + thisSlug, String(cur.lastWatchedEp));
          updatePlayPrimaryButton();
        } catch(e){}
      }
      $("tm-count").textContent = countLabel();
      renderEpRanges();
      renderEpGrid();
    }).catch(function(){
      if(thisSlug !== cur.slug) return;
      $("tm-count").textContent = countLabel();
      renderEpRanges();
      renderEpGrid();
    });
  });
}

function renderEpGrid(){
  var f = $("ep-filter").value.trim();
  var box = $("tm-eps");
  box.innerHTML = "";
  var shown = 0;
  var frag = document.createDocumentFragment();

  var epsToRender = cur.eps || [];
  var useRange = !f && cur.activeEpRange && !cur.activeEpRange.isAll;

  var lastEp = cur.lastWatchedEp;
  if(!lastEp && cur.slug){
    try {
      var storedLast = getAppStorage("last_ep_" + cur.slug);
      if(storedLast) lastEp = parseInt(storedLast);
    } catch(e){}
  }

  for(var i = 0; i < epsToRender.length; i++){
    var epObj = epsToRender[i];
    var ep = epObj.ep;
    if(f && String(ep).indexOf(f) < 0) continue;
    if(useRange && (ep < cur.activeEpRange.start || ep > cur.activeEpRange.end)) continue;

    shown++;
    var b = document.createElement("button");
    var isLast = (lastEp && ep === lastEp);
    var isWatched = (cur.watched && cur.watched[ep]);

    var cls = "ep";
    if(isLast){
      cls += " last-watch";
    } else if(isWatched){
      cls += " watched";
    }
    b.className = cls;

    if(isLast){
      b.innerHTML = '<span class="ep-num">' + ep + '</span><span class="ep-badge-last">TERAKHIR</span>';
      b.title = "Episode " + ep + " (Terakhir ditonton)";
    } else {
      b.textContent = ep;
      if(isWatched) b.title = "Episode " + ep + " (Sudah ditonton)";
    }

    (function(targetEp){
      b.addEventListener("click", function(e){
        if(e) e.stopPropagation();
        openPlayer(targetEp);
      });
    })(ep);
    frag.appendChild(b);
  }

  if(shown > 0){
    box.appendChild(frag);
    if(lastEp){
      setTimeout(function(){
        var activeBtn = box.querySelector(".ep.last-watch");
        if(activeBtn){
          try {
            activeBtn.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
          } catch(e){}
        }
      }, 50);
    }
  } else {
    box.innerHTML = "<p class='dim'>Tidak ada episode cocok filter.</p>";
  }
}
function closeTitle(){$("title-modal").classList.add("hidden");}
function syncSeg(){
  document.querySelectorAll("#mode-seg button").forEach(function(x){x.classList.toggle("active",x.getAttribute("data-mode")===cur.mode);});
}

function formatTimeSec(sec){
  sec = Math.max(0, Math.floor(sec || 0));
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  if(m >= 60){
    var h = Math.floor(m / 60);
    m = m % 60;
    return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

var _lastProgressSaveTime = 0;
function recordWatchProgress(force){
  var v = $("vid");
  if(!v || !cur.slug || !cur.ep) return;
  var now = Date.now();
  if(!force && (now - _lastProgressSaveTime < 5000)) return;
  _lastProgressSaveTime = now;
  var curPos = Math.floor(v.currentTime || 0);
  var dur = Math.floor(v.duration || 0);
  if(curPos <= 0 && !force) return;
  (window.ReStram||window.Tatap).saveProgress(cur.slug, cur.ep, curPos, dur).then(function(){
    renderContinue();
  }).catch(function(){});
}

var _activeResumeCleanup = null;
function closeResumeModal(){
  if(_activeResumeCleanup){
    _activeResumeCleanup();
    _activeResumeCleanup = null;
  }
  var rm = $("resume-modal");
  if(rm) rm.classList.add("hidden");
}

function dismissResumeModal(){
  cur.playToken = ++_playTokenCounter;
  var savedSlug = cur.slug;
  var savedTitle = cur.title;
  var savedPoster = cur.poster;
  var savedType = cur.type;
  var savedCounter = cur.eps_counter;

  closeResumeModal();

  if(savedSlug){
    var tm = $("title-modal");
    if(tm && tm.classList.contains("hidden")){
      openTitle(savedSlug, savedTitle, savedPoster, savedType, savedCounter);
    } else {
      if(tm) tm.classList.remove("hidden");
      renderEpGrid();
    }
  }
}

function openPlayer(ep, resumeTime){
  if(resumeTime === undefined){
    var fetchToken = ++_playTokenCounter;
    cur.playToken = fetchToken;
    var reqSlug = cur.slug;
    (window.ReStram||window.Tatap).getProgress(reqSlug, ep).then(function(r){
      if(cur.playToken !== fetchToken || cur.slug !== reqSlug) return;
      if(r && r.success && r.data && r.data.should_resume && r.data.progress >= 15){
        var p = r.data.progress;
        var dur = r.data.duration || 0;
        var fTime = r.data.formatted || formatTimeSec(p);
        var fDur = (dur > 0) ? formatTimeSec(dur) : "--:--";
        var pct = (dur > 0) ? Math.min(100, Math.max(1, Math.round((p / dur) * 100))) : 0;
        var modal = $("resume-modal");
        if(modal){
          var animeTitle = cur.title || "Lanjutkan Menonton?";
          var titleEl = $("rm-title");
          if(titleEl){
            titleEl.textContent = animeTitle;
            titleEl.setAttribute("title", animeTitle);
          }
          $("rm-sub").innerHTML = "<span class='rm-badge-ep'>EP " + ep + "</span> Tersimpan pada " + fTime + (dur > 0 ? (" dari " + fDur) : "");
          $("rm-time").textContent = fTime;
          $("rm-resume-label").textContent = "Lanjutkan (" + fTime + ")";

          var fillEl = $("rm-progress-fill");
          if(fillEl) fillEl.style.width = pct + "%";
          var curEl = $("rm-time-current");
          if(curEl) curEl.textContent = fTime;
          var totEl = $("rm-time-total");
          if(totEl) totEl.textContent = (dur > 0) ? fDur : "";
          var badgeEl = $("rm-percent-badge");
          if(badgeEl){
            badgeEl.textContent = (pct > 0) ? (pct + "% selesai") : "Tersimpan";
          }

          var bResume = $("rm-btn-resume");
          var bRestart = $("rm-btn-restart");
          var bCancel = $("rm-btn-cancel");
          var bClose = $("rm-close");

          var btns = [bResume, bRestart, bCancel].filter(Boolean);
          var keyHandler = function(e){
            if(modal.classList.contains("hidden")) return;
            if(e.key === "ArrowLeft" || e.key === "ArrowUp"){
              e.preventDefault();
              var idx = btns.indexOf(document.activeElement);
              var prevIdx = (idx <= 0) ? btns.length - 1 : idx - 1;
              if(btns[prevIdx]) btns[prevIdx].focus();
            } else if(e.key === "ArrowRight" || e.key === "ArrowDown"){
              e.preventDefault();
              var idx = btns.indexOf(document.activeElement);
              var nextIdx = (idx >= btns.length - 1 || idx === -1) ? 0 : idx + 1;
              if(btns[nextIdx]) btns[nextIdx].focus();
            } else if(e.key === "Escape"){
              e.preventDefault();
              dismissResumeModal();
            }
          };

          var cleanupModal = function(){
            modal.classList.add("hidden");
            window.removeEventListener("keydown", keyHandler);
            if(bResume) bResume.onclick = null;
            if(bRestart) bRestart.onclick = null;
            if(bCancel) bCancel.onclick = null;
            if(bClose) bClose.onclick = null;
            _activeResumeCleanup = null;
          };
          _activeResumeCleanup = cleanupModal;

          if(bResume){
            bResume.onclick = function(){
              cleanupModal();
              openPlayer(ep, p);
            };
          }

          if(bRestart){
            bRestart.onclick = function(){
              cleanupModal();
              (window.ReStram||window.Tatap).saveProgress(reqSlug, ep, 0, dur).catch(function(){});
              openPlayer(ep, 0);
            };
          }

          if(bCancel){
            bCancel.onclick = function(e){
              if(e) e.stopPropagation();
              dismissResumeModal();
            };
          }

          if(bClose){
            bClose.onclick = function(e){
              if(e) e.stopPropagation();
              dismissResumeModal();
            };
          }

          window.addEventListener("keydown", keyHandler);
          modal.classList.remove("hidden");
          setTimeout(function(){
            if(bResume) bResume.focus();
          }, 50);
          return;
        }
      }
      if(cur.playToken === fetchToken && cur.slug === reqSlug) openPlayer(ep, 0);
    }).catch(function(){
      if(cur.playToken === fetchToken && cur.slug === reqSlug) openPlayer(ep, 0);
    });
    return;
  }

  cur.ep=ep;
  cur.playerOpenedAt=Date.now();
  var token = ++_playTokenCounter;
  cur.playToken = token;
  var reqSlug = cur.slug;
  recordEpisodeWatched(cur.slug, ep);
  closeTitle();
  closeResumeModal();
  $("player-modal").classList.remove("hidden");
  $("pm-title").textContent=cur.title;
  $("pm-meta").textContent="ep "+ep+" · "+cur.mode.toUpperCase();
  $("pm-spinner").classList.remove("hidden");
  $("pm-status").textContent="resolving ep "+ep+"...";
  updatePrevNext();
  var t0=Date.now();
  var src=cur.source||"";
  (window.ReStram||window.Tatap).resolve(cur.slug,ep,cur.mode,cur.quality,src).then(function(r){
    if(cur.playToken !== token || cur.slug !== reqSlug || $("player-modal").classList.contains("hidden")) return;
    if(!r || !r.success){
      var item = (window.NET27_DATA && window.NET27_DATA.getItem(cur.slug)) || cur.meta || cur.item;
      if(!item && window.NET27_DATA && window.NET27_DATA.items && cur.title){
        var cleanTitle = (cur.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        item = window.NET27_DATA.items.find(function(it){
          return (it.title || "").toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTitle;
        });
      }
      var srvMap = extractEpisodeServers(item, ep);
      if(srvMap && (srvMap.blogger || srvMap.mega || srvMap.native)){
        cur.episodeServers = srvMap;
        var fbUrl = srvMap.blogger || srvMap.mega;
        if(fbUrl){
          cur.embedUrl = fbUrl;
          cur.source = "anime-json";
          $("pm-meta").innerHTML = "ep " + ep + " · " + cur.mode.toUpperCase() + " · SERVER ALTERNATIF";
          applyEmbedPlayer(fbUrl, srvMap.blogger ? "blogger" : "mega");
          toast("Server online sibuk, beralih ke Server Cadangan...");
          (window.ReStram||window.Tatap).saveHist({slug:cur.slug,title:cur.title,episode:ep,mode:cur.mode,progress:resumeTime||0}).then(function(){renderContinue();});
          return;
        }
      }
      $("pm-spinner").classList.add("hidden");
      $("pm-status").textContent="ERROR: "+(r && r.error ? r.error : "gagal resolve stream");
      toast("Gagal resolve stream: "+(r && r.error ? r.error : "unknown"));
      return;
    }
    cur.res=r.data;
    cur.intro=(r.data&&r.data.intro)||{start:0,end:0};
    cur.outro=(r.data&&r.data.outro)||{start:0,end:0};
    cur.activeSkipTarget=0;
    cur.source=r.data.source||"hianime";
    var picked=r.data.picked||(r.data.variants&&r.data.variants[0])||{q:"HD",url:r.data.master||""};
    var srvText=r.data.server||"";
    $("pm-meta").innerHTML = "EP " + ep + " · " + cur.mode.toUpperCase() + " · " + picked.q + (r.data.cached ? " · CACHED" : "");
    renderVariants();
    cur.activeSub = pickSubtitleUrl(r.data.subtitles || [], cur.subLang);
    renderSubtitles(r.data.subtitles || [], cur.activeSub);
    if(cur.activeSub){
      prefetchSubtitleTrack(cur.activeSub, r.data.referer);
    }
    // Multi-server extraction and embed resolution
    var item = (window.NET27_DATA && window.NET27_DATA.getItem(cur.slug)) || cur.meta || cur.item;
    if(!item && window.NET27_DATA && window.NET27_DATA.items && cur.title){
      var cleanTitle = (cur.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      item = window.NET27_DATA.items.find(function(it){
        return (it.title || "").toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTitle;
      });
    }
    var srvMap = (r.data && r.data.episodeServers) || extractEpisodeServers(item, ep);
    cur.episodeServers = srvMap;

    var embedUrl = (srvMap && srvMap.blogger) || (r.data && r.data.embedUrl) || "";
    if(!embedUrl && srvMap && srvMap.mega){
      embedUrl = srvMap.mega;
    }
    if(!embedUrl){
      var anilistId = (r.data && r.data.anilist_id) || (cur.item && cur.item.anilist_id) || (window.NET27_DATA && window.NET27_DATA.getItem(cur.slug) && window.NET27_DATA.getItem(cur.slug).anilist_id);
      if(anilistId){
        embedUrl = "https://vidlink.pro/anime/" + anilistId + "/" + ep + "/" + (cur.mode === "dub" ? "dub" : "sub");
      }
    }
    cur.embedUrl = embedUrl;

    var streamUrl = (r.data && r.data.master && (r.data.master.indexOf(".m3u8") >= 0 || r.data.master.indexOf("/hls") >= 0)) ? r.data.master : (picked ? picked.url : ((srvMap && srvMap.native) || ""));

    if(cur.playerServer === "mega" && srvMap && srvMap.mega){
      applyEmbedPlayer(srvMap.mega, "mega");
    } else if(cur.playerServer === "native" && streamUrl){
      applyNativePlayer();
      playUrl(streamUrl, r.data.referer, cur.activeSub, r.data.referer, resumeTime, token);
    } else {
      // Default to Server 1: Blogger/Drive
      if(embedUrl){
        applyEmbedPlayer(embedUrl, "blogger");
      } else {
        applyNativePlayer();
        playUrl(streamUrl, r.data.referer, cur.activeSub, r.data.referer, resumeTime, token);
      }
    }
    (window.ReStram||window.Tatap).saveHist({slug:cur.slug,title:cur.title,episode:ep,mode:cur.mode,progress:resumeTime||0}).then(function(){renderContinue();});
  }).catch(function(err){
    if(cur.playToken !== token || cur.slug !== reqSlug || $("player-modal").classList.contains("hidden")) return;
    var item = (window.NET27_DATA && window.NET27_DATA.getItem(cur.slug)) || cur.meta || cur.item;
    var srvMap = extractEpisodeServers(item, ep);
    if(srvMap && (srvMap.blogger || srvMap.mega)){
      cur.episodeServers = srvMap;
      var fb = srvMap.blogger || srvMap.mega;
      cur.embedUrl = fb;
      cur.source = "anime-json";
      $("pm-meta").innerHTML = "ep " + ep + " · " + cur.mode.toUpperCase() + " · SERVER ALTERNATIF";
      applyEmbedPlayer(fb, srvMap.blogger ? "blogger" : "mega");
      toast("Koneksi gagal, beralih ke Server Cadangan...");
      return;
    }
    $("pm-spinner").classList.add("hidden");
    $("pm-status").textContent="KONEKSI GAGAL: "+(err&&err.message||err);
    toast("Koneksi gagal saat resolve: "+(err&&err.message||err));
  });
}
function renderVariants(){
  var box=$("pm-variants");if(box)box.innerHTML="";
  var sel=$("pm-quality-select");if(sel)sel.innerHTML="";
  var vs=(cur.res&&cur.res.hlsLevels&&cur.res.hlsLevels.length)?cur.res.hlsLevels:((cur.res&&cur.res.variants)||[]);
  var activeQ=(cur.res&&cur.res.picked&&cur.res.picked.q)||(vs[0]&&vs[0].q)||"";
  if(window._hls && cur.res && cur.res.hlsLevels && cur.res.hlsLevels.length){
    if(window._hls.autoLevelEnabled || window._hls.currentLevel === -1){
      activeQ = "Auto";
    }
  }

  for(var i=0;i<vs.length;i++){
    (function(v){
      if(box){
        var b=document.createElement("button");
        b.textContent=v.q;
        if(v.q.toLowerCase()===activeQ.toLowerCase())b.className="active";
        b.addEventListener("click",function(){switchQ(v.q);});
        box.appendChild(b);
      }
      if(sel){
        var opt=document.createElement("option");
        opt.value=v.q;
        opt.textContent=v.q.toUpperCase();
        if(v.q.toLowerCase()===activeQ.toLowerCase())opt.selected=true;
        sel.appendChild(opt);
      }
    })(vs[i]);
  }
  if(sel){
    if(vs.length<=1){
      sel.classList.add("hidden");
    } else {
      sel.classList.remove("hidden");
    }
  }
}

function extractEpisodeServers(item, epNum){
  if(!item) return { blogger: "", mega: "", native: "", primary: "" };
  var epList = item.episodes_list || [];
  var epObj = null;
  for(var i = 0; i < epList.length; i++){
    if(epList[i].ep === epNum){
      epObj = epList[i];
      break;
    }
  }
  if(!epObj && epList.length) epObj = epList[0];
  if(!epObj) return { blogger: "", mega: "", native: "", primary: "" };

  var allUrls = [epObj.stream_url].concat(epObj.servers || []).filter(Boolean);
  var blogger = "";
  var mega = "";
  var native = "";
  var fallback = "";

  if(epObj.drive_file_id){
    blogger = "https://drive.google.com/file/d/" + epObj.drive_file_id + "/preview";
  }

  for(var j = 0; j < allUrls.length; j++){
    var u = allUrls[j];
    if(!blogger && (u.indexOf("blogger.com") >= 0 || u.indexOf("drive.google") >= 0 || u.indexOf("gdplayer") >= 0)){
      blogger = u;
    }
    if(!mega && u.indexOf("mega.nz") >= 0){
      mega = u.replace("/file/", "/embed/");
    }
    if(!native && (u.indexOf(".m3u8") >= 0 || u.indexOf("xtwap.top") >= 0 || u.indexOf("/hls") >= 0)){
      native = u;
    }
    if(!fallback && (u.indexOf("mp4upload") >= 0 || u.indexOf("yourupload") >= 0 || u.indexOf("embed") >= 0)){
      fallback = u;
    }
  }

  if(!blogger) blogger = fallback || allUrls[0] || "";
  if(!mega) mega = fallback || blogger || (allUrls[1] || allUrls[0] || "");
  if(!native) native = (allUrls.find ? allUrls.find(function(x){ return x.indexOf("mega.nz") === -1; }) : allUrls[0]) || "";

  var primary = blogger || mega || native || allUrls[0] || "";
  return {
    blogger: blogger,
    mega: mega,
    native: native,
    primary: primary,
    all: allUrls
  };
}

function applyEmbedPlayer(url, serverName){
  if(serverName === "mega"){
    cur.playerServer = "mega";
  } else {
    cur.playerServer = "blogger";
  }
  if(window._hls){
    try{ window._hls.destroy(); window._hls = null; }catch(e){}
  }
  var v = $("vid");
  if(v){
    v.onerror = null;
    try{ v.pause(); }catch(e){}
    v.removeAttribute("src");
    try{ v.load(); }catch(e){}
    v.classList.add("hidden");
    v.style.display = "none";
  }
  var frame = $("pm-embed-frame");
  if(frame){
    frame.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope");
    frame.setAttribute("allowfullscreen", "true");
    frame.setAttribute("webkitallowfullscreen", "true");
    frame.setAttribute("mozallowfullscreen", "true");
    frame.setAttribute("frameborder", "0");
    frame.classList.remove("hidden");
    frame.style.display = "block";
    if(url && frame.src !== url){
      frame.src = url;
    }
  }
  if($("pm-gesture-stage")) $("pm-gesture-stage").classList.add("hidden");
  if($("pm-subs-overlay")) $("pm-subs-overlay").classList.add("hidden");
  if($("pm-skip-btn")) $("pm-skip-btn").classList.add("hidden");
  if($("pm-speed-select")) $("pm-speed-select").classList.add("hidden");
  if($("pm-quality-select")) $("pm-quality-select").classList.add("hidden");
  if($("pm-subs-wrap")) $("pm-subs-wrap").classList.add("hidden");
  if($("ambient")) $("ambient").classList.add("hidden");
  if($("pm-spinner")) $("pm-spinner").classList.add("hidden");

  var btnBlogger = $("pm-server-embed") || $("pm-server-blogger");
  var btnMega = $("pm-server-mega");
  var btnNative = $("pm-server-native");

  if(cur.playerServer === "mega"){
    if(btnBlogger) btnBlogger.classList.remove("active");
    if(btnMega) btnMega.classList.add("active");
    if(btnNative) btnNative.classList.remove("active");
  } else {
    if(btnBlogger) btnBlogger.classList.add("active");
    if(btnMega) btnMega.classList.remove("active");
    if(btnNative) btnNative.classList.remove("active");
  }
}

function applyNativePlayer(){
  cur.playerServer = "native";
  var frame = $("pm-embed-frame");
  if(frame){
    frame.classList.add("hidden");
    frame.style.display = "none";
    frame.src = "about:blank";
  }
  var v = $("vid");
  if(v){
    v.classList.remove("hidden");
    v.style.display = "block";
  }
  if($("pm-gesture-stage")) $("pm-gesture-stage").classList.remove("hidden");
  if($("pm-subs-overlay")) $("pm-subs-overlay").classList.remove("hidden");
  if($("pm-speed-select")) $("pm-speed-select").classList.remove("hidden");
  if($("ambient")) $("ambient").classList.remove("hidden");

  var btnBlogger = $("pm-server-embed") || $("pm-server-blogger");
  var btnMega = $("pm-server-mega");
  var btnNative = $("pm-server-native");
  if(btnBlogger) btnBlogger.classList.remove("active");
  if(btnMega) btnMega.classList.remove("active");
  if(btnNative) btnNative.classList.add("active");
}

function switchPlayerServer(serverType){
  var item = (window.NET27_DATA && window.NET27_DATA.getItem(cur.slug)) || cur.meta || cur.item;
  var srvMap = cur.episodeServers || extractEpisodeServers(item, cur.ep || 1);
  cur.episodeServers = srvMap;

  if(serverType === "mega"){
    if(srvMap && srvMap.mega){
      applyEmbedPlayer(srvMap.mega, "mega");
      toast("Beralih ke Server 2: Mega");
    } else {
      toast("Server 2 (Mega) tidak tersedia untuk episode ini");
    }
  } else if(serverType === "blogger" || serverType === "embed"){
    var url = (srvMap && srvMap.blogger) ? srvMap.blogger : cur.embedUrl;
    if(url){
      applyEmbedPlayer(url, "blogger");
      toast("Beralih ke Server 1: Blogger/Drive");
    } else {
      toast("Server 1 (Blogger/Drive) tidak tersedia");
    }
  } else if(serverType === "native"){
    applyNativePlayer();
    var nativeUrl = (srvMap && srvMap.native) ? srvMap.native : (cur.res && (cur.res.master || (cur.res.picked && cur.res.picked.url)));
    if(nativeUrl){
      var ref = (cur.res && cur.res.referer) || "";
      playUrl(nativeUrl, ref, cur.activeSub, ref, 0, cur.playToken);
      toast("Beralih ke Server 3: HLS Native");
    } else {
      toast("Stream HLS native tidak tersedia");
    }
  }
}

function fallbackFromNative(reason){
  var item = (window.NET27_DATA && window.NET27_DATA.getItem(cur.slug)) || cur.meta || cur.item;
  if(!item && window.NET27_DATA && window.NET27_DATA.items && cur.title){
    var cleanTitle = (cur.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    item = window.NET27_DATA.items.find(function(it){
      return (it.title || "").toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTitle;
    });
  }
  var srvMap = cur.episodeServers || extractEpisodeServers(item, cur.ep || 1);
  cur.episodeServers = srvMap;

  var targetUrl = "";
  var targetType = "";
  var targetLabel = "";

  if(srvMap && srvMap.blogger){
    targetUrl = srvMap.blogger;
    targetType = "blogger";
    targetLabel = "Server 1 (Blogger/Drive)";
  } else if(srvMap && srvMap.mega){
    targetUrl = srvMap.mega;
    targetType = "mega";
    targetLabel = "Server 2 (Mega)";
  } else if(cur.embedUrl){
    targetUrl = cur.embedUrl;
    targetType = "blogger";
    targetLabel = "Server Alternatif";
  } else {
    var anilistId = (cur.res && cur.res.anilist_id) || (cur.item && cur.item.anilist_id) || (item && item.anilist_id);
    if(anilistId){
      targetUrl = "https://vidlink.pro/anime/" + anilistId + "/" + (cur.ep || 1) + "/" + (cur.mode === "dub" ? "dub" : "sub");
      targetType = "blogger";
      targetLabel = "Server Alternatif (VidLink)";
    }
  }

  if(targetUrl){
    toast("Stream terputus (" + (reason || "gangguan koneksi") + "). Otomatis beralih ke " + targetLabel + "...");
    applyEmbedPlayer(targetUrl, targetType);
    return true;
  }
  return false;
}


// ==== Multi-subtitle dropdown ====

function pickSubtitleUrl(subtitles, preferLang){
  // Pilih URL track subtitle yang cocok. Prioritas:
  //   1) Track dengan label == preferLang (case-insensitive).
  //   2) Track dengan lang code == preferLang (misal "English" → "en").
  //   3) Track AI Indonesian kalau user prefer Indonesian / translate aktif + ada track English.
  //   4) Track dengan default: true.
  //   5) Track English (hindari Arabic alfabetik pertama).
  //   6) Track pertama kalau tidak ada yang match.
  // Return null kalau subtitles kosong (UI akan sembunyikan dropdown).
  if(!subtitles||!subtitles.length)return null;
  if(preferLang){
    var low=String(preferLang).toLowerCase();
    for(var i=0;i<subtitles.length;i++){
      var s=subtitles[i];
      if((s.label||"").toLowerCase()===low)return s.url;
    }
    // Partial match di label (misal "Indonesian" cocok "Indonesian (Bahasa)").
    for(var j=0;j<subtitles.length;j++){
      if(((subtitles[j].label)||"").toLowerCase().indexOf(low)===0)return subtitles[j].url;
    }
    // Match kode bahasa (English → en/id/ja).
    var langMap={"english":"en","indonesian":"id","japanese":"ja","spanish":"es","portuguese":"pt",
                 "french":"fr","german":"de","italian":"it","korean":"ko","chinese":"zh","arabic":"ar",
                 "russian":"ru","thai":"th","vietnamese":"vi","turkish":"tr","hindi":"hi",
                 "czech":"cs","danish":"da","dutch":"nl","finnish":"fi","greek":"el","hungarian":"hu",
                 "norwegian":"no","polish":"pl","romanian":"ro","slovak":"sk","swedish":"sv",
                 "malay":"ms","tagalog":"tl"};
    var code=langMap[low];
    if(code){
      for(var k=0;k<subtitles.length;k++){
        if((subtitles[k].lang||"").toLowerCase()===code)return subtitles[k].url;
      }
    }
    // Kalau prefer Indonesian / translate on dan tidak ada track ID asli:
    // auto-pilih track GTX+, AI Fansub, atau Pure GTX translate dari track English.
    if((low==="indonesian"||low==="id"||low==="indonesian (gtx+)"||low==="indonesian (aigtx)"||low==="indonesian (ai)"||low==="indonesian (gtx)"||cur.translate)){
      var enTrack=null;
      for(var e=0;e<subtitles.length;e++){
        if(isExactEnglishSubTrack(subtitles[e])){
          enTrack=subtitles[e];break;
        }
      }
      if(!enTrack){
        for(var e2=0;e2<subtitles.length;e2++){
          if(isPureEnglishSubTrack(subtitles[e2])){
            enTrack=subtitles[e2];break;
          }
        }
      }
      if(enTrack&&enTrack.url){
        if(low==="indonesian (gtx+)"||low==="indonesian (aigtx)") return "gtx+:"+enTrack.url;
        if(low==="indonesian (ai)") return "ai:"+enTrack.url;
        return "gtx:"+enTrack.url;
      }
    }
  }
  // Prioritaskan exact English jika ada
  for(var nx=0;nx<subtitles.length;nx++){
    if(isExactEnglishSubTrack(subtitles[nx]))return subtitles[nx].url;
  }
  // Prioritaskan varian English jika ada
  for(var n=0;n<subtitles.length;n++){
    if(isPureEnglishSubTrack(subtitles[n]))return subtitles[n].url;
  }
  // Fallback: default:true (selama bukan Arabic)
  for(var m=0;m<subtitles.length;m++){
    var mlab=(subtitles[m].label||"").toLowerCase();
    var mlang=(subtitles[m].lang||"").toLowerCase();
    if(subtitles[m].default && mlang!=="ar" && mlab.indexOf("arab")===-1)return subtitles[m].url;
  }
  // Fallback: track pertama yang bukan Arabic
  for(var p=0;p<subtitles.length;p++){
    var plab=(subtitles[p].label||"").toLowerCase();
    var plang=(subtitles[p].lang||"").toLowerCase();
    if(plang!=="ar"&&plab.indexOf("arab")===-1)return subtitles[p].url;
  }
  return subtitles[0].url;
}

var _NON_EN_SUB_KEYWORDS = [
  "arabic", "arab", "indonesia", "bahasa", "spanish", "espanol", "español",
  "portuguese", "french", "francais", "german", "deutsch", "italian", "korean",
  "chinese", "russian", "thai", "vietnamese", "turkish", "hindi", "czech",
  "danish", "dutch", "finnish", "greek", "hungarian", "norwegian", "polish",
  "romanian", "slovak", "swedish", "malay", "tagalog", "filipino", "japanese"
];

function isPureEnglishSubTrack(s){
  if(!s)return false;
  var lab=((s.label||"")+"").toLowerCase().trim();
  var l=((s.lang||"")+"").toLowerCase().trim();
  for(var k=0;k<_NON_EN_SUB_KEYWORDS.length;k++){
    if(lab.indexOf(_NON_EN_SUB_KEYWORDS[k])!==-1)return false;
  }
  return l==="en"||lab.indexOf("english")===0||lab.indexOf("eng")===0;
}

function isExactEnglishSubTrack(s){
  if(!s)return false;
  var lab=((s.label||"")+"").toLowerCase().trim();
  return isPureEnglishSubTrack(s)&&(lab==="english"||lab==="english [full]"||lab==="eng");
}

function renderSubtitles(subtitles, activeUrl){
  var wrap=$("pm-subs-wrap");
  var sel=$("pm-subs");
  if(!wrap||!sel)return;
  // Dropdown hanya tampil kalau ada minimal 1 track subtitle.
  // Kalau 0 → sembunyikan wrap (UI tetap clean).
  if(!subtitles||!subtitles.length){
    wrap.classList.add("hidden");
    sel.innerHTML="";
    return;
  }
  wrap.classList.remove("hidden");
  sel.innerHTML="";
  // Opsi pertama: "Off" (matikan subtitle).
  var offOpt=document.createElement("option");
  offOpt.value="";
  offOpt.textContent="Off";
  sel.appendChild(offOpt);
  // Tambah opsi "Indonesian (AI)", "Indonesian (GTX+)", dan "Indonesian (Google GTX)" kalau ada track English.
  var exactEnTrack=null;
  var anyEnTrack=null;
  for(var i=0;i<subtitles.length;i++){
    (function(s){
      var o=document.createElement("option");
      o.value=s.url||"";
      o.textContent=s.label||("Subtitle "+(i+1));
      if(s.default)o.textContent+=" (Default)";
      if(activeUrl&&s.url===activeUrl)o.selected=true;
      sel.appendChild(o);
      // deteksi track English untuk AI-translate source
      if(!exactEnTrack && isExactEnglishSubTrack(s)){
        exactEnTrack=s;
      } else if(!anyEnTrack && isPureEnglishSubTrack(s)){
        anyEnTrack=s;
      }
    })(subtitles[i]);
  }
  var englishTrack=exactEnTrack||anyEnTrack;
  if(englishTrack&&englishTrack.url){
    var gtxOpt=document.createElement("option");
    gtxOpt.value="gtx:"+englishTrack.url;
    gtxOpt.textContent="Indonesian (Google GTX)";
    gtxOpt.setAttribute("data-gtx-source",englishTrack.url);
    if(activeUrl&&(activeUrl===gtxOpt.value||(activeUrl.indexOf("gtx:")===0&&activeUrl.slice(4)===englishTrack.url))){
      gtxOpt.selected=true;
    }
    sel.appendChild(gtxOpt);

    var gtxplusOpt=document.createElement("option");
    gtxplusOpt.value="gtx+:"+englishTrack.url;
    gtxplusOpt.textContent="Indonesian (GTX+)";
    gtxplusOpt.setAttribute("data-gtxplus-source",englishTrack.url);
    if(activeUrl&&(activeUrl===gtxplusOpt.value||(activeUrl.indexOf("gtx+:")===0&&activeUrl.slice(5)===englishTrack.url)||(activeUrl.indexOf("aigtx:")===0&&activeUrl.slice(6)===englishTrack.url))){
      gtxplusOpt.selected=true;
    }
    sel.appendChild(gtxplusOpt);

    var aiOpt=document.createElement("option");
    aiOpt.value="ai:"+englishTrack.url;
    aiOpt.textContent="Indonesian (AI Fansub)";
    aiOpt.setAttribute("data-ai-source",englishTrack.url);
    if(activeUrl&&(activeUrl===aiOpt.value||(activeUrl.indexOf("ai:")===0&&activeUrl.slice(3)===englishTrack.url))){
      aiOpt.selected=true;
    }
    sel.appendChild(aiOpt);
  }
  // Set value juga kalau match dari default tidak ketemu (URL di pickSubtitleUrl).
  if(activeUrl){
    sel.value=activeUrl;
  }else{
    sel.value="";  // Off
  }
  // Event listener: ganti track aktif seketika + simpan preferensi.
  sel.onchange=function(){
    var url=sel.value;
    cur.activeSub=url||null;
    // Track GTX+: synthetic URL "gtx+:<url>" (atau legacy "aigtx:<url>").
    if(url&&(url.indexOf("gtx+:")===0||url.indexOf("aigtx:")===0)){
      cur.translate=false;
      switchSubtitleTrack(url,"id");
      cur.subLang="Indonesian (GTX+)";
      (window.ReStram||window.Tatap).setSetting({sub_lang:"Indonesian (GTX+)"}).then(function(){}).catch(function(){});
      return;
    }
    // Track AI Fansub: synthetic URL "ai:<url>". Extract realUrl + panggil translate.
    if(url&&url.indexOf("ai:")===0){
      cur.translate=true;
      setAppStorage("translate","1");
      syncTranslate();
      switchSubtitleTrack(url,"id");
      cur.subLang="Indonesian (AI)";
      (window.ReStram||window.Tatap).setSetting({sub_lang:"Indonesian (AI)"}).then(function(){}).catch(function(){});
      return;
    }
    // Track Google GTX: synthetic URL "gtx:<url>".
    if(url&&url.indexOf("gtx:")===0){
      cur.translate=false;
      switchSubtitleTrack(url,"id");
      cur.subLang="Indonesian (GTX)";
      (window.ReStram||window.Tatap).setSetting({sub_lang:"Indonesian (GTX)"}).then(function(){}).catch(function(){});
      return;
    }
    // Update <track> live tanpa pause/reload video.
    switchSubtitleTrack(url);
    // Cari label untuk disimpan ke settings (server-side preference).
    var label="";
    if(url){
      for(var j=0;j<subtitles.length;j++){
        if(subtitles[j].url===url){label=subtitles[j].label||"";break;}
      }
    }
    if(label){
      cur.subLang=label;
      (window.ReStram||window.Tatap).setSetting({sub_lang:label}).then(function(){}).catch(function(){});
      toast("Subtitle: "+label);
    }else{
      cur.subLang="";
      (window.ReStram||window.Tatap).setSetting({sub_lang:""}).then(function(){}).catch(function(){});
      toast("Subtitle: Off");
    }
  };
}

function vttTime(s){
  var m=/^(?:(\d+):)?([0-5]?\d):([0-5]\d)(?:[.,](\d{1,3}))?$/.exec((s||"").trim());
  if(!m)return -1;
  var ms=m[4]?parseInt((m[4]+"000").slice(0,3),10):0;
  return (m[1]?parseInt(m[1],10)*3600:0)+parseInt(m[2],10)*60+parseInt(m[3],10)+ms/1000;
}
function parseVtt(text){
  var out=[];
  var lines=String(text||"").replace(/\r\n?/g,"\n").split("\n");
  var i=0;
  if(lines[0]&&lines[0].indexOf("WEBVTT")===0)i=1;
  var start=-1,end=-1,buf=[];
  var flush=function(){
    if(start>=0&&end>start&&buf.length){
      var plain=buf.map(function(x){return x.replace(/<[^>]+>/g,"");}).join("\n");
      var html=buf.map(function(x){return esc(x);}).join("<br>");
      html=html.replace(/&lt;[^&]*?&gt;/g,"");
      out.push({start:start,end:end,html:html,plain:plain});
    }
    start=-1;end=-1;buf=[];
  };
  for(;i<lines.length;i++){
    var ln=lines[i].trim();
    if(!ln){flush();continue;}
    if(ln.indexOf("-->")>=0){
      flush();
      var p=ln.split("-->");
      start=vttTime(p[0]);end=vttTime((p[1]||"").trim().split(" ")[0]);
      continue;
    }
    if(/^(NOTE|STYLE|REGION)/.test(ln))continue;
    if(start>=0)buf.push(ln);
  }
  flush();
  return out;
}
function clearOverlay(){
  var box=$("pm-subs-overlay");
  if(!box)return;
  var s=box.querySelector("span");
  if(s){s.innerHTML="";s._last="";}
}
function isVideoFullscreen(){
  var v=$("vid");
  if(!v)return false;
  var fsEl=document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement;
  if(fsEl&&fsEl===v)return true;
  if(v.webkitDisplayingFullscreen)return true;
  return false;
}
function isFullscreenActive(){
  var v=$("vid");
  var fsEl=document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement;
  if(fsEl)return true;
  if(v&&v.webkitDisplayingFullscreen)return true;
  return false;
}
function syncFullscreenSubtitles(){
  var v=$("vid");
  if(!v||!v.textTracks)return;
  var isVidFs=isVideoFullscreen();
  for(var i=0;i<v.textTracks.length;i++){
    var t=v.textTracks[i];
    if(t.label&&(t.label.indexOf("ReStram")>=0 || t.label.indexOf("Tatap")>=0)){
      t.mode=isVidFs?"showing":"hidden";
    }
  }
  paintCue();
}
function syncNativeTextTrack(vttText, cues, langCode){
  var v=$("vid");
  if(!v)return;

  var oldTracks=v.querySelectorAll("track.restram-sub-track, track.tatap-sub-track");
  for(var i=0;i<oldTracks.length;i++){
    var trk=oldTracks[i];
    if(trk.src&&trk.src.indexOf("blob:")===0){
      try{URL.revokeObjectURL(trk.src);}catch(e){}
    }
    if(trk.parentNode)trk.parentNode.removeChild(trk);
  }

  if(v.textTracks){
    for(var j=0;j<v.textTracks.length;j++){
      var tt = v.textTracks[j];
      if(tt.label&&(tt.label.indexOf("ReStram")>=0 || tt.label.indexOf("Tatap")>=0)){
        tt.mode="disabled";
        if(tt.cues){
          for(var ci=tt.cues.length-1;ci>=0;ci--){
            try{tt.removeCue(tt.cues[ci]);}catch(_){}
          }
        }
      }
    }
  }

  if(!vttText&&(!cues||!cues.length))return;

  try{
    var trackEl=document.createElement("track");
    trackEl.className="restram-sub-track tatap-sub-track";
    trackEl.kind="subtitles";
    trackEl.label="ReStram Subtitle";
    trackEl.srclang=langCode||"id";
    trackEl.default=false;

    if(vttText&&window.Blob&&window.URL&&window.URL.createObjectURL){
      var blob=new Blob([vttText],{type:"text/vtt"});
      trackEl.src=URL.createObjectURL(blob);
    }

    var applyMode=function(){
      if(trackEl.track){
        trackEl.track.mode=isVideoFullscreen()?"showing":"hidden";
      }
    };

    trackEl.addEventListener("load",applyMode);
    v.appendChild(trackEl);
    applyMode();

    setTimeout(function(){
      if(trackEl.track&&(!trackEl.track.cues||trackEl.track.cues.length===0)&&cues&&cues.length&&window.VTTCue){
        for(var k=0;k<cues.length;k++){
          var c=cues[k];
          var plain=c.plain||(c.html?c.html.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,""):"");
          try{
            trackEl.track.addCue(new VTTCue(c.start,c.end,plain));
          }catch(e){}
        }
        applyMode();
      }
    },200);
  }catch(err){
    console.warn("syncNativeTextTrack error:",err);
  }
}
function toggleFullscreen(){
  var v=$("vid");
  var stage=document.querySelector(".ambient-stage");
  var fsEl=document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement;
  var isVideoFs=(v&&v.webkitDisplayingFullscreen);

  if(fsEl||isVideoFs){
    if(document.exitFullscreen){
      try{document.exitFullscreen().catch(function(){});}catch(e){}
    }else if(document.webkitExitFullscreen){
      try{document.webkitExitFullscreen();}catch(e){}
    }else if(document.mozCancelFullScreen){
      try{document.mozCancelFullScreen();}catch(e){}
    }else if(document.msExitFullscreen){
      try{document.msExitFullscreen();}catch(e){}
    }
    if(v&&v.webkitExitFullscreen&&v.webkitDisplayingFullscreen){
      try{v.webkitExitFullscreen();}catch(e){}
    }
    return;
  }

  // iOS Safari video native fullscreen
  if(v&&v.webkitEnterFullscreen&&(!stage||!stage.requestFullscreen)){
    try{
      v.webkitEnterFullscreen();
      return;
    }catch(err){
      console.warn("webkitEnterFullscreen error:",err);
    }
  }

  var enterVideoFs=function(){
    if(!v)return;
    if(v.requestFullscreen){
      try{v.requestFullscreen().catch(function(){if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();});}catch(e){if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();}
    }else if(v.webkitRequestFullscreen){
      try{v.webkitRequestFullscreen();}catch(e){if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();}
    }else if(v.mozRequestFullScreen){
      try{v.mozRequestFullScreen();}catch(e){}
    }else if(v.msRequestFullscreen){
      try{v.msRequestFullscreen();}catch(e){}
    }else if(v.webkitEnterFullscreen){
      try{v.webkitEnterFullscreen();}catch(e){}
    }
  };

  if(stage&&(stage.requestFullscreen||stage.webkitRequestFullscreen||stage.mozRequestFullScreen||stage.msRequestFullscreen)){
    var p;
    try{
      if(stage.requestFullscreen){
        p=stage.requestFullscreen();
      }else if(stage.webkitRequestFullscreen){
        p=stage.webkitRequestFullscreen();
      }else if(stage.mozRequestFullScreen){
        p=stage.mozRequestFullScreen();
      }else if(stage.msRequestFullscreen){
        p=stage.msRequestFullscreen();
      }
      if(p&&p.catch){
        p.catch(function(err){
          console.warn("stage.requestFullscreen rejected, falling back to video:",err);
          enterVideoFs();
        });
      }
    }catch(err){
      console.warn("stage fullscreen exception, falling back to video:",err);
      enterVideoFs();
    }
  }else{
    enterVideoFs();
  }
}
function paintCue(){
  var box=$("pm-subs-overlay");
  var v=$("vid");
  if(!box||!v)return;
  var s=box.querySelector("span");
  if(!s)return;
  if($("player-modal").classList.contains("hidden")){s.innerHTML="";return;}
  var t=v.currentTime||0;
  if(isVideoFullscreen()){
    if(s._last!==""){s.innerHTML="";s._last="";}
    box.style.display="none";
  }else{
    box.style.display="";
    var html="";
    for(var i=0;i<cur.cues.length;i++){
      if(t>=cur.cues[i].start&&t<=cur.cues[i].end){html=cur.cues[i].html;break;}
    }
    if(s._last!==html){s.innerHTML=html;s._last=html;}
  }
  checkSkipTimes(t);
}

function checkSkipTimes(currentTime){
  var btn=$("pm-skip-btn");
  var label=$("pm-skip-label");
  if(!btn||!cur.res){return;}
  var intro=cur.intro||(cur.res&&cur.res.intro)||{start:0,end:0};
  var outro=cur.outro||(cur.res&&cur.res.outro)||{start:0,end:0};

  var inIntro=(intro.end>intro.start&&(intro.end-intro.start)>=10&&currentTime>=intro.start&&currentTime<intro.end);
  var inOutro=(outro.end>outro.start&&(outro.end-outro.start)>=10&&currentTime>=outro.start&&currentTime<outro.end);

  if(inIntro){
    cur.activeSkipTarget=intro.end+0.5;
    if(label)label.textContent="Lewati Opening (S)";
    btn.classList.remove("hidden");
  }else if(inOutro){
    cur.activeSkipTarget=outro.end+0.5;
    if(label)label.textContent="Lewati Ending (S)";
    btn.classList.remove("hidden");
  }else{
    cur.activeSkipTarget=0;
    btn.classList.add("hidden");
  }
}

function doSkip(){
  if(cur.activeSkipTarget&&cur.activeSkipTarget>0){
    var v=$("vid");
    if(v){
      v.currentTime=cur.activeSkipTarget;
      var btn=$("pm-skip-btn");
      if(btn)btn.classList.add("hidden");
      toast("⏩ Melompat ke "+formatTime(v.currentTime),1500);
      cur.activeSkipTarget=0;
      return true;
    }
  }
  return false;
}

function formatTime(sec){
  var s=Math.floor(sec||0);
  var m=Math.floor(s/60);
  s=s%60;
  return (m<10?"0"+m:m)+":"+(s<10?"0"+s:s);
}
function prefetchSubtitleTrack(url, ref, langCode){
  if(!url)return null;
  var targetUrl = url;
  var targetLang = langCode || "";
  var mode = "";
  if(targetUrl.indexOf("gtx+:")===0){
    targetUrl = targetUrl.slice(5);
    if(!targetLang) targetLang = "id";
    mode = "gtx+";
  }else if(targetUrl.indexOf("aigtx:")===0){
    targetUrl = targetUrl.slice(6);
    if(!targetLang) targetLang = "id";
    mode = "gtx+";
  }else if(targetUrl.indexOf("ai:")===0){
    targetUrl = targetUrl.slice(3);
    if(!targetLang) targetLang = "id";
    mode = "ai";
  }else if(targetUrl.indexOf("gtx:")===0){
    targetUrl = targetUrl.slice(4);
    if(!targetLang) targetLang = "id";
    mode = "gtx";
  }
  var qs = "url=" + encodeURIComponent(targetUrl) + "&referer=" + encodeURIComponent(ref || "");
  if(targetLang) qs += "&lang=" + encodeURIComponent(targetLang);
  if(mode) qs += "&mode=" + encodeURIComponent(mode);
  var prox = "/api/player/sub?" + qs;

  // Cek apakah promise untuk URL yang sama sudah berjalan
  if(cur._subPrefetch && cur._subPrefetch.prox === prox){
    return cur._subPrefetch.promise;
  }

  var p = fetch(prox).then(function(r){
    if(!r.ok)throw new Error("HTTP "+r.status);
    var tier=r.headers.get("X-Translate-Tier")||"";
    var trErr=r.headers.get("X-Translate-Error")||"";
    var trModel=r.headers.get("X-Translate-Model")||"";
    var trMixed=r.headers.get("X-Translate-Mixed")||"";
    var trBg=r.headers.get("X-Translate-Background")||"";
    return r.text().then(function(t){
      return {text:t, tier:tier, error:trErr, model:trModel, mixed:trMixed, bg:trBg};
    });
  });

  cur._subPrefetch = {prox: prox, promise: p};
  return p;
}

function switchSubtitleTrack(url, langCode){
  // Render subtitle milik app (overlay div), bukan <track> native.
  // Style tidak lagi mengikuti setting caption Windows.
  // langCode opsional ("id", "ja", dst.) — backend akan translate kalau beda.
  var v=$("vid");
  if(!v)return;
  var token = cur.playToken;
  // Bersihkan track lama lalu kosongkan overlay.
  syncNativeTextTrack("", [], "");
  cur.cues=[];
  clearOverlay();
  if(cur._subUpgradeTimer){
    clearTimeout(cur._subUpgradeTimer);
    cur._subUpgradeTimer = null;
  }
  if(!url)return;
  var originalUrl = url;
  var trackMode = "none";
  if(url.indexOf("gtx+:")===0){
    url=url.slice(5);
    if(!langCode) langCode="id";
    trackMode = "gtx+";
  }else if(url.indexOf("aigtx:")===0){
    url=url.slice(6);
    if(!langCode) langCode="id";
    trackMode = "gtx+";
  }else if(url.indexOf("ai:")===0){
    url=url.slice(3);
    if(!langCode) langCode="id";
    trackMode = "ai";
  }else if(url.indexOf("gtx:")===0){
    url=url.slice(4);
    if(!langCode) langCode="id";
    trackMode = "gtx";
  }
  if(langCode==="id"){
    var waitMsg = "Menerjemahkan subtitle AI ke bahasa Indonesia...";
    if(trackMode==="gtx+"||trackMode==="aigtx") waitMsg = "Menerjemahkan subtitle GTX+ (Smart Fansub & Scene Detection)...";
    else if(trackMode==="gtx") waitMsg = "Menerjemahkan subtitle Google GTX...";
    toast(waitMsg, 3000);
    var obox=$("pm-subs-overlay");
    if(obox){
      var osp=obox.querySelector("span");
      if(osp){
        osp.textContent="[" + waitMsg + "]";
        osp._last=osp.textContent;
      }
    }
  }
  var ref=cur.res&&cur.res.referer||"";
  var subPromise = prefetchSubtitleTrack(originalUrl, ref, langCode);
  subPromise.then(function(res){
    if(cur.playToken !== token) return;
    clearOverlay();
    cur.cues=parseVtt(res.text);
    paintCue();
    syncNativeTextTrack(res.text, cur.cues, langCode);
    if(langCode==="id"){
      if(res.tier==="source"||res.tier==="source-fallback"){
        var msg="Gagal translate";
        if(res.error) msg+=": "+res.error;
        else msg+=" (menampilkan subtitle asli)";
        toast(msg, 6000);
      }else{
        var tierLabel = "AI Fansub" + (res.model ? " · "+res.model : "");
        if(res.tier === "gtx+" || res.tier === "cached-gtx+" || res.tier === "aigtx" || res.tier === "cached-aigtx"){
          tierLabel = (res.tier === "cached-gtx+" || res.tier === "cached-aigtx") ? "GTX+, tersimpan" : "GTX+ Translate";
        }else if(res.tier === "tier2"){
          tierLabel = trackMode === "gtx" ? "Google GTX" : "GTX+ (Instan)";
        }else if(res.tier === "cached-mt" || res.tier === "cached-gtx"){
          tierLabel = trackMode === "gtx" ? "Google GTX, tersimpan" : "GTX+, tersimpan";
        }else if(res.tier === "tier3"){
          tierLabel = "MyMemory — kaku";
        }else if(res.tier === "cached"){
          tierLabel = "AI Fansub, tersimpan";
        }
        var extra = "";
        if(res.mixed) extra = " · "+res.mixed+" baris via GTX";
        toast("Subtitle Indonesia siap ("+tierLabel+")! ("+cur.cues.length+" baris"+extra+")", 4000);

        // Jika mode AI Fansub dan disajikan instan via GTX+ / MT, upgrade di background saat AI selesai:
        if(trackMode === "ai" && (res.bg === "llm-translating" || res.tier === "tier2" || res.tier === "gtx+" || res.tier === "cached-gtx+" || res.tier === "aigtx" || res.tier === "cached-aigtx" || res.tier === "cached-mt")){
          var checkUpgrade = function(attempt){
            if(cur.playToken !== token) return;
            if(attempt > 20) return; // Maksimal ~5 menit
            cur._subUpgradeTimer = setTimeout(function(){
              if(cur.playToken !== token) return;
              var qs = "url=" + encodeURIComponent(url) + "&referer=" + encodeURIComponent(ref || "") + "&lang=id";
              fetch("/api/player/sub?" + qs).then(function(ur){
                if(cur.playToken !== token) return;
                var uTier = ur.headers.get("X-Translate-Tier") || "";
                var uModel = ur.headers.get("X-Translate-Model") || "";
                if(uTier === "cached" || uTier === "tier1"){
                  ur.text().then(function(uText){
                    if(cur.playToken !== token) return;
                    cur.cues = parseVtt(uText);
                    paintCue();
                    syncNativeTextTrack(uText, cur.cues, "id");
                    var lbl = "AI Fansub" + (uModel ? " · " + uModel : "");
                    toast("✨ Subtitle berhasil di-upgrade ke " + lbl + "!", 5000);
                  });
                }else{
                  checkUpgrade(attempt + 1);
                }
              }).catch(function(){});
            }, 15000);
          };
          checkUpgrade(1);
        }
      }
    }
  }).catch(function(err){
    if(cur.playToken !== token) return;
    cur.cues=[];
    clearOverlay();
    syncNativeTextTrack("", [], "");
    if(langCode==="id"){
      toast("Gagal menerjemahkan subtitle: "+(err&&err.message||err));
    }
  });
}

var TouchGestures = {
  startX: 0,
  startY: 0,
  lastTap: 0,
  lastTapX: 0,
  mode: null,       // 'volume' | 'brightness' | 'seek' | null
  initVol: 1,
  initBright: 100,
  initTime: 0,
  currentBright: 100,
  osdTimer: null,
  armed: false,

  showOSD: function(icon, pct, text){
    var el = $("pm-gesture-osd");
    if(!el) return;
    var iconEl = $("pm-osd-icon");
    if(icon && (icon.indexOf("<svg") >= 0 || icon.indexOf("<") >= 0)){
      iconEl.innerHTML = icon;
    } else {
      iconEl.textContent = icon;
    }
    $("pm-osd-bar").style.width = Math.max(0, Math.min(100, pct)) + "%";
    $("pm-osd-val").textContent = text != null ? text : Math.round(pct) + "%";
    el.classList.remove("hidden");
    clearTimeout(this.osdTimer);
    this.osdTimer = setTimeout(function(){ el.classList.add("hidden"); }, 1200);
  },

  triggerRipple: function(side, text){
    var rip = $(side === "left" ? "pm-ripple-left" : "pm-ripple-right");
    if(!rip) return;
    if(text) {
      var t = rip.querySelector(".ripple-text");
      if(t) t.textContent = text;
    }
    rip.classList.remove("active");
    void rip.offsetWidth; // force reflow
    rip.classList.add("active");
    setTimeout(function(){ rip.classList.remove("active"); }, 400);
    // Haptic feedback via native bridge or Web Vibration API
    var nbNative = window.ReStramNative || window.TatapNative;
    if(nbNative && nbNative.vibrate){
      nbNative.vibrate(25);
    } else if(navigator.vibrate){
      try{ navigator.vibrate(25); }catch(e){}
    }
  },

  bind: function(){
    if(this.armed) return;
    this.armed = true;
    var stage = document.querySelector(".ambient-stage");
    var v = $("vid");
    if(!stage || !v) return;

    var self = this;

    stage.addEventListener("touchstart", function(e){
      if(e.touches.length !== 1) return;
      var touch = e.touches[0];
      var rect = stage.getBoundingClientRect();
      self.startX = touch.clientX;
      self.startY = touch.clientY;
      self.mode = null;
      self.initVol = v.volume;
      self.initBright = self.currentBright;
      self.initTime = v.currentTime;
    }, {passive: true});

    stage.addEventListener("touchmove", function(e){
      if(e.touches.length !== 1) return;
      var touch = e.touches[0];
      var rect = stage.getBoundingClientRect();
      var dx = touch.clientX - self.startX;
      var dy = touch.clientY - self.startY;
      var relX = (self.startX - rect.left) / rect.width;

      if(!self.mode){
        if(Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy)){
          self.mode = "seek";
        } else if(Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)){
          self.mode = (relX < 0.5) ? "brightness" : "volume";
        }
      }

      if(self.mode === "seek"){
        var dur = v.duration || 1400;
        var scrub = (dx / rect.width) * 90; // geser penuh layar = +/- 90 detik
        var target = Math.max(0, Math.min(dur, self.initTime + scrub));
        var diff = Math.round(target - self.initTime);
        var sign = diff >= 0 ? "+" : "";
        var min = Math.floor(target / 60);
        var sec = Math.floor(target % 60);
        var timeStr = min + ":" + (sec < 10 ? "0" : "") + sec;
        self.showOSD('<svg class="ui-icon"><use href="#icon-forward"/></svg>', (target / dur) * 100, timeStr + " (" + sign + diff + "s)");
        self._targetSeek = target;
      } else if(self.mode === "volume"){
        var deltaV = (-dy / rect.height) * 1.5;
        var nv = Math.max(0, Math.min(1, self.initVol + deltaV));
        v.volume = nv;
        v.muted = (nv === 0);
        var ic = nv === 0 ? '<svg class="ui-icon"><use href="#icon-volume-mute"/></svg>' : (nv < 0.5 ? '<svg class="ui-icon"><use href="#icon-volume-mid"/></svg>' : '<svg class="ui-icon"><use href="#icon-volume-high"/></svg>');
        self.showOSD(ic, nv * 100);
      } else if(self.mode === "brightness"){
        var deltaB = (-dy / rect.height) * 120;
        var nb = Math.max(20, Math.min(150, self.initBright + deltaB));
        self.currentBright = nb;
        v.style.filter = "brightness(" + (nb / 100) + ")";
        var nbNative = window.ReStramNative || window.TatapNative;
        if(nbNative && nbNative.setBrightness){
          nbNative.setBrightness(nb / 100);
        }
        self.showOSD('<svg class="ui-icon"><use href="#icon-sun"/></svg>', (nb / 150) * 100, Math.round(nb) + "%");
      }
    }, {passive: true});

    stage.addEventListener("touchend", function(e){
      if(self.mode === "seek" && self._targetSeek != null){
        v.currentTime = self._targetSeek;
        self._targetSeek = null;
        self.mode = null;
        return;
      }
      if(self.mode){
        self.mode = null;
        return;
      }

      // Deteksi tap & double-tap
      var now = Date.now();
      var rect = stage.getBoundingClientRect();
      var relX = (self.startX - rect.left) / rect.width;

      if(now - self.lastTap < 320 && Math.abs(self.startX - self.lastTapX) < 80){
        // Double Tap
        self.lastTap = 0; // reset
        if(relX < 0.35){
          v.currentTime = Math.max(0, v.currentTime - 10);
          self.triggerRipple("left", "-10s");
        } else if(relX > 0.65){
          v.currentTime = Math.min(v.duration || 99999, v.currentTime + 10);
          self.triggerRipple("right", "+10s");
        } else {
          if(v.paused) v.play(); else v.pause();
        }
      } else {
        self.lastTap = now;
        self.lastTapX = self.startX;
      }
    }, {passive: true});
  }
};

function armAutohide(){
  var stage=document.querySelector(".ambient-stage");
  var shell=document.querySelector(".player-shell");
  TouchGestures.bind();
  if(!stage||stage._armed)return;
  stage._armed=true;
  var v=$("vid");
  var t=null;
  var show=function(){
    stage.classList.remove("idle");
    if(shell)shell.classList.remove("idle");
    clearTimeout(t);
    t=setTimeout(function(){
      if(v.paused)return;
      v.removeAttribute("controls");
      stage.classList.add("idle");
      if(shell)shell.classList.add("idle");
    },2800);
  };
  var wake=function(){
    if(!v.hasAttribute("controls"))v.setAttribute("controls","");
    show();
  };
  ["mousemove","touchstart","click"].forEach(function(ev){stage.addEventListener(ev,wake,{passive:true});});
  v.addEventListener("play",show);
  v.addEventListener("pause",function(){clearTimeout(t);v.setAttribute("controls","");stage.classList.remove("idle");if(shell)shell.classList.remove("idle");});
  v.addEventListener("seeking",show);
  show();
}
function playUrl(url,referrer,sub,subRef,resumeTime,token){
  var pm = $("player-modal");
  var v=$("vid");
  if(!pm || pm.classList.contains("hidden") || (token && cur.playToken !== token)){
    if(window._hls){try{window._hls.destroy();window._hls=null;}catch(e){}}
    if(v){try{v.pause();v.removeAttribute("src");v.load();}catch(e){}}
    return;
  }
  if(v){
    v.muted=false;
    if(v.volume===0) v.volume=1.0;
  }
  var b = (typeof apiBase === "function") ? apiBase() : "";
  var prox = (url.indexOf("/api/player/video") === 0) ? url : ((b || "") + "/api/player/video?url=" + encodeURIComponent(url) + "&referer=" + encodeURIComponent(referrer || ""));
  try{
    var m=/^(.*\/)index-(f\d+-v\d+-a\d+)\.m3u8/.exec(url);
    if(m){
      for(var wi=1;wi<=2;wi++){
        (function(n){
          var seg=m[1]+"seg-"+n+"-"+m[2]+".jpg";
          fetch((b||"")+"/api/player/video?url="+encodeURIComponent(seg)+"&referer="+encodeURIComponent(referrer||""),{mode:"no-cors"}).catch(function(){});
        })(wi);
      }
    }
  }catch(e){}
  // Bersihkan <track> lama lalu pasang track subtitle aktif (live switch).
  // Fungsi switchSubtitleTrack() menhandle Off (hapus semua) dan replace.
  switchSubtitleTrack(sub || null);
  $("pm-spinner").classList.remove("hidden");
  $("pm-status").textContent="buffering...";
  var onCan=function(){
    $("pm-spinner").classList.add("hidden");
    if(resumeTime && resumeTime > 0){
      try{v.currentTime = resumeTime;}catch(e){}
    }
  };
  v.addEventListener("canplay",onCan,{once:true});
  var cleanPath = (url || "").split("?")[0].toLowerCase();
  var isSeg = cleanPath.endsWith(".ts") || cleanPath.endsWith(".ts.jpg") || cleanPath.endsWith(".mp4") || cleanPath.endsWith(".aac");
  var isHls = !isSeg && ((url.indexOf(".m3u8") >= 0) || (url.indexOf("format=m3u8") >= 0) || (url.indexOf("/api/hls") >= 0) || (url.indexOf("/hls/playlist") >= 0));
  if(window.Hls&&window.Hls.isSupported()&&isHls){
    if(window._hls){try{window._hls.destroy();}catch(e){}}
    var h=new Hls({
      maxBufferLength:30,
      maxMaxBufferLength:60,
      maxBufferSize:40*1000*1000,
      startLevel:-1,
      capLevelToPlayerSize:true,
      fragLoadingMaxRetry:6,
      manifestLoadingMaxRetry:4,
      levelLoadingMaxRetry:4,
      fragLoadingMaxRetryTimeout:12000,
      backBufferLength:30,
      liveSyncDurationCount:2,
      maxFragLookUpTolerance:0.5,
      nudgeOffset:0.1,
      nudgeMaxRetry:5,
      maxStarvationDelay:4,
      highBufferWatchdogPeriod:2,
      testBandwidth:false,
      progressive:true,
      lowLatencyMode:false,
      defaultAudioCodec:"mp4a.40.2",
      enableWorker:true
    });
    window._hls=h;
    h._networkRetryCount = 0;
    h._mediaRetryCount = 0;
    h._stallCount = 0;
    h._fragErrorCount = 0;
    h.on(Hls.Events.FRAG_LOADED, function(){
      h._networkRetryCount = 0;
      h._mediaRetryCount = 0;
      h._stallCount = 0;
      h._fragErrorCount = 0;
    });
    h.on(Hls.Events.AUDIO_TRACKS_UPDATED,function(ev,data){
      if(data&&data.audioTracks&&data.audioTracks.length){
        var isDub = (cur.mode === "dub");
        var selectedIdx = -1;
        if(isDub){
          for(var ai=0;ai<data.audioTracks.length;ai++){
            var t = data.audioTracks[ai];
            var lang = (t.lang || "").toLowerCase();
            var name = (t.name || "").toLowerCase();
            if(lang === "en" || name.indexOf("english") >= 0 || name.indexOf("dub") >= 0){
              selectedIdx = ai;
              break;
            }
          }
        } else {
          for(var ai=0;ai<data.audioTracks.length;ai++){
            var t = data.audioTracks[ai];
            var lang = (t.lang || "").toLowerCase();
            var name = (t.name || "").toLowerCase();
            if(lang === "ja" || lang === "jpn" || name.indexOf("japan") >= 0 || t.default){
              selectedIdx = ai;
              break;
            }
          }
        }
        if(selectedIdx !== -1){
          h.audioTrack = selectedIdx;
        } else if(h.audioTrack === -1 || h.audioTrack === undefined){
          h.audioTrack = 0;
        }
      }
    });
    h.on(Hls.Events.FRAG_BUFFERED,function(){
      try{
        var nxt=null;
        if(h.levels&&h.levelDetails&&h.levelDetails.fragments){
          var fr=h.levelDetails.fragments;
          for(var fi=0;fi<fr.length;fi++){if(!fr[fi].loaded){nxt=fr[fi];break;}}
        }
        if(nxt&&nxt.url){
          var fetchTarget = nxt.url;
          if(!fetchTarget.startsWith("/api/player/video") && !fetchTarget.startsWith("/api/")){
            fetchTarget = (b||"") + "/api/player/video?url="+encodeURIComponent(nxt.url)+"&referer="+encodeURIComponent(referrer||"");
            fetch(fetchTarget,{mode:"no-cors",priority:"low"}).catch(function(){});
          }
        }
      }catch(e){}
    });
    h.on(Hls.Events.MANIFEST_PARSED,function(ev,data){
      if(data&&data.levels&&data.levels.length>1){
        var hlsVars=[];
        for(var li=0;li<data.levels.length;li++){
          var lvl=data.levels[li];
          var lHeight = lvl.height || 0;
          var lLabel = lHeight ? (lHeight + "p") : ("Level " + (li+1));
          hlsVars.push({q: lLabel, levelIdx: li, height: lHeight, url: lvl.url || (lvl.details && lvl.details.url) || ""});
        }
        // Urutkan dari tertinggi ke terendah
        hlsVars.sort(function(a,b){return b.height - a.height;});
        // Tambahkan opsi Auto di awal
        hlsVars.unshift({q: "Auto", levelIdx: -1, height: 99999, url: ""});
        cur.res = cur.res || {};
        cur.res.hlsLevels = hlsVars;
        renderVariants();
        // Terapkan kualitas yang cocok jika user memilih kualitas tertentu
        if(cur.quality && cur.quality.toLowerCase() !== "auto" && cur.quality.toLowerCase() !== "best"){
          var targetQ = cur.quality.toLowerCase();
          for(var qk=0; qk<hlsVars.length; qk++){
            if(hlsVars[qk].q.toLowerCase().indexOf(targetQ) >= 0 || targetQ.indexOf(hlsVars[qk].q.toLowerCase()) >= 0){
              if(hlsVars[qk].levelIdx !== -1){
                h.currentLevel = hlsVars[qk].levelIdx;
                break;
              }
            }
          }
        }
      }
    });
    h.on(Hls.Events.LEVEL_SWITCHED,function(ev,data){
      if(cur.res && cur.res.hlsLevels){
        var curIdx = h.currentLevel;
        var autoMode = (h.autoLevelEnabled || curIdx === -1);
        var activeLabel = "AUTO";
        if(!autoMode){
          for(var hi=0;hi<cur.res.hlsLevels.length;hi++){
            if(cur.res.hlsLevels[hi].levelIdx === curIdx){
              activeLabel = cur.res.hlsLevels[hi].q.toUpperCase();
              break;
            }
          }
        }
        var sel=$("pm-quality-select");
        if(sel && !sel.classList.contains("user-interacting")){
          sel.value = autoMode ? "Auto" : activeLabel.toLowerCase();
        }
      }
    });
    h.loadSource(prox);
    h.attachMedia(v);
    h.on(Hls.Events.ERROR,function(ev,d){
      if(!d)return;
      if(d.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR || d.details === "bufferStalledError"){
        h._stallCount = (h._stallCount || 0) + 1;
        if(h._stallCount > 3){
          if(fallbackFromNative("buffer stream macet")) return;
        }
        try{
          if(!v.paused && v.readyState >= 2){
            v.currentTime += 0.08;
          }
          h.startLoad();
        }catch(_){}
        return;
      }
      if(d.fatal){
        if(d.type===Hls.ErrorTypes.NETWORK_ERROR){
          h._networkRetryCount = (h._networkRetryCount || 0) + 1;
          if(h._networkRetryCount <= 2){
            $("pm-status").textContent="mencoba memulihkan koneksi stream ("+h._networkRetryCount+"/2)...";
            setTimeout(function(){ try{h.startLoad();}catch(_){} }, 600);
            return;
          }
          if(fallbackFromNative("koneksi HLS terputus")) return;
        }else if(d.type===Hls.ErrorTypes.MEDIA_ERROR){
          h._mediaRetryCount = (h._mediaRetryCount || 0) + 1;
          if(h._mediaRetryCount <= 1){
            $("pm-status").textContent="mencoba memulihkan codec media...";
            setTimeout(function(){ try{h.recoverMediaError();}catch(_){} }, 500);
            return;
          }
          if(fallbackFromNative("kesalahan dekode media")) return;
        }else{
          if(fallbackFromNative(d.details || "error pemutaran")) return;
        }
        $("pm-status").textContent="player error: "+(d.type||"fatal")+" — "+(d.details||"");
        try{h.destroy();}catch(_){}
        return;
      }
      // Non-fatal: fragLoadError / manifestLoadError / networkError
      if(d.details==="fragLoadError"||d.details==="manifestLoadError"||d.details==="networkError"){
        h._fragErrorCount = (h._fragErrorCount || 0) + 1;
        if(h._fragErrorCount >= 4){
          if(fallbackFromNative("gagal memuat fragmen")) return;
        }
        $("pm-status").textContent="gagal load: "+(d.details||"network");
      }
    });
  }else{
    v.src=isHls?prox:url;
  }
  if(pm.classList.contains("hidden") || (token && cur.playToken !== token)){
    if(window._hls){try{window._hls.destroy();window._hls=null;}catch(e){}}
    if(v){try{v.pause();v.removeAttribute("src");v.load();}catch(e){}}
    return;
  }
  v.onerror = function(){
    if(cur.playerServer === "native" || !cur.playerServer){
      fallbackFromNative("video error");
    }
  };
  v.play().catch(function(err){
    $("pm-spinner").classList.add("hidden");
    if(err && err.name === "NotAllowedError"){
      v.muted = true;
      v.play().catch(function(){});
    }
  });
  armAutohide();
}
function switchQ(q){
  var qLow = String(q||"").toLowerCase();
  // 1. Jika HLS.js aktif dan memiliki live levels, ganti level secara instan tanpa reload!
  if(window._hls && cur.res && cur.res.hlsLevels && cur.res.hlsLevels.length){
    for(var hi=0;hi<cur.res.hlsLevels.length;hi++){
      var hl = cur.res.hlsLevels[hi];
      if(hl.q.toLowerCase() === qLow){
        if(hl.levelIdx === -1){
          window._hls.currentLevel = -1; // Auto adaptive mode
          toast("Resolusi: AUTO (Adaptif)");
        } else {
          window._hls.currentLevel = hl.levelIdx;
          toast("Resolusi: " + hl.q.toUpperCase());
        }
        if(cur.res.picked) cur.res.picked.q = hl.q;
        renderVariants();
        return;
      }
    }
  }

  // 2. Fallback: reload varian URL jika bukan live multi-level HLS.js
  if(!cur.res||!cur.res.variants)return;
  var curTime = ($("vid") && $("vid").currentTime) || 0;
  for(var i=0;i<cur.res.variants.length;i++){
    if(cur.res.variants[i].q.toLowerCase()===qLow){
      cur.res.picked=cur.res.variants[i];
      renderVariants();
      playUrl(cur.res.variants[i].url,cur.res.referer,cur.activeSub||cur.res.sub,cur.res.referer,curTime);
      toast("Resolusi: "+cur.res.variants[i].q.toUpperCase());
      return;
    }
  }
}

function updatePrevNext(){
  var idx=-1;
  for(var i=0;i<cur.eps.length;i++)if(cur.eps[i].ep===cur.ep)idx=i;
  $("pm-prev").disabled=idx<=0;
  $("pm-next").disabled=idx<0||idx>=cur.eps.length-1;
}
function stepEp(d){
  if($("player-modal").classList.contains("hidden"))return;
  var idx=-1;
  for(var i=0;i<cur.eps.length;i++)if(cur.eps[i].ep===cur.ep)idx=i;
  var nxt=cur.eps[idx+d];
  if(nxt){
    cur.ep=nxt.ep;
    updatePrevNext();
    openPlayer(nxt.ep);
  }
  else toast(d>0?"Sudah episode terakhir":"Sudah episode pertama");
}
function closePlayer(){
  // 1. Invalidate all pending async playback tokens immediately
  cur.playToken = ++_playTokenCounter;
  cur.playerServer = null;

  // 2. Safely stop and destroy video & HLS stream
  var v=$("vid");
  try{recordWatchProgress(true);}catch(e){}
  if(v){
    v.onerror = null;
    try{v.pause();}catch(e){}
    v.removeAttribute("src");
    try{v.load();}catch(e){}
    v.classList.remove("hidden");
    v.style.display = "";
  }
  var frame = $("pm-embed-frame");
  if(frame){
    frame.src = "about:blank";
    frame.classList.add("hidden");
    frame.style.display = "none";
  }
  if(window._hls){try{window._hls.destroy();window._hls=null;}catch(e){}}
  cur.cues=[];
  clearOverlay();
  syncNativeTextTrack("", [], "");

  // 3. Hide modal & spinner
  $("player-modal").classList.add("hidden");
  $("pm-spinner").classList.add("hidden");

  // 4. Exit fullscreen safely if active
  if(document.fullscreenElement || document.webkitFullscreenElement){
    try{
      if(document.exitFullscreen) document.exitFullscreen();
      else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    }catch(e){}
  }

  // 5. Perilaku post-watch: kembalikan user ke list episode anime dengan marker last watch yang aktif
  var savedSlug = cur.slug;
  if(savedSlug){
    var tm = $("title-modal");
    if(cur.eps && cur.eps.length > 0){
      if(tm) tm.classList.remove("hidden");
      renderEpRanges();
      renderEpGrid();
    } else {
      openTitle(savedSlug, cur.title, cur.poster, cur.type, cur.eps_counter);
    }
  }
}
function playMPV(){
  (window.ReStram||window.Tatap).playMPV({slug:cur.slug,title:cur.title,ep:cur.ep||1,mode:cur.mode,quality:cur.quality}).then(function(r){
    toast(r.success?("MPV: "+r.data.picked.q):("ERROR: "+r.error));
  });
}
function renderContinue(){
  (window.ReStram||window.Tatap).history().then(function(r){
    var h=(r.data||[]).slice(0,12);
    var sec=$("continue-sec");
    if(!sec) return;
    if(!h.length){sec.classList.add("hidden");return;}
    var inHome = !window.Tui || Tui.view() === "home" || Tui.view() === "beranda" || Tui.view() === "cari";
    sec.classList.toggle("hidden",!inHome);
    var box=$("continue-row");
    if(!box) return;
    box.innerHTML="";
    for(var i=0;i<h.length;i++){
      (function(x){
        var card = document.createElement("div");
        card.className = "rail-card continue-card";
        card.tabIndex = 0;
        var p = x.progress || 0;
        var dur = x.duration || 0;
        var pct = dur > 0 ? Math.min(100, Math.max(5, Math.round((p / dur) * 100))) : (p > 0 ? 50 : 0);
        var pStr = p >= 15 ? formatTimeSec(p) : "";
        var posterUrl = x.poster || "";
        card.innerHTML = 
          '<div class="rail-card-poster-wrap">' +
            (posterUrl ? '<img class="rail-card-img" src="' + esc(posterUrl) + '" alt="' + esc(x.title) + '" loading="lazy">' : '<div class="rail-card-img no-img" style="background:#151922;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:24px;">▶</div>') +
            (pct > 0 ? '<div class="card-progress-bar"><div class="card-progress-fill" style="width:' + pct + '%"></div></div>' : '') +
            '<div class="rail-card-overlay"><div class="card-play-btn"><svg class="ui-icon"><use href="#icon-play"/></svg></div></div>' +
            '<span class="card-badge-status">EP ' + (x.episode || 1) + '</span>' +
          '</div>' +
          '<div class="rail-card-info">' +
            '<h3 class="rail-card-title">' + esc(x.title) + '</h3>' +
            '<div class="rail-card-meta">Ep ' + (x.episode || 1) + (pStr ? (' · ' + pStr) : '') + ' · ' + (x.mode || 'sub').toUpperCase() + '</div>' +
          '</div>';
        card.addEventListener("click",function(){
          cur.slug=x.slug;cur.title=x.title;cur.mode=x.mode||"sub";syncSeg();
          openTitle(x.slug,x.title,x.poster);
          openPlayer(x.episode);
        });
        box.appendChild(card);
      })(h[i]);
    }
  }).catch(function(){});
}
function setFallback(r,g,b){
  var fb=$("ambient-fallback");
  if(!fb)return;
  fb.style.background="radial-gradient(60% 90% at 50% 50%, rgb("+r+","+g+","+b+"), transparent 70%)";
}
function startAmbient(){
  var cv=$("ambient"),ctx=null;
  try{ctx=cv.getContext("2d",{willReadFrequently:true});}catch(e){ctx=cv.getContext("2d");}
  var v=$("vid");
  v.setAttribute("crossorigin","anonymous");
  var tmp=document.createElement("canvas");
  tmp.width=48;tmp.height=27;
  var tctx=null;
  try{tctx=tmp.getContext("2d",{willReadFrequently:true});}catch(e){tctx=tmp.getContext("2d");}
  setInterval(function(){
    if(document.body.classList.contains("no-ambient"))return;
    if($("player-modal").classList.contains("hidden"))return;
    if(v.paused||v.ended||v.readyState<2||v.videoWidth===0)return;
    try{
      tctx.drawImage(v,0,0,48,27);
      var px;
      try{px=tctx.getImageData(0,0,48,27).data;}
      catch(taint){
        var h=0,s=String(cur.slug)+cur.ep;
        for(var k=0;k<s.length;k++)h=(h*31+s.charCodeAt(k))%360;
        setFallback(Math.round(90+80*Math.abs(Math.sin(h))),120,220);
        return;
      }
      var r=0,g=0,b=0,n=0;
      for(var i=0;i<px.length;i+=12){r+=px[i];g+=px[i+1];b+=px[i+2];n++;}
      r=Math.round(r/n);g=Math.round(g/n);b=Math.round(b/n);
      var g2=ctx.createLinearGradient(0,0,96,54);
      g2.addColorStop(0,"rgb("+r+","+g+","+b+")");
      g2.addColorStop(1,"rgb("+Math.round(b*.7)+","+Math.round(r*.6)+","+Math.round(g*.8)+")");
      ctx.fillStyle=g2;
      ctx.fillRect(0,0,96,54);
      setFallback(r,g,b);
    }catch(e){}
  },500);
}
function onKeyPlayer(e){
  var t=(e.target.tagName||"");
  var typing=t==="INPUT"||t==="SELECT"||t==="TEXTAREA";
  if(typing&&e.key==="Escape"){e.target.blur();return;}
  var v=$("vid");
  if(e.key==="Escape"){
    var fsEl=document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement;
    if(fsEl){
      // Fullscreen will be closed natively by browser, keep player modal open
      return;
    }
    if($("resume-modal") && !$("resume-modal").classList.contains("hidden")){dismissResumeModal();return;}
    if($("drawer-panel") && !$("drawer-panel").classList.contains("hidden")){closeDrawer();return;}
    if($("update-modal") && !$("update-modal").classList.contains("hidden")){closeUpdateModal();return;}
    if(!$("player-modal").classList.contains("hidden"))closePlayer();
    else if(!$("title-modal").classList.contains("hidden"))closeTitle();
    return;
  }
  if($("player-modal").classList.contains("hidden"))return;
  if(e.key===" "){e.preventDefault();if(v.paused)v.play();else v.pause();}
  else if(e.key==="f"||e.key==="F"){e.preventDefault();toggleFullscreen();}
  else if(e.key==="n")stepEp(1);
  else if(e.key==="p")stepEp(-1);
  else if(e.key==="["||e.key==="{"){e.preventDefault();adjustPlaySpeed(-1);}
  else if(e.key==="]"||e.key==="}"){e.preventDefault();adjustPlaySpeed(1);}
  else if(e.key==="m"||e.key==="M"){e.preventDefault();v.muted=!v.muted;}
  else if(e.key==="s"||e.key==="S"){
    if(cur.activeSkipTarget&&cur.activeSkipTarget>0){
      e.preventDefault();
      doSkip();
    }else{
      switchSource();
    }
  }
  else if(e.key==="ArrowRight"){e.preventDefault();v.currentTime+=5;}
  else if(e.key==="ArrowLeft"){e.preventDefault();v.currentTime-=5;}
}

function syncSubSize(){
  var box=$("pm-subs-overlay");
  if(box){
    box.classList.remove("sz-s","sz-m","sz-l");
    box.classList.add("sz-"+(cur.subSize||"m"));
  }
  document.querySelectorAll(".sub-size button").forEach(function(b){
    b.classList.toggle("active",b.getAttribute("data-subsize")===(cur.subSize||"m"));
  });
}
function setSubSize(sz){
  if(sz!=="s"&&sz!=="m"&&sz!=="l")return;
  cur.subSize=sz;
  setAppStorage("subsize",sz);
  syncSubSize();
}

function syncTranslate(){
  var btn=$("pm-translate");
  if(!btn)return;
  btn.setAttribute("data-on",cur.translate?"1":"0");
  btn.title="Translate ID: "+(cur.translate?"on":"off")+" (butuh track English sebagai source)";
}
function setTranslate(on){
  cur.translate=!!on;
  setAppStorage("translate",cur.translate?"1":"0");
  syncTranslate();
  // Re-render dropdown agar opsi Indonesian (AI) muncul/hilang.
  var subs=(cur.res&&cur.res.subtitles)||[];
  if(cur.translate){
    var picked=pickSubtitleUrl(subs, "Indonesian");
    if(picked){
      cur.activeSub=picked;
      switchSubtitleTrack(picked);
    }
  }
  renderSubtitles(subs, cur.activeSub);
  toast("Translate: "+(cur.translate?"ON":"OFF"));
}

function renderSourceUI(){
  var s = cur.source || "hianime";
  var isOtaku = (s === "otakudesu");
  var txt = isOtaku ? "src: otakudesu (sub indo) ⇄" : "src: hianime ⇄";
  var badgeTxt = isOtaku ? "OTAKUDESU (SUB INDO) ⇄" : "HIANIME ⇄";
  var sb = $("sb-source");
  if(sb){
    sb.textContent = txt;
    sb.classList.toggle("otaku", isOtaku);
  }
  var tm = $("tm-source-btn");
  if(tm){
    tm.textContent = "SRC: " + badgeTxt;
    tm.classList.toggle("otaku", isOtaku);
  }
  var navLbl = $("nav-source-label");
  if(navLbl){
    navLbl.textContent = isOtaku ? "SRC: OTAKUDESU" : "SRC: HIANIME";
  }
  var navBtn = $("nav-source-btn");
  if(navBtn){
    navBtn.classList.toggle("otaku", isOtaku);
  }
  var pHi = $("pill-src-hianime");
  if(pHi) pHi.classList.toggle("active", !isOtaku);
  var pOt = $("pill-src-otakudesu");
  if(pOt) pOt.classList.toggle("active", isOtaku);
}

function switchSource(targetSource){
  var v=$("vid");
  var curTime = (v && !isNaN(v.currentTime)) ? v.currentTime : 0;
  var nextSource = targetSource;
  if(!nextSource){
    nextSource = (cur.source === "otakudesu") ? "hianime" : "otakudesu";
  }
  cur.source = nextSource;
  renderSourceUI();
  var api = window.ReStram || window.Tatap;
  if(api && api.setSetting){
    api.setSetting({ preferred_source: nextSource }).catch(function(){});
  }
  var label = nextSource === "otakudesu" ? "Otakudesu (Sub Indo)" : "HiAnime";
  toast("Sumber: " + label);
  if(!$("player-modal").classList.contains("hidden") && cur.ep){
    openPlayer(cur.ep, curTime);
  }
  return nextSource;
}

function openDrawer(){
  var p = $("drawer-panel");
  if(p) p.classList.remove("hidden");
  document.body.classList.add("drawer-open");
  // Update status di footer drawer
  var hEl = $("health");
  var dHText = $("drawer-health-text");
  if(dHText && hEl){
    dHText.textContent = hEl.textContent || "Online";
    dHText.className = hEl.className || "dim";
  }
}
function closeDrawer(){
  var p = $("drawer-panel");
  if(p) p.classList.add("hidden");
  document.body.classList.remove("drawer-open");
}

function openUpdateModal(data){
  var m = $("update-modal");
  if(!m) return;
  $("um-title").textContent = data.release_name || ("ReStram v" + data.latest_version);
  $("um-sub").textContent = "Rilis: " + (data.tag_name || "v" + data.latest_version) + " · Terpasang: v" + data.current_version;
  $("um-content").textContent = data.body || "Tidak ada catatan rilis.";
  
  var act = $("um-actions");
  act.innerHTML = "";
  
  // Deteksi OS user untuk tombol download utama
  var ua = (navigator.userAgent || "").toLowerCase();
  var isWin = ua.indexOf("windows") >= 0;
  var isLinux = ua.indexOf("linux") >= 0 && ua.indexOf("android") === -1;
  var isAndroid = ua.indexOf("android") >= 0;

  var primaryUrl = "";
  var primaryLabel = "Unduh Pembaruan";
  if(isWin && data.assets && data.assets.windows){
    primaryUrl = data.assets.windows;
    primaryLabel = "🪟 Unduh Windows Portable (.zip)";
  } else if(isLinux && data.assets && data.assets.linux){
    primaryUrl = data.assets.linux;
    primaryLabel = "🐧 Unduh Linux AppImage";
  } else if(isAndroid && data.assets && data.assets.android){
    primaryUrl = data.assets.android;
    primaryLabel = "📱 Unduh Signed APK Android";
  } else if(data.assets && data.assets.windows){
    primaryUrl = data.assets.windows;
    primaryLabel = "Unduh Rilis Resmi";
  }

  if(primaryUrl){
    var a = document.createElement("a");
    a.className = "update-btn";
    a.href = primaryUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = primaryLabel;
    act.appendChild(a);
  }

  // Tombol buka halaman GitHub release
  if(data.release_url){
    var aRel = document.createElement("a");
    aRel.className = "update-btn secondary";
    aRel.href = data.release_url;
    aRel.target = "_blank";
    aRel.rel = "noopener noreferrer";
    aRel.textContent = "Buka di GitHub";
    act.appendChild(aRel);
  }

  m.classList.remove("hidden");
}

function closeUpdateModal(){
  var m = $("update-modal");
  if(m) m.classList.add("hidden");
}

function checkForUpdate(manualTrigger){
  if(manualTrigger) toast("Memeriksa update ke GitHub…", 2000);
  (window.ReStram||window.Tatap).checkUpdate().then(function(res){
    if(res && res.success && res.data){
      var d = res.data;
      if(d.has_update){
        openUpdateModal(d);
        toast("🚀 Pembaruan ReStram v" + d.latest_version + " tersedia!", 4000);
      } else {
        if(manualTrigger){
          toast("✓ ReStram v" + d.current_version + " adalah versi terbaru!", 3000);
        }
      }
    } else {
      if(manualTrigger){
        toast("Gagal memeriksa update: " + (res && res.error || "koneksi bermasalah"), 3000);
      }
    }
  }).catch(function(err){
    if(manualTrigger){
      toast("Error cek update: " + (err && err.message || err), 3000);
    }
  });
}

// =========================================================================
// NETMIRROR CONTROLLER (Netflix-style Hero Carousel & Content Rails)
// =========================================================================
var HERO_SHOWCASE = [
  {
    id: "solo-leveling-season-2-arise-from-the-shadows-19413",
    slug: "solo-leveling-season-2-arise-from-the-shadows-19413",
    title: "Solo Leveling Season 2 -Arise from the Shadow-",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx176496-9BDMjAZGEbq4.png",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/176496-5oY4k2NRqlYs.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/176496-5oY4k2NRqlYs.jpg",
    score: 8.9,
    type: "TV",
    season: "Winter 2025",
    badge: "TRENDING SEKARANG",
    eps_counter: "13/13",
    synopsis: "Sung Jinwoo melanjutkan perjalanannya sebagai Shadow Monarch yang mengendalikan pasukan bayangan tak terkalahkan. Ancaman Dungeon misterius semakin dekat ke dunia manusia dan perang antar Monarch tak terhindarkan.",
    genres: ["Action", "Adventure", "Fantasy"]
  },
  {
    id: "frieren-beyond-journeys-end-18418",
    slug: "frieren-beyond-journeys-end-18418",
    title: "Frieren: Beyond Journey’s End",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    score: 9.3,
    type: "TV",
    season: "Fall 2023",
    badge: "TOP RATED",
    eps_counter: "28/28",
    synopsis: "Setelah mengalahkan Raja Iblis bersama pahlawan Himmel dan kawan-kawan, penyihir elf Frieren memulai perjalanan baru melintasi benua untuk memahami perasaan manusia dan makna waktu.",
    genres: ["Adventure", "Drama", "Fantasy"]
  },
  {
    id: "dandadan-19343",
    slug: "dandadan-19343",
    title: "DAN DA DAN",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx171018-60q1B6GK2Ghb.jpg",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-SpwPNAduszXl.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-SpwPNAduszXl.jpg",
    score: 8.7,
    type: "TV",
    season: "Fall 2024",
    badge: "POPULER",
    eps_counter: "12/12",
    synopsis: "Momo Ayase yang percaya hantu dan Ken Takakura (Okarun) yang percaya alien bertaruh di tempat angker, terjerumus ke dalam perang misterius antara arwah dan invasi alien.",
    genres: ["Action", "Comedy", "Supernatural"]
  },
  {
    id: "jujutsu-kaisen-2nd-season-18413",
    slug: "jujutsu-kaisen-2nd-season-18413",
    title: "JUJUTSU KAISEN Season 2",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx145064-hSNRJM03pvv1.jpg",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-esDtAY2He7sk.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-esDtAY2He7sk.jpg",
    score: 8.8,
    type: "TV",
    season: "Summer 2023",
    badge: "HOT ACTION",
    eps_counter: "23/23",
    synopsis: "Tragedi besar Shibuya pecah pada malam Halloween. Gojo Satoru terperangkap dalam Prison Realm, sementara Yuji Itadori harus bertarung mati-matian melawan roh kutukan khusus.",
    genres: ["Action", "Fantasy", "Supernatural"]
  },
  {
    id: "demon-slayer-kimetsu-no-yaiba-47",
    slug: "demon-slayer-kimetsu-no-yaiba-47",
    title: "Demon Slayer: Kimetsu no Yaiba",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx101922-WBsBl0ClmgYL.jpg",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    score: 8.6,
    type: "TV",
    season: "Spring 2019",
    badge: "BEST ANIMATION",
    eps_counter: "26/26",
    synopsis: "Tanjiro dan korps pembasmi iblis menjalani latihan fisik dan teknik pernapasan intensif sebagai persiapan menghadapi pertempuran akhir melawan Muzan Kibutsuji.",
    genres: ["Action", "Fantasy", "Historical"]
  },
  {
    id: "one-piece",
    slug: "one-piece",
    title: "One Piece",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-Y2ncsENluTMA.png",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJSpdH.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJSpdH.jpg",
    score: 8.8,
    type: "TV",
    season: "Egghead Arc",
    badge: "LEGENDARY",
    eps_counter: "1122+",
    synopsis: "Monkey D. Luffy dan Bajak Laut Topi Jerami tiba di Pulau Masa Depan Egghead, markas ilmuwan jenius Dr. Vegapunk, memicu konfrontasi dahsyat melawan World Government dan Gorosei.",
    genres: ["Action", "Adventure", "Fantasy"]
  },
  {
    id: "naruto-shippuden",
    slug: "naruto-shippuden",
    title: "Naruto: Shippuuden",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1735-F5nnmxkBNUye.png",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1735-e6hP4jXbhYlT.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1735-e6hP4jXbhYlT.jpg",
    score: 8.6,
    type: "TV",
    season: "Classic Shounen",
    badge: "MASTERPIECE",
    eps_counter: "500/500",
    synopsis: "Setelah dua setengah tahun berlatih dengan Jiraiya, Naruto Uzumaki kembali ke Konoha untuk menyelamatkan sahabatnya Sasuke dan melindungi dunia shinobi dari ancaman Akatsuki.",
    genres: ["Action", "Adventure", "Martial Arts"]
  },
  {
    id: "bleach",
    slug: "bleach",
    title: "Bleach: Thousand-Year Blood War",
    poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx159322-wK1n3kO42o6g.jpg",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/159322-y4n5FqFh3941.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/159322-y4n5FqFh3941.jpg",
    score: 8.9,
    type: "TV",
    season: "Fall 2022",
    badge: "EPIC BATTLE",
    eps_counter: "39/39",
    synopsis: "Soul Society diserang oleh Wandenreich, pasukan Quincy di bawah kepemimpinan Yhwach. Ichigo Kurosaki kembali mengangkat Zangetsu untuk menghadapi takdir terdalam para Shinigami.",
    genres: ["Action", "Supernatural"]
  }
];

var NET_FALLBACK_ANIME = HERO_SHOWCASE;

function loadAnimeDatabase(){
  return fetch("./data/anime.json")
    .then(function(res){
      if(!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function(data){
      if(!Array.isArray(data) || !data.length) return null;
      var normalized = data.map(function(item){
        var poster = item.thumbnail || item.poster || item.banner || "";
        var backdrop = item.banner || item.thumbnail || item.poster || "";
        var count = item.episodes || (item.episodes_list ? item.episodes_list.length : 12);
        var counter = item.eps_counter || (count + "/" + count);
        return Object.assign({}, item, {
          id: item.id || item.slug,
          slug: item.slug,
          title: item.title,
          poster: poster,
          thumbnail: item.thumbnail || poster,
          backdrop: backdrop,
          banner: item.banner || backdrop,
          score: item.score ? parseFloat(item.score) : 8.5,
          type: item.type || "TV",
          status: item.status || "Ongoing",
          season: item.season || item.release_year || "Terbaru",
          episodes: count,
          eps_counter: counter,
          synopsis: item.synopsis || "",
          genres: item.genres || [],
          episodes_list: item.episodes_list || []
        });
      });

      window.ANIME_DB = normalized;

      if(typeof window !== "undefined" && window.NET27_DATA){
        window.NET27_DATA.items = normalized;
        window.NET27_DATA.hero = HERO_SHOWCASE;

        var itemMap = {};
        normalized.forEach(function(it){
          itemMap[it.slug] = it;
          if(it.id) itemMap[String(it.id)] = it;
        });

        window.NET27_DATA.getItem = function(slug){
          return itemMap[slug] || null;
        };

        window.NET27_DATA.getEpisodes = function(slug){
          var it = itemMap[slug];
          if(it && it.episodes_list && it.episodes_list.length){
            return it.episodes_list.map(function(ep){
              return {
                ep: ep.ep,
                episode: ep.ep,
                title: ep.title || ("Episode " + ep.ep),
                id: (it.slug || slug) + "?ep=" + ep.ep,
                date: ep.date || "",
                stream_url: ep.stream_url,
                servers: ep.servers || [],
                drive_file_id: ep.drive_file_id || ""
              };
            });
          }
          var total = (it && it.episodes) ? it.episodes : 12;
          var arr = [];
          for(var i = 1; i <= total; i++){
            arr.push({ ep: i, episode: i, title: "Episode " + i, id: slug + "?ep=" + i });
          }
          return arr;
        };

        window.NET27_DATA.resolveStream = function(slug, ep, mode){
          ep = parseInt(ep) || 1;
          mode = (mode === "dub") ? "dub" : "sub";
          var it = itemMap[slug] || normalized[0];
          var srvs = extractEpisodeServers(it, ep);
          var primaryUrl = srvs.blogger || srvs.mega || srvs.native || "";

          return {
            success: true,
            data: {
              slug: slug,
              episode: ep,
              mode: mode,
              source: "anime-json",
              server: "Server 1: Blogger/Drive",
              embedUrl: primaryUrl,
              embed_url: primaryUrl,
              master: srvs.native || primaryUrl,
              embedServers: [
                { id: "blogger", name: "Server 1: Blogger/Drive", type: "iframe", url: srvs.blogger },
                { id: "mega", name: "Server 2: Mega", type: "iframe", url: srvs.mega },
                { id: "native", name: "Server 3: HLS Native", type: "video", url: srvs.native }
              ],
              servers: [
                { id: "blogger", name: "Server 1: Blogger/Drive", url: srvs.blogger },
                { id: "mega", name: "Server 2: Mega", url: srvs.mega },
                { id: "native", name: "Server 3: HLS Native", url: srvs.native }
              ],
              episodeServers: srvs,
              picked: { q: "HD", url: primaryUrl },
              variants: [
                { q: "Server 1", url: srvs.blogger },
                { q: "Server 2", url: srvs.mega },
                { q: "Server 3", url: srvs.native }
              ],
              subtitles: [
                { lang: "Indonesian", label: "Indonesian", url: "" },
                { lang: "English", label: "English", url: "" }
              ],
              intro: { start: 90, end: 175 },
              outro: { start: 1320, end: 1410 },
              cached: true
            }
          };
        };

        window.NET27_DATA.search = function(query){
          var q = (query || "").toLowerCase().trim();
          if(!q) return normalized;
          return normalized.filter(function(it){
            var t = (it.title || "").toLowerCase();
            var g = (it.genres || []).join(" ").toLowerCase();
            var s = (it.synopsis || "").toLowerCase();
            return t.indexOf(q) >= 0 || g.indexOf(q) >= 0 || s.indexOf(q) >= 0;
          });
        };
      }

      if(window.NetMirror){
        if(window.NetMirror.initHero) window.NetMirror.initHero();
        if(window.NetMirror.refreshHomeRails) window.NetMirror.refreshHomeRails();
      }

      return normalized;
    })
    .catch(function(err){
      console.warn("loadAnimeDatabase fallback:", err);
      return null;
    });
}
window.loadAnimeDatabase = loadAnimeDatabase;

var NetMirror = (function(){
  function getHeroData(){
    return HERO_SHOWCASE;
  }

  var heroIndex = 0;
  var heroTimer = null;
  var heroSlides = getHeroData();

  function createRailCard(a){
    var card = document.createElement("div");
    card.className = "rail-card";
    card.tabIndex = 0;
    var posterUrl = a.poster || a.thumbnail || "";
    var epText = a.eps_counter ? ("EP " + a.eps_counter) : (a.badge || (a.episode != null ? ("EP " + a.episode) : (a.eps ? (a.eps + " EP") : "TV")));
    var scoreVal = a.score ? parseFloat(a.score) : 8.5;
    var scoreText = "⭐ " + scoreVal.toFixed(1);

    var isTam = a.badge === "TAMAT" || a.is_finished || a.status === "finished";
    var statusCls = isTam ? "card-badge-status finished" : "card-badge-status";

    card.innerHTML = 
      '<div class="rail-card-poster-wrap">' +
        (posterUrl ? '<img class="rail-card-img" src="' + esc(posterUrl) + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">' : '<div class="rail-card-img no-img" style="background:#151922;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:24px;">▶</div>') +
        '<div class="rail-card-overlay"><div class="card-play-btn"><svg class="ui-icon"><use href="#icon-play"/></svg></div></div>' +
        '<span class="card-badge-hd">HD</span>' +
        '<span class="card-badge-score">' + esc(scoreText) + '</span>' +
        '<span class="' + statusCls + '">' + esc(epText) + '</span>' +
      '</div>' +
      '<div class="rail-card-info">' +
        '<h3 class="rail-card-title">' + esc(a.title) + '</h3>' +
        '<div class="rail-card-meta">' + esc((a.type || "TV") + (a.season ? (" · " + a.season) : "")) + '</div>' +
      '</div>';

    var targetId = a.id || a.slug;
    card.addEventListener("click", function(){
      if(typeof App !== "undefined" && App.openTitle){
        App.openTitle(targetId, a.title, a.poster, a.type, a.eps_counter, a);
      }
    });
    return card;
  }

  function renderRailItems(trackEl, items){
    if(!trackEl || !items || !items.length) return;
    trackEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    for(var i = 0; i < items.length; i++){
      frag.appendChild(createRailCard(items[i]));
    }
    trackEl.appendChild(frag);
  }

  function setHeroSlide(idx){
    if(!heroSlides || !heroSlides.length){
      heroSlides = getHeroData();
    }
    if(!heroSlides || !heroSlides.length) return;
    heroIndex = (idx + heroSlides.length) % heroSlides.length;
    var a = heroSlides[heroIndex];
    if(!a) return;

    var bg = $("hero-backdrop");
    if(bg){
      var bgImg = a.backdrop || a.banner || "https://s4.anilist.co/file/anilistcdn/media/anime/banner/176496-5oY4k2NRqlYs.jpg";
      var pre = new Image();
      pre.onload = function(){
        bg.style.backgroundImage = "url('" + bgImg + "')";
        bg.style.opacity = "1";
      };
      pre.onerror = function(){
        bg.style.backgroundImage = "url('" + bgImg + "')";
        bg.style.opacity = "1";
      };
      bg.style.opacity = "0.45";
      pre.src = bgImg;
    }

    var tEl = $("hero-title");
    if(tEl) tEl.textContent = a.title || "";
    var synEl = $("hero-synopsis");
    if(synEl) synEl.textContent = a.synopsis || "Anime pilihan terbaik untuk streaming berkualitas di ReStram.";
    var scEl = $("hero-score-val");
    if(scEl) scEl.textContent = a.score ? parseFloat(a.score).toFixed(1) : "8.9";
    var typEl = $("hero-type");
    if(typEl) typEl.textContent = a.type || "TV Series";
    var ssnEl = $("hero-season");
    if(ssnEl) ssnEl.textContent = a.season || "Populer";

    // Dots indicator update
    var dots = document.querySelectorAll("#hero-dots .hero-dot");
    dots.forEach(function(dot, dIdx){
      dot.classList.toggle("active", dIdx === heroIndex);
    });

    // Button actions
    var btnPlay = $("hero-btn-play");
    if(btnPlay){
      btnPlay.onclick = function(){
        if(typeof App !== "undefined" && App.openTitle){
          App.openTitle(a.id || a.slug, a.title, a.poster, a.type, a.eps_counter, a);
          setTimeout(function(){
            App.openPlayer(1);
          }, 150);
        }
      };
    }
    var btnWatchlist = $("hero-btn-watchlist");
    if(btnWatchlist){
      btnWatchlist.onclick = function(e){
        e.stopPropagation();
        var api = window.ReStram || window.Tatap;
        if(api && api.addBookmark){
          api.addBookmark({
            slug: a.id || a.slug,
            title: a.title,
            poster: a.poster,
            type: a.type || "TV"
          }).then(function(){
            toast("✓ Ditambahkan ke Daftar Tontonan: " + a.title);
          }).catch(function(){});
        }
      };
    }
    var btnDetail = $("hero-btn-detail");
    if(btnDetail){
      btnDetail.onclick = function(){
        if(typeof App !== "undefined" && App.openTitle){
          App.openTitle(a.id || a.slug, a.title, a.poster, a.type, a.eps_counter, a);
        }
      };
    }
  }

  function startHeroTimer(){
    stopHeroTimer();
    heroTimer = setInterval(function(){
      setHeroSlide(heroIndex + 1);
    }, 7000);
  }

  function stopHeroTimer(){
    if(heroTimer){
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }

  function initHero(){
    heroSlides = getHeroData();
    var dotsContainer = $("hero-dots");
    if(dotsContainer){
      dotsContainer.innerHTML = "";
      heroSlides.forEach(function(_, i){
        var dot = document.createElement("button");
        dot.className = "hero-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        dot.addEventListener("click", function(){
          setHeroSlide(i);
          startHeroTimer();
        });
        dotsContainer.appendChild(dot);
      });
    }

    var btnPrev = $("hero-prev");
    if(btnPrev){
      btnPrev.onclick = function(){
        setHeroSlide(heroIndex - 1);
        startHeroTimer();
      };
    }
    var btnNext = $("hero-next");
    if(btnNext){
      btnNext.onclick = function(){
        setHeroSlide(heroIndex + 1);
        startHeroTimer();
      };
    }

    var heroSec = $("net-hero");
    if(heroSec){
      heroSec.addEventListener("mouseenter", stopHeroTimer);
      heroSec.addEventListener("mouseleave", startHeroTimer);
    }

    setHeroSlide(0);
    startHeroTimer();
  }

  function bindRailNavArrows(){
    document.querySelectorAll(".rail-slider-wrapper").forEach(function(wrap){
      var track = wrap.querySelector(".rail-track");
      var prevBtn = wrap.querySelector(".rail-nav-btn.prev");
      var nextBtn = wrap.querySelector(".rail-nav-btn.next");
      if(!track) return;
      if(prevBtn && !prevBtn._navBound){
        prevBtn._navBound = true;
        prevBtn.addEventListener("click", function(){
          track.scrollBy({ left: -Math.max(280, track.clientWidth * 0.75), behavior: "smooth" });
        });
      }
      if(nextBtn && !nextBtn._navBound){
        nextBtn._navBound = true;
        nextBtn.addEventListener("click", function(){
          track.scrollBy({ left: Math.max(280, track.clientWidth * 0.75), behavior: "smooth" });
        });
      }
    });

    document.querySelectorAll(".rail-see-all-btn[data-rail-view]").forEach(function(btn){
      if(!btn._bound){
        btn._bound = true;
        btn.addEventListener("click", function(){
          var v = btn.getAttribute("data-rail-view");
          if(window.Tui && window.Tui.setView) window.Tui.setView(v);
        });
      }
    });
  }

  function loadTrendingRail(){
    var track = $("lane-season");
    var api = window.ReStram || window.Tatap;
    if(!api || !api.seasonNow) return;
    api.seasonNow(1).then(function(r){
      if(r && r.success && r.data && Array.isArray(r.data.items) && r.data.items.length){
        renderRailItems(track, r.data.items);
        if(r.data.items.length >= 3){
          heroSlides = r.data.items.slice(0, 5);
          initHero();
        }
      }
    }).catch(function(){});
  }

  function loadLatestRail(){
    var track = $("lane-latest");
    var api = window.ReStram || window.Tatap;
    if(!api || !api.schedule) return;
    api.schedule("today").then(function(r){
      if(r && r.success && r.data){
        var items = r.data.items || (Array.isArray(r.data) ? r.data : []);
        if(items.length){
          renderRailItems(track, items);
        }
      }
    }).catch(function(){});
  }

  function loadPopularRail(){
    var track = $("lane-popular");
    var api = window.ReStram || window.Tatap;
    if(!api || !api.catalog) return;
    api.catalog(1).then(function(r){
      if(r && r.success && r.data && Array.isArray(r.data.items) && r.data.items.length){
        renderRailItems(track, r.data.items);
      }
    }).catch(function(){});
  }

  function loadFavoritesRail(){
    var track = $("lane-favorites");
    var sec = $("lane-favorites-sec");
    var api = window.ReStram || window.Tatap;
    if(!api || !api.bookmarks) return;
    api.bookmarks().then(function(r){
      if(r && r.success && Array.isArray(r.data) && r.data.length){
        renderRailItems(track, r.data);
        if(sec) sec.classList.remove("hidden");
      } else {
        if(sec) sec.classList.add("hidden");
      }
    }).catch(function(){
      if(sec) sec.classList.add("hidden");
    });
  }

  function refreshHomeRails(){
    renderContinue();

    // 1. Render immediately from 84-anime database or fallback data so rails are populated with Netflix horizontal items
    var allItems = (window.ANIME_DB && window.ANIME_DB.length) ? window.ANIME_DB : 
                   ((typeof window !== "undefined" && window.NET27_DATA && window.NET27_DATA.items && window.NET27_DATA.items.length) ? window.NET27_DATA.items : NET_FALLBACK_ANIME);

    renderRailItems($("lane-season"), allItems.slice(0, 15));
    renderRailItems($("lane-latest"), allItems.slice(15, 30));
    var sorted = allItems.slice().sort(function(a,b){ return (b.score||0) - (a.score||0); });
    renderRailItems($("lane-popular"), sorted.slice(0, 15));

    // 2. Fetch live updates if server API is reachable and local DB not loaded
    if(!window.ANIME_DB || !window.ANIME_DB.length){
      loadTrendingRail();
      loadLatestRail();
      loadPopularRail();
    }
    loadFavoritesRail();
    bindRailNavArrows();
  }

  function init(){
    initHero();
    bindRailNavArrows();
    refreshHomeRails();
  }

  return {
    init: init,
    initHero: initHero,
    refreshHomeRails: refreshHomeRails,
    setHeroSlide: setHeroSlide,
    fallbackAnime: NET_FALLBACK_ANIME
  };
})();
window.NetMirror = NetMirror;

App = {
  openTitle:openTitle, openPlayer:openPlayer, playMPV:playMPV,
  renderContinue:renderContinue, onKeyPlayer:onKeyPlayer,
  switchSource:switchSource,
  setPlaySpeed:setPlaySpeed, adjustPlaySpeed:adjustPlaySpeed,
  openDrawer:openDrawer, closeDrawer:closeDrawer,
  openUpdateModal:openUpdateModal, closeUpdateModal:closeUpdateModal,
  checkForUpdate:checkForUpdate,
  closeResumeModal:closeResumeModal, dismissResumeModal:dismissResumeModal,
  openGenreModal:function(){
    if(typeof window.Tui!=="undefined"&&window.Tui.openGenreModal){
      window.Tui.openGenreModal();
    }
  }
};

function init(){
  loadPrefs();
  try{
    var sz=getAppStorage("subsize");
    if(sz==="s"||sz==="m"||sz==="l")cur.subSize=sz;
  }catch(e){}
  syncSubSize();
  // Toggle translate ID (default ON kecuali user eksplisit set "0").
  try{
    var tr=getAppStorage("translate");
    if(tr === "0") cur.translate = false;
    else cur.translate = true;
  }catch(e){ cur.translate = true; }
  syncTranslate();
  var trBtn=$("pm-translate");
  if(trBtn) trBtn.addEventListener("click",function(){setTranslate(!cur.translate);});
  document.querySelectorAll(".sub-size button").forEach(function(b){
    b.addEventListener("click",function(){setSubSize(b.getAttribute("data-subsize"));});
  });
  var v=$("vid");
  if(v){
    v.addEventListener("timeupdate",function(){
      paintCue();
      recordWatchProgress(false);
    });
    v.addEventListener("pause",function(){
      recordWatchProgress(true);
    });
    v.addEventListener("ended",function(){
      var endedSlug = cur.slug;
      var endedEp = cur.ep;

      if(endedSlug && endedEp){
        (window.ReStram||window.Tatap).saveProgress(endedSlug, endedEp, 0, Math.floor(v.duration||0)).catch(function(){});
        recordEpisodeWatched(endedSlug, endedEp);
      }

      closePlayer();
      toast("Episode " + endedEp + " selesai diputar");
    });
    v.addEventListener("seeked",paintCue);
    v.addEventListener("loadedmetadata",function(){
      if(currentPlaybackSpeed && v.playbackRate !== currentPlaybackSpeed){
        try{ v.playbackRate = currentPlaybackSpeed; }catch(e){}
      }
    });
    v.addEventListener("play",function(){
      if(currentPlaybackSpeed && v.playbackRate !== currentPlaybackSpeed){
        try{ v.playbackRate = currentPlaybackSpeed; }catch(e){}
      }
    });
    v.addEventListener("fullscreenchange",syncFullscreenSubtitles);
    v.addEventListener("webkitfullscreenchange",syncFullscreenSubtitles);
    v.addEventListener("webkitbeginfullscreen",syncFullscreenSubtitles);
    v.addEventListener("webkitendfullscreen",syncFullscreenSubtitles);
    v.addEventListener("dblclick",function(e){
      e.preventDefault();
      toggleFullscreen();
    });
    if(!v._restramFsHooked && !v._tatapFsHooked){
      v._restramFsHooked=v._tatapFsHooked=true;
      var origFs=v.requestFullscreen||v.webkitRequestFullscreen||v.mozRequestFullScreen||v.msRequestFullscreen;
      var fsHandler=function(options){
        var stage=document.querySelector(".ambient-stage");
        if(stage&&(stage.requestFullscreen||stage.webkitRequestFullscreen)){
          var p;
          try{
            if(stage.requestFullscreen)p=stage.requestFullscreen(options);
            else if(stage.webkitRequestFullscreen)p=stage.webkitRequestFullscreen(options);
            if(p&&p.catch){
              return p.catch(function(){
                if(origFs)return origFs.call(v,options);
                if(v.webkitEnterFullscreen)try{v.webkitEnterFullscreen();}catch(e){}
              });
            }
            return p;
          }catch(e){
            if(origFs)return origFs.call(v,options);
            if(v.webkitEnterFullscreen)try{v.webkitEnterFullscreen();}catch(err){}
          }
        }
        if(origFs)return origFs.call(v,options);
        if(v.webkitEnterFullscreen)try{v.webkitEnterFullscreen();}catch(e){}
      };
      if(v.requestFullscreen)v.requestFullscreen=fsHandler;
      if(v.webkitRequestFullscreen)v.webkitRequestFullscreen=fsHandler;
      if(v.mozRequestFullScreen)v.mozRequestFullScreen=fsHandler;
      if(v.msRequestFullscreen)v.msRequestFullscreen=fsHandler;
    }
  }
  document.addEventListener("fullscreenchange",syncFullscreenSubtitles);
  document.addEventListener("webkitfullscreenchange",syncFullscreenSubtitles);
  document.addEventListener("mozfullscreenchange",syncFullscreenSubtitles);
  document.addEventListener("MSFullscreenChange",syncFullscreenSubtitles);
  var pmFs=$("pm-fs");
  if(pmFs)pmFs.addEventListener("click",toggleFullscreen);
  var skipBtn=$("pm-skip-btn");
  if(skipBtn)skipBtn.addEventListener("click",doSkip);
  renderSourceUI();
  var sbSrc=$("sb-source");
  if(sbSrc) sbSrc.addEventListener("click",function(){switchSource();});
  var tmSrc=$("tm-source-btn");
  if(tmSrc) tmSrc.addEventListener("click",function(){switchSource();});
  // Muat preferensi subtitle dari server (sub_lang). Kalau server gagal,
  // fallback ke default 'English' yang sudah di-set di var cur.
  var api = window.ReStram || window.Tatap;
  if(api && api.getSettings){
    api.getSettings().then(function(r){
      if(r&&r.success&&r.data){
        if(r.data.sub_lang) cur.subLang=r.data.sub_lang;
        if(r.data.quality) cur.quality=r.data.quality;
        if(r.data.mode) {cur.mode=r.data.mode; syncSeg();}
        if(r.data.preferred_source) {cur.source=r.data.preferred_source; renderSourceUI();}
      }
    }).catch(function(){});
  }
  document.querySelectorAll("#mode-seg button").forEach(function(b){
    b.addEventListener("click",function(){
      document.querySelectorAll("#mode-seg button").forEach(function(x){x.classList.remove("active");});
      b.classList.add("active");cur.mode=b.getAttribute("data-mode");loadEps();
    });
  });
  document.querySelectorAll("#quality-seg button").forEach(function(b){
    b.addEventListener("click",function(){
      document.querySelectorAll("#quality-seg button").forEach(function(x){x.classList.remove("active");});
      b.classList.add("active");cur.quality=b.getAttribute("data-q");
    });
  });
  var tmClose = $("tm-close");
  if(tmClose){
    tmClose.addEventListener("click",function(){
      cur.playToken = ++_playTokenCounter;
      closeTitle();
    });
  }
  var tmBack = $("tm-back-btn");
  if(tmBack){
    tmBack.addEventListener("click",function(){
      cur.playToken = ++_playTokenCounter;
      closeTitle();
    });
  }
  var tmPlayPri = $("tm-btn-play-primary");
  if(tmPlayPri){
    tmPlayPri.addEventListener("click",function(){
      playPrimaryEpisode();
    });
  }
  var synIdBtn = $("tm-syn-id-btn");
  if(synIdBtn) synIdBtn.addEventListener("click",function(){ setSynopsisLang("id"); });
  var synMalBtn = $("tm-syn-mal-btn");
  if(synMalBtn) synMalBtn.addEventListener("click",function(){ setSynopsisLang("mal"); });
  var tmBmBtn=$("tm-bookmark-btn");
  if(tmBmBtn) tmBmBtn.addEventListener("click",toggleModalBookmark);
  $("title-modal").addEventListener("click",function(e){
    if(e.target===this){
      cur.playToken = ++_playTokenCounter;
      closeTitle();
    }
  });
  $("pm-close").addEventListener("click",closePlayer);
  var btnSrvEmbed = $("pm-server-embed") || $("pm-server-blogger");
  if(btnSrvEmbed){
    btnSrvEmbed.addEventListener("click", function(){
      switchPlayerServer("blogger");
    });
  }
  var btnSrvMega = $("pm-server-mega");
  if(btnSrvMega){
    btnSrvMega.addEventListener("click", function(){
      switchPlayerServer("mega");
    });
  }
  var btnSrvNative = $("pm-server-native");
  if(btnSrvNative){
    btnSrvNative.addEventListener("click", function(){
      switchPlayerServer("native");
    });
  }
  $("player-modal").addEventListener("click",function(e){
    if(Date.now() - (cur.playerOpenedAt || 0) < 500) return;
    if(e.target===this) closePlayer();
  });
  $("pm-prev").addEventListener("click",function(){stepEp(-1);});
  $("pm-next").addEventListener("click",function(){stepEp(1);});
  $("pm-mpv").addEventListener("click",playMPV);
  var qSel=$("pm-quality-select");
  if(qSel){
    qSel.addEventListener("change",function(){
      switchQ(this.value);
    });
  }
  var spdSel=$("pm-speed-select");
  if(spdSel){
    spdSel.addEventListener("change",function(){
      setPlaySpeed(parseFloat(this.value), true);
    });
  }
  startAmbient();
  renderContinue();

  // Listener Drawer Navigation & Update Modal
  var btnDrawer = $("btn-drawer");
  if(btnDrawer) btnDrawer.addEventListener("click", openDrawer);
  var btnDrawerHead = $("btn-drawer-head") || $("nav-menu-btn") || $("btn-menu");
  if(btnDrawerHead) btnDrawerHead.addEventListener("click", openDrawer);
  document.querySelectorAll(".nav-menu-btn, #nav-menu-btn, #btn-menu").forEach(function(b){
    if(b !== btnDrawer && b !== btnDrawerHead) b.addEventListener("click", openDrawer);
  });
  var btnDrawerClose = $("drawer-close");
  if(btnDrawerClose) btnDrawerClose.addEventListener("click", closeDrawer);
  var drawerBackdrop = $("drawer-backdrop");
  if(drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  // Navigasi menu di dalam Drawer
  document.querySelectorAll(".drawer-item[data-view]").forEach(function(b){
    b.addEventListener("click", function(){
      var v = b.getAttribute("data-view");
      closeDrawer();
      if(v === "cari"){
        var sInp = $("nav-search-input");
        if(sInp){
          setTimeout(function(){
            sInp.focus();
            sInp.select();
          }, 60);
        }
      }
      if(window.Tui && window.Tui.setView){
        window.Tui.setView(v);
      }
    });
  });

  var drawerGenre = $("drawer-genre");
  if(drawerGenre) drawerGenre.addEventListener("click", function(){
    closeDrawer();
    if(window.Tui && window.Tui.openGenreModal) window.Tui.openGenreModal();
  });

  var drawerCatFilter = $("drawer-catalog-filter");
  if(drawerCatFilter) drawerCatFilter.addEventListener("click", function(){
    closeDrawer();
    if(window.Tui && window.Tui.openCatalogFilterModal) window.Tui.openCatalogFilterModal();
  });

  var drawerSrc = $("drawer-switch-source");
  if(drawerSrc) drawerSrc.addEventListener("click", function(){
    switchSource();
    var b = $("drawer-src-badge");
    if(b) b.textContent = cur.source === "otakudesu" ? "Otakudesu" : "HiAnime";
  });

  var drawerHelp = $("drawer-help");
  if(drawerHelp) drawerHelp.addEventListener("click", function(){
    closeDrawer();
    var ho = $("help-overlay");
    if(ho) ho.classList.remove("hidden");
    var hb = $("help-body");
    if(hb && window.Tui) hb.textContent = window.Tui.cmdUsage();
  });

  var drawerUpd = $("drawer-update");
  if(drawerUpd) drawerUpd.addEventListener("click", function(){
    closeDrawer();
    checkForUpdate(true);
  });

  var umClose = $("um-close");
  if(umClose) umClose.addEventListener("click", closeUpdateModal);
  var um = $("update-modal");
  if(um) um.addEventListener("click", function(e){
    if(e.target === um) closeUpdateModal();
  });

  var rmClose = $("rm-close");
  if(rmClose) rmClose.addEventListener("click", dismissResumeModal);
  var rm = $("resume-modal");
  if(rm) rm.addEventListener("click", function(e){
    if(e.target === rm) dismissResumeModal();
  });
  // CLI Collapsible Toggle Listeners
  var btnCliToggle = $("btn-cli-toggle");
  if(btnCliToggle) btnCliToggle.addEventListener("click", function(){ toggleCli(); });
  var btnCliClose = $("btn-cli-close");
  if(btnCliClose) btnCliClose.addEventListener("click", function(){ toggleCli(false); });

  window.addEventListener("beforeunload", function(){
    recordWatchProgress(true);
  });

  loadAnimeDatabase();
  if(window.NetMirror && window.NetMirror.init){
    window.NetMirror.init();
  }
  if(window.Tui && window.Tui.boot){
    window.Tui.boot();
  }
}

function toggleCli(forceState){
  var bb = $("bottom-bar");
  var btn = $("btn-cli-toggle");
  if(!bb) return;
  var willShow = (forceState !== undefined) ? forceState : bb.classList.contains("collapsed");
  if(willShow){
    bb.classList.remove("collapsed");
    if(btn) btn.classList.add("active");
    var inp = $("cmd");
    if(inp) inp.focus();
  } else {
    bb.classList.add("collapsed");
    if(btn) btn.classList.remove("active");
    var inp = $("cmd");
    if(inp) inp.blur();
  }
}
window.toggleCli = toggleCli;

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}