// Tambahan Okt 2026: kata "some-" (something, someone, sometime…) dan kata kerja tidak
// beraturan yang belum ada di level Pemula dan Pre-intermediate. Isi penjelasannya ada di
// notes-v2-extra.js (dimuat belakangan); di sini hanya kata, indeks penjelasan, dan terjemahan contoh.
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{}; var VOCAB_L=window.VOCAB_L=window.VOCAB_L||{};

// ---- kata "some-"
var SOME_THINGS=[
["w","something","SAM-fing","sesuatu","I want something to drink.",""],
["w","someone","SAM-wan","seseorang","Someone is at the door.","somebody"],
["w","somebody","SAM-ba-di","seseorang","Somebody called you this morning.","someone"],
["w","somewhere","SAM-wer","di / ke suatu tempat","My keys are somewhere in this room.",""],
["col","some more","sam mor","tambah lagi / sedikit lagi","Can I have some more rice?",""],
["col","some people","sam PI-pel","sebagian orang","Some people like spicy food.",""]
];
var SOME_TIME=[
["w","sometime","SAM-taim","kapan-kapan / suatu saat","Let's have lunch sometime.",""],
["col","some time","sam taim","beberapa waktu / agak lama","I need some time to think.",""]
];
var SOMEDAY=["w","someday","SAM-dei","suatu hari nanti","Someday I will visit London.","one day"];
var SOMEHOW=["w","somehow","SAM-hau","entah bagaimana","Somehow I passed the test.",""];

// ---- kata kerja tidak beraturan (contoh memakai V2 supaya bentuk lampaunya ikut terlihat)
var V={
break:["w","break","breik","memecahkan / merusak","I broke my phone yesterday.",""],
choose:["w","choose","cuz","memilih","I chose the blue shirt.",""],
begin:["w","begin","bi-GIN","mulai","The movie began at eight.","start"],
sing:["w","sing","sing","bernyanyi","We sang a song for her birthday.",""],
become:["w","become","bi-KAM","menjadi","She became a teacher last year.",""],
swim:["w","swim","swim","berenang","We swam in the sea.",""],
fly:["w","fly","flai","terbang / naik pesawat","We flew to Bali last month.",""],
blow:["w","blow","blo","meniup / bertiup","The wind blew all night.",""],
draw:["w","draw","dro","menggambar","My son drew a cat.",""],
fall:["w","fall","fol","jatuh","I fell off my bike.",""],
freeze:["w","freeze","friz","membeku / membekukan","The water froze in the cold.",""],
grow:["w","grow","gro","tumbuh / menanam","The tree grew very fast.",""],
hide:["w","hide","haid","bersembunyi / menyembunyikan","The cat hid under the bed.",""],
rise:["w","rise","raiz","naik / terbit","The sun rose at six.",""],
shake:["w","shake","syeik","mengguncang / menjabat (tangan)","We shook hands.",""],
steal:["w","steal","stil","mencuri","Someone stole my bike.",""],
tear:["w","tear","ter","merobek / sobek","I tore my jeans.",""],
throw:["w","throw","fro","melempar","He threw the ball to me.",""],
wake:["w","wake","weik","bangun / membangunkan","I woke up late today.",""],
teach:["w","teach","tic","mengajar","She taught me English.",""],
catch:["w","catch","kec","menangkap / sempat naik (bus)","I caught the last bus.",""],
fight:["w","fight","fait","berkelahi / bertengkar","The two boys fought at school.",""],
keep:["w","keep","kip","menyimpan / tetap","I kept the receipt.",""],
leave:["w","leave","liv","pergi / meninggalkan","I left home at seven.",""],
spend:["w","spend","spend","menghabiskan (uang / waktu)","I spent too much money.",""],
build:["w","build","bild","membangun","They built a new school.",""],
hold:["w","hold","hold","memegang","She held the baby.",""],
give:["w","give","giv","memberi","He gave me a gift.",""],
show:["w","show","syo","menunjukkan","She showed me her photos.",""],
wear:["w","wear","wer","memakai (baju)","I wore a jacket yesterday.",""],
win:["w","win","win","menang","Our team won the game.",""],
sell:["w","sell","sel","menjual","I sold my old car.",""],
cut:["w","cut","kat","memotong","I cut my finger.",""]
};
function pick(names){ return names.split(' ').map(function(n){ return V[n]; }); }

// Pemula: minggu 1 (waktu), 2 (benda & tempat, ada "some"), 7 (kemarin & dulu), 8 (rencana & perasaan)
var B=VOCAB_L.beginner&&VOCAB_L.beginner.weeks;
if(B){
B[1].items=B[1].items.concat(SOME_TIME,[SOMEDAY]);
B[2].items=B[2].items.concat(SOME_THINGS);
B[7].items=B[7].items.concat(pick('break choose begin sing become swim fly blow draw fall freeze grow hide rise shake steal tear throw wake teach catch fight keep leave spend build hold'));
B[8].items=B[8].items.concat([SOMEHOW]);
}

