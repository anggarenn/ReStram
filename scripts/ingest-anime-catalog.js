/**
 * ReStram - Anime Catalog Ingestion & Fallback Generator
 * Ingests data/anime.json (84 anime) and produces js/fallback-data.js
 */
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const ANIME_JSON_PATH = path.join(FRONTEND_DIR, 'data/anime.json');
const OUTPUT_JS_PATH = path.join(FRONTEND_DIR, 'js/fallback-data.js');

if (!fs.existsSync(ANIME_JSON_PATH)) {
  console.error("Missing anime.json at", ANIME_JSON_PATH);
  process.exit(1);
}

const rawAnime = JSON.parse(fs.readFileSync(ANIME_JSON_PATH, 'utf8'));
console.log("Read raw anime items:", rawAnime.length);

function cleanImage(url) {
  if (!url) return '';
  if (url.startsWith('assets/images/')) {
    return './' + url;
  }
  return url;
}

// Map 84 anime into standard ReStram format
const ITEMS = rawAnime.map(a => {
  const epsList = (a.episodes_list || []).map(e => ({
    ep: typeof e.ep === 'number' ? e.ep : parseInt(e.ep) || 1,
    title: e.title || ('Episode ' + e.ep),
    date: e.date || '',
    ep_url: e.ep_url || '',
    stream_url: e.stream_url || '',
    servers: Array.isArray(e.servers) ? e.servers : [],
    drive_file_id: (e.drive_file_id || '').trim()
  }));

  const totalCount = epsList.length || a.episodes || 12;
  const isFinished = (a.status || '').toLowerCase().includes('finish');

  return {
    id: a.slug,
    slug: a.slug,
    anilist_id: (a.id && a.id < 1000000) ? a.id : 176496,
    title: a.title,
    japanese_title: a.title,
    poster: cleanImage(a.thumbnail),
    backdrop: cleanImage(a.banner) || cleanImage(a.thumbnail),
    type: a.type || 'TV',
    score: parseFloat(a.score) || 8.0,
    episodes: totalCount,
    sub: totalCount,
    dub: 0,
    eps: totalCount,
    eps_released: totalCount,
    eps_total: totalCount,
    eps_counter: totalCount + '/' + totalCount,
    duration: '24m',
    genres: Array.isArray(a.genres) && a.genres.length ? a.genres : ['Action'],
    status: isFinished ? 'finished' : 'releasing',
    season: a.release_year ? ('Tahun ' + a.release_year) : '2024',
    synopsis: a.synopsis || '',
    views: a.views || 0,
    studio: a.studio || '',
    episodes_list: epsList
  };
});

