// Mekanisme penjelasan detail per kata. notes-v2-index.js (dimuat langsung) mengisi M: kata → id catatan, jadi
// has() langsung tahu kata mana yang punya penjelasan. Isinya (N) ada di notes-v2-<level>.js yang dimuat belakangan
// (lihat loadNotes di src/data/index.ts); sebelum itu get() mengembalikan null. Format data:
//   add([kata, alias…], {core, forms?, use?, traps?, see?})
//   core : penjelasan dalam kalimat utuh     forms: [[pola, "arti · contoh"]]   use: [[kalimat Inggris, label]]
//   traps: [[salah, benar, alasan]]          see: [kata terkait yang ada di app]
// Terjemahan kalimat contoh dibaca lewat VOCAB_ID (id.js, ex-id.js, dan blok terjemahan di notes-v2-*.js).
export default function load(window){
var R=window.VOCAB_NOTES_RAW=window.VOCAB_NOTES_RAW||{N:{},M:{}}; var N=R.N, M=R.M;

// Kartu filler/ekspresi ditulis dengan tanda baca ("Well, …", "How come?"), penjelasannya tanpa ("well", "how come").
// Kalau tidak ada yang persis sama DAN teks kartu memang bertanda baca, cocokkan versi tanpa "…"/"..." dan tanda baca di ujung
// (kata polos seperti "right" tidak boleh nyasar ke alias "right?").
function norm(s){ return s.toLowerCase().replace(/…|\.\.\./g,' ').replace(/[\s,.?!]+$/,'').replace(/\s+/g,' ').trim(); }
var NM=null;
function byNorm(k){ if(!NM){ NM={}; Object.keys(M).forEach(function(w){ var n=norm(w); if(!(n in NM)) NM[n]=M[w]; }); } return NM[norm(k)]; }
// Penjelasan preposisi waktu/tempat ditautkan ke sub-tab grammar (tanpa mengubah data aslinya).
var AFTER={}; ['in','on','in the morning','at night','on monday','in march',"at 7 o'clock",'at home','at work','at school','on the wall','in front of'].forEach(function(w){ AFTER[w]=' Lengkapnya di Panduan grammar → In / On / At.'; });
var cache={};
function idOf(en){ var k=(en||'').toLowerCase().trim(); return M[k]||(norm(k)!==k?byNorm(k):null); }
window.VOCAB_NOTES={ has:function(en){ return !!idOf(en); },
  get:function(en){ var k=(en||'').toLowerCase().trim(); if(cache[k]) return cache[k];
    var id=idOf(en), n=id?N[id]:null; if(!n) return null;
    if(AFTER[k] && n.core.indexOf('In / On / At')<0) n=Object.assign({},n,{core:n.core+AFTER[k]});
    return (cache[k]=n); },
  get count(){ return Object.keys(M).length; } };
}
