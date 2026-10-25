// Dihasilkan dari vocab/x6.js — isi data tidak diubah. Dieksekusi dengan objek "window" lokal (bukan global).
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{}; var VOCAB_L=window.VOCAB_L=window.VOCAB_L||{};
// Paket "Ekspresi harian": reaksi, filler, dan frasa percakapan yang sering dipakai.
(window.VOCAB_X=window.VOCAB_X||{});
// Minggu 1 — sapaan, sopan santun, pamit
VOCAB_X[1]=(VOCAB_X[1]||[]).concat([
["ex","Hey, what's up?","hei wots ap","Hei, apa kabar? (sangat santai)","Hey, what's up? Long time no see.","kasual; jawab: Not much."],
["ex","How's it going?","hauz it GO-ing","Gimana kabarnya?","How's it going? — Pretty good, you?","kasual"],
["ex","Not bad.","not bed","Lumayan / baik-baik saja.","How are you? — Not bad, thanks.",""],
["ex","Pretty good.","PRI-ti gud","Cukup baik.","How's work? — Pretty good, actually.",""],
["ex","Excuse me.","ik-SKYUZ mi","Permisi. / Maaf (menyela, lewat, memanggil)","Excuse me, is this the right line?",""],
["ex","Pardon?","PAR-den","Maaf, apa? (minta ulang, sopan)","Pardon? I didn't catch that.","lebih formal dari Sorry?"],
["ex","After you.","AF-ter yu","Silakan duluan.","After you. — Oh, thanks.","di pintu / antrean"],
["ex","Help yourself.","help yor-SELF","Silakan ambil sendiri.","There's coffee in the kitchen. Help yourself.",""],
["ex","Take care.","teik ker","Jaga diri ya. (pamit)","Okay, see you Monday. Take care!",""],
["ex","Catch you later.","kec yu LEI-ter","Sampai nanti. (santai)","I've got to run. Catch you later!","kasual"],
["ex","See you around.","si yu e-RAUND","Sampai jumpa lagi (kapan-kapan).","Nice meeting you. See you around!",""],
["ex","Have a good one.","hev e gud wan","Semoga harimu menyenangkan.","Thanks for your help. Have a good one!","AmE, kasual"],
["ex","Well done!","wel dan","Bagus! / Kerja bagus!","You passed? Well done!",""],
["ex","Good job.","gud job","Kerja bagus.","Good job on the demo today.",""],
["ex","Congrats!","kon-GRETS","Selamat!","Congrats on the new role!","singkatan congratulations"],
["ex","Nice one.","nais wan","Bagus / mantap. (santai)","You fixed it already? Nice one.","BrE, kasual"]
]);
// Minggu 2 — makan, nongkrong, kehidupan sehari-hari
VOCAB_X[2]=(VOCAB_X[2]||[]).concat([
["ex","It's on me.","its on mi","Aku yang bayar.","Put your wallet away. It's on me.",""],
["ex","My treat.","mai trit","Aku yang traktir.","Lunch today? My treat.",""],
["ex","Let's split the bill.","lets split de bil","Bayar masing-masing / patungan.","Let's just split the bill.","go Dutch = sama"],
["ex","For here or to go?","for hir or tu go","Makan di sini atau dibawa pulang?","One latte, please. — For here or to go?","AmE; BrE: eat in or take away"],
["w","takeout","TEIK-aut","makanan bawa pulang / pesan antar","Let's just get takeout tonight.","BrE: takeaway"],
["w","tap water","tep WO-ter","air keran (gratis di restoran)","Just tap water is fine, thanks.",""],
["ex","Is this seat taken?","iz dis sit TEI-ken","Kursi ini ada yang pakai?","Excuse me, is this seat taken?",""],
["w","craving","KREI-ving","ngidam / ingin banget makan sesuatu","I'm craving something spicy.","be craving / have a craving for"],
["w","starving","STAR-ving","lapar banget","I skipped lunch. I'm starving.",""],
["w","leftovers","LEFT-o-verz","sisa makanan","We had leftovers for lunch.",""],
["w","nap","nep","tidur siang sebentar","I took a quick nap after lunch.","take a nap"],
["w","errand","E-rend","urusan kecil di luar (ke bank, pos, dsb.)","I have to run a few errands.","run errands"],
["w","chore","cor","pekerjaan rumah (cuci, sapu, dsb.)","Weekend means chores.","do the chores"],
["w","broke","brok","bokek / tidak punya uang","I can't go out, I'm broke.","kasual"],
["w","hungover","hang-O-ver","pusing setelah minum semalam","He looked hungover this morning.",""],
["w","cozy","KO-zi","nyaman dan hangat (tempat)","This café is really cozy.","BrE: cosy"],
["pv","hang out","heng aut","nongkrong","We hung out at the mall.",""],
["pv","bump into","bamp IN-tu","tidak sengaja bertemu","I bumped into my old boss yesterday.","= run into"]
]);
// Minggu 3 — chat kerja, kabar posisi
VOCAB_X[3]=(VOCAB_X[3]||[]).concat([
["ex","I'm running late.","aim RA-ning leit","Aku terlambat (sedang di jalan).","Sorry, I'm running late. Start without me.",""],
["ex","I'm on my way.","aim on mai wei","Aku sedang di jalan.","On my way, be there in ten.","chat: omw"],
["ex","I'm stuck in traffic.","aim stak in TRE-fik","Aku terjebak macet.","Stuck in traffic, sorry!",""],
["ex","Be right back.","bi rait bek","Sebentar, segera kembali.","Be right back, grabbing coffee.","chat: brb"],
["ex","Heads up:","hedz ap","Sekadar info / peringatan dini:","Heads up: the deploy is at 3.",""],
["ex","FYI","ef wai ai","Sekadar informasi (for your information)","FYI, the client moved the meeting.","tulis/ucap huruf"],
["ex","ASAP","ei es ei pi / EI-sep","Sesegera mungkin","Please send it ASAP.",""],
["ex","Let me know.","let mi no","Kabari aku.","Let me know if that works for you.",""],
["ex","Keep me posted.","kip mi POS-tid","Kabari terus perkembangannya.","Keep me posted on the bug.",""],
["w","ping","ping","menghubungi cepat lewat chat","Ping me when you're free.","kasual, kantor tech"],
["w","WFH","dab-lyu ef eic","kerja dari rumah (work from home)","I'm WFH on Fridays.",""],
["w","day off","dei of","hari libur (cuti)","I'm taking a day off tomorrow.",""],
["w","payday","PEI-dei","hari gajian","Friday is payday.",""],
["w","due","dyu","jatuh tempo / harus selesai","The report is due Monday.","due date"],
["col","on track","on trek","sesuai rencana / jadwal","We're on track for the release.",""],
["col","behind schedule","bi-HAIND SKE-jul","terlambat dari jadwal","We're a week behind schedule.",""],
["pv","kick off","kik of","memulai (proyek, meeting)","We kick off the project Monday.","kick-off meeting"],
["pv","wrap up","rep ap","menyelesaikan / menutup","Let's wrap up in five minutes.",""],
["pv","follow up","FO-lo ap","menindaklanjuti","I'll follow up by email.",""]
]);
// Minggu 4 — reaksi, filler, klarifikasi, pilihan & menolak halus
VOCAB_X[4]=(VOCAB_X[4]||[]).concat([
["ex","I mean, ...","ai min","Maksudku, ... (filler / meralat)","It's fine. I mean, it could be better.","filler paling umum"],
["ex","You know, ...","yu no","Kamu tahu lah, ... (filler)","It's, you know, a bit complicated.","jangan berlebihan"],
["ex","Gotcha.","GO-ce","Oke, ngerti. (santai)","Turn left at the bank. — Gotcha.","= got it"],
["ex","Got it.","got it","Ngerti / oke.","Send it by Friday. — Got it.",""],
["ex","I see.","ai si","Oh, begitu.","I see. So the meeting is cancelled.",""],
["ex","Makes sense.","meiks sens","Masuk akal.","We test first, then deploy. — Makes sense.",""],
["ex","Good point.","gud point","Poin bagus / benar juga.","Good point. I hadn't thought of that.",""],
["ex","Sounds good.","saundz gud","Boleh / setuju.","Lunch at one? — Sounds good.",""],
["ex","No way!","no wei","Nggak mungkin! / Serius?!","She quit? No way!","kaget; juga = tidak mau"],
["ex","Guess what?","ges wot","Coba tebak? (mau kasih kabar)","Guess what? I got the job!",""],
["ex","That's it.","dets it","Itu saja. / Tepat sekali.","Just one more file. That's it.",""],
["ex","To be honest, ...","tu bi O-nest","Jujur saja, ...","To be honest, I didn't like the movie.","chat: tbh"],
["ex","I suppose.","ai se-POZ","Kurasa begitu. (ragu-ragu setuju)","It's okay, I suppose.",""],
["ex","I bet.","ai bet","Pasti / aku yakin.","I bet he forgot again.",""],
["ex","I'd say ...","aid sei","Menurutku kira-kira ...","I'd say about two hours.","perkiraan halus"],
["ex","Let's say ...","lets sei","Anggap saja / misalnya ...","Let's say we launch in May.",""],
["ex","As far as I know, ...","ez far ez ai no","Sejauh yang aku tahu, ...","As far as I know, it's still open.","chat: afaik"],
["ex","Kidding! / Just joking.","KI-ding","Bercanda!","You're fired. Kidding!","= just kidding"],
["ex","Sorry?","SO-ri","Maaf, apa? (minta ulang)","Sorry? I didn't hear you.",""],
["ex","Come again?","kam e-GEN","Apa tadi? (santai)","Come again? The wifi cut out.","kasual"],
["ex","What was that?","wot woz det","Apa tadi?","What was that? Say it again, please.",""],
["ex","Could you say that again?","kud yu sei det e-GEN","Bisa diulang?","Could you say that again, please?","sopan"],
["ex","What do you mean?","wot du yu min","Maksudmu apa?","What do you mean it's not working?",""],
["ex","How come?","hau kam","Kok bisa? / Kenapa?","You're not coming? How come?","lebih santai dari why"],
["ex","What for?","wot for","Untuk apa?","You need my ID? What for?",""],
["ex","So what?","so wot","Lalu apa? / Terus kenapa?","It's late. — So what? It's Friday.","bisa terdengar kasar"],
["ex","Who cares?","hu kerz","Siapa peduli?","It's a bit messy. Who cares?","kasual"],
["ex","Do you mind if I ...?","du yu maind if ai","Boleh aku ...?","Do you mind if I open the window?","jawab: Not at all / Go ahead"],
["ex","Would you mind ...ing?","wud yu maind","Bisa tolong ...?","Would you mind closing the door?","sopan"],
["ex","I was wondering if ...","ai woz WAN-de-ring if","Aku ingin tahu apakah ... (minta halus)","I was wondering if you could help me.",""],
["ex","I'm afraid ...","aim e-FREID","Sayangnya ... / Maaf, ...","I'm afraid I can't make it.","menolak sopan"],
["ex","I'm not sure.","aim not syur","Aku tidak yakin.","I'm not sure. Let me check.",""],
["ex","It depends.","it di-PENDZ","Tergantung.","Can you finish today? — It depends.",""],
["ex","Up to you.","ap tu yu","Terserah kamu.","Pizza or sushi? — Up to you.",""],
["ex","Either way.","AI-der wei","Yang mana saja boleh.","Call or text, either way is fine.",""],
["ex","Whichever / whenever.","wic-E-ver","Yang mana / kapan saja.","Whichever is easier for you.",""],
["ex","I don't mind.","ai dont maind","Aku tidak keberatan / terserah.","Window or aisle? — I don't mind.",""],
["ex","Count me in.","kaunt mi in","Aku ikut.","Dinner Friday? Count me in!","= I'm in / I'm down"],
["ex","I'll pass.","ail pas","Aku lewat saja / tidak ikut.","Karaoke? I'll pass this time.","menolak santai"],
["ex","Can I take a rain check?","ken ai teik e rein cek","Boleh ditunda lain kali?","Can I take a rain check? I'm exhausted.",""],
["ex","Maybe next time.","MEI-bi nekst taim","Mungkin lain kali.","Can't tonight. Maybe next time.",""],
["w","flaky","FLEI-ki","sering batal janji / tidak bisa diandalkan","He's flaky. Don't count on him.","kasual"],
["w","clingy","KLING-i","terlalu nempel / bergantung","Her ex was really clingy.",""],
["w","nosy","NO-zi","suka ikut campur / kepo","My neighbor is so nosy.",""],
["w","awkward","OK-werd","canggung","There was an awkward silence.",""],
["w","weird","wird","aneh","That's weird. It worked yesterday.",""]
]);

}
