/* Fleet Risk & Savings Calculator — tool logic */
function label(s){return s>=70?'High risk':s>=55?'Elevated':s>=40?'Guarded':s>=25?'Managed':'Low risk';}
/* Telematics-linked insurance discounts are not generally offered in Pakistan: default off for PKR */
var insTouched=false;
function setIns(v){document.querySelectorAll('[data-group="insdisc"]').forEach(function(b){b.classList.toggle('is-on',b.getAttribute('data-value')===v);});}
C9.hooks.onGroup=function(g){if(g==='insdisc')insTouched=true;};
C9.hooks.onCurrency=function(c){if(!insTouched)setIns(c==='PKR'?'no':'yes');};
function recalc(){
  C9.setMax('accidents',Math.min(200,Math.max(10,C9.state().vehicles*2)));
  var s=C9.state();
  var perVeh=s.vehicles>0?s.accidents/s.vehicles:0;
  var warn=document.getElementById('accWarn');
  if(warn){warn.hidden=perVeh<=1;warn.textContent='That is '+perVeh.toFixed(1)+' at-fault accidents per vehicle per year. Most fleets report well under 1. Check the figure, as it drives most of the saving.';}
  var cls={heavy:14,light:6,bus:10,mixed:9}[s.vclass]||9;
  var rt={highway:12,urban:9,mixed:10,yard:6}[s.route]||10;
  var gap={none:14,gps:8,dashcam:4}[s.fitted]||14;
  var mkm=s.km*s.vehicles/1e6;
  var rate=mkm>0?s.accidents/mkm:0;
  var hist=Math.min(24,rate*3.2);
  var fatigue=Math.min(100,(s.route==='highway'?52:34)+s.night*0.75+(s.vclass==='heavy'?12:0));
  var distraction=Math.min(100,(s.route==='urban'?58:38)+(s.vclass==='light'?12:0)+s.night*0.2);
  var history=Math.min(100,rate*22);
  var gapPct={none:88,gps:56,dashcam:34}[s.fitted]||88;
  var risk=Math.max(5,Math.min(95,22+cls+rt+s.night*0.28+hist+gap));
  var red=Math.min(0.42,0.24+(s.fitted==='none'?0.10:s.fitted==='gps'?0.06:0.03)+s.night/600);
  var next=Math.max(4,Math.round(risk*(1-red)));
  var accRed=Math.min(0.30,0.18+(s.fitted==='none'?0.08:s.fitted==='gps'?0.05:0.02)+s.night/700);
  var avoided=s.accidents*accRed;
  var accSave=avoided*s.acost;
  var ins=s.insdisc!=='no';
  var insSave=ins?s.premium*s.vehicles*0.08*(s.fitted==='none'?1:0.7):0;
  C9.set('riskNow',Math.round(risk)); C9.set('riskNowLabel',label(risk));
  C9.set('riskNext',next); C9.set('riskNextLabel',label(next));
  [['f1',fatigue],['f2',distraction],['f3',history],['f4',gapPct]].forEach(function(p){C9.bar(p[0],p[1]);C9.set(p[0]+'v',Math.round(p[1])+'%');});
  C9.set('avoided',avoided.toFixed(1));
  C9.set('accSave',C9.money(accSave));
  C9.set('insSave',ins?C9.money(insSave):'Not applied');
  C9.set('totalSave',C9.money(accSave+insSave));
}
if(!location.search)setIns('yes');
C9.init(recalc);
