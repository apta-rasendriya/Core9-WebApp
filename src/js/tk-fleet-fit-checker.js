/* Fleet Fit Checker — tool logic */
var VPD=10,DEPOTS_PER_CREW=5;
function recalc(){
  C9.setMax('sites',Math.min(80,C9.state().vehicles));
  var s=C9.state();
  var types=s.types||[];
  var notes=[];
  var level='green';
  if(s.fitted==='adas'){level='amber';notes.push(['Existing AI camera','Replace or run alongside, needs a decision']);}
  if(s.ownership==='3pl'){level='amber';notes.push(['Contracted carriers','Installation agreement needed per carrier']);}
  else if(s.ownership==='mixed'){if(level==='green')level='amber';notes.push(['Mixed ownership','Own fleet first, contractors in phase 2']);}
  if(types.indexOf('plant')>-1){if(level==='green')level='amber';notes.push(['Yard plant included','Separate mounting kit, scoped as its own phase']);}
  if(s.conn==='remote'){if(level==='green')level='amber';notes.push(['Remote routes','Edge-first configuration, events sync on reconnect']);}
  if(s.conn==='patchy')notes.push(['Patchy coverage','Detection runs on the vehicle; events queue and sync when signal returns']);
  if(s.vehicles<10){level='amber';notes.push(['Small fleet','Below the usual pilot size, still workable']);}
  if(!types.length){level='red';notes.push(['No vehicle type selected','Pick at least one to get a verdict']);}
  if(s.fitted==='none')notes.push(['Nothing fitted today','Cleanest install: camera, unit and harness fitted in one visit']);
  if(s.fitted==='dashcam')notes.push(['Passive dashcams','Swapped out, same mount position, same power feed']);
  if(s.fitted==='gps')notes.push(['GPS telematics','Kept for tracking, or consolidated into DriveSense']);
  /* crews work in parallel: one crew per 5 depots, ~10 vehicles per crew-day */
  var crews=Math.max(1,Math.ceil(s.sites/DEPOTS_PER_CREW));
  var depotsPerCrew=Math.ceil(s.sites/crews);
  var days=Math.ceil(s.vehicles/(VPD*crews))+Math.max(0,depotsPerCrew-1);
  notes.push(['Install crews',crews===1?'One crew, depot by depot':crews+' crews working depots in parallel']);
  var badge={green:'Strong fit',amber:'Fits, with notes',red:'Needs review'}[level];
  var text={
    green:'Standard deployment. DriveSense installs into your existing vehicles with no change to how you dispatch or route.',
    amber:'This fleet works. The notes below are worth settling before installation; none of them are blockers.',
    red:'Tell us a little more and we will confirm the shape of it.'
  }[level];
  document.getElementById('verdictWrap').className='verdict verdict--'+level;
  C9.set('verdict',badge); C9.set('verdictText',text);
  C9.set('units',C9.num(s.vehicles));
  C9.set('days',days<=5?C9.plural(days,'day'):C9.plural(Math.ceil(days/5),'week'));
  document.getElementById('changes').innerHTML=notes.map(function(n){
    return '<div class="rail__row"><span>'+n[1]+'</span><b style="max-width:44%;text-align:right">'+n[0]+'</b></div>';
  }).join('');
}
C9.init(recalc);
