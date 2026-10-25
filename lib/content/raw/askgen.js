// Dihasilkan dari vocab/askgen.js — isi data tidak diubah. Dieksekusi dengan objek "window" lokal (bukan global).
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{}; var VOCAB_L=window.VOCAB_L=window.VOCAB_L||{};
// Generator soal "Bertanya": bank kalimat pernyataan + aturan transformasi per rumus.
// Menghasilkan ribuan variasi soal yang gramatikal, dengan kunci, pengalih (jebakan), dan keterangan langkah.
(function(){
// ---------- Bank ----------
// Subjek: [teks, orang(1/2/3), jamak, kata ganti objek]
var SUBJ=[['you',2,false,'you'],['we',1,true,'us'],['they',3,true,'them'],['he',3,false,'him'],['she',3,false,'her'],
['my brother',3,false,'him'],['my sister',3,false,'her'],['the manager',3,false,'her'],['our teacher',3,false,'him'],['the students',3,true,'them'],['your friends',3,true,'them'],['my parents',3,true,'them'],['the new intern',3,false,'him'],['the kids',3,true,'them'],['your boss',3,false,'him'],['the driver',3,false,'him']];
var THING_SUBJ=[['the bus',3,false,'it'],['the meeting',3,false,'it'],['the shop',3,false,'it'],['the class',3,false,'it'],['the movie',3,false,'it']];
var THING_VERBS={start:1,open:1,leave:1,come:1,finish:1};
// Kata kerja: {base, s(-s), past, pp, ing, obj:[objek…], adv:[keterangan tempat/waktu/cara…], wh:{objek→kata tanya}}
var VERBS=[
 {base:'live',s:'lives',past:'lived',pp:'lived',ing:'living',obj:[],place:['in Jakarta','in Solo','near the station','in a small town','with my parents','downtown'],time:['now','these days']},
 {base:'work',s:'works',past:'worked',pp:'worked',ing:'working',obj:[],place:['here','at a bank','from home','in a hospital','at the office','for a startup'],time:['on Saturdays','every day','late']},
 {base:'like',s:'likes',past:'liked',pp:'liked',ing:'liking',obj:['coffee','this song','spicy food','the new office','horror movies','the blue one']},
 {base:'want',s:'wants',past:'wanted',pp:'wanted',ing:'wanting',obj:['coffee','a new phone','some help','a day off','the window seat']},
 {base:'need',s:'needs',past:'needed',pp:'needed',ing:'needing',obj:['more time','a break','your help','a new laptop','an umbrella']},
 {base:'buy',s:'buys',past:'bought',pp:'bought',ing:'buying',obj:['a new phone','the tickets','some bread','a car','a gift for her'],place:['online','at the mall','at the market']},
 {base:'see',s:'sees',past:'saw',pp:'seen',ing:'seeing',obj:['the email','the movie','my message','the doctor','the accident'],time:['yesterday','last night','this morning']},
 {base:'call',s:'calls',past:'called',pp:'called',ing:'calling',obj:['the office','her mother','the client','you','the driver'],time:['yesterday','last night','an hour ago','this morning']},
 {base:'finish',s:'finishes',past:'finished',pp:'finished',ing:'finishing',obj:['the report','the project','the homework','the book','the test'],time:['last week','yesterday','on time','already']},
 {base:'start',s:'starts',past:'started',pp:'started',ing:'starting',obj:['the meeting','the class','the new job','the course'],time:['at 9','at nine','early','last month','on Monday']},
 {base:'leave',s:'leaves',past:'left',pp:'left',ing:'leaving',obj:['the office','the party','the keys','the door open'],time:['early','at 5','last night','before lunch']},
 {base:'eat',s:'eats',past:'ate',pp:'eaten',ing:'eating',obj:['breakfast','lunch','rice','sushi','the leftovers'],place:['at home','at the canteen','in the car']},
 {base:'go',s:'goes',past:'went',pp:'gone',ing:'going',obj:[],place:['home','to the gym','to Bali','to the office','to the market','to school'],time:['yesterday','every morning','last weekend','on Fridays']},
 {base:'come',s:'comes',past:'came',pp:'come',ing:'coming',obj:[],place:['here','to the party','to the meeting','from Bandung','by bus'],time:['late','yesterday','on time']},
 {base:'take',s:'takes',past:'took',pp:'taken',ing:'taking',obj:['the bus','the train','a taxi','a photo','the medicine','my umbrella']},
 {base:'speak',s:'speaks',past:'spoke',pp:'spoken',ing:'speaking',obj:['English','Japanese'],place:['to the manager','to her','with the client']},
 {base:'know',s:'knows',past:'knew',pp:'known',ing:'knowing',obj:['the answer','his name','the way','the password','that song']},
 {base:'play',s:'plays',past:'played',pp:'played',ing:'playing',obj:['football','the guitar','chess','badminton','video games'],time:['on Sundays','every weekend','yesterday']},
 {base:'study',s:'studies',past:'studied',pp:'studied',ing:'studying',obj:['English','math','medicine','for the exam'],place:['at the library','at home','abroad']},
 {base:'send',s:'sends',past:'sent',pp:'sent',ing:'sending',obj:['the email','the file','the invoice','a message','the package'],time:['yesterday','this morning','last week']},
 {base:'make',s:'makes',past:'made',pp:'made',ing:'making',obj:['coffee','a mistake','dinner','a decision','the presentation']},
 {base:'read',s:'reads',past:'read',pp:'read',ing:'reading',obj:['the news','the contract','this book','the manual','the message']},
 {base:'write',s:'writes',past:'wrote',pp:'written',ing:'writing',obj:['the report','a letter','the code','an email','the summary']},
 {base:'meet',s:'meets',past:'met',pp:'met',ing:'meeting',obj:['the client','her parents','the new manager','the team','him'],time:['yesterday','last week','at noon']},
 {base:'find',s:'finds',past:'found',pp:'found',ing:'finding',obj:['the keys','a job','the file','my wallet','a solution']},
 {base:'fix',s:'fixes',past:'fixed',pp:'fixed',ing:'fixing',obj:['the bug','the car','the printer','the wifi','the door']},
 {base:'open',s:'opens',past:'opened',pp:'opened',ing:'opening',obj:['the window','the shop','the file','the door','a new branch'],time:['at 8','on Sundays','early']},
 {base:'break',s:'breaks',past:'broke',pp:'broken',ing:'breaking',obj:['the window','the glass','the printer','my phone','the rule']},
 {base:'pay',s:'pays',past:'paid',pp:'paid',ing:'paying',obj:['the bill','the rent','for lunch','the fee','in cash']},
 {base:'wait',s:'waits',past:'waited',pp:'waited',ing:'waiting',obj:[],place:['for the bus','for you','for the results','for the manager','outside']}
];
// Frasa BE: [pelengkap]
var BE_COMP=['tired','hungry','late','ready','at home','from Surabaya','busy today','sick','angry','at the office','in Bali','new here','on time','free tomorrow','happy with the result','afraid of dogs','at the meeting','in the car'];
var BE_SING=['a teacher','a student','a doctor','the new manager'];
// Modal
var MODALS=[['can','bisa'],['will','akan'],['should','sebaiknya'],['must','harus'],['could','bisa (sopan)'],['would','maukah / akan']];
var WH_TIME=['when','what time'], WH_PLACE=['where'], WH_WHY=['why'], WH_HOW=['how','how often','how long'];
var OPENERS=[['Could you tell me','?'],['Do you know','?'],['I wonder','.'],['Can you tell me','?'],["I'd like to know",'.']];
var REASON=['because of the traffic','because she was sick','to save money','for work','because it was late'];


// ---------- arti Indonesia (dirakit dari bank kata) ----------
var ID_SUBJ={you:'kamu',we:'kita',they:'mereka',he:'dia',she:'dia','my brother':'kakakku (lk)','my sister':'kakakku (pr)','the manager':'manajernya','our teacher':'guru kami','the students':'para siswa','your friends':'teman-temanmu','my parents':'orang tuaku','the new intern':'anak magang baru','the kids':'anak-anak','your boss':'bosmu','the driver':'sopirnya','the bus':'busnya','the meeting':'rapatnya','the shop':'tokonya','the class':'kelasnya','the movie':'filmnya',someone:'seseorang',something:'sesuatu'};
var ID_VERB={live:'tinggal',work:'bekerja',like:'suka',want:'mau',need:'butuh',buy:'membeli',see:'melihat',call:'menelepon',finish:'menyelesaikan',start:'mulai',leave:'pergi dari / meninggalkan',eat:'makan',go:'pergi',come:'datang',take:'naik / mengambil',speak:'berbicara',know:'tahu',play:'bermain',study:'belajar',send:'mengirim',make:'membuat',read:'membaca',write:'menulis',meet:'bertemu',find:'menemukan',fix:'memperbaiki',open:'membuka / buka',break:'memecahkan / merusak',pay:'membayar',wait:'menunggu'};
var ID_PHRASE={'coffee':'kopi','this song':'lagu ini','spicy food':'makanan pedas','the new office':'kantor baru','horror movies':'film horor','the blue one':'yang biru','a new phone':'HP baru','some help':'bantuan','a day off':'libur sehari','the window seat':'kursi dekat jendela','more time':'lebih banyak waktu','a break':'istirahat','your help':'bantuanmu','a new laptop':'laptop baru','an umbrella':'payung','the tickets':'tiketnya','some bread':'roti','a car':'mobil','a gift for her':'hadiah untuknya','the email':'emailnya','the movie':'filmnya','my message':'pesanku','the doctor':'dokter','the accident':'kecelakaan itu','the office':'kantor','her mother':'ibunya','the client':'kliennya','you':'kamu','the driver':'sopirnya','the report':'laporannya','the project':'proyeknya','the homework':'PR-nya','the book':'bukunya','the test':'tesnya','the meeting':'rapatnya','the class':'kelasnya','the new job':'pekerjaan baru','the course':'kursusnya','the party':'pestanya','the keys':'kuncinya','the door open':'pintu terbuka','breakfast':'sarapan','lunch':'makan siang','rice':'nasi','sushi':'sushi','the leftovers':'sisa makanan','the bus':'bus','the train':'kereta','a taxi':'taksi','a photo':'foto','the medicine':'obatnya','my umbrella':'payungku','English':'bahasa Inggris','Japanese':'bahasa Jepang','the answer':'jawabannya','his name':'namanya','the way':'jalannya','the password':'kata sandinya','that song':'lagu itu','football':'sepak bola','the guitar':'gitar','chess':'catur','badminton':'bulu tangkis','video games':'video game','math':'matematika','medicine':'kedokteran','for the exam':'untuk ujian','the file':'filenya','the invoice':'invoicenya','a message':'pesan','the package':'paketnya','a mistake':'kesalahan','dinner':'makan malam','a decision':'keputusan','the presentation':'presentasinya','the news':'berita','the contract':'kontraknya','this book':'buku ini','the manual':'panduannya','the message':'pesannya','a letter':'surat','the code':'kodenya','an email':'email','the summary':'ringkasannya','her parents':'orang tuanya','the new manager':'manajer baru','the team':'timnya','him':'dia','a job':'pekerjaan','my wallet':'dompetku','a solution':'solusi','the bug':'bug-nya','the printer':'printernya','the wifi':'wifinya','the door':'pintunya','the window':'jendelanya','a new branch':'cabang baru','the glass':'gelasnya','my phone':'HP-ku','the rule':'aturannya','the bill':'tagihannya','the rent':'sewanya','for lunch':'untuk makan siang','the fee':'biayanya','in cash':'tunai',
'in Jakarta':'di Jakarta','in Solo':'di Solo','near the station':'dekat stasiun','in a small town':'di kota kecil','with my parents':'bersama orang tuaku','downtown':'di pusat kota','here':'di sini','at a bank':'di bank','from home':'dari rumah','in a hospital':'di rumah sakit','at the office':'di kantor','for a startup':'di sebuah startup','online':'online','at the mall':'di mal','at the market':'di pasar','at home':'di rumah','at the canteen':'di kantin','in the car':'di mobil','home':'pulang','to the gym':'ke gym','to Bali':'ke Bali','to the office':'ke kantor','to the market':'ke pasar','to school':'ke sekolah','to the party':'ke pesta','to the meeting':'ke rapat','from Bandung':'dari Bandung','by bus':'naik bus','to the manager':'dengan manajer','to her':'dengannya','with the client':'dengan klien','at the library':'di perpustakaan','abroad':'di luar negeri','for the bus':'bus','for you':'kamu','for the results':'hasilnya','for the manager':'manajernya','outside':'di luar',
'now':'sekarang','these days':'belakangan ini','on Saturdays':'tiap Sabtu','on Sundays':'tiap Minggu','on Fridays':'tiap Jumat','every day':'setiap hari','every morning':'setiap pagi','every weekend':'setiap akhir pekan','late':'terlambat / larut','yesterday':'kemarin','last night':'tadi malam','this morning':'pagi ini','an hour ago':'sejam lalu','last week':'minggu lalu','last month':'bulan lalu','last weekend':'akhir pekan lalu','on time':'tepat waktu','already':'sudah','at 9':'jam 9','at nine':'jam 9','at 5':'jam 5','at 8':'jam 8','early':'lebih awal','on Monday':'hari Senin','before lunch':'sebelum makan siang','at noon':'siang hari','today':'hari ini',
'tired':'lelah','hungry':'lapar','ready':'siap','from Surabaya':'dari Surabaya','busy today':'sibuk hari ini','sick':'sakit','angry':'marah','in Bali':'di Bali','new here':'baru di sini','free tomorrow':'kosong besok','happy with the result':'puas dengan hasilnya','afraid of dogs':'takut anjing','at the meeting':'di rapat','a teacher':'seorang guru','a student':'seorang pelajar','a doctor':'seorang dokter'};
var ID_PASSIVE={buy:'dibeli',see:'dilihat',call:'ditelepon',finish:'diselesaikan',start:'dimulai',leave:'ditinggalkan',eat:'dimakan',take:'diambil / dinaiki',speak:'dibicarakan',know:'diketahui',play:'dimainkan',study:'dipelajari',send:'dikirim',make:'dibuat',read:'dibaca',write:'ditulis',meet:'ditemui',find:'ditemukan',fix:'diperbaiki',open:'dibuka',break:'dipecahkan',pay:'dibayar',like:'disukai',want:'diinginkan',need:'dibutuhkan'};
var ID_MODAL={can:'bisa',will:'akan',should:'sebaiknya',must:'harus',could:'bisa',would:'mau'};
var ID_WH={what:'apa',where:'di mana',when:'kapan','what time':'jam berapa',why:'kenapa',how:'bagaimana','how often':'seberapa sering','how long':'berapa lama',who:'siapa'};
var ID_OPEN={'Could you tell me':'Bisa beri tahu saya','Do you know':'Apakah kamu tahu','I wonder':'Saya ingin tahu','Can you tell me':'Bisa beri tahu saya',"I'd like to know":'Saya ingin tahu'};
function idPhr(x){return ID_PHRASE[x]||ID_SUBJ[x]||x;}
function idTail(arr){return arr.map(idPhr).join(' ');}
function idVerbPast(v,tense){return (tense==='past'?'':'')+ID_VERB[v];}
// Terjemahan pernyataan dari struktur s (hasil statement())
function idStmt(s){
 var sub=idPhr(s.sub[0]);
 if(s.kind==='be')return cap(sub)+' '+idTail(s.rest)+(s.tense==='past'?' (tadi)':'')+'.';
 if(s.kind==='modal')return cap(sub)+' '+ID_MODAL[s.aux]+' '+ID_VERB[s.rest[0]]+' '+idTail(s.rest.slice(1))+'.';
 if(s.kind==='have')return cap(sub)+' sudah '+ID_VERB[(s.v&&s.v.base)||ppBase(s.rest[0])]+' '+idTail(s.rest.slice(1))+'.';
 return cap(sub)+' '+ID_VERB[s.v.base]+' '+idTail(s.tail)+(s.tense==='past'&&!s.tail.some(function(x){return PAST_ADV.test(x);})?' (dulu)':'')+'.';
}
function ppBase(pp){for(var i=0;i<VERBS.length;i++)if(VERBS[i].pp===pp)return VERBS[i].base;return pp;}
function idYN(s){return 'Apakah '+idStmt(s).replace(/^./,function(c){return c.toLowerCase();}).replace(/.$/,'?');}
function idWH(s,wh,rest){
 var sub=idPhr(s.sub[0]);var w=ID_WH[wh]||wh;
 var core;
 if(s.kind==='be')core=sub+(rest.length?' '+idTail(rest):'');
 else if(s.kind==='modal')core=sub+' '+ID_MODAL[s.aux]+' '+ID_VERB[rest[0]]+(rest.length>1?' '+idTail(rest.slice(1)):'');
 else if(s.kind==='have')core=sub+' sudah '+ID_VERB[ppBase(rest[0])]+(rest.length>1?' '+idTail(rest.slice(1)):'');
 else core=sub+' '+ID_VERB[s.v.base]+(rest.length>1?' '+idTail(rest.slice(1)):'');
 if(wh==='where'&&s.kind==='be')return cap(w)+' '+core+'?';
 if(wh==='what'&&s.kind==='do')return 'Apa yang '+(ID_PASSIVE[s.v.base]||ID_VERB[s.v.base])+' '+sub+(rest.length>1?' '+idTail(rest.slice(1)):'')+'?';
 if(wh==='what')return cap(w)+' yang '+core+'?';
 return cap(w)+' '+core+'?';
}

// ---------- util ----------
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function be(sub,past){var p=sub[1],pl=sub[2];if(past)return (p===1&&!pl)||(p===3&&!pl)?'was':'were';if(p===1&&!pl)return 'am';if(p===3&&!pl)return 'is';return 'are';}
function doAux(sub,past){if(past)return 'did';return (sub[1]===3&&!sub[2])?'does':'do';}
function have(sub){return (sub[1]===3&&!sub[2])?'has':'have';}
function third(sub){return sub[1]===3&&!sub[2];}
function vform(v,sub,tense){return tense==='past'?v.past:third(sub)?v.s:v.base;}
function shuffle(r,a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function uniq(arr){var s={},o=[];arr.forEach(function(x){var k=x.toLowerCase();if(!s[k]){s[k]=1;o.push(x);}});return o;}
var PAST_ADV=/yesterday|last |ago|this morning|on Monday|last night/;
var HABIT_ADV=/^every |^on (Saturdays|Sundays|Fridays)$|these days|^now$/;
function timeFor(v,tense){var t=(v.time||[]).filter(function(x){if(tense==='past')return !HABIT_ADV.test(x);return !PAST_ADV.test(x);});return t;}
function tail(r,v,tense){var parts=[];if(v.obj&&v.obj.length)parts.push(pick(r,v.obj));if(v.place&&v.place.length&&(r()<0.6||!parts.length))parts.push(pick(r,v.place));var tm=timeFor(v,tense||'present');if(tm.length&&(r()<0.5||!parts.length))parts.push(pick(r,tm));if(!parts.length)parts.push(tense==='past'?'yesterday':'today');return parts;}

// ---------- pembangun kalimat pernyataan ----------
// Mengembalikan {stmt, subj, kind:'be'|'modal'|'have'|'do', tense, v, comp, wordsQ (yes/no question tokens), whInfo}
function statement(r){
 var kind=pick(r,['do','do','do','be','be','modal','have']), tense=r()<0.45?'past':'present', v=pick(r,VERBS), sub=(kind!=='be'&&THING_VERBS[v.base]&&r()<0.35)?pick(r,THING_SUBJ):pick(r,SUBJ);
 if(kind==='be'){var c=(!sub[2]&&r()<0.25)?pick(r,BE_SING):pick(r,BE_COMP);var b=be(sub,tense==='past');return {sub:sub,kind:kind,tense:tense,aux:b,rest:[c],stmt:cap(sub[0])+' '+b+' '+c+'.',qwords:[cap(b),sub[0]].concat(c.split(' ')),ans:cap(b)+' '+sub[0]+' '+c+'?',wrong:[cap(sub[0])+' '+b+' '+c+'?',cap(doAux(sub,tense==='past'))+' '+sub[0]+' '+b+' '+c+'?','Is '+sub[0]+' '+c+'?'==cap(b)+' '+sub[0]+' '+c+'?'?'Are '+sub[0]+' '+c+'?':'Is '+sub[0]+' '+c+'?']};}
 if(kind==='modal'){var m=pick(r,MODALS)[0];var t=tail(r,v,'present');if(THING_SUBJ.indexOf(sub)>=0)t=t.filter(function(x){return v.obj.indexOf(x)<0;}),t.length||(t=[pick(r,timeFor(v,'present').concat(v.place||[]).concat(['early']))]);var restM=[v.base].concat(t);return {sub:sub,kind:kind,tense:'present',aux:m,rest:restM,v:v,tail:t,stmt:cap(sub[0])+' '+m+' '+restM.join(' ')+'.',qwords:[cap(m),sub[0]].concat(restM.join(' ').split(' ')),ans:cap(m)+' '+sub[0]+' '+restM.join(' ')+'?',wrong:[cap(doAux(sub,false))+' '+sub[0]+' '+m+' '+restM.join(' ')+'?',cap(m)+' '+sub[0]+' '+[v.s].concat(t).join(' ')+'?',cap(sub[0])+' '+m+' '+restM.join(' ')+'?']};}
 if(kind==='have'){var h=have(sub);var t2=tail(r,v,'present').filter(function(x){return !PAST_ADV.test(x)&&x!=='today';});if(!t2.length)t2=[v.obj.length?pick(r,v.obj):(v.place?pick(r,v.place):'already')];var restH=[v.pp].concat(t2);return {sub:sub,kind:kind,tense:'perfect',aux:h,rest:restH,v:v,tail:t2,stmt:cap(sub[0])+' '+h+' '+restH.join(' ')+'.',qwords:[cap(h),sub[0]].concat(restH.join(' ').split(' ')),ans:cap(h)+' '+sub[0]+' '+restH.join(' ')+'?',wrong:['Did '+sub[0]+' '+h+' '+restH.join(' ')+'?',cap(h==='has'?'have':'has')+' '+sub[0]+' '+restH.join(' ')+'?',cap(h)+' '+sub[0]+' '+[v.past].concat(t2).join(' ')+'?']};}
 var t3=tail(r,v,tense);if(THING_SUBJ.indexOf(sub)>=0)t3=t3.filter(function(x){return v.obj.indexOf(x)<0;}),t3.length||(t3=[pick(r,timeFor(v,tense).concat(v.place||[]).concat([tense==='past'?'yesterday':'early']))]);var d=doAux(sub,tense==='past');var vf=vform(v,sub,tense);var rest=[v.base].concat(t3);
 return {sub:sub,kind:'do',tense:tense,aux:d,rest:rest,v:v,tail:t3,stmt:cap(sub[0])+' '+[vf].concat(t3).join(' ')+'.',qwords:[cap(d),sub[0]].concat(rest.join(' ').split(' ')),ans:cap(d)+' '+sub[0]+' '+rest.join(' ')+'?',
  wrong:[cap(d)+' '+sub[0]+' '+[vf].concat(t3).join(' ')+'?',cap(sub[0])+' '+[vf].concat(t3).join(' ')+'?',cap(d==='does'?'do':d==='do'?'does':'do')+' '+sub[0]+' '+rest.join(' ')+'?']};
}

// ---------- rumus 1 ----------
function r1(r){var s=statement(r);return {rule:'r1',promptId:idStmt(s),ansId:idYN(s),prompt:s.stmt,hint:'ubah jadi pertanyaan Yes/No',ans:s.ans,opts:uniq([s.ans].concat(s.wrong)).slice(0,4),tokens:s.qwords,why:s.kind==='do'?('Langkah 2: tambah '+s.aux+(s.tense==='past'||third(s.sub)?', kata kerja kembali ke bentuk dasar':'')):('Langkah 1: '+s.aux+' dipindah ke depan')};}

// ---------- rumus 2 ----------
function r2(r){
 var s=statement(r);
 // pilih bagian yang ditanyakan
 var rest=s.rest.slice(), wh, removed, ask;
 if(s.kind==='be'){var comp=s.rest[0];var isPlace=/^(at |in |from |here|downtown)/.test(comp);if(isPlace&&r()<0.7){wh='where';ask='tanyakan di mana';rest=[];}else{wh='why';ask='tanyakan kenapa';rest=[comp];}}
 else{
  var v=s.v||null; var t=s.tail||rest.slice(1);
  var cands=[];
  if(t.length){t.forEach(function(x,i){if(v&&v.place&&v.place.indexOf(x)>=0)cands.push(['where',i,'tanyakan di mana']);else if((v&&v.time&&v.time.indexOf(x)>=0)||/^(today|yesterday|early|late)$/.test(x))cands.push([/^at \d|^at nine/.test(x)?'what time':'when',i,/^at \d|^at nine/.test(x)?'tanyakan jam berapa':'tanyakan kapan']);else if(v&&v.obj&&v.obj.indexOf(x)>=0)cands.push(['what',i,'tanyakan apa']);});}
  var hasTime=t.some(function(x){return (v&&v.time&&v.time.indexOf(x)>=0)||/^(today|yesterday|early|late|already)$/.test(x);});
  if(!cands.length){cands.push(['why',-1,'tanyakan kenapa']);if(!hasTime)cands.push(['when',-1,'tanyakan kapan']);}
  var c=pick(r,cands);wh=c[0];ask=c[2];
  if(c[1]>=0){var keep=t.slice();keep.splice(c[1],1);rest=[rest[0]].concat(keep);}
 }
 var body=[s.aux,s.sub[0]].concat(rest).join(' ');
 var ans=cap(wh)+' '+body+'?';
 var wrong=[cap(wh)+' '+s.sub[0]+' '+rest.join(' ')+'?', cap(s.aux)+' '+s.sub[0]+' '+rest.join(' ')+' '+wh+'?', cap(wh)+' '+s.aux+' '+s.sub[0]+' '+(s.kind==='do'&&s.v?[vform(s.v,s.sub,s.tense)].concat(rest.slice(1)).join(' '):rest.join(' '))+'?'];
 return {rule:'r2',promptId:idStmt(s),ansId:idWH(s,wh,rest),prompt:s.stmt,hint:ask,ans:ans,opts:uniq([ans].concat(wrong)).slice(0,4),tokens:[cap(wh)].concat(body.split(' ')),why:'Rumus 1 dulu ('+cap(s.aux)+' '+s.sub[0]+' …?), lalu '+wh+' di depan; bagian yang ditanyakan hilang'};
}

// ---------- rumus 3 ----------
function r3(r){
 var v=pick(r,VERBS.filter(function(x){return x.obj.length;})), tense=r()<0.5?'past':'present', sub=pick(r,SUBJ.filter(function(s){return s[1]===3;})), obj=pick(r,v.obj);
 var askSubj=r()<0.55;
 var vf=tense==='past'?v.past:v.s; // subjek "someone" tunggal → -s
 if(askSubj){
  var stmt='Someone '+vf+' '+obj+'.';var ans='Who '+vf+' '+obj+'?';
  var wrong=['Who '+(tense==='past'?'did':'does')+' '+v.base+' '+obj+'?','Who '+(tense==='past'?'did':'does')+' '+vf+' '+obj+'?','Who '+(tense==='past'?'did':'do')+' '+obj+' '+v.base+'?'];
  return {rule:'r3',promptId:'Seseorang '+ID_VERB[v.base]+' '+idPhr(obj)+(tense==='past'?' (dulu)':'')+'.',ansId:'Siapa yang '+ID_VERB[v.base]+' '+idPhr(obj)+'?',prompt:stmt,hint:'tanyakan siapa pelakunya',ans:ans,opts:uniq([ans].concat(wrong)).slice(0,4),tokens:['Who',vf].concat(obj.split(' ')),why:'Yang ditanya subjek → who langsung menggantikan subjek, tanpa '+(tense==='past'?'did':'does')+', kata kerja tetap'};
 }
 var d=doAux(sub,tense==='past');var sv=tense==='past'?v.past:third(sub)?v.s:v.base;
 var isPerson=/client|manager|teacher|parents|friends|students|kids|intern|brother|sister|mother|doctor|driver|team|\bhim\b|\bher\b|\byou\b/.test(obj);
 var wh=isPerson?'Who':'What';
 var stmt=cap(sub[0])+' '+sv+' '+obj+'.';var ans=wh+' '+d+' '+sub[0]+' '+v.base+'?';
 var wrong=[wh+' '+sub[0]+' '+sv+'?',wh+' '+sv+' '+sub[0]+'?',wh+' '+d+' '+sub[0]+' '+sv+'?'];
 return {rule:'r3',promptId:cap(idPhr(sub[0]))+' '+ID_VERB[v.base]+' '+idPhr(obj)+(tense==='past'?' (dulu)':'')+'.',ansId:(isPerson?'Siapa':'Apa')+' yang '+(ID_PASSIVE[v.base]||ID_VERB[v.base])+' '+idPhr(sub[0])+'?',prompt:stmt,hint:isPerson?'tanyakan siapa yang di-'+v.base:'tanyakan apa yang di-'+v.base+' (objek)',ans:ans,opts:uniq([ans].concat(wrong)).slice(0,4),tokens:[wh,d,sub[0],v.base],why:'Yang ditanya objek, subjeknya masih ada → Rumus 2: '+wh+' + '+d+' + subjek + kata kerja dasar'};
}

// ---------- rumus 4 ----------
function r4(r){
 var s=statement(r), op=pick(r,OPENERS), yn=r()<0.4;
 var end=op[1];
 var inner;
 if(yn){var stmtNoDot=s.stmt.replace(/\.$/,'');inner='if '+(/^I\b/.test(stmtNoDot)?stmtNoDot:stmtNoDot.charAt(0).toLowerCase()+stmtNoDot.slice(1));var q=s.ans;
  var ans=op[0]+' '+inner+end;
  var wrong=[op[0]+' '+q.charAt(0).toLowerCase()+q.slice(1).replace(/\?$/,'')+end,op[0]+' if '+q.charAt(0).toLowerCase()+q.slice(1).replace(/\?$/,'')+end,op[0]+' whether '+s.aux+' '+s.sub[0]+' '+s.rest.join(' ')+end];
  return {rule:'r4',promptId:idYN(s),ansId:ID_OPEN[op[0]]+' apakah '+idStmt(s).replace(/^./,function(c){return c.toLowerCase();}).replace(/\.$/,'')+end,prompt:q,hint:'versi sopan dengan "'+op[0]+'"',ans:ans,opts:uniq([ans].concat(wrong)).slice(0,4),tokens:op[0].split(' ').concat(inner.split(' ')),why:'Yes/No → if + urutan kembali normal ('+s.sub[0]+' '+(s.kind==='do'?vform(s.v,s.sub,s.tense):s.aux)+' …)'+(end==='.'?'; pembuka pernyataan → titik':'')};
 }
 // WH langsung → tidak langsung
 var q2=r2(r);var m=q2.ans.match(/^(\S+(?: time| often| long)?)\s+(\S+)\s+(.+)\?$/);if(!m)return r4(r);
 var wh=m[1].toLowerCase(),aux=m[2],rest=m[3];var subj=null;SUBJ.concat(THING_SUBJ).forEach(function(x){if(rest===x[0]||rest.indexOf(x[0]+' ')===0){if(!subj||x[0].length>subj.length)subj=x[0];}});if(!subj)return r4(r);var after=rest.slice(subj.length).trim();
 var normal;
 if(/^(do|does|did)$/i.test(aux)){var v=VERBS.filter(function(x){return after.indexOf(x.base+' ')===0||after===x.base;})[0];var sub=SUBJ.concat(THING_SUBJ).filter(function(x){return x[0]===subj;})[0]||['he',3,false];var form=aux.toLowerCase()==='did'?(v?v.past:after.split(' ')[0]):(third(sub)?(v?v.s:after.split(' ')[0]):(v?v.base:after.split(' ')[0]));normal=subj+' '+(v?form+after.slice(v.base.length):after);}
 else normal=subj+' '+aux+(after?' '+after:'');
 inner=wh+' '+normal;var ans2=op[0]+' '+inner+end;
 var wrong2=[op[0]+' '+wh+' '+aux+' '+rest+end,op[0]+' '+wh+' '+subj+' '+aux+(after?' '+after:'')+end,op[0]+' if '+normal+end];
 return {rule:'r4',promptId:q2.ansId,ansId:ID_OPEN[op[0]]+' '+q2.ansId.replace(/^./,function(c){return c.toLowerCase();}).replace(/\?$/,'')+end,prompt:q2.ans,hint:'versi sopan dengan "'+op[0]+'"',ans:ans2,opts:uniq([ans2].concat(wrong2)).slice(0,4),tokens:op[0].split(' ').concat(inner.split(' ')),why:'Pembuka + '+wh+' + urutan normal; '+(/^(do|does|did)$/i.test(aux)?aux+' hilang, bentuknya kembali ke kata kerja':aux+' kembali ke belakang subjek')+(end==='.'?'; pembuka pernyataan → titik':'')};
}


// ---------- penjelasan per opsi ----------
// Mengembalikan alasan kenapa opsi ini salah (atau benar), dibaca dari bentuk opsinya dibanding kunci.
function explainOpt(q,opt){
 var a=q.ans, o=opt, la=a.toLowerCase(), lo=o.toLowerCase();
 if(lo===la) return 'Benar: '+q.why+'.';
 var AUX=/^(do|does|did|am|is|are|was|were|have|has|had|can|could|will|would|shall|should|must|may|might)\b/i;
 var WH=/^(what time|how long|how often|how many|how much|what|where|when|why|how|which|who)\b/i;
 if(/\.$/.test(o)&&/\?$/.test(a)&&q.rule!=='r4') return 'Ini masih kalimat pernyataan (diakhiri titik), belum kalimat tanya.';
 if(lo===q.prompt.toLowerCase().replace(/\.$/,'?')) return 'Hanya menambah tanda tanya. Dalam bahasa Inggris urutan katanya harus berubah: kata bantu pindah ke depan subjek.';
 if(q.rule==='r1'||q.rule==='r2'){
  var ansAux=(a.match(WH)?a.replace(WH,'').trim():a).split(' ')[0].toLowerCase();
  var optNoWh=o.match(WH)?o.replace(WH,'').trim():o;
  var optAux=optNoWh.split(' ')[0].toLowerCase();
  if(q.rule==='r2'&&!o.match(WH)&&a.match(WH)) return 'Kata tanya harus di paling depan, bukan di akhir atau hilang.';
  if(!AUX.test(optNoWh)) return 'Tidak ada kata bantu sebelum subjek. Kalimat tanya wajib diawali kata bantu (atau kata tanya + kata bantu).';
  if(/^(do|does|did)$/.test(optAux)&&/^(am|is|are|was|were|can|could|will|would|shall|should|must|may|might|have|has|had)$/.test(ansAux)) return 'Kalimatnya sudah punya kata bantu ('+ansAux+'), jadi tidak perlu menambah '+optAux+'. Cukup pindahkan '+ansAux+' ke depan.';
  if(/^(do|does)$/.test(optAux)&&ansAux==='did') return 'Kejadiannya lampau, kata bantunya harus did, bukan '+optAux+'.';
  if(optAux==='did'&&/^(do|does)$/.test(ansAux)) return 'Kalimat aslinya bukan lampau, jadi kata bantunya '+ansAux+', bukan did.';
  if(optAux==='does'&&ansAux==='do') return 'Subjeknya jamak / you / we / they → pakai do, bukan does.';
  if(optAux==='do'&&ansAux==='does') return 'Subjeknya he / she / it (tunggal orang ketiga) → pakai does, bukan do.';
  if(optAux!==ansAux&&/^(am|is|are|was|were|have|has)$/.test(optAux)&&/^(am|is|are|was|were|have|has)$/.test(ansAux)) return 'Kata bantunya tidak cocok dengan subjek atau waktunya. Seharusnya '+ansAux+'.';
  if(optAux===ansAux){
   var restA=(a.match(WH)?a.replace(WH,'').trim():a).split(' ').slice(1).join(' ').toLowerCase();
   var restO=optNoWh.split(' ').slice(1).join(' ').toLowerCase();
   if(/^(do|does|did)$/.test(ansAux)&&restO!==restA) return 'Setelah '+ansAux+', kata kerja harus kembali ke bentuk dasar. Informasi -s / lampau sudah dibawa oleh '+ansAux+'.';
   if(/^(can|could|will|would|shall|should|must|may|might)$/.test(ansAux)&&restO!==restA) return 'Setelah modal ('+ansAux+'), kata kerja selalu bentuk dasar, tanpa -s.';
   if(restO!==restA) return 'Kata bantunya sudah benar, tapi bagian setelahnya berubah. Selain memindahkan kata bantu, sisanya harus tetap.';
  }
  return 'Urutannya belum sesuai rumus: '+(q.rule==='r2'?'kata tanya + ':'')+'kata bantu + subjek + kata kerja.';
 }
 if(q.rule==='r3'){
  var subjQ=/^Who\s+\w+/.test(a)&&!/^Who (do|does|did)\b/.test(a);
  if(subjQ){
   if(/^Who (do|does|did) /i.test(o)) return 'Yang ditanyakan adalah pelakunya (subjek). Who langsung menggantikan subjek, tidak perlu do/does/did.';
   return 'Untuk pertanyaan subjek, susunannya persis kalimat pernyataan dengan subjek diganti who: kata kerja tetap di tempat dan bentuknya tidak berubah.';
  }
  if(!/^(who|what) (do|does|did) /i.test(o)) return 'Yang ditanyakan objek, subjeknya masih ada → butuh kata bantu: '+a.split(' ')[1]+' setelah kata tanya.';
  return 'Setelah '+a.split(' ')[1]+', kata kerja harus bentuk dasar dan subjek tetap di posisinya.';
 }
 if(q.rule==='r4'){
  var opener=a.split(/ (if|whether|what time|how long|how often|what|where|when|why|how|which|who)\b/i)[0];
  var innerA=a.slice(opener.length).trim(), innerO=o.indexOf(opener)===0?o.slice(opener.length).trim():null;
  if(innerO===null) return 'Pembukanya hilang. Tanpa pembuka sopan, ini bukan pertanyaan tidak langsung.';
  if(/^if /.test(innerA)&&!/^(if|whether) /.test(innerO)) return 'Pertanyaan Yes/No harus disambung dengan if (atau whether) setelah pembuka.';
  if(/^(if|whether) /.test(innerO)&&!/^if /.test(innerA)) return 'Pertanyaan ini punya kata tanya (WH), jadi tidak memakai if. Pakai kata tanyanya langsung.';
  if(innerO.replace(/[?.]$/,'').toLowerCase()===innerA.replace(/[?.]$/,'').toLowerCase()) return /\?$/.test(a)?'Kata-katanya sudah benar, tapi pembukanya berbentuk pertanyaan ('+opener+'), jadi harus diakhiri tanda tanya.':'Kata-katanya sudah benar, tapi pembukanya pernyataan ('+opener+'), jadi diakhiri titik, bukan tanda tanya.';
  var body=innerO.replace(/^(if|whether) /,'').replace(WH,'').trim();
  if(/ (do|does|did) \w+/.test(body)&&!AUX.test(body)) return 'Setelah pembuka, do/does/did tidak dipakai sama sekali, juga tidak di tengah. Kata kerjanya langsung: '+innerA.replace(/[?.]$/,'')+'.';
  if(AUX.test(body)&&/^(do|does|did) /i.test(body)) return 'Setelah pembuka, do/does/did hilang dan -s / bentuk lampaunya kembali ke kata kerja. Urutan jadi seperti kalimat biasa.';
  if(AUX.test(body)) return 'Setelah pembuka, urutan kembali normal: subjek dulu, baru kata bantu ('+body.split(' ')[0]+' seharusnya setelah subjek).';
  return 'Bagian dalam sudah urutan normal, tapi bentuk kata kerjanya belum sesuai (-s / lampau harus kembali ke kata kerja).';
 }
 return 'Tidak sesuai kunci.';
}

var GEN={r1:r1,r2:r2,r3:r3,r4:r4};
// Bangun N soal untuk satu rumus dari seed, melewati kunci yang sudah pernah benar (doneKeys: {ans:1})
window.ASK_GEN={
 make:function(rule,n,seed,doneKeys){var r=mulberry(seed||1);var out=[],seen={},guard=0;while(out.length<n&&guard<n*40){guard++;var q=GEN[rule](r);if(!q||!q.ans)continue;var k=q.ans.toLowerCase();if(seen[k]||(doneKeys&&doneKeys[k]))continue;if(q.opts.length<3)continue;seen[k]=1;
   // lengkapi sampai 4 opsi dengan pengalih umum (tanpa tanda tanya / urutan pernyataan)
   var extra=[q.ans.replace(/\?$/,'.'),q.prompt.replace(/\.$/,'?'),q.ans.replace(/^(\S+) (\S+)/,'$2 $1')];extra.forEach(function(e){if(q.opts.length<4&&q.opts.map(function(x){return x.toLowerCase();}).indexOf(e.toLowerCase())<0&&e.toLowerCase()!==q.ans.toLowerCase())q.opts.push(e);});
   var nk=window.ASK_GEN?window.ASK_GEN.norm(q.ans):q.ans.toLowerCase().replace(/[?.!]+$/,''); q.opts=q.opts.filter(function(o){return o===q.ans||(window.ASK_GEN?window.ASK_GEN.norm(o):o.toLowerCase().replace(/[?.!]+$/,''))!==nk;}); if(q.opts.length<3)continue;
   q.opts=shuffle(r,q.opts); q.explain={}; q.opts.forEach(function(o){q.explain[o]=explainOpt(q,o);});q.shuffled=shuffle(r,q.tokens.map(function(t,i){return {t:t,i:i};}));out.push(q);}return out;},
 // Normalisasi jawaban ketik: huruf kecil, spasi tunggal, tanpa tanda baca akhir, kontraksi disamakan
 explain:explainOpt,
 norm:function(s){return String(s||'').toLowerCase().replace(/[’`]/g,"'").replace(/\s+/g,' ').replace(/[?.!]+$/,'').replace(/\bi'm\b/g,'i am').replace(/\b(\w+)n't\b/g,'$1 not').replace(/\bwon't\b/g,'will not').replace(/\b(he|she|it|that|there|who|what|where|when|why|how)'s\b/g,'$1 is').replace(/\b(i|you|we|they)'re\b/g,'$1 are').replace(/\b(i|you|we|they)'ve\b/g,'$1 have').replace(/\b(\w+)'d\b/g,'$1 would').replace(/\b(\w+)'ll\b/g,'$1 will').trim();}
};
})();

}
