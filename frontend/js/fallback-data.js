/**
 * net27.cc Fallback Data & Client-Side Catalog Engine
 * Memberikan instant offline/Vercel static catalog, hero carousel, rails, detail, episode list & demo player.
 */
(function(window){
  var ITEMS = [
  {
    "id": "solo-leveling-season-2-arise-from-the-shadows-19413",
    "slug": "solo-leveling-season-2-arise-from-the-shadows-19413",
    "anilist_id": 176496,
    "title": "Solo Leveling Season 2 -Arise from the Shadow-",
    "japanese_title": "Ore dake Level Up na Ken: Season 2 - Arise from the Shadow",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx176496-9BDMjAZGEbq4.png",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/176496-5oY4k2NRqlYs.jpg",
    "type": "TV",
    "score": 8.4,
    "episodes": 13,
    "sub": 13,
    "dub": 13,
    "eps": 13,
    "eps_released": 13,
    "eps_total": 13,
    "eps_counter": "13/13",
    "duration": "24m",
    "genres": [
      "Action",
      "Adventure",
      "Fantasy"
    ],
    "status": "finished",
    "season": "Winter 2025",
    "synopsis": "Mastering his new abilities in secret, Jin-U must battle humanity's toughest foes to save his mother."
  },
  {
    "id": "frieren-beyond-journeys-end-18418",
    "slug": "frieren-beyond-journeys-end-18418",
    "anilist_id": 154587,
    "title": "Frieren: Beyond Journey’s End",
    "japanese_title": "Sousou no Frieren",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    "type": "TV",
    "score": 9.1,
    "episodes": 28,
    "sub": 28,
    "dub": 28,
    "eps": 28,
    "eps_released": 28,
    "eps_total": 28,
    "eps_counter": "28/28",
    "duration": "24m",
    "genres": [
      "Adventure",
      "Drama",
      "Fantasy"
    ],
    "status": "finished",
    "season": "Fall 2023",
    "synopsis": "The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land. But Frieren will long outlive the rest of her former party. How will she come to understand what life means to the people around her? Decades after their victory, the funeral of one her friends confronts Frieren with her own near immortality. Frieren sets out to fulfill the last wishes of her comrades and finds herself beginning a new adventure…"
  },
  {
    "id": "dandadan-19343",
    "slug": "dandadan-19343",
    "anilist_id": 171018,
    "title": "DAN DA DAN",
    "japanese_title": "Dandadan",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx171018-60q1B6GK2Ghb.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-SpwPNAduszXl.jpg",
    "type": "TV",
    "score": 8.3,
    "episodes": 12,
    "sub": 12,
    "dub": 12,
    "eps": 12,
    "eps_released": 12,
    "eps_total": 12,
    "eps_counter": "12/12",
    "duration": "24m",
    "genres": [
      "Action",
      "Comedy",
      "Drama",
      "Romance",
      "Sci-Fi",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Fall 2024",
    "synopsis": "This is a story about Momo, a high school girl who comes from a family of spirit mediums, and her classmate Okarun, an occult fanatic. After Momo rescues Okarun from being bullied, they begin talking. However, an argument ensues between them since Momo believes in ghosts but denies aliens exist, and Okarun believes in aliens but denies ghosts exist. To prove to each other what they believe in is real, Momo goes to an abandoned hospital where a UFO has been spotted and Okarun goes to a tunnel rumored to be haunted. To their surprise, they each encounter overwhelming paranormal activities that transcend comprehension. Amid these predicaments, Momo awakens her hidden power and Okarun gains the power of a curse to overcome these new dangers! Their fateful love begins as well!? The story of the occult battle and adolescence starts! Notes: - Worldwide premiere of Episode 1 before the Japanese television premiere occurred at Anime Expo July 6, 2024. - Episodes 1-3 titled as DAN DA DAN: FIRST ENCOUNTER was pre-screened in advance in theaters on August 31, 2024 in Asia, September 7, 2024 in Europe and September 13, 2024 in North America. The regular TV broadcast began October 4, 2024."
  },
  {
    "id": "jujutsu-kaisen-2nd-season-18413",
    "slug": "jujutsu-kaisen-2nd-season-18413",
    "anilist_id": 145064,
    "title": "JUJUTSU KAISEN Season 2",
    "japanese_title": "Jujutsu Kaisen 2nd Season",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx145064-hSNRJM03pvv1.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-esDtAY2He7sk.jpg",
    "type": "TV",
    "score": 8.6,
    "episodes": 23,
    "sub": 23,
    "dub": 23,
    "eps": 23,
    "eps_released": 23,
    "eps_total": 23,
    "eps_counter": "23/23",
    "duration": "24m",
    "genres": [
      "Action",
      "Drama",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Summer 2023",
    "synopsis": "The past comes to light when second-year students Satoru Gojou and Suguru Getou are tasked with escorting young Riko Amanai to Master Tengen. But when a non-sorcerer user tries to kill them, their mission to protect the Star Plasma Vessel threatens to turn them into bitter enemies and cement their destinies—one as the world’s strongest sorcerer, and the other its most twisted curse user!"
  },
  {
    "id": "demon-slayer-kimetsu-no-yaiba-47",
    "slug": "demon-slayer-kimetsu-no-yaiba-47",
    "anilist_id": 101922,
    "title": "Demon Slayer: Kimetsu no Yaiba",
    "japanese_title": "Kimetsu no Yaiba",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx101922-WBsBl0ClmgYL.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    "type": "TV",
    "score": 8.2,
    "episodes": 26,
    "sub": 26,
    "dub": 26,
    "eps": 26,
    "eps_released": 26,
    "eps_total": 26,
    "eps_counter": "26/26",
    "duration": "24m",
    "genres": [
      "Action",
      "Adventure",
      "Drama",
      "Fantasy",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Spring 2019",
    "synopsis": "It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. Though devastated by this grim reality, Tanjiro resolves to become a “demon slayer” so that he can turn his sister back into a human, and kill the demon that massacred his family."
  },
  {
    "id": "attack-on-titan-112",
    "slug": "attack-on-titan-112",
    "anilist_id": 16498,
    "title": "Attack on Titan",
    "japanese_title": "Shingeki no Kyojin",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg",
    "type": "TV",
    "score": 8.5,
    "episodes": 25,
    "sub": 25,
    "dub": 25,
    "eps": 25,
    "eps_released": 25,
    "eps_total": 25,
    "eps_counter": "25/25",
    "duration": "24m",
    "genres": [
      "Action",
      "Drama",
      "Fantasy",
      "Mystery"
    ],
    "status": "finished",
    "season": "Spring 2013",
    "synopsis": "Several hundred years ago, humans were nearly exterminated by titans. Titans are typically several stories tall, seem to have no intelligence, devour human beings and, worst of all, seem to do it for the pleasure rather than as a food source. A small percentage of humanity survived by walling themselves in a city protected by extremely high walls, even taller than the biggest of titans. Flash forward to the present and the city has not seen a titan in over 100 years. Teenage boy Eren and his foster sister Mikasa witness something horrific as the city walls are destroyed by a colossal titan that appears out of thin air. As the smaller titans flood the city, the two kids watch in horror as their mother is eaten alive. Eren vows that he will murder every single titan and take revenge for all of mankind."
  },
  {
    "id": "chainsaw-man-17406",
    "slug": "chainsaw-man-17406",
    "anilist_id": 127230,
    "title": "Chainsaw Man",
    "japanese_title": "Chainsaw Man",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx127230-DdP4vAdssLoz.png",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-o8IRwCGVr9KW.jpg",
    "type": "TV",
    "score": 8.3,
    "episodes": 12,
    "sub": 12,
    "dub": 12,
    "eps": 12,
    "eps_released": 12,
    "eps_total": 12,
    "eps_counter": "12/12",
    "duration": "24m",
    "genres": [
      "Action",
      "Drama",
      "Horror",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Fall 2022",
    "synopsis": "Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while repaying his debt by harvesting devil corpses with Pochita. One day, Denji is betrayed and killed. As his consciousness fades, he makes a contract with Pochita and gets revived as \"Chainsaw Man\" — a man with a devil's heart."
  },
  {
    "id": "one-piece-100",
    "slug": "one-piece-100",
    "anilist_id": 21,
    "title": "ONE PIECE",
    "japanese_title": "ONE PIECE",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-ELSYx3yMPcKM.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg",
    "type": "TV",
    "score": 8.7,
    "episodes": 12,
    "sub": 12,
    "dub": 12,
    "eps": 12,
    "eps_released": 12,
    "eps_total": 12,
    "eps_counter": "12/12",
    "duration": "24m",
    "genres": [
      "Action",
      "Adventure",
      "Comedy",
      "Drama",
      "Fantasy"
    ],
    "status": "releasing",
    "season": "Fall 1999",
    "synopsis": "Gold Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line. The capture and death of Roger by the World Government brought a change throughout the world. His last words before his death revealed the location of the greatest treasure in the world, One Piece. It was this revelation that brought about the Grand Age of Pirates, men who dreamed of finding One Piece (which promises an unlimited amount of riches and fame), and quite possibly the most coveted of titles for the person who found it, the title of the Pirate King. Enter Monkey D. Luffy, a 17-year-old boy that defies your standard definition of a pirate. Rather than the popular persona of a wicked, hardened, toothless pirate who ransacks villages for fun, Luffy’s reason for being a pirate is one of pure wonder; the thought of an exciting adventure and meeting new and intriguing people, along with finding One Piece, are his reasons of becoming a pirate. Following in the footsteps of his childhood hero, Luffy and his crew travel across the Grand Line, experiencing crazy adventures, unveiling dark mysteries and battling strong enemies, all in order to reach One Piece. *This includes the following special episodes: - Chopperman to the Rescue! Protect the TV Station by the Shore! (Episode 336) - The Strongest Tag-Team! Luffy and Toriko's Hard Struggle! (Episode 492) - Team Formation! Save Chopper (Episode 542) - History's Strongest Collaboration vs. Glutton of the Sea (Episode 590) - 20th Anniversary! Special Romance Dawn (Episode 907)"
  },
  {
    "id": "bleach-thousand-year-blood-war-18150",
    "slug": "bleach-thousand-year-blood-war-18150",
    "anilist_id": 114446,
    "title": "Higurashi: When They Cry - GOU",
    "japanese_title": "Higurashi no Naku Koro ni Gou",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx114446-H6uxjVi8wBoo.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/114446-DTd4xfGx7DJB.jpg",
    "type": "TV",
    "score": 6.9,
    "episodes": 24,
    "sub": 24,
    "dub": 24,
    "eps": 24,
    "eps_released": 24,
    "eps_total": 24,
    "eps_counter": "24/24",
    "duration": "24m",
    "genres": [
      "Drama",
      "Horror",
      "Mystery",
      "Psychological",
      "Supernatural",
      "Thriller"
    ],
    "status": "finished",
    "season": "Fall 2020",
    "synopsis": "New kid Keiichi Maebara is settling into his new home of peaceful Hinamizawa village. Making quick friends with the girls from his school, he's arrived in time for the big festival of the year. But something about this isolated town seems \"off,\" and his feelings of dread continue to grow. With a gnawing fear that he's right, what dark secrets could this small community be hiding?"
  },
  {
    "id": "oshi-no-ko-18342",
    "slug": "oshi-no-ko-18342",
    "anilist_id": 150672,
    "title": "OSHI NO KO",
    "japanese_title": "[Oshi no Ko]",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx150672-WqmmwZ4nMzAy.png",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/150672-ISwoA0eS722H.jpg",
    "type": "TV",
    "score": 8.4,
    "episodes": 11,
    "sub": 11,
    "dub": 11,
    "eps": 11,
    "eps_released": 11,
    "eps_total": 11,
    "eps_counter": "11/11",
    "duration": "24m",
    "genres": [
      "Drama",
      "Mystery",
      "Psychological",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Spring 2023",
    "synopsis": "When a pregnant young starlet appears in Gorou Amemiya’s countryside medical clinic, the doctor takes it upon himself to safely (and secretly) deliver Ai Hoshino’s child so she can make a scandal-free return to the stage. But no good deed goes unpunished, and on the eve of her delivery, he finds himself slain at the hands of Ai’s deluded stalker — and subsequently reborn as Ai’s child, Aquamarine Hoshino! The glitz and glamor of showbiz hide the dark underbelly of the entertainment industry, threatening to dull the shine of his favorite star. Can he help his new mother rise to the top of the charts? And what will he do when unthinkable disaster strikes? Note: Episode 1【推しの子】Mother and Children was pre-screened in advance in Japanese theaters on March 17, 2023. The regular TV broadcast began on April 12, 2023. The first episode has an extended runtime of ~82 minutes."
  },
  {
    "id": "kaiju-no-8-19139",
    "slug": "kaiju-no-8-19139",
    "anilist_id": 153288,
    "title": "Kaiju No. 8",
    "japanese_title": "Kaijuu 8-gou",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx153288-25FBfFJzEQ5O.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/153288-JNsWuMPMAuJL.jpg",
    "type": "TV",
    "score": 8.1,
    "episodes": 12,
    "sub": 12,
    "dub": 12,
    "eps": 12,
    "eps_released": 12,
    "eps_total": 12,
    "eps_counter": "12/12",
    "duration": "24m",
    "genres": [
      "Action",
      "Sci-Fi"
    ],
    "status": "finished",
    "season": "Spring 2024",
    "synopsis": "With the highest kaiju-emergence rates in the world, Japan is no stranger to attack by deadly monsters. Enter the Japan Defense Force, a military organization tasked with the neutralization of kaiju. Kafka Hibino, a kaiju-corpse cleanup man, has always dreamed of joining the force. But when he gets another shot at achieving his childhood dream, he undergoes an unexpected transformation. How can he fight kaiju now that he’s become one himself?!"
  },
  {
    "id": "spy-x-family-17978",
    "slug": "spy-x-family-17978",
    "anilist_id": 140960,
    "title": "SPY x FAMILY",
    "japanese_title": "SPY×FAMILY",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx140960-Kb6R5nYQfjmP.jpg",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-Z7xSvkRxHKfj.jpg",
    "type": "TV",
    "score": 8.3,
    "episodes": 12,
    "sub": 12,
    "dub": 12,
    "eps": 12,
    "eps_released": 12,
    "eps_total": 12,
    "eps_counter": "12/12",
    "duration": "24m",
    "genres": [
      "Action",
      "Comedy",
      "Slice of Life",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Spring 2022",
    "synopsis": "Everyone has a part of themselves they cannot show to anyone else. At a time when all nations of the world were involved in a fierce war of information happening behind closed doors, Ostania and Westalis had been in a state of cold war against one another for decades. The Westalis Intelligence Services' Eastern-Focused Division (WISE) sends their most talented spy, \"Twilight,\" on a top-secret mission to investigate the movements of Donovan Desmond, the chairman of Ostania's National Unity Party, who is threatening peace efforts between the two nations. This mission is known as \"Operation Strix.\" It consists of \"putting together a family in one week in order to infiltrate social gatherings organized by the elite school that Desmond's son attends.\" \"Twilight\" takes on the identity of psychiatrist Loid Forger and starts looking for family members. But Anya, the daughter he adopts, turns out to have the ability to read people's minds, while his wife, Yor, is an assassin! With it being in each of their own interests to keep these facts hidden, they start living together while concealing their true identities from one another. World peace is now in the hands of this brand-new family as they embark on an adventure full of surprises."
  },
  {
    "id": "bocchi-the-rock-18153",
    "slug": "bocchi-the-rock-18153",
    "anilist_id": 146065,
    "title": "Mushoku Tensei: Jobless Reincarnation Season 2",
    "japanese_title": "Mushoku Tensei II: Isekai Ittara Honki Dasu",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx146065-IjirxRK26O03.png",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/146065-33RDijfuxLLk.jpg",
    "type": "TV",
    "score": 8.1,
    "episodes": 13,
    "sub": 13,
    "dub": 13,
    "eps": 13,
    "eps_released": 13,
    "eps_total": 13,
    "eps_counter": "13/13",
    "duration": "24m",
    "genres": [
      "Adventure",
      "Drama",
      "Ecchi",
      "Fantasy"
    ],
    "status": "finished",
    "season": "Summer 2023",
    "synopsis": "After his relationship with Eris Boreas Greyrat reaches new heights, Rudeus Greyrat is ecstatic. Unfortunately, his joy is short-lived, as Eris suddenly abandons him to embark on her own journey. Believing that Eris has lost all interest in him, a heartbroken and depressed Rudeus sets forth to the Northern Territories. With his sole goal being to locate his mother on the vast continent, Rudeus wonders if persisting through daily life is worth the pain, falling into a robotic routine as he endlessly ruminates on his lost love. However, the dangers of the North soon prove that one cannot survive with a dulled mind. While on a quest with the party Counter Arrow, with whom he recently became acquainted, Rudeus has a brush with death—an experience that forces him to finally snap out of his despair. With his newfound teammates, Rudeus rediscovers the pleasure of daily adventuring and moves forward with his original goal of living his second lease on life to the fullest. Note: Includes episode 0, Shugo Jutsushi Fitz."
  },
  {
    "id": "blue-lock-vs-u-20-japan-19342",
    "slug": "blue-lock-vs-u-20-japan-19342",
    "anilist_id": 163146,
    "title": "BLUE LOCK Season 2",
    "japanese_title": "Blue Lock VS. U-20 JAPAN",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx163146-BVZPgyzkqi82.png",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/163146-HIz04v1Or7He.jpg",
    "type": "TV",
    "score": 7.5,
    "episodes": 14,
    "sub": 14,
    "dub": 14,
    "eps": 14,
    "eps_released": 14,
    "eps_total": 14,
    "eps_counter": "14/14",
    "duration": "24m",
    "genres": [
      "Action",
      "Drama",
      "Sports"
    ],
    "status": "finished",
    "season": "Fall 2024",
    "synopsis": "The hottest soccer matches start again as the U-20 Japan National Team makes their debut!"
  },
  {
    "id": "demon-slayer-kimetsu-no-yaiba-hashira-training-arc-19146",
    "slug": "demon-slayer-kimetsu-no-yaiba-hashira-training-arc-19146",
    "anilist_id": 166240,
    "title": "Demon Slayer: Kimetsu no Yaiba Hashira Training Arc",
    "japanese_title": "Kimetsu no Yaiba: Hashira Geiko-hen",
    "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx166240-PBV7zukIHW7V.png",
    "backdrop": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/166240-YdxoEhrfwNk0.jpg",
    "type": "TV",
    "score": 7.9,
    "episodes": 8,
    "sub": 8,
    "dub": 8,
    "eps": 8,
    "eps_released": 8,
    "eps_total": 8,
    "eps_counter": "8/8",
    "duration": "24m",
    "genres": [
      "Action",
      "Adventure",
      "Drama",
      "Fantasy",
      "Supernatural"
    ],
    "status": "finished",
    "season": "Spring 2024",
    "synopsis": "The Hashira, the Demon Slayer Corps' highest ranking swordsmen and members. The Hashira Training has begun in order to face the forthcoming battle against Muzan Kibutsuji. Each with their own thoughts and hopes held in their hearts, a new story for Tanjiro and the Hashira begins. Note: The first episode received an early premiere in cinemas as part of a special screening alongside the final episode of Kimetsu no Yaiba: Katanakaji no Sato-hen."
  }
];

  // Metadata pemetaan ID eksternal (TMDB, MAL, Season) untuk sinkronisasi embed anime asli
  var ANIME_METADATA = {
    "solo-leveling-season-2-arise-from-the-shadows-19413": { tmdb_id: 127532, mal_id: 58567, season_num: 2 },
    "frieren-beyond-journeys-end-18418": { tmdb_id: 209867, mal_id: 52991, season_num: 1 },
    "dandadan-19343": { tmdb_id: 240411, mal_id: 57334, season_num: 1 },
    "jujutsu-kaisen-2nd-season-18413": { tmdb_id: 95479, mal_id: 51009, season_num: 2 },
    "demon-slayer-kimetsu-no-yaiba-47": { tmdb_id: 85937, mal_id: 38000, season_num: 1 },
    "attack-on-titan-112": { tmdb_id: 1429, mal_id: 16498, season_num: 1 },
    "chainsaw-man-17406": { tmdb_id: 114410, mal_id: 44511, season_num: 1 },
    "one-piece-100": { tmdb_id: 37854, mal_id: 21, season_num: 1 },
    "bleach-thousand-year-blood-war-18150": { tmdb_id: 100100, mal_id: 41006, season_num: 1 },
    "oshi-no-ko-18342": { tmdb_id: 203737, mal_id: 52034, season_num: 1 },
    "kaiju-no-8-19139": { tmdb_id: 207347, mal_id: 52588, season_num: 1 },
    "spy-x-family-17978": { tmdb_id: 120089, mal_id: 50265, season_num: 1 },
    "bocchi-the-rock-18153": { tmdb_id: 99578, mal_id: 51179, season_num: 2 },
    "blue-lock-vs-u-20-japan-19342": { tmdb_id: 199951, mal_id: 54865, season_num: 2 },
    "demon-slayer-kimetsu-no-yaiba-hashira-training-arc-19146": { tmdb_id: 85937, mal_id: 55701, season_num: 4 }
  };

  // Multi-server embed provider mapping untuk anime asli (VidLink, VidSrc, AutoEmbed, Embed.su, 2Embed)
  function getEmbedServers(item, ep, mode){
    ep = parseInt(ep) || 1;
    var anilistId = (item && item.anilist_id) || 176496;
    var meta = (item && item.slug && ANIME_METADATA[item.slug]) || {};
    var tmdbId = (item && item.tmdb_id) || meta.tmdb_id || anilistId;
    var sNum = (item && item.season_num) || meta.season_num || 1;
    var m = (mode === "dub") ? "dub" : "sub";

    return [
      {
        id: "vidlink",
        name: "Server 1: VidLink (Multi-Sub HD)",
        type: "iframe",
        url: "https://vidlink.pro/anime/" + anilistId + "/" + ep + "/" + m
      },
      {
        id: "vidsrc_cc",
        name: "Server 2: VidSrc CC (Fast Stream)",
        type: "iframe",
        url: "https://vidsrc.cc/v2/embed/anime/" + anilistId + "/" + ep + "/" + m
      },
      {
        id: "autoembed",
        name: "Server 3: AutoEmbed (Global CDN)",
        type: "iframe",
        url: "https://player.autoembed.cc/embed/anime/" + anilistId + "/" + ep
      },
      {
        id: "embedsu",
        name: "Server 4: Embed.su (Multi-Track)",
        type: "iframe",
        url: "https://embed.su/embed/anime/" + anilistId + "/" + ep
      },
      {
        id: "vidsrc_xyz",
        name: "Server 5: VidSrc.xyz (Cloud Backup)",
        type: "iframe",
        url: "https://vidsrc.xyz/embed/anime?anilist=" + anilistId + "&ep=" + ep
      },
      {
        id: "twoembed",
        name: "Server 6: 2Embed (TMDB TV)",
        type: "iframe",
        url: "https://www.2embed.cc/embedtv/" + tmdbId + "&s=" + sNum + "&e=" + ep
      }
    ];
  }

  // Enrich setiap anime di ITEMS dengan metadata & server embed anime asli
  ITEMS.forEach(function(it){
    var meta = ANIME_METADATA[it.slug] || {};
    it.tmdb_id = it.tmdb_id || meta.tmdb_id;
    it.mal_id = it.mal_id || meta.mal_id;
    it.season_num = it.season_num || meta.season_num || 1;
    var srvs = getEmbedServers(it, 1, "sub");
    it.embed_servers = srvs;
    it.embed_url = srvs[0].url;
    it.stream_url = srvs[0].url;
  });

  // Map slug ke objek item cepat
  var ITEM_MAP = {};
  ITEMS.forEach(function(it){ ITEM_MAP[it.slug] = it; });

  // 1. Hero Spotlight Items (5 Top Highlights dengan banner/backdrop lebar & embed stream anime asli)
  var HERO_ITEMS = ITEMS.slice(0, 5).map(function(it){
    var srvs = getEmbedServers(it, 1, "sub");
    return Object.assign({}, it, {
      spotlight: true,
      quality: "HD 1080p",
      badge: it.status === "releasing" ? "SEDANG TAYANG" : "LENGKAP",
      embed_url: srvs[0].url,
      stream_url: srvs[0].url,
      embed_servers: srvs
    });
  });

  // 2. Catalog Rails per Kategori
  var RAILS = [
    {
      id: "trending",
      title: "🔥 Sedang Tren Minggu Ini",
      subtitle: "Anime paling ramai ditonton komunitas",
      items: ITEMS.slice(0, 8)
    },
    {
      id: "seasonal",
      title: "🌸 Tayang Musim Ini",
      subtitle: "Episode terbaru yang sedang on-going",
      items: ITEMS.filter(function(it){ return it.status === "releasing" || it.season.indexOf("2024") >= 0 || it.season.indexOf("2025") >= 0; }).slice(0, 8)
    },
    {
      id: "top_rated",
      title: "⭐ Rating Tertinggi Sepanjang Masa",
      subtitle: "Karya mahakarya dengan review legendaris",
      items: ITEMS.slice().sort(function(a,b){ return (b.score||0) - (a.score||0); }).slice(0, 8)
    },
    {
      id: "action",
      title: "⚔️ Action & Shounen Terbaik",
      subtitle: "Pertarungan epik tanpa henti",
      items: ITEMS.filter(function(it){ return it.genres.indexOf("Action") >= 0; }).slice(0, 8)
    },
    {
      id: "fantasy",
      title: "🔮 Petualangan & Fantasi",
      subtitle: "Dunia lain, sihir, dan eksplorasi tak terbatas",
      items: ITEMS.filter(function(it){ return it.genres.indexOf("Fantasy") >= 0 || it.genres.indexOf("Adventure") >= 0; }).slice(0, 8)
    }
  ];

  // Helper untuk membuat daftar episode mock yang dinamis dengan embed video stream asli
  function generateEpisodes(slug){
    var item = ITEM_MAP[slug] || ITEMS[0];
    var count = item.eps_total || item.episodes || 12;
    var list = [];
    for(var i = 1; i <= count; i++){
      var srvs = getEmbedServers(item, i, "sub");
      list.push({
        ep: i,
        title: "Episode " + i,
        id: slug + "?ep=" + i,
        embedUrl: srvs[0].url,
        embed_url: srvs[0].url,
        master: srvs[0].url,
        servers: srvs,
        intro: { start: 90, end: 175 },
        outro: { start: 1320, end: 1410 }
      });
    }
    return list;
  }

  // Helper untuk resolve stream anime ASLI (Multi-Server Embed & Native HLS master)
  function resolveFallbackStream(slug, ep, mode){
    ep = parseInt(ep) || 1;
    mode = (mode === "dub") ? "dub" : "sub";
    var item = ITEM_MAP[slug] || ITEMS[0];
    var servers = getEmbedServers(item, ep, mode);
    var primary = servers[0];
    var embedUrl = primary.url;
    // ponytail: fallback m3u8 native untuk Server 2; upgrade ke direct scrapers saat backend aktif
    var masterHls = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

    return {
      success: true,
      data: {
        slug: slug,
        episode: ep,
        mode: mode,
        source: "embed-multiserver",
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
        variants: [
          { q: "1080p", url: embedUrl },
          { q: "720p", url: (servers[1] ? servers[1].url : embedUrl) },
          { q: "480p", url: (servers[2] ? servers[2].url : embedUrl) }
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
  }

  // Search filter
  function searchFallback(query){
    var q = (query || "").toLowerCase().trim();
    if(!q) return [];
    return ITEMS.filter(function(it){
      var t = (it.title || "").toLowerCase();
      var jt = (it.japanese_title || "").toLowerCase();
      var g = (it.genres || []).join(" ").toLowerCase();
      return t.indexOf(q) >= 0 || jt.indexOf(q) >= 0 || g.indexOf(q) >= 0;
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

})(window);
