// Dihasilkan dari vocab/pron.js — isi data tidak diubah. Dieksekusi dengan objek "window" lokal (bukan global).
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{}; var VOCAB_L=window.VOCAB_L=window.VOCAB_L||{};
// Materi pelafalan, connected speech, dan strategi saat mentok.
window.VOCAB_PRON={
// Bunyi yang sulit bagi penutur Indonesia. pairs: [kata, lafal kasar] untuk latihan minimal pair.
sounds:[
{sym:'/θ/ · /ð/',name:'th',tip:'Lidah menyentuh belakang gigi atas, udara lewat celah. /θ/ tanpa getar (think), /ð/ bergetar (this). Jangan diganti t/d.',pairs:[['think','tink ✗'],['three','tree ✗'],['this','dis ✗'],['they','dey ✗'],['bath','bat ✗'],['month','mont ✗']]},
{sym:'/v/ vs /f/',name:'v · f',tip:'Keduanya bibir bawah menyentuh gigi atas. /v/ pita suara bergetar (pegang leher), /f/ tidak.',pairs:[['very','fery ✗'],['have','haf ✗'],['leave','leaf'],['save','safe'],['van','fan'],['believe','belief']]},
{sym:'/ʃ/ vs /s/',name:'sh · s',tip:'/ʃ/ bibir maju, lidah agak ke belakang. Penutur Indonesia sering menyamakan keduanya.',pairs:[['she','see'],['ship','sip'],['shock','sock'],['sheet','seat'],['wish','wis ✗'],['finish','finis ✗']]},
{sym:'/iː/ vs /ɪ/',name:'vokal panjang · pendek',tip:'Beda makna, bukan hanya panjang. /iː/ bibir tegang senyum, /ɪ/ rileks dan pendek.',pairs:[['sheet','shit'],['beach','bitch'],['leave','live'],['feel','fill'],['seat','sit'],['peace','piss']]},
{sym:'/æ/ vs /e/ vs /ʌ/',name:'a · e · u',tip:'bad /æ/ mulut lebar ke bawah, bed /e/ netral, bud /ʌ/ pendek di tengah. Jangan semua jadi "e".',pairs:[['bad','bed'],['man','men'],['cat','cut'],['bat','but'],['hat','hut'],['sad','said']]},
{sym:'/z/',name:'z bergetar',tip:'Akhiran -s setelah bunyi bersuara dibaca /z/, bukan /s/: dogs, goes, is, was, please.',pairs:[['is','iss ✗'],['please','pleass ✗'],['does','doess ✗'],['always','alwayss ✗'],['news','newss ✗'],['because','becauss ✗']]},
{sym:'/r/ · /l/',name:'r di akhir kata',tip:'AmE: r di akhir terdengar lembut (car, her, work), bukan digetarkan seperti "r" Indonesia. BrE: hampir hilang.',pairs:[['car','kar ✗ (getar)'],['work','werk'],['her','hur'],['first','furst'],['world','wurld'],['girl','gurl']]},
{sym:'/w/ vs /v/',name:'w bukan v',tip:'/w/ bibir bulat tanpa menyentuh gigi. Penutur Indonesia aman di sini, tapi sering terbalik saat mengejar /v/.',pairs:[['wine','vine'],['west','vest'],['wet','vet'],['while','vile'],['worse','verse'],['wary','very']]}
],
// Akhiran -ed
ed:[
{rule:'/t/',when:'setelah bunyi tak bersuara: p, k, s, sh, ch, f',ex:['stopped','worked','missed','washed','watched','laughed']},
{rule:'/d/',when:'setelah bunyi bersuara dan vokal: b, g, v, z, l, m, n, r, vokal',ex:['played','lived','called','planned','opened','tried']},
{rule:'/ɪd/',when:'hanya setelah t atau d',ex:['wanted','needed','started','decided','visited','ended']}
],
// Word stress: suku kata kapital = ditekan
stress:[
{rule:'Kata benda 2 suku kata: tekanan biasanya di depan',ex:['TAble','OFfice','PROblem','MEEting','PROject (n)','REcord (n)']},
{rule:'Kata kerja 2 suku kata: tekanan biasanya di belakang',ex:['deCIDE','beGIN','forGET','reLAX','proJECT (v)','reCORD (v)']},
{rule:'-tion / -sion / -ic: tekanan tepat sebelum akhiran',ex:['inforMAtion','deCIsion','ecoNOmic','presenTAtion','disCUSsion','speCIfic']},
{rule:'-ity / -graphy / -logy: tekanan 3 suku dari belakang',ex:['aBIlity','phoTOgraphy','techNOlogy','responsiBIlity','oppor TUnity','psyCHOlogy']},
{rule:'Sering salah oleh penutur Indonesia',ex:['deVElop (bukan DEvelop)','HOtel → hoTEL','comFORtable → COMftable','inTERESting → INteresting','vegeTAble → VEGtable','CATegory → KAtegori ✗']}
],
// Sentence stress & intonasi
intonation:[
{name:'Tekankan kata isi, lemahkan kata fungsi',tip:'Kata benda, kerja utama, sifat, keterangan = kuat. Artikel, preposisi, to be, kata ganti = lemah dan cepat.',ex:[['I WENT to the OFfice this MORning.','a, the, to, this hampir tak terdengar'],['She DOESn\'t LIKE COFfee.','n\'t ikut ditekan karena membawa makna negatif']]},
{name:'Pertanyaan ya/tidak: naik di akhir',tip:'Do you…? Are you…? Have you…? nada naik di kata terakhir.',ex:[['Are you COming? ↗',''],['Do you have a MInute? ↗','']]},
{name:'Pertanyaan WH: turun di akhir',tip:'What, where, when, why, how: nada turun seperti pernyataan.',ex:[['WHERE do you WORK? ↘',''],['HOW long have you been HERE? ↘','']]},
{name:'Daftar: naik, naik, turun',tip:'Setiap item naik, item terakhir turun sebagai penutup.',ex:[['I need EGGS ↗, MILK ↗, and BREAD ↘.','']]},
{name:'Pindahkan tekanan untuk mengubah maksud',tip:'Kalimat sama, tekanan beda, arti beda.',ex:[['I didn\'t say HE took it.','orang lain yang ambil'],['I didn\'t SAY he took it.','aku tidak bilang, tapi mungkin berpikir'],['I didn\'t say he took IT.','dia ambil sesuatu yang lain']]}
],
// Connected speech: [bentuk cepat, bentuk penuh, lafal, contoh]
connected:[
{name:'Pelemahan (reductions)',tip:'Lazim dalam bicara santai. Boleh dipakai saat bicara, jangan saat menulis formal.',items:[['gonna','going to','GA-na','I\'m gonna call him later.'],['wanna','want to','WA-na','Do you wanna grab lunch?'],['gotta','got to / have to','GA-da','I gotta go.'],['lemme','let me','LE-mi','Lemme check.'],['gimme','give me','GI-mi','Gimme a second.'],['dunno','don\'t know','de-NO','I dunno, maybe.'],['kinda','kind of','KAIN-da','It\'s kinda late.'],['sorta','sort of','SOR-da','I sorta agree.'],['outta','out of','AU-da','We\'re outta time.'],['lotta','lot of','LA-da','There\'s a lotta work.'],['whaddya','what do you','WA-dya','Whaddya think?'],['ya','you','ya','See ya!'],['\'cause','because','koz','I stayed \'cause it rained.'],['\'em','them','em','Tell \'em I\'m coming.']]},
{name:'Kontraksi ganda & lemah',tip:'Penutur asli hampir selalu memakai kontraksi. Tanpa kontraksi terdengar kaku atau marah.',items:[['I\'d\'ve','I would have','AI-dev','I\'d\'ve called if I knew.'],['shouldn\'t\'ve','should not have','SYU-den-ev','You shouldn\'t\'ve done that.'],['could\'ve','could have','KU-dev','It could\'ve been worse.'],['must\'ve','must have','MAS-tev','He must\'ve left.'],['who\'s','who is / who has','huz','Who\'s coming?'],['there\'s','there is','derz','There\'s a problem.'],['that\'ll','that will','DE-tel','That\'ll work.'],['it\'d','it would','I-ted','It\'d be nice.']]},
{name:'Linking (menyambung)',tip:'Konsonan akhir menyambung ke vokal awal kata berikutnya. Ini alasan ucapan cepat sulit ditangkap.',items:[['an apple','an apple','a-NA-pel','I ate an apple.'],['turn it off','turn it off','tur-ni-TOF','Turn it off, please.'],['pick it up','pick it up','pi-ki-TAP','Can you pick it up?'],['come on','come on','ka-MON','Come on, let\'s go.'],['not at all','not at all','no-ta-TOL','Not at all.'],['far away','far away','fa-ra-WEI','It\'s far away.'],['go on','go on','go-WON','Go on, I\'m listening.'],['do it','do it','du-WIT','Just do it.']]},
{name:'Bunyi yang hilang & melebur',tip:'t/d di akhir sering hilang; t+y → ch, d+y → j.',items:[['next week','next week','neks-WIK','See you next week.'],['must be','must be','mas-BI','It must be late.'],['don\'t you','don\'t you','DON-cu','Don\'t you like it?'],['would you','would you','WU-ju','Would you mind?'],['did you','did you','DI-ju','Did you see that?'],['what are you','what are you','wa-DER-ya','What are you doing?'],['I don\'t know','I don\'t know','ai-de-NO','I don\'t know yet.'],['want to','want to','WA-na','I want to go.']]}
],
// Strategi saat mentok: [frasa, arti, contoh, catatan]
stuck:[
{name:'Beli waktu (biar tidak hening)',tip:'Isi jeda dengan frasa, bukan "eee". Lawan bicara tahu kamu sedang berpikir.',items:[['Let me think…','Coba aku pikir…','Let me think… I\'d say around fifty.',''],['How do I put this…','Gimana ya bilangnya…','How do I put this… it\'s complicated.',''],['That\'s a good question.','Pertanyaan bagus.','That\'s a good question. I think…','beli 2 detik'],['Well, …','Hmm, …','Well, it depends on the budget.','filler netral'],['You know what I mean?','Ngerti maksudku?','It\'s kind of heavy, you know what I mean?','cek pemahaman'],['What\'s the word…','Apa ya kata nya…','What\'s the word… flexible, yes.','']]},
{name:'Menjelaskan kata yang lupa',tip:'Deskripsikan: fungsi, bentuk, tempat, kategori. Lawan bicara biasanya menebak kata itu untuk kamu.',items:[['It\'s a thing you use to…','Benda yang dipakai untuk…','It\'s a thing you use to open bottles.','→ bottle opener'],['It\'s like a …, but …','Seperti …, tapi …','It\'s like a taxi, but you share it.','→ shuttle'],['It\'s the opposite of…','Kebalikan dari…','It\'s the opposite of expensive.','→ cheap'],['It\'s a kind of…','Sejenis…','It\'s a kind of fruit, yellow, sour.','→ lemon'],['The person who…','Orang yang…','The person who fixes pipes.','→ plumber'],['I forgot the word, but…','Aku lupa katanya, tapi…','I forgot the word, but it\'s where you park.','→ parking lot'],['What do you call it?','Apa namanya?','The thing on the roof, what do you call it?','']]},
{name:'Memperbaiki diri',tip:'Salah itu normal. Perbaiki singkat, lanjut bicara. Jangan minta maaf panjang.',items:[['Sorry, I mean…','Maaf, maksudku…','I went… sorry, I mean I\'m going tomorrow.',''],['Let me rephrase that.','Biar aku ulang.','Let me rephrase that. The plan is simple.',''],['What I meant was…','Yang aku maksud…','What I meant was, it\'s optional.',''],['Actually, scratch that.','Sebenarnya, lupakan itu.','Actually, scratch that. Let\'s start over.','kasual'],['Or rather, …','Atau lebih tepatnya, …','It\'s cheap, or rather, affordable.','']]},
{name:'Minta lawan bicara membantu',tip:'Lebih baik minta ulang daripada pura-pura paham.',items:[['Could you slow down a bit?','Bisa pelan sedikit?','Sorry, could you slow down a bit?',''],['Sorry, I didn\'t catch that.','Maaf, aku tidak dengar.','Sorry, I didn\'t catch that. The address?',''],['Could you spell that?','Bisa dieja?','Could you spell that for me?','nama, email'],['Do you mean…?','Maksudmu…?','Do you mean the one on the left?','cek pemahaman'],['So, in other words, …?','Jadi, dengan kata lain, …?','So, in other words, it\'s cancelled?','parafrase untuk memastikan'],['Is that right?','Benar begitu?','We meet at nine, is that right?','']]},
{name:'Menyederhanakan',tip:'Kalau kalimat panjang tersendat, pecah jadi dua kalimat pendek. Fluent bukan berarti kalimat panjang.',items:[['Basically, …','Intinya, …','Basically, it didn\'t work.',''],['In short, …','Singkatnya, …','In short, we need more time.',''],['The point is…','Poinnya adalah…','The point is, we\'re late.',''],['Long story short, …','Singkat cerita, …','Long story short, I missed the flight.','']]}
]
};

}
