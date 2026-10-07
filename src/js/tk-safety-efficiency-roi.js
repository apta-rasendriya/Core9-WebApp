/* Safety & Efficiency ROI Calculator — tool logic */
/* Industry sets the default incident cost and prevention share (placeholder benchmarks) */
var IND={manufacturing:{icost:38000,prevent:40},warehouse:{icost:30000,prevent:40},logistics:{icost:45000,prevent:35},retail:{icost:12000,prevent:30}};
C9.hooks.onGroup=function(g){
  if(g!=='industry')return;
  var d=IND[C9.state().industry];if(!d)return;
  C9.setSlider('icost',d.icost);C9.setSlider('prevent',d.prevent);
};
function recalc(){
  var s=C9.state();
  var cams=s.sites*s.cameras;
  var quoted=s.quote!=null&&s.quote>0;
  var invest=quoted?s.quote/C9.rate():cams*s.camprice;
  var hoursSaved=s.hours*s.sites*52*(s.automation/100);
  var labVal=hoursSaved*s.rate;
  var avoided=s.incidents*(s.prevent/100);
  var incVal=avoided*s.icost;
  var compVal=(labVal+incVal)*0.08;
  var total=labVal+incVal+compVal;
  var roi=invest>0?((total-invest)/invest)*100:0;
  var months=total>0?invest/(total/12):Infinity;
  C9.set('roi',(roi>0?'+':'')+Math.round(roi)+'%');
  C9.set('payback',!isFinite(months)?'No payback':months<1?'<1 mo':months>60?'Over 5 yrs':Math.round(months)+' mo');
  C9.set('roi3',C9.money((total-invest)*3));
  C9.set('avoidedN',avoided.toFixed(1));
  C9.set('hoursN',C9.num(hoursSaved));
  C9.set('incVal',C9.money(incVal));
  C9.set('labVal',C9.money(labVal));
  C9.set('compVal',C9.money(compVal));
  C9.set('total',C9.money(total));
  C9.set('investOut',C9.money(invest));C9.set('investOut2',C9.money(invest)+' a year');
  C9.set('investHow',quoted?'your quoted figure':C9.num(cams)+' cameras × '+C9.money(s.camprice,{exact:true}));
  C9.set('camTotal',C9.num(cams)+' cameras in scope');
}
C9.init(recalc);
