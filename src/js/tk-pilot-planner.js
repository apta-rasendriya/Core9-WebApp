/* Pilot Planner — tool logic */
var FOCUS={
  camcore:[
    ['ppe','PPE compliance','Helmet, vest and eye protection in named zones'],
    ['zones','Restricted zones','People in exclusion areas and forklift proximity'],
    ['hazard','Hazard &amp; fire precursors','Smoke, spills, blocked routes'],
    ['process','Process adherence','Line stoppage, loading discipline, housekeeping'],
    ['review','Review time','Hours of manual footage review removed'],
    ['evidence','Evidence retrieval','Time to produce clips for an investigation']
  ],
  drivesense:[
    ['fatigue','Fatigue &amp; distraction','Driver-facing detection of drowsiness and phone use'],
    ['harsh','Harsh driving','Braking, cornering, speeding by route'],
    ['collision','Collision risk','Forward and following-distance warnings'],
    ['coaching','Coaching loop','Driver scorecards and review workflow'],
    ['claims','Claims defence','Footage available for disputed incidents'],
    ['fuel','Fuel &amp; idling','Idle time and driving-style consumption']
  ],
  illytical:[
    ['oos','Out-of-stock detection','Shelf gaps found the same day'],
    ['planogram','Planogram compliance','Layout vs. agreed plan'],
    ['share','Brand share of shelf','Facings against competitors'],
    ['promo','Promo execution','Displays and pricing in place'],
    ['audit','Audit effort','Field hours removed per cycle'],
    ['coverage','Store coverage','Share of the estate actually checked']
  ]
};
var UNIT={camcore:['camera','cameras'],drivesense:['vehicle','vehicles'],illytical:['store','stores']};
var NAME={camcore:'CamCore',drivesense:'DriveSense',illytical:'illytical'};
var IND={manufacturing:'manufacturing',warehousing:'warehousing and distribution',logistics:'logistics and transport',retail:'retail'};

/* keep valid picks for this product; otherwise start with two defaults */
function renderFocus(){
  var s=C9.state(),list=FOCUS[s.product]||FOCUS.camcore;
  var ids=list.map(function(f){return f[0];});
  var sel=(s.focus||[]).filter(function(id){return ids.indexOf(id)>-1;});
  if(!sel.length)sel=ids.slice(0,2);
  document.getElementById('focusCards').innerHTML='<div class="cards" data-max="3">'+list.map(function(f){
    return '<button type="button" class="card-toggle'+(sel.indexOf(f[0])>-1?' is-on':'')+'" data-group="focus" data-single="false" data-value="'+f[0]+'"><strong>'+f[1]+'</strong><span>'+f[2]+'</span></button>';
  }).join('')+'</div><p class="capture__note" id="focusHint" style="margin-top:10px">Up to three.</p>';
}
C9.hooks.onGroup=function(g){if(g==='product')renderFocus();if(g==='focus')C9.set('focusHint','Up to three.');};
C9.hooks.onFull=function(){C9.set('focusHint','Three is the maximum. Deselect one to swap it in.');};
C9.hooks.afterSingles=renderFocus;

function recalc(){
  C9.setMax('sites',Math.min(20,C9.state().scale));
  var s=C9.state();
  var prod=s.product||'camcore';
  var u=UNIT[prod];
  var focus=s.focus||[];
  var weeks=(s.sites>1?6:4)+(s.scale>80?2:0)+1;
  var scope=C9.plural(s.scale,u[0],u[1])+' across '+C9.plural(s.sites,'site');
  C9.set('prodOut',NAME[prod]+' pilot');
  C9.set('scopeOut',scope);
  C9.set('weeks',weeks+' weeks');
  C9.set('price','No charge');
  C9.set('sitesOut',s.sites);
  C9.set('focusOut',focus.length===0?'pick 2–3':focus.length===1?'1 selected, pick 1–2 more':focus.length+' selected');
  var names=(FOCUS[prod]||[]).filter(function(f){return focus.indexOf(f[0])>-1;}).map(function(f){return f[1];});
  document.getElementById('plan').innerHTML=[
    ['Scope',scope+', '+(IND[s.industry]||'manufacturing')],
    ['Duration','Week 1 setup and configuration, then '+(weeks-1)+' weeks live, closing review in the final week'],
    ['Success criteria',names.length?names.join(' · '):'Select two or three in step 3'],
    ['Core9 provides','Configuration and tuning, pilot-period hardware, weekly reporting, closing review with your baseline compared'],
    ['You provide','Stream or vehicle access, site access windows, one operational owner, and the baseline numbers to measure against'],
    ['Commercials','No charge for configuration, pilot-period hardware, tuning or reporting'],
    ['Exit','Written report against the agreed criteria. Expand, adjust, or stop, with no automatic rollover']
  ].map(function(r){return '<div class="plan-list__row"><b>'+r[0]+'</b><span>'+r[1]+'</span></div>';}).join('');
}

function goStep(n){
  document.querySelectorAll('.step-tab').forEach(function(t){t.classList.toggle('is-on',t.getAttribute('data-step')===String(n));});
  document.querySelectorAll('.step-panel').forEach(function(p){p.classList.toggle('is-on',p.getAttribute('data-panel')===String(n));});
  var _st=document.querySelector('.steps'),_y=_st.getBoundingClientRect().top+window.pageYOffset-110;if(window.C9Lenis)window.C9Lenis.scrollTo(_y,{duration:1.1});else window.scrollTo({top:_y,behavior:'smooth'});
  recalc();
}
document.querySelectorAll('.step-tab').forEach(function(t){t.addEventListener('click',function(){goStep(Number(t.getAttribute('data-step')));});});
document.querySelectorAll('[data-next]').forEach(function(b){b.addEventListener('click',function(){goStep(Number(b.getAttribute('data-next')));});});
renderFocus();
C9.init(recalc);