// Pre-intermediate: minggu 2 (ada "some"), 3 (fokus Past Simple), 4 (ada "someday")
VOCAB_X[2]=(VOCAB_X[2]||[]).concat(SOME_THINGS);
VOCAB_X[3]=(VOCAB_X[3]||[]).concat(pick('give show wear win sell cut choose begin sing become swim fly blow draw grow throw catch keep hold steal fight shake tear rise freeze'));
VOCAB_X[4]=(VOCAB_X[4]||[]).concat(SOME_TIME,[SOMEHOW]);

// Bentuk kata kerja yang belum tercatat.
if(window.VERB_FORMS&&window.VERB_FORMS.IRREG) window.VERB_FORMS.IRREG.blow=['blew','blown'];

// Kata → id penjelasan (isinya di notes-v2-extra.js).
var R=window.VOCAB_NOTES_RAW=window.VOCAB_NOTES_RAW||{N:{},M:{}};
Object.assign(R.M,{
"sometime":"v2:sometime","some time":"v2:sometime","some day":"v2:someday",
"someone":"v2:someone","somebody":"v2:someone","something":"v2:something",
"somewhere":"v2:somewhere","somehow":"v2:somehow",
"sing":"v2:sing","swim":"v2:sing","begin":"v2:sing","drink":"v2:sing",
"blow":"v2:blow","fly":"v2:blow","throw":"v2:blow","draw":"v2:blow",
"catch":"v2:catch","teach":"v2:catch","fight":"v2:catch",
"choose":"v2:choose","wake":"v2:choose","hide":"v2:choose","shake":"v2:choose",
"keep":"v2:keep","hold":"v2:hold","tear":"v2:tear","steal":"v2:steal","win":"v2:win","become":"v2:become"
});

// Terjemahan contoh kalimat kartu.
var T={
"I want something to drink.":"Aku mau sesuatu untuk diminum.",
"Someone is at the door.":"Ada seseorang di depan pintu.",
"Somebody called you this morning.":"Tadi pagi ada yang meneleponmu.",
"My keys are somewhere in this room.":"Kunciku ada di suatu tempat di ruangan ini.",
"Can I have some more rice?":"Boleh minta nasi lagi?",
"Some people like spicy food.":"Sebagian orang suka makanan pedas.",
"Let's have lunch sometime.":"Kapan-kapan kita makan siang bareng, yuk.",
"I need some time to think.":"Aku butuh waktu untuk berpikir.",
"Someday I will visit London.":"Suatu hari nanti aku akan mengunjungi London.",
"Somehow I passed the test.":"Entah bagaimana aku lulus ujiannya.",
"I broke my phone yesterday.":"Aku merusak HP-ku kemarin.",
"I chose the blue shirt.":"Aku memilih kemeja biru.",
"The movie began at eight.":"Filmnya mulai jam delapan.",
"We sang a song for her birthday.":"Kami menyanyikan lagu untuk ulang tahunnya.",
"She became a teacher last year.":"Dia menjadi guru tahun lalu.",
"We swam in the sea.":"Kami berenang di laut.",
"We flew to Bali last month.":"Kami terbang ke Bali bulan lalu.",
"The wind blew all night.":"Angin bertiup sepanjang malam.",
"My son drew a cat.":"Anakku menggambar kucing.",
"I fell off my bike.":"Aku jatuh dari sepeda.",
"The water froze in the cold.":"Airnya membeku karena dingin.",
"The tree grew very fast.":"Pohonnya tumbuh sangat cepat.",
"The cat hid under the bed.":"Kucingnya bersembunyi di bawah kasur.",
"The sun rose at six.":"Matahari terbit jam enam.",
"We shook hands.":"Kami berjabat tangan.",
"Someone stole my bike.":"Ada yang mencuri sepedaku.",
"I tore my jeans.":"Celana jinku sobek.",
"He threw the ball to me.":"Dia melempar bola ke arahku.",
"I woke up late today.":"Hari ini aku bangun kesiangan.",
"She taught me English.":"Dia mengajariku bahasa Inggris.",
"I caught the last bus.":"Aku sempat naik bus terakhir.",
"The two boys fought at school.":"Dua anak laki-laki itu berkelahi di sekolah.",
"I kept the receipt.":"Aku menyimpan struknya.",
"I left home at seven.":"Aku berangkat dari rumah jam tujuh.",
"I spent too much money.":"Aku menghabiskan terlalu banyak uang.",
"They built a new school.":"Mereka membangun sekolah baru.",
"She held the baby.":"Dia menggendong bayinya.",
"He gave me a gift.":"Dia memberiku hadiah.",
"She showed me her photos.":"Dia menunjukkan foto-fotonya padaku.",
"I wore a jacket yesterday.":"Kemarin aku memakai jaket.",
"Our team won the game.":"Tim kami memenangkan pertandingan.",
"I sold my old car.":"Aku menjual mobil lamaku.",
"I cut my finger.":"Jariku teriris."
};
var I=window.VOCAB_ID; if(!I||!I.map) return;
Object.keys(T).forEach(function(k){ if(!I.map[k]) I.map[k]=T[k]; });
}
