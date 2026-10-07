/* Architecture Builder — tool logic */
(function(){
var root=document.querySelector('[data-ab]'),S={products:['camcore'],vms:'Milestone XProtect',proc:'edge',host:'Core9 cloud',act:['dash','email']};
var n=function(x){return Number(x).toLocaleString('en-US')};
var val=function(k){return +root.querySelector('[name='+k+']').value};
function node(t,sub,em,core){return '<div class="node'+(core?' node--core':'')+'">'+(em?'<em>'+em+'</em>':'')+'<b>'+t+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</div>'}
function render(){
  var P=S.products,cc=P.indexOf('camcore')>-1,ds=P.indexOf('drivesense')>-1,il=P.indexOf('illytical')>-1;
  root.querySelectorAll('[data-need]').forEach(function(q){q.classList.toggle('off',P.indexOf(q.dataset.need)<0)});
  var sites=val('sites'),cams=val('cams'),veh=val('veh'),stores=val('stores'),tc=sites*cams;
  root.querySelector('[data-o=sites]').textContent=sites;root.querySelector('[data-o=cams]').textContent=cams;root.querySelector('[data-o=veh]').textContent=n(veh);root.querySelector('[data-o=stores]').textContent=n(stores);
  root.querySelectorAll('input[type=range]').forEach(function(r){r.style.setProperty('--f',((r.value-r.min)/(r.max-r.min)*100)+'%')});
  var units=sites*Math.ceil(cams/16),edge=S.proc!=='cloud',cloud=S.proc!=='edge';
  var cap='',con='',pro='',plat='',act='';
  if(cc){cap+=node('CCTV / IP cameras',n(tc)+' across '+sites+' site'+(sites>1?'s':''),'CamCore');con+=node(S.vms==='none'?'Direct camera streams':S.vms,S.vms==='none'?'RTSP feeds, no VMS in between':'Your existing system, kept as is','CamCore');
    if(edge)pro+=node('On-site AI units',units+' unit'+(units>1?'s':'')+', video stays on site','CamCore');if(cloud)pro+=node('Core9 cloud AI',S.proc==='hybrid'?'Heavier models and search':'Streams analysed in the cloud','CamCore');}
  if(ds){cap+=node('AI dashcams',n(veh)+' vehicles','DriveSense');con+=node('4G / LTE telematics','Events and GPS from each vehicle','DriveSense');pro+=node('On-vehicle AI','Fatigue and distraction flagged in real time','DriveSense');}
  if(il){cap+=node('Shelf images',n(stores)+' store'+(stores>1?'s':''),'illytical');con+=node('Secure image upload','From store cameras or photo capture','illytical');pro+=node('Core9 shelf vision','Planogram and stock-gap checks','illytical');}
  plat=node('Core9 platform','One record of every event, scored and searchable','Core',true)+node(S.host,'Where events and evidence are stored','Hosting');
  var A={dash:['Live dashboard','Supervisors see events as they happen'],email:['Email alerts','Routed to the right person, with context'],reports:['Scheduled reports','Daily, weekly and audit-ready'],api:['API / ERP, WMS, TMS','Events pushed into your systems']};
  S.act.forEach(function(k){act+=node(A[k][0],A[k][1])});
  var f=document.getElementById('flow');
  if(!P.length){f.innerHTML='<p class="empty">Pick at least one product to build your architecture.</p>';}
  else f.innerHTML=[['Capture',cap],['Connect',con],['Process',pro],['Platform',plat],['Act',act||'<p class="note">Choose how your team acts.</p>']].map(function(c){return '<div class="col"><div class="col__h">'+c[0]+'</div>'+c[1]+'</div>'}).join('');
  var lock='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="10" height="7" rx="1.5"></rect><path d="M5.5 7V5a2.5 2.5 0 015 0v2"></path></svg>';
  var rows=[];
  if(cc){rows.push(['Cameras connected',n(tc)]);if(edge)rows.push(['On-site AI units',n(units)]);rows.push(['Upload bandwidth per site',S.proc==='edge'?'~'+Math.max(1,Math.ceil(cams/40))+' Mbps (events and clips)':S.proc==='hybrid'?'~'+n(Math.max(2,Math.ceil(cams/2)))+' Mbps (events plus clips for cloud search)':'~'+n(cams*2)+' Mbps (every stream uploaded)']);if(S.proc==='cloud'&&S.host==='On-premise server')rows.push(['Note','Cloud AI with on-premise storage: video leaves site for analysis']);}
  if(ds)rows.push(['AI dashcams and telematics units',n(veh)]);
  if(il)rows.push(['Stores onboarded',n(stores)]);
  rows.push(['Integrations',!S.act.length?'None chosen':S.act.indexOf('api')>-1?'API + '+(S.act.length-1)+' channel'+(S.act.length-1===1?'':'s'):S.act.length+' channel'+(S.act.length===1?'':'s')]);
  document.getElementById('bom').innerHTML=!P.length?'<p class="note">Pick at least one product to see sizing.</p>':rows.map(function(r){return '<div class="locked__row"><span class="lock">'+lock+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');
}
root.querySelectorAll('.q[data-q]').forEach(function(q){var k=q.dataset.q,multi=q.querySelector('[data-multi]');
  q.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){
    if(multi){b.classList.toggle('on');S[k]=[].map.call(q.querySelectorAll('.opt.on'),function(x){return x.dataset.v})}
    else{q.querySelectorAll('.opt').forEach(function(x){x.classList.toggle('on',x===b)});S[k]=b.dataset.v}
    render();});});});
root.querySelectorAll('input[type=range]').forEach(function(r){r.addEventListener('input',render)});
render();
var form=root.querySelector('.gate__form');form.addEventListener('submit',function(e){e.preventDefault();var em=form.querySelector('input[type=email]'),err=form.querySelector('.gate__err');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)){em.classList.add('bad');err.hidden=false;return}
  em.classList.remove('bad');err.hidden=true;root.querySelector('[data-o=email]').textContent=em.value;root.querySelector('.size').classList.add('is-open');});
})();
