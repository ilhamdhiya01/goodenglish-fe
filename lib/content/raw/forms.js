// Dihasilkan dari vocab/forms.js — isi data tidak diubah. Dieksekusi dengan objek "window" lokal (bukan global).
export default function load(window){
var VOCAB_X=window.VOCAB_X=window.VOCAB_X||{}; var VOCAB_L=window.VOCAB_L=window.VOCAB_L||{};
// Bentuk kata kerja. IRREG: base → [V2, V3, V-ing (hanya jika ejaan tidak biasa)].
// SPELL: verb beraturan dengan ejaan V2/V-ing yang tidak biasa → [V2, V-ing].
window.VERB_FORMS={
IRREG:{
be:['was / were','been','being'],have:['had','had','having'],do:['did','done'],go:['went','gone'],come:['came','come','coming'],
get:['got','got / gotten','getting'],make:['made','made','making'],take:['took','taken','taking'],give:['gave','given','giving'],
see:['saw','seen'],know:['knew','known'],think:['thought','thought'],say:['said','said'],tell:['told','told'],
find:['found','found'],leave:['left','left','leaving'],feel:['felt','felt'],bring:['brought','brought'],buy:['bought','bought'],
pay:['paid','paid'],send:['sent','sent'],meet:['met','met'],write:['wrote','written','writing'],speak:['spoke','spoken'],
eat:['ate','eaten'],drink:['drank','drunk'],sleep:['slept','slept'],begin:['began','begun','beginning'],build:['built','built'],
spend:['spent','spent'],read:['read /red/','read /red/'],wake:['woke','woken','waking'],drive:['drove','driven','driving'],
ride:['rode','ridden','riding'],hear:['heard','heard'],forget:['forgot','forgotten','forgetting'],understand:['understood','understood'],
teach:['taught','taught'],lose:['lost','lost','losing'],fall:['fell','fallen'],break:['broke','broken'],hurt:['hurt','hurt'],
run:['ran','run','running'],hide:['hid','hidden','hiding'],ring:['rang','rung'],hang:['hung','hung'],
lead:['led','led'],hold:['held','held'],keep:['kept','kept'],let:['let','let','letting'],put:['put','put','putting'],
set:['set','set','setting'],cut:['cut','cut','cutting'],hit:['hit','hit','hitting'],quit:['quit','quit','quitting'],
show:['showed','shown'],grow:['grew','grown'],throw:['threw','thrown'],draw:['drew','drawn'],fly:['flew','flown'],
wear:['wore','worn'],tear:['tore','torn'],choose:['chose','chosen','choosing'],rise:['rose','risen','rising'],
win:['won','won','winning'],sit:['sat','sat','sitting'],stand:['stood','stood'],lie:['lay','lain','lying'],
sell:['sold','sold'],catch:['caught','caught'],fight:['fought','fought'],seek:['sought','sought'],
mean:['meant','meant'],learn:['learned / learnt','learned / learnt'],dream:['dreamed / dreamt','dreamed / dreamt'],
shut:['shut','shut','shutting'],cost:['cost','cost'],become:['became','become','becoming'],
sing:['sang','sung'],swim:['swam','swum','swimming'],stick:['stuck','stuck'],strike:['struck','struck','striking'],
shake:['shook','shaken','shaking'],steal:['stole','stolen'],freeze:['froze','frozen','freezing'],
forgive:['forgave','forgiven','forgiving'],bite:['bit','bitten','biting'],feed:['fed','fed'],
deal:['dealt','dealt'],light:['lit','lit'],split:['split','split','splitting'],spread:['spread','spread'],
withdraw:['withdrew','withdrawn'],overcome:['overcame','overcome','overcoming'],undertake:['undertook','undertaken','undertaking'],
misunderstand:['misunderstood','misunderstood'],arise:['arose','arisen','arising'],
burst:['burst','burst'],lend:['lent','lent'],bend:['bent','bent'],shoot:['shot','shot'],
prove:['proved','proved / proven','proving'],upset:['upset','upset','upsetting']
},
SPELL:{
stop:['stopped','stopping'],plan:['planned','planning'],drop:['dropped','dropping'],grab:['grabbed','grabbing'],
chat:['chatted','chatting'],shop:['shopped','shopping'],prefer:['preferred','preferring'],refer:['referred','referring'],
occur:['occurred','occurring'],admit:['admitted','admitting'],commit:['committed','committing'],submit:['submitted','submitting'],
travel:['traveled / travelled','traveling / travelling'],cancel:['canceled / cancelled','canceling / cancelling'],
study:['studied','studying'],try:['tried','trying'],carry:['carried','carrying'],worry:['worried','worrying'],
hurry:['hurried','hurrying'],apply:['applied','applying'],reply:['replied','replying'],cry:['cried','crying'],
die:['died','dying'],tie:['tied','tying'],panic:['panicked','panicking'],picnic:['picnicked','picnicking'],
argue:['argued','arguing'],agree:['agreed','agreeing'],free:['freed','freeing'],
make:['made','making'],live:['lived','living'],use:['used','using'],move:['moved','moving'],
arrive:['arrived','arriving'],decide:['decided','deciding'],hope:['hoped','hoping'],
visit:['visited','visiting'],open:['opened','opening'],listen:['listened','listening'],happen:['happened','happening'],
begin:['began','beginning'],regret:['regretted','regretting'],forget:['forgot','forgetting'],
fix:['fixed','fixing'],mix:['mixed','mixing'],enjoy:['enjoyed','enjoying'],play:['played','playing'],stay:['stayed','staying']
}
};

}
