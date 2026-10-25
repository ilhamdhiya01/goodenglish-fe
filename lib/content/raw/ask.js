// Dihasilkan dari vocab/ask.js — isi data tidak diubah. Dieksekusi dengan objek "window" lokal (bukan global).
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{}; var VOCAB_L=window.VOCAB_L=window.VOCAB_L||{};
// Materi "Cara bertanya": 4 rumus kalimat tanya, dijabarkan per langkah + cheat sheet.
window.VOCAB_ASK={
intro:'Dalam bahasa Indonesia cukup naikkan intonasi: "Kamu suka kopi?" Dalam bahasa Inggris, kalimat tanya wajib punya kata bantu (auxiliary) di depan subjek. Semua bertumpu pada satu pertanyaan: kata bantunya apa? Klik satu rumus untuk dibedah pelan-pelan.',
// Cheat sheet: satu baris per rumus, cukup untuk diingat saat bicara
cheat:[
 ['1','Yes / No','Kata bantu + S + V + …?','Do you like coffee?'],
 ['2','WH','WH + Kata bantu + S + V + …?','Where do you live?'],
 ['3','Tanya subjek','Who / What + V + …?  (tanpa kata bantu)','Who called you?'],
 ['4','Sopan / tidak langsung','Pembuka + WH/if + S + V  (urutan normal)','Could you tell me where the station is?']
],
auxCheat:[
 ['BE','am · is · are · was · were','pindahkan ke depan'],
 ['HAVE','have · has · had (arti: sudah)','pindahkan ke depan'],
 ['Modal','can · could · will · would · shall · should · must · may · might','pindahkan ke depan'],
 ['DO','do · does · did','tambahkan kalau tidak ada yang lain; V kembali dasar']
],
aux:[
 {fam:'BE',mean:'adalah / sedang / keadaan',now:'am (I) · is (he, she, it) · are (you, we, they)',past:'was (I, he, she, it) · were (you, we, they)',ex:'She is happy. → Is she happy?'},
 {fam:'DO',mean:'tidak punya arti; cadangan untuk kalimat tanpa kata bantu lain',now:'do (I, you, we, they) · does (he, she, it)',past:'did (semua subjek)',ex:'You like tea. → Do you like tea?'},
 {fam:'HAVE',mean:'sudah / telah',now:'have (I, you, we, they) · has (he, she, it)',past:'had (semua subjek)',ex:'You have finished. → Have you finished?',note:'Kalau have berarti "punya" (I have a car), ia kata kerja biasa → tanyanya pakai do: Do you have a car?'},
 {fam:'Modal',mean:'menambah makna; bentuk tidak pernah berubah, tidak ada -s',now:'can (bisa) · will (akan) · shall (akan, tawaran) · should (sebaiknya) · must (harus) · may (boleh / mungkin) · might (mungkin)',past:'could (bisa lampau / bisakah, sopan) · would (akan lampau / maukah, sopan)',ex:'He can swim. → Can he swim?'}
],
// Tiap rumus: ringkas (kartu tertutup) + detail (saat dibuka)
rules:[
 {id:'r1',no:'Rumus 1',title:'Pertanyaan Yes / No',formula:'Kata bantu + Subjek + Kata kerja + …?',short:'Jawabannya ya atau tidak. Kata bantu pindah / ditambah ke depan subjek.',
  idea:'Kalimat tanya Yes/No hanya membalik posisi: kata bantu yang tadinya setelah subjek pindah ke depan subjek. Kalau kalimatnya belum punya kata bantu, kita pinjam keluarga DO.',
  steps:[
   {t:'Cek: kalimatnya sudah punya kata bantu?',b:'Lihat kalimat pernyataannya. Ada am / is / are / was / were / can / will / should / have / has? Kalau ada, cukup pindahkan kata itu ke depan. Tidak ada yang lain berubah.',ex:[['You are tired.','Are you tired?'],['She is a teacher.','Is she a teacher?'],['They were at home.','Were they at home?'],['He can drive.','Can he drive?'],['You will come.','Will you come?']]},
   {t:'Kalau tidak ada, tambahkan DO / DOES / DID',b:'Kalimat seperti "You like coffee" hanya punya kata kerja biasa (like). Kita tidak bisa memindahkan like ke depan (✗ Like you coffee?). Pilih kata bantunya dari waktu dan subjek: sekarang + I/you/we/they → do; sekarang + he/she/it → does; lampau, semua subjek → did.',ex:[['You like coffee.','Do you like coffee?'],['She works here.','Does she work here?'],['They went home.','Did they go home?']]},
   {t:'Aturan emas: setelah do/does/did, kata kerja kembali ke bentuk dasar',b:'Informasi "-s" dan "bentuk lampau" sudah diambil oleh does dan did. Kata kerjanya tidak perlu membawanya lagi. works → work, went → go, bought → buy.',ex:[['She works here.','Does she work here?  (bukan works)'],['They went home.','Did they go home?  (bukan went)'],['He bought a car.','Did he buy a car?  (bukan bought)']]},
   {t:'Menjawabnya: pakai kata bantu yang sama',b:'Jawaban pendek mengulang kata bantu pertanyaan, tidak mengulang kata kerjanya.',ex:[['Are you tired?','Yes, I am. / No, I\'m not.'],['Can he drive?','Yes, he can. / No, he can\'t.'],['Does she work here?','Yes, she does. / No, she doesn\'t.'],['Did they go home?','Yes, they did. / No, they didn\'t.']]}
  ],
  traps:[['Does she works here?','Does she work here?','"-s" dobel: sudah ada di does'],['Did you went?','Did you go?','lampau dobel: sudah ada di did'],['You like coffee?','Do you like coffee?','intonasi saja tidak cukup, butuh kata bantu'],['Have you a car?','Do you have a car?','have = punya adalah kata kerja biasa']],
  summary:'Kalau sudah ada kata bantu, pindahkan. Kalau belum ada, tambahkan do/does/did lalu kembalikan kata kerjanya ke bentuk dasar.',
  drill:[['You are hungry.','Are you hungry?','Langkah 1: are dipindah ke depan'],['He plays football.','Does he play football?','Langkah 2: does, plays → play'],['We can start now.','Can we start now?','Langkah 1: can dipindah'],['She bought a new phone.','Did she buy a new phone?','Langkah 2: did, bought → buy'],['They live in Surabaya.','Do they live in Surabaya?','Langkah 2: do'],['You have finished the report.','Have you finished the report?','Langkah 1: have (sudah) dipindah']]},

 {id:'r2',no:'Rumus 2',title:'Pertanyaan WH',formula:'WH + Kata bantu + Subjek + Kata kerja + …?',short:'Menanyakan informasi: what, where, when, why, how, which, who. Rumus 1 ditambah kata tanya di depan.',
  idea:'Rumus 2 bukan rumus baru. Ia adalah Rumus 1 yang diberi kata tanya di paling depan. Jadi kalau Rumus 1 sudah lancar, Rumus 2 tinggal satu langkah lagi.',
  steps:[
   {t:'Buat pertanyaan Yes/No-nya dulu (Rumus 1)',b:'Ambil kalimat pernyataan, ubah jadi pertanyaan Yes/No seperti biasa. Ini memastikan kata bantu dan bentuk kata kerjanya sudah benar.',ex:[['You live in Solo.','Do you live in Solo?'],['She called yesterday.','Did she call yesterday?'],['You are learning English for work.','Are you learning English for work?']]},
   {t:'Ganti bagian yang ditanyakan dengan kata tanya, taruh di depan',b:'Bagian yang ingin kamu tanyakan (in Solo, yesterday, for work) dihapus, lalu kata tanyanya ditaruh di paling depan. Sisa kalimatnya tidak berubah.',ex:[['Do you live in Solo?','Where do you live?'],['Did she call yesterday?','When did she call?'],['Are you learning English for work?','Why are you learning English?'],['Have you studied for two months?','How long have you studied?']]},
   {t:'Pilih kata tanya yang tepat',b:'what = apa · where = di mana · when = kapan · why = kenapa · how = bagaimana · which = yang mana (dari pilihan) · who = siapa · how long = berapa lama · how often = seberapa sering · how much / many = berapa banyak · what time = jam berapa.',ex:[['How long have you lived here?','berapa lama'],['How often do you exercise?','seberapa sering'],['Which one do you prefer?','yang mana'],['What time does it start?','jam berapa']]},
   {t:'Kata tanya bisa membawa kata benda',b:'What time, which bus, how many people: kata tanya + kata bendanya tetap satu paket di depan, lalu kata bantu.',ex:[['What time does the class start?','jam berapa'],['Which bus goes to the airport?','bus yang mana (lihat Rumus 3: which bus jadi subjek)'],['How many people came?','berapa orang (subjek → Rumus 3)']]}
  ],
  traps:[['Where you go?','Where do you go?','kata bantu hilang'],['You are from where?','Where are you from?','kata tanya harus di depan'],['Why she is late?','Why is she late?','kata bantu harus sebelum subjek'],['What means this word?','What does this word mean?','means → does … mean']],
  summary:'Rumus 1 dulu, lalu taruh kata tanya di paling depan. Bagian yang ditanyakan hilang dari kalimat.',
  drill:[['She lives in Jakarta. → tanyakan di mana','Where does she live?','Rumus 1: Does she live in Jakarta? → Where does she live?'],['They finished the project last week. → tanyakan kapan','When did they finish the project?','did, finished → finish'],['He has worked here for three years. → tanyakan berapa lama','How long has he worked here?','has dipindah ke depan'],['You are leaving because of the traffic. → tanyakan kenapa','Why are you leaving?','are dipindah'],['The meeting starts at 9. → tanyakan jam berapa','What time does the meeting start?','starts → does … start'],['She likes the blue one. → tanyakan yang mana','Which one does she like?','likes → does … like']]},

 {id:'r3',no:'Rumus 3',title:'Bertanya tentang subjek',formula:'Who / What + Kata kerja + …?   (tanpa kata bantu)',short:'Pengecualian: kalau yang ditanyakan adalah pelakunya sendiri, tidak ada do/does/did dan kata kerjanya tidak berubah.',
  idea:'Setiap kalimat punya subjek (pelaku) dan objek (yang dikenai). Kalau yang tidak kamu tahu adalah subjeknya, kata tanya langsung menggantikan posisi subjek, dan kalimat lainnya tetap seperti kalimat pernyataan.',
  steps:[
   {t:'Tentukan: yang ditanyakan subjek atau objek?',b:'Tulis kalimat pernyataannya, tandai subjek (yang melakukan) dan objek (yang dikenai). "Someone called you": someone = subjek, you = objek.',ex:[['Someone called you.','subjek: someone · objek: you'],['You called someone.','subjek: you · objek: someone'],['Something happened.','subjek: something · tidak ada objek']]},
   {t:'Kalau subjek yang ditanyakan: ganti dengan who/what, selesai',b:'Tidak ada kata bantu yang ditambahkan, tidak ada yang dipindah. Kata kerjanya tetap dalam bentuk aslinya (called tetap called, happened tetap happened).',ex:[['Someone called you.','Who called you?'],['Something happened.','What happened?  (bukan What did happen?)'],['Someone wants coffee.','Who wants coffee?  (tetap -s)']]},
   {t:'Kalau objek yang ditanyakan: itu Rumus 2',b:'Karena subjeknya masih ada (you), kalimat butuh kata bantu seperti biasa.',ex:[['You called someone.','Who did you call?'],['You saw something.','What did you see?'],['You are waiting for someone.','Who are you waiting for?']]},
   {t:'Bandingkan berpasangan sampai bedanya terasa',b:'Kalimat mirip, arti berbeda. Yang kiri menanyakan pelaku, yang kanan menanyakan sasaran.',ex:[['Who called you?','siapa yang menelepon kamu'],['Who did you call?','siapa yang kamu telepon'],['Who loves her?','siapa yang mencintai dia'],['Who does she love?','siapa yang dia cintai']]}
  ],
  traps:[['Who did call you?','Who called you?','subjek ditanya → tanpa did'],['What did happen?','What happened?','subjek ditanya → tanpa did'],['Who you called?','Who did you call?','objek ditanya → butuh did'],['Which bus does go there?','Which bus goes there?','which bus adalah subjek']],
  summary:'Kalau jawabannya menggantikan subjek kalimat, pakai Rumus 3: who/what + kata kerja, tanpa kata bantu. Kalau jawabannya objek, kembali ke Rumus 2.',
  drill:[['Someone broke the window. → tanyakan siapa pelakunya','Who broke the window?','subjek → tanpa did, broke tetap'],['You broke something. → tanyakan apa yang kamu pecahkan','What did you break?','objek → Rumus 2'],['Something is making that noise. → tanyakan apa','What is making that noise?','subjek → is tetap di tempat'],['Someone lives here. → tanyakan siapa','Who lives here?','subjek → tetap -s'],['She is talking to someone. → tanyakan siapa','Who is she talking to?','objek → Rumus 2'],['Some students passed the exam. → tanyakan berapa banyak','How many students passed the exam?','how many students = subjek']]},

 {id:'r4',no:'Rumus 4',title:'Pertanyaan tidak langsung (sopan)',formula:'Pembuka sopan + WH / if + Subjek + Kata kerja   (urutan kembali normal)',short:'Untuk speaking dan situasi formal. Setelah pembuka seperti Could you tell me…, urutan kata kembali seperti kalimat biasa.',
  idea:'Pertanyaan langsung (Where is the station?) bisa terasa tiba-tiba. Dengan pembuka sopan, pertanyaannya "dibungkus" dan menjadi bagian dari kalimat lain. Karena sudah dibungkus, bagian dalamnya tidak perlu lagi berbentuk pertanyaan.',
  steps:[
   {t:'Pilih pembuka',b:'Could you tell me … · Do you know … · I wonder … · I\'d like to know … · Can you tell me … · Would you mind telling me … Pembuka ini yang membawa "nada tanya"-nya.',ex:[['Could you tell me …','paling umum, sopan'],['Do you know …','santai, sopan'],['I wonder …','halus, bukan pertanyaan langsung'],['I\'d like to know …','formal']]},
   {t:'Ambil pertanyaan langsungnya, lalu kembalikan urutannya',b:'Kata bantu yang tadinya di depan subjek kembali ke setelah subjek. Kalau kata bantunya do/does/did, ia hilang dan "-s" / bentuk lampaunya kembali ke kata kerja.',ex:[['Where is the station?','… where the station is.'],['What does this word mean?','… what this word means.'],['When did she leave?','… when she left.'],['How long have you worked here?','… how long you have worked here.']]},
   {t:'Pertanyaan Yes/No: pakai if atau whether',b:'Kalau pertanyaan aslinya tidak punya kata tanya, sambungkan dengan if (atau whether, lebih formal).',ex:[['Is he coming?','I wonder if he is coming.'],['Does the shop open on Sunday?','Do you know if the shop opens on Sunday?'],['Can I park here?','Could you tell me if I can park here?']]},
   {t:'Tanda tanya mengikuti pembukanya',b:'Kalau pembukanya pertanyaan (Could you…? Do you know…?) diakhiri tanda tanya. Kalau pembukanya pernyataan (I wonder…, I\'d like to know…) diakhiri titik.',ex:[['Could you tell me where the station is?','pembuka pertanyaan → ?'],['I wonder where the station is.','pembuka pernyataan → .']]}
  ],
  traps:[['Can you tell me where is the bank?','Can you tell me where the bank is?','urutan harus kembali normal'],['Do you know what does this mean?','Do you know what this means?','does hilang, -s kembali ke mean'],['I wonder is he coming.','I wonder if he is coming.','Yes/No butuh if'],['Could you tell me when did she leave?','Could you tell me when she left?','did hilang, lampau kembali ke leave']],
  summary:'Pembuka sopan + kata tanya (atau if) + kalimat dengan urutan biasa. Begitu ada pembuka, kata bantunya mundur atau hilang.',
  drill:[['What time does the class start? → versi sopan dengan Could you tell me','Could you tell me what time the class starts?','does hilang, start → starts'],['Where is the toilet? → versi sopan','Could you tell me where the toilet is?','is kembali ke belakang'],['Is this seat taken? → versi sopan dengan Do you know','Do you know if this seat is taken?','Yes/No → if'],['How much does it cost? → versi sopan','Could you tell me how much it costs?','does hilang, cost → costs'],['Did they accept the offer? → dengan I wonder','I wonder if they accepted the offer.','did hilang, accept → accepted'],['Why is she upset? → dengan I\'d like to know','I\'d like to know why she is upset.','is kembali ke belakang']]}
],
errors:[
 ['Where you go?','Where do you go?','Tidak ada kata bantu'],
 ['You are from where?','Where are you from?','Terjemahan langsung dari bahasa Indonesia'],
 ['Does she works here?','Does she work here?','"-s" dobel'],
 ['Did you went?','Did you go?','Bentuk lampau dobel'],
 ['Can you tell me where is the bank?','Can you tell me where the bank is?','Rumus 4 tidak memakai urutan tanya']
],
examiner:[
 ['Sorry, could you repeat the question, please?','Maaf, bisa diulang pertanyaannya?'],
 ['Could you explain what you mean by "…"?','Bisa dijelaskan maksud "…"?'],
 ['Do you mean … or …?','Maksudnya … atau …?']
]
};

}