// Build the fallback-data.js file content
const jsContent = `/**
 * ReStram Fallback Data & Client-Side Catalog Engine
 * Berisi 84 anime dari data/anime.json dengan server streaming asli:
 * - Google Drive: https://drive.google.com/file/d/\${drive_file_id}/preview
 * - Blogger: https://www.blogger.com/video.g?token=...
 * - Mega: https://mega.nz/embed/...
 * - Mp4Upload & Multi-Server Embed Backup
 */
(function(window){
  var ITEMS = ${JSON.stringify(ITEMS, null, 2)};

  // Map slug ke objek item cepat
  var ITEM_MAP = {};
  ITEMS.forEach(function(it){ ITEM_MAP[it.slug] = it; });

  // Slug aliases untuk kompatibilitas bookmark / direct URL lawas
  var ALIASES = {
    "frieren-beyond-journeys-end-18418": "sousou-no-frieren",
    "one-piece-100": "one-piece",
    "bleach-thousand-year-blood-war-18150": "bleach",
    "black-clover-season-2-cour-2": "black-clover-season-2"
  };
  for(var oldSlug in ALIASES){
    if(ITEM_MAP[ALIASES[oldSlug]] && !ITEM_MAP[oldSlug]){
      ITEM_MAP[oldSlug] = ITEM_MAP[ALIASES[oldSlug]];
    }
  }

  // Multi-server embed provider mapping untuk anime asli (Google Drive, Blogger, Mega, Mp4Upload, VidLink, VidSrc)
  function getEmbedServers(item, ep, mode){
    ep = (typeof ep === "number") ? ep : (parseInt(ep) || 1);
    mode = (mode === "dub") ? "dub" : "sub";
    var servers = [];

    var epObj = null;
    if(item && item.episodes_list && item.episodes_list.length){
      for(var i = 0; i < item.episodes_list.length; i++){
        if(item.episodes_list[i].ep === ep){
          epObj = item.episodes_list[i];
          break;
        }
      }
      if(!epObj){
        epObj = item.episodes_list[ep - 1] || item.episodes_list[0];
      }
    }

    if(epObj){
      // 1. Google Drive (Direct High-Speed Embed Preview)
      if(epObj.drive_file_id && epObj.drive_file_id.trim()){
        servers.push({
          id: "gdrive",
          name: "Server 1: Google Drive (Fast HD)",
          type: "iframe",
          url: "https://drive.google.com/file/d/" + epObj.drive_file_id.trim() + "/preview"
        });
      }

      var allUrls = [epObj.stream_url].concat(epObj.servers || []).filter(Boolean);

      // 2. Blogger Video (Original Google Video CDN)
      allUrls.forEach(function(u){
        if(u.indexOf("blogger.com") >= 0 || u.indexOf("bp.blogspot.com") >= 0){
          var clean = u.trim();
          if(clean.indexOf("http://") === 0) clean = "https://" + clean.slice(7);
          if(clean.indexOf("//") === 0) clean = "https:" + clean;
          if(clean.indexOf("https://blogger.com") === 0) clean = "https://www.blogger.com" + clean.slice(19);
          if(!servers.some(function(s){ return s.url === clean; })){
            var bCount = servers.filter(function(s){ return s.id.indexOf("blogger") === 0; }).length;
            servers.push({
              id: "blogger" + (bCount ? "_" + bCount : ""),
              name: "Server " + (servers.length + 1) + ": Blogger HD" + (bCount ? " (" + (bCount + 1) + ")" : ""),
              type: "iframe",
              url: clean
            });
          }
        }
      });

      // 3. Mega.nz (Encrypted Cloud Embed)
      allUrls.forEach(function(u){
        if(u.indexOf("mega.nz") >= 0){
          var megaUrl = u.trim();
          if(megaUrl.indexOf("http://") === 0) megaUrl = "https://" + megaUrl.slice(7);
          if(megaUrl.indexOf("//") === 0) megaUrl = "https:" + megaUrl;
          if(megaUrl.indexOf("/file/") >= 0) megaUrl = megaUrl.replace("/file/", "/embed/");
          if(!servers.some(function(s){ return s.url === megaUrl; })){
            var mCount = servers.filter(function(s){ return s.id.indexOf("mega") === 0; }).length;
            servers.push({
              id: "mega" + (mCount ? "_" + mCount : ""),
              name: "Server " + (servers.length + 1) + ": Mega Embed" + (mCount ? " (" + (mCount + 1) + ")" : ""),
              type: "iframe",
              url: megaUrl
            });
          }
        }
      });

      // 4. Mp4Upload (Direct Video Player Embed)
      allUrls.forEach(function(u){
        if(u.indexOf("mp4upload.com") >= 0){
          var mp4Url = u.trim();
          if(mp4Url.indexOf("http://") === 0) mp4Url = "https://" + mp4Url.slice(7);
          if(mp4Url.indexOf("//") === 0) mp4Url = "https:" + mp4Url;
          if(!servers.some(function(s){ return s.url === mp4Url; })){
            servers.push({
              id: "mp4upload",
              name: "Server " + (servers.length + 1) + ": Mp4Upload HD",
              type: "iframe",
              url: mp4Url
            });
          }
        }
      });

      // 5. Alternative Embed (gdplayer, yourupload, etc)
      allUrls.forEach(function(u){
        if(u.indexOf("gdplayer.to") >= 0 || u.indexOf("yourupload.com") >= 0){
          var altUrl = u.trim();
          if(altUrl.indexOf("http://") === 0) altUrl = "https://" + altUrl.slice(7);
          if(altUrl.indexOf("//") === 0) altUrl = "https:" + altUrl;
          if(!servers.some(function(s){ return s.url === altUrl; })){
            servers.push({
              id: "alt_embed",
              name: "Server " + (servers.length + 1) + ": Cloud Stream",
              type: "iframe",
              url: altUrl
            });
          }
        }
      });
    }

    // Backup universal embed servers (VidLink / VidSrc / AutoEmbed / Embed.su)
    var anilistId = (item && item.anilist_id) || 176496;
    var backupServers = [
      {
        id: "vidlink",
        name: "Server VidLink (Multi-Sub HD)",
        type: "iframe",
        url: "https://vidlink.pro/anime/" + anilistId + "/" + ep + "/" + mode
      },
      {
        id: "vidsrc_cc",
        name: "Server VidSrc CC (Fast Stream)",
        type: "iframe",
        url: "https://vidsrc.cc/v2/embed/anime/" + anilistId + "/" + ep + "/" + mode
      },
      {
        id: "autoembed",
        name: "Server AutoEmbed (Global CDN)",
        type: "iframe",
        url: "https://player.autoembed.cc/embed/anime/" + anilistId + "/" + ep
      },
      {
        id: "embedsu",
        name: "Server Embed.su (Multi-Track)",
        type: "iframe",
        url: "https://embed.su/embed/anime/" + anilistId + "/" + ep
      }
    ];

    if(servers.length === 0){
      servers = backupServers;
    } else {
      backupServers.slice(0, 2).forEach(function(bk){
        servers.push(bk);
      });
    }

    return servers;
  }

  // Enrich setiap anime di ITEMS dengan embed server awal
  ITEMS.forEach(function(it){
    var srvs = getEmbedServers(it, 1, "sub");
    it.embed_servers = srvs;
    it.embed_url = srvs[0] ? srvs[0].url : "";
    it.stream_url = it.embed_url;
  });

  // 1. Hero Spotlight Items (Top Highlights dengan banner lebar & stream siap tonton)
  var heroSlugs = [
    "one-piece",
    "sousou-no-frieren",
    "naruto-shippuden",
    "bleach",
    "dragon-ball-super",
    "black-clover"
  ];
  var HERO_ITEMS = heroSlugs.map(function(sl){
    return ITEM_MAP[sl];
  }).filter(Boolean).concat(ITEMS.slice(0, 6)).slice(0, 6).map(function(it){
    var srvs = getEmbedServers(it, 1, "sub");
    var primaryUrl = srvs[0] ? srvs[0].url : "";
    return Object.assign({}, it, {
      spotlight: true,
      quality: "HD 1080p",
      badge: it.status === "releasing" ? "SEDANG TAYANG" : "LENGKAP",
      embed_url: primaryUrl,
      stream_url: primaryUrl,
      embed_servers: srvs
    });
  });

  // 2. Catalog Rails per Kategori
  var RAILS = [
    {
      id: "trending",
      title: "🔥 Sedang Tren Minggu Ini",
      subtitle: "Anime terpopuler paling ramai ditonton",
      items: ITEMS.slice().sort(function(a,b){ return (b.views||0) - (a.views||0); }).slice(0, 10)
    },
    {
      id: "fast_servers",
      title: "⚡ Server Cepat (Google Drive & Mega)",
      subtitle: "Streaming instan tanpa buffering via Google Drive & Mega",
      items: ITEMS.filter(function(it){
        return (it.episodes_list || []).some(function(e){
          var all = [e.stream_url].concat(e.servers || []).join(" ");
          return (e.drive_file_id && e.drive_file_id.trim()) || all.indexOf("mega.nz") >= 0;
        });
      }).slice(0, 10)
    },
    {
      id: "seasonal",
      title: "🌸 Tayang Musim Ini",
      subtitle: "Episode terbaru yang sedang tayang (on-going)",
      items: ITEMS.filter(function(it){
        return it.status === "releasing" || (it.season && (it.season.indexOf("2024") >= 0 || it.season.indexOf("2025") >= 0 || it.season.indexOf("2026") >= 0));
      }).slice(0, 10)
    },
    {
      id: "top_rated",
      title: "⭐ Rating Tertinggi",
      subtitle: "Karya anime dengan review dan skor terbaik",
      items: ITEMS.slice().sort(function(a,b){ return (b.score||0) - (a.score||0); }).slice(0, 10)
    },
    {
      id: "action",
      title: "⚔️ Action & Shounen Terbaik",
      subtitle: "Pertarungan dahsyat dan petualangan penuh aksi",
      items: ITEMS.filter(function(it){
        return (it.genres || []).some(function(g){ return g === "Action" || g === "Shounen" || g === "Super Power"; });
      }).slice(0, 10)
    },
    {
      id: "fantasy",
      title: "🔮 Fantasi & Isekai",
      subtitle: "Dunia lain, sihir magis, dan eksplorasi tak terbatas",
      items: ITEMS.filter(function(it){
        return (it.genres || []).some(function(g){ return g === "Fantasy" || g === "Adventure" || g === "Magic"; });
      }).slice(0, 10)
    },
    {
      id: "all_anime",
      title: "📚 Katalog Lengkap (84 Anime)",
      subtitle: "Koleksi lengkap seluruh serial anime siap streaming",
      items: ITEMS.slice()
    }
  ];

  // Helper untuk membuat daftar episode
  function generateEpisodes(slug){
    var item = ITEM_MAP[slug] || ITEMS[0];
    if(item && item.episodes_list && item.episodes_list.length){
      return item.episodes_list.map(function(e){
        var srvs = getEmbedServers(item, e.ep, "sub");
        var primaryUrl = srvs[0] ? srvs[0].url : "";
        return {
          ep: e.ep,
          title: e.title || ("Episode " + e.ep),
          id: slug + "?ep=" + e.ep,
          date: e.date || "",
          embedUrl: primaryUrl,
          embed_url: primaryUrl,
          master: primaryUrl,
          servers: srvs,
          drive_file_id: e.drive_file_id || "",
          intro: { start: 90, end: 175 },
          outro: { start: 1320, end: 1410 }
        };
      });
    }

    var count = (item && (item.eps_total || item.episodes)) || 12;
    var list = [];
    for(var i = 1; i <= count; i++){
      var srvs = getEmbedServers(item, i, "sub");
      var primaryUrl = srvs[0] ? srvs[0].url : "";
      list.push({
        ep: i,
        title: "Episode " + i,
        id: slug + "?ep=" + i,
        embedUrl: primaryUrl,
        embed_url: primaryUrl,
        master: primaryUrl,
        servers: srvs,
        intro: { start: 90, end: 175 },
        outro: { start: 1320, end: 1410 }
      });
    }
    return list;
  }

  // Helper untuk resolve stream anime ASLI (Google Drive / Blogger / Mega / Mp4Upload / Multi-server)
  function resolveFallbackStream(slug, ep, mode){
    ep = (typeof ep === "number") ? ep : (parseInt(ep) || 1);
    mode = (mode === "dub") ? "dub" : "sub";
    var item = ITEM_MAP[slug] || ITEMS[0];
    var servers = getEmbedServers(item, ep, mode);
    var primary = servers[0] || { id: "unknown", name: "Default Stream", url: "" };
    var embedUrl = primary.url;
    var masterHls = (primary.url.indexOf(".m3u8") >= 0 || primary.url.indexOf("/hls") >= 0) ? primary.url : "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

    return {
      success: true,
      data: {
        slug: slug,
        episode: ep,
        mode: mode,
        source: primary.id,
        server: primary.name,
        embedUrl: embedUrl,
        embed_url: embedUrl,
        master: masterHls,
        embedServers: servers,
        servers: servers,
        picked: {
          q: "1080p",
          url: embedUrl
        },
        variants: servers.map(function(s, idx){
          var q = idx === 0 ? "1080p" : (idx === 1 ? "720p" : "480p");
          return { q: q + " (" + s.name + ")", url: s.url };
        }),
        subtitles: [
          { lang: "Indonesian", label: "Indonesian", url: "" },
          { lang: "English", label: "English", url: "" }
        ],
        intro: { start: 90, end: 175 },
        outro: { start: 1320, end: 1410 },
        cached: true
      }
    };
  }

  // Search filter
  function searchFallback(query){
    var q = (query || "").toLowerCase().trim();
    if(!q) return [];
    return ITEMS.filter(function(it){
      var t = (it.title || "").toLowerCase();
      var jt = (it.japanese_title || "").toLowerCase();
      var g = (it.genres || []).join(" ").toLowerCase();
      var s = (it.slug || "").toLowerCase();
      return t.indexOf(q) >= 0 || jt.indexOf(q) >= 0 || g.indexOf(q) >= 0 || s.indexOf(q) >= 0;
    });
  }

  window.NET27_DATA = {
    items: ITEMS,
    hero: HERO_ITEMS,
    rails: RAILS,
    getItem: function(slug){ return ITEM_MAP[slug] || null; },
    getEpisodes: generateEpisodes,
    resolveStream: resolveFallbackStream,
    getEmbedServers: getEmbedServers,
    search: searchFallback
  };

})(typeof window !== "undefined" ? window : global);
`;

fs.writeFileSync(OUTPUT_JS_PATH, jsContent, 'utf8');
console.log("Successfully wrote fallback-data.js at", OUTPUT_JS_PATH);
console.log("File size:", (fs.statSync(OUTPUT_JS_PATH).size / 1024 / 1024).toFixed(2), "MB");
