/* Shelf Audit ROI Calculator — tool logic */
function show(id,on){var el=document.getElementById(id);if(!el)return;var box=el.classList.contains('cards')?el:el.closest('.slider');if(box)box.style.display=on?'':'none';}
function recalc(){
  var s=C9.state();
  var none=s.method==='none';
  show('freqCards',!none);show('auditHours',!none);show('auditRate',!none);
  var cx={simple:0.85,standard:1,complex:1.15}[s.complexity]||1;
  var visits={weekly:52,monthly:12,quarterly:4,never:1.5}[s.freq]||12;
  /* share of shelf-gap time today's audits already catch */
  var cov={weekly:26,monthly:8,quarterly:3,never:1.5}[s.freq]||8;
  if(s.method==='sampling')cov=cov*0.4;
  if(none){cov=1;visits=0;}
  var annualSales=s.revenue*12*s.stores;
  var lost=annualSales*(s.oos/100)*(s.nosub/100);
  var recovered=lost*(s.recover/100)*cx*(1-cov/100);
  var gp=recovered*(s.margin/100);
  var hoursYr=visits*s.auditHours*s.stores*(s.method==='sampling'?0.4:1);
  var replaceable=hoursYr*0.65;
  var labour=replaceable*s.auditRate;
  var comp=recovered*0.06;
  C9.set('recovered',C9.money(recovered));
  C9.set('hoursMo',none?'0':C9.num(replaceable/12));
  C9.set('coverage',(cov<10?cov.toFixed(1).replace('.0',''):Math.round(cov))+'% → 100%');
  C9.set('revVal',C9.money(gp));
  C9.set('labourVal',none?'No audits today':C9.money(labour));
  C9.set('compVal',C9.money(comp));
  C9.set('total',C9.money(gp+labour+comp));
}
C9.init(recalc);
