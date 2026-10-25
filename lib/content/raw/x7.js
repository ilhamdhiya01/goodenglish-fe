// Tambahan kosakata Pre-intermediate (Okt 2026), termasuk frasa percakapan sehari-hari. Format sama dengan x1–x6: [type, en, pron, id, ex, syn].
// Dieksekusi dengan objek "window" lokal (bukan global).
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{};
// W1 Kenalan & rutinitas harian — milik sendiri (my own …), diri sendiri (myself …), Family matters most.
VOCAB_X[1]=(VOCAB_X[1]||[]).concat([
["w","my own","mai on","milikku sendiri","I want my own room.",""],
["w","your own","yor on","milikmu sendiri","You can bring your own food.",""],
["w","his own","hiz on","miliknya (lk) sendiri","He runs his own business.",""],
["w","her own","her on","miliknya (pr) sendiri","She has her own car.",""],
["w","our own","aur on","milik kami sendiri","We built our own house.",""],
["w","their own","der on","milik mereka sendiri","They make their own bread.",""],
["w","myself","mai-SELF","diriku sendiri","I made this cake myself.",""],
["w","yourself","yor-SELF","dirimu sendiri","Take care of yourself.",""],
["w","himself","him-SELF","dirinya (lk) sendiri","He cut himself while cooking.",""],
["w","herself","her-SELF","dirinya (pr) sendiri","She taught herself English.",""],
["w","ourselves","aur-SELVZ","diri kami sendiri","We enjoyed ourselves at the party.",""],
["w","themselves","dem-SELVZ","diri mereka sendiri","They introduced themselves.",""],
["ex","Family matters most.","FE-mi-li ME-terz most","Keluarga yang paling penting.","For me, family matters most.",""],
["ex","Same as usual.","seim ez YU-zhu-el","Ya begitu-begitu aja.","How's work? — Same as usual.",""],
["ex","Talk to you later.","tok tu yu LEI-ter","Nanti ngobrol lagi ya.","I have to go now. Talk to you later!",""],
["ex","Just text me.","jast tekst mi","Chat aja.","If you need anything, just text me.",""]
]);
// W2 Rumah, makanan & belanja — cut out sugar (berhenti makan / minum sesuatu), separate (memilah sampah).
VOCAB_X[2]=(VOCAB_X[2]||[]).concat([
["pv","cut out","kat aut","berhenti (makan / minum sesuatu) / memotong","I'm trying to cut out sugar.",""],
["w","separate","SE-pe-reit","memisahkan / terpisah","Please separate the plastic from the paper.",""],
["ex","Let's grab lunch.","lets greb lanc","Yuk makan siang bareng.","Are you hungry? Let's grab lunch.",""],
["ex","I'll be there in 10 minutes.","ail bi der in ten MI-nits","Aku sampai 10 menit lagi.","Don't worry, I'll be there in 10 minutes.",""],
["ex","I'll have this one.","ail hev dis wan","Aku pesan yang ini.","I'll have this one, please.",""],
["ex","What do you recommend?","wot du yu re-ke-MEND","Kamu rekomendasi apa?","It's my first time here. What do you recommend?",""],
["ex","Do you have a smaller size?","du yu hev e SMO-ler saiz","Ada ukuran lebih kecil?","This shirt is too big. Do you have a smaller size?",""],
["ex","It looks like it's going to rain.","its luks laik its GO-ing tu rein","Kayaknya mau hujan.","Take an umbrella. It looks like it's going to rain.",""],
["ex","What a nice day!","wot e nais dei","Cuacanya enak banget!","What a nice day! Let's go for a walk.",""],
["ex","It's freezing!","its FRI-zing","Dingin banget!","Close the window. It's freezing!",""]
]);
// W4 Small talk, perasaan & opini — what kind of (pasangan "kind of"), dan ekspresi matter = penting.
VOCAB_X[4]=(VOCAB_X[4]||[]).concat([
["col","what kind of","wot KAIN-dov","jenis apa / seperti apa","What kind of music do you like?",""],
["ex","It doesn't matter.","it DA-zent ME-ter","Nggak apa-apa. / Nggak masalah.","Sorry I'm late. — It doesn't matter.",""],
["ex","Does it matter?","daz it ME-ter","Apa itu penting? / Ngaruh nggak?","Does it matter which one I choose?",""],
["ex","Your opinion matters.","yor o-PI-nyen ME-terz","Pendapatmu penting.","Please tell us. Your opinion matters.",""],
["ex","Are you free tomorrow?","ar yu fri tu-MO-ro","Besok kamu kosong?","Are you free tomorrow? Let's watch a movie.",""],
["ex","Let me check first.","let mi cek ferst","Aku cek dulu ya.","Dinner on Friday? Let me check first.",""],
["ex","Don't worry about it.","dont WA-ri e-BAUT it","Nggak usah dipikirin.","Sorry I'm late. — Don't worry about it.",""],
["ex","I'm so excited!","aim so ek-SAI-tid","Aku senang banget!","We're going to Bali next week. I'm so excited!",""],
["ex","I'm not in the mood.","aim not in de mud","Lagi nggak mood.","Not tonight. I'm not in the mood.",""],
["ex","I'm stressed out.","aim strest aut","Aku lagi stres.","I have three deadlines. I'm stressed out.",""],
["ex","I guess so.","ai ges so","Kayaknya sih iya.","Is it going to be OK? — I guess so.",""],
["st","I'm not a big fan of …","aim not e big fen ov","Aku kurang suka …","I'm not a big fan of spicy food.",""],
["ex","It's not my thing.","its not mai fing","Itu bukan seleraku.","I tried yoga, but it's not my thing.",""],
["ex","You can do it!","yu ken du it","Kamu pasti bisa!","Don't be nervous. You can do it!",""],
["ex","Hang in there.","heng in der","Bertahan ya.","I know it's hard. Hang in there.",""],
["ex","I'm proud of you.","aim praud ov yu","Aku bangga sama kamu.","You passed the exam! I'm proud of you.",""],
["ex","Everything will be fine.","EV-ri-fing wil bi fain","Semua bakal baik-baik aja.","Don't worry. Everything will be fine.",""],
["ex","What time works for you?","wot taim werks for yu","Jam berapa kamu bisa?","Let's have a call tomorrow. What time works for you?",""],
["ex","See you then.","si yu den","Sampai ketemu nanti.","Saturday at 10? OK, see you then.",""],
["ex","What's the matter?","wots de ME-ter","Ada apa? / Kenapa?","What's the matter? You look upset.",""]
]);
// W9 Diskusi & membandingkan — even + comparative (even better), that's why (memberi alasan → akibat).
VOCAB_X[9]=(VOCAB_X[9]||[]).concat([
["w","even","I-ven","bahkan / lebih … lagi","This plan is even better than the first one.",""],
["cj","that's why","dets wai","makanya / itulah sebabnya","I was sick yesterday. That's why I didn't come.",""],
["ex","I don't think so.","ai dont fingk so","Kayaknya nggak deh.","Will it rain today? — I don't think so.",""]
]);
// W11 Cerita & pengalaman — adverb cara (quiet → quietly) dan kick out (got kicked out of …).
VOCAB_X[11]=(VOCAB_X[11]||[]).concat([
["w","quietly","KWAI-et-li","dengan pelan / diam-diam","She closed the door quietly.",""],
["pv","kick out","kik aut","mengusir / mengeluarkan","He got kicked out of school.",""],
["ex","Oh my God!","o mai god","Ya ampun!","Oh my God! Is that really you?",""],
["ex","You're kidding!","yor KI-ding","Kamu bercanda! / Masa sih!","I won the lottery. — You're kidding!",""],
["ex","What a surprise!","wot e ser-PRAIZ","Kejutan banget!","What a surprise! I didn't know you were coming.",""]
]);
// W12 Review & ekspresi natural — go all out (habis-habisan).
VOCAB_X[12]=(VOCAB_X[12]||[]).concat([
["pv","go all out","go ol aut","habis-habisan / mengerahkan semua tenaga","We went all out for the launch.",""],
["ex","I gotta go.","ai GO-te go","Aku harus pergi dulu.","Sorry, I gotta go. See you!",""],
["ex","I'm so done with this.","aim so dan wid dis","Aku udah capek sama ini.","Another bug? I'm so done with this.",""],
["ex","What a long day!","wot e long dei","Hari yang panjang banget!","What a long day! I just want to sleep.",""],
["cj","no matter what","no ME-ter wot","apa pun yang terjadi","I'll finish it, no matter what.",""],
["cj","no matter how","no ME-ter hau","bagaimanapun / seberapa pun","No matter how hard it is, keep trying.",""],
["st","As a matter of fact, …","ez e ME-ter ov fekt","Sebenarnya, … / Faktanya, …","As a matter of fact, I've been there.",""]
]);
// Frasa percakapan (Okt 2026) — minggu 3.
VOCAB_X[3]=(VOCAB_X[3]||[]).concat([
["ex","Sorry about that.","SO-ri e-BAUT det","Maaf soal itu.","I sent the wrong file. Sorry about that.",""],
["ex","Can we talk later?","ken wi tok LEI-ter","Bisa ngobrol nanti?","I'm in a meeting. Can we talk later?",""],
["ex","I'm working on it.","aim WER-king on it","Lagi aku kerjakan.","Is the report ready? — I'm working on it.",""],
["ex","It's almost done.","its OL-most dan","Udah hampir selesai.","Don't worry, it's almost done.",""],
["st","Just to make sure, …","jast tu meik syur","Cuma mau memastikan, …","Just to make sure, the meeting is at 3, right?",""],
["ex","Something came up.","SAM-fing keim ap","Ada urusan mendadak.","Sorry, I can't come. Something came up.",""],
["ex","Can we reschedule?","ken wi ri-SKE-jul","Bisa dijadwal ulang?","I'm not feeling well. Can we reschedule?",""]
]);
// Frasa percakapan (Okt 2026) — minggu 5.
VOCAB_X[5]=(VOCAB_X[5]||[]).concat([
["ex","It's just around the corner.","its jast e-RAUND de KOR-ner","Deket banget, di tikungan situ.","The pharmacy? It's just around the corner.",""]
]);
// Frasa percakapan (Okt 2026) — minggu 10.
VOCAB_X[10]=(VOCAB_X[10]||[]).concat([
["ex","Who's calling?","huz KO-ling","Ini siapa? / Dengan siapa ini?","Hello, who's calling, please?",""],
["ex","Can you hear me?","ken yu hir mi","Kedengeran nggak?","Hello? Can you hear me now?",""],
["ex","You're breaking up.","yor BREI-king ap","Suaramu putus-putus.","Sorry, you're breaking up. Can you say that again?",""],
["ex","I'll call you back.","ail kol yu bek","Nanti aku telepon balik.","I'm driving now. I'll call you back.",""],
["ex","Sorry, I missed your call.","SO-ri ai mist yor kol","Maaf, tadi nggak keangkat.","Sorry, I missed your call. I was in a meeting.",""],
["ex","This is so annoying.","dis iz so e-NOI-ing","Ini nyebelin banget.","The Wi-Fi keeps disconnecting. This is so annoying.",""],
["ex","I can't deal with this right now.","ai kent dil wid dis rait nau","Aku lagi nggak sanggup ngurusin ini.","Sorry, I can't deal with this right now. Can we talk tomorrow?",""]
]);
}
