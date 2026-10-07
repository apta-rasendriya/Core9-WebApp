/* Camera & VMS Compatibility Checker — tool logic */
/* Platform levels: on-prem VMS and NVRs publish RTSP/ONVIF streams; cloud platforms need
   their stream or API access confirmed. Placeholder levels, to be confirmed with devops. */
var PL={'Eagle Eye Networks':'amber','Genetec Stratocast':'amber','Arcules':'amber','Verkada Command':'red','Cisco Meraki Vision':'amber','Ava Aware':'amber','Cameras direct, no recorder':'amber'};
var PNOTE={
  'Verkada Command':'Verkada is a closed cloud platform. Stream access has to be confirmed site by site before a pilot.',
  'Cameras direct, no recorder':'With no recorder, CamCore reads each camera stream directly. Recording and retention stay your responsibility.'
};
var RANK={green:0,amber:1,red:2};
function worse(a,b){return RANK[b]>RANK[a]?b:a;}
function recalc(){
  var chips=[].slice.call(document.querySelectorAll('[data-group="brands"].is-on'));
  var lvls=chips.map(function(c){return c.getAttribute('data-level');});
  var s=C9.state();
  var vms=s.vms||'—';
  var plat=PL[vms]||'green';
  var brandWorst=lvls.indexOf('red')>-1?'red':lvls.indexOf('amber')>-1?'amber':'green';
  var allRed=lvls.length>0&&lvls.every(function(l){return l==='red';});
  var analogNoEnc=chips.some(function(c){return c.getAttribute('data-value')==='Analog cameras, no encoder';});
  var contradiction=s.conn==='ip'&&analogNoEnc;
  var worst=worse(brandWorst,plat);
  if((s.conn==='analog'||s.conn==='mixed')&&worst==='green')worst='amber';
  var badge={green:'Fully compatible',amber:'Compatible with notes',red:'Needs a quick review'}[worst];
  var text;
  if(worst==='green')text='Every brand you selected is read directly from your existing streams. No camera replacement, no change to how you record today.';
  else if(worst==='amber')text='This estate works, with notes: '+[
      brandWorst==='amber'?'some brands need a stream setting changed':'',
      plat==='amber'?'your platform needs stream or API access confirmed':'',
      s.conn==='analog'?'analog runs need your DVR or a small encoder':'',
      s.conn==='mixed'?'analog cameras in the mix need your DVR or a small encoder':''
    ].filter(Boolean).join('; ')+'.';
  else if(allRed)text='None of the selected cameras can be read directly today. Consumer and unlabelled cameras usually lock their stream, so these would need replacing or an encoder. A short review will confirm.';
  else if(brandWorst!=='red')text=(PNOTE[vms]||'Your recording platform needs a review before CamCore can read its streams.')+' The camera brands themselves are fine.';
  else text='Most of this estate is fine, but at least one selection needs a look: consumer-grade or unlabelled cameras sometimes lock their stream.';
  if(contradiction)text+=' You chose IP cameras but also selected analog cameras with no encoder. If some cameras are analog, pick "Mixed IP and analog".';
  if(!chips.length){badge='Pick your brands';text='Select the camera brands in your estate to get a verdict.';worst='amber';}
  document.getElementById('verdictWrap').className='verdict verdict--'+worst;
  C9.set('verdict',badge);
  C9.set('verdictText',text);
  C9.set('brandCount',chips.length);
  var g=lvls.filter(function(l){return l==='green';}).length;
  C9.set('tally',g+' of '+chips.length+' fully supported');
  C9.set('platform',vms+' · '+{green:'supported',amber:'with notes',red:'needs review'}[plat]);
  C9.set('connOut',{ip:'IP · direct stream',analog:'Analog · via DVR or encoder',mixed:'Mixed · per site'}[s.conn]);
  C9.set('howText',
    s.conn==='ip'?'CamCore subscribes to the ONVIF/RTSP sub-stream your recorder already publishes and processes it on site. Nothing is re-cabled.'
    :s.conn==='analog'?'Analog cameras pass through your existing DVR or a small on-site encoder, which turns each feed into a stream CamCore can read. The coax and cameras stay in place.'
    :'IP cameras stream directly. Analog cameras pass through your DVR or a small on-site encoder. Existing recording is untouched.');
  document.getElementById('brandRows').innerHTML=chips.map(function(c){
    var lvl=c.getAttribute('data-level');
    var note={green:'Fully supported',amber:'Supported, stream note',red:'Needs review'}[lvl];
    return '<div class="rail__row"><span>'+c.textContent.trim()+'</span><b style="color:'+({green:'#4ade80',amber:'#f0b429',red:'#f87171'}[lvl])+'">'+note+'</b></div>';
  }).join('');
}
C9.init(recalc);
