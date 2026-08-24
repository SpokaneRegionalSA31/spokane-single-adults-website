const FEED_URL="https://script.google.com/macros/s/AKfycbydWsFlSeIE2kExls6H4miVySGRCE7JQn7MEWlOn97l_ciQQAKEqsAts5XiVbFottDD/exec";
const FORM_URL="https://forms.gle/Tc67D7DiD8yyUrN97";
const CALENDAR_URL="https://calendar.google.com/calendar/u/0?cid=OTJhYjFkZDIzYzJmYWNhODYyMGQ3MzE1MmQ2Njk1MDZkNDY4MTI3MzRiZWQzZGQyYjY0YmM1N2JmZDljYjdhZUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t";
let events=[];
const $=id=>document.getElementById(id);
$('form-link').href=FORM_URL;
$('calendar-link').href=CALENDAR_URL;

function esc(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function safeUrl(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function directionsUrl(location){return location?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`:'';}
function text(v){return String(v||'').trim();}
function canonicalArea(value){
  const original=text(value);
  const key=original.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const words=new Set(key.split(' ').filter(Boolean));
  if(words.has('spokane')&&words.has('north')) return 'Spokane North Stake';
  return original;
}

function classify(item){
  const type=text(item.type).toLowerCase();
  const area=canonicalArea(item.area).toLowerCase();
  const source=canonicalArea(item.sourceArea).toLowerCase();
  const combined=`${type} ${area} ${source}`;
  if(/regional conference/.test(combined)||(/conference/.test(type)&&/spokane/.test(combined))) return 'conference';
  if(/cda|coeur d.?alene/.test(combined)) return 'cda';
  if(/out.?of.?area|travel required/.test(combined)||(/conference/.test(type)&&!/spokane/.test(combined))) return 'out';
  if(/spokane region|regional activity|regional fireside/.test(combined)) return 'regional';
  if(/stake.?sponsored|stake sponsored/.test(combined)||/stake/.test(area)||/stake/.test(source)) return 'stake';
  return 'stake';
}

function toEvent(item,index){
  const dateValue=Number(item.dateValue)||0;
  const date=new Date(dateValue);
  const valid=dateValue>0&&!Number.isNaN(date.getTime());
  const area=canonicalArea(item.area||item.sourceArea||'Spokane Area');
  const sourceArea=canonicalArea(item.sourceArea||'');
  const category=classify({...item,area,sourceArea});
  return {
    id:index+1,
    title:item.eventName||'Untitled event',
    dateValue,
    date:item.date||'Date coming soon',
    day:valid?new Intl.DateTimeFormat('en-US',{day:'2-digit',timeZone:'America/Los_Angeles'}).format(date):'—',
    month:valid?new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'America/Los_Angeles'}).format(date).toUpperCase():'TBD',
    year:valid?new Intl.DateTimeFormat('en-US',{year:'numeric',timeZone:'America/Los_Angeles'}).format(date):'',
    time:item.time||'Time coming soon',
    location:item.location||'Location coming soon',
    type:item.type||'Event',
    area,
    description:item.description||'Open the flyer for complete event details.',
    featured:Boolean(item.featured)||category==='regional'||category==='conference',
    bring:item.bring||'',
    children:item.children||'',
    flyerLink:safeUrl(item.flyerLink),
    calendarUrl:safeUrl(item.calendarUrl),
    directionsUrl:directionsUrl(item.location),
    sourceArea,
    category
  };
}

function tag(textValue,cls=''){return textValue?`<span class="${cls}">${esc(textValue)}</span>`:'';}
function displayCategory(e){
  if(e.category==='conference') return 'Regional Conference';
  if(e.category==='regional') return 'Spokane Regional Event';
  if(e.category==='stake') return 'Stake-Sponsored';
  if(e.category==='cda') return 'CDA';
  return 'Out-of-Area';
}

function renderNext(){
  const e=events[0];
  $('next-card').innerHTML=e?`<p>UP NEXT</p><div class="nextDate"><strong>${esc(e.day)}</strong><span>${esc(e.month)}<br>${esc(e.year)}</span></div><div><h2>${esc(e.title)}</h2><p>${esc(e.time)} · ${esc(displayCategory(e))}</p></div><a href="#event-${e.id}">See the details <span>→</span></a>`:`<p>UP NEXT</p><div><h2>More events are coming</h2><p>Check back soon for the next gathering.</p></div>`;
}

function cardHtml(e){
  return `<article class="eventCard ${e.featured?'featured':''}" id="event-${e.id}">
    <div class="dateTile"><span>${esc(e.month)}</span><strong>${esc(e.day)}</strong></div>
    <div class="eventMain">
      <div class="tags">${tag(displayCategory(e),e.category==='out'?'travelTag':'')}${e.sourceArea&&e.sourceArea!==e.area?tag(e.sourceArea,'sourceTag'):''}${e.type&&e.type!==displayCategory(e)?tag(e.type):''}</div>
      <h3>${esc(e.title)}</h3>
      <p class="meta">${esc(e.time)} <b>·</b> ${esc(e.location)}</p>
      <div class="hosted">Hosted by: <strong>${esc(e.area)}</strong></div>
      <div class="eventDetails hidden" id="details-${e.id}">
        <p>${esc(e.description)}</p>
        ${e.children?`<p><strong>Children welcome:</strong> ${esc(e.children)}</p>`:''}
        ${e.bring?`<p><strong>What to bring:</strong> ${esc(e.bring)}</p>`:''}
      </div>
    </div>
    <div class="cardActions">
      <button data-id="${e.id}">Details</button>
      ${e.flyerLink?`<a class="secondaryAction" href="${e.flyerLink}" target="_blank" rel="noreferrer">View Flyer</a>`:''}
      ${e.directionsUrl?`<a class="secondaryAction" href="${e.directionsUrl}" target="_blank" rel="noreferrer">Directions</a>`:''}
      ${e.calendarUrl?`<a href="${e.calendarUrl}" target="_blank" rel="noreferrer">Add This Event</a>`:''}
    </div>
  </article>`;
}

const sectionMeta={
  conference:['Regional Conference','Regional conference events for Spokane Singles 31+.'],
  regional:['Spokane Regional Activities & Firesides','Events planned for the Spokane regional 31+ Single Adult community.'],
  stake:['Stake-Sponsored Activities','Activities sponsored by individual stakes and shared with the wider 31+ community.'],
  cda:['CDA Coordinating Council Activities','CDA-area activities shared as partner events.'],
  out:['Nearby & Out-of-Area Events','Additional events that may require travel outside the Spokane area.']
};

function render(){
  const q=$('search').value.toLowerCase();
  const type=$('type-filter').value;
  const area=$('area-filter').value;
  const filtered=events.filter(e=>(type==='All events'||e.type===type)&&(area==='All areas'||e.area===area)&&`${e.title} ${e.location} ${e.description} ${e.area} ${e.type}`.toLowerCase().includes(q));
  $('results-count').textContent=`${filtered.length} upcoming ${filtered.length===1?'event':'events'}`;
  $('clear-filters').classList.toggle('hidden',type==='All events'&&area==='All areas'&&!q);

  if(!filtered.length){
    $('event-list').innerHTML='<div class="empty"><strong>No events match those filters.</strong><p>Try clearing one filter or searching another word.</p></div>';
  } else {
    const order=['conference','regional','stake','cda','out'];
    $('event-list').innerHTML=order.map(key=>{
      const group=filtered.filter(e=>e.category===key);
      if(!group.length) return '';
      const [title,desc]=sectionMeta[key];
      return `<section class="eventGroup"><div class="eventGroupHead"><div><p class="eyebrow green">${esc(title.toUpperCase())}</p><h3>${esc(title)}</h3></div><p>${esc(desc)}</p></div>${group.map(cardHtml).join('')}</section>`;
    }).join('');
  }

  document.querySelectorAll('.cardActions button').forEach(button=>button.addEventListener('click',()=>{
    const d=$(`details-${button.dataset.id}`);
    const hidden=d.classList.toggle('hidden');
    button.textContent=hidden?'Details':'Less info';
  }));
}

function addOptions(id,values,first){$(id).innerHTML=[first,...new Set(values.filter(Boolean))].map(x=>`<option>${esc(x)}</option>`).join('');}

function showFlyer(f,prefix){
  if(!f?.image)return;
  const image=safeUrl(f.image);
  const link=safeUrl(f.flyerLink)||image;
  if(!image)return;
  $(`${prefix}-monthly-flyer-title`).textContent=`${f.month||'Monthly'} ${f.year||''} Flyer of Flyers`;
  $(`${prefix}-monthly-flyer-image`).src=image;
  $(`${prefix}-monthly-flyer-link`).href=link;
  $(`${prefix}-monthly-flyer-image-link`).href=link;
  $(`${prefix}-monthly-flyer`).classList.remove('hidden');
}

function loadFeed(){
  const callback=`regionalEvents_${Date.now()}`;
  const script=document.createElement('script');
  let finished=false;
  const fail=()=>{
    if(finished)return;
    finished=true;
    $('event-list').innerHTML='<div class="empty"><strong>The event list could not load.</strong><p>Please use the full regional calendar above while the connection is restored.</p></div>';
    $('results-count').textContent='0 upcoming events';
  };
  window[callback]=payload=>{
    finished=true;
    events=(payload.events||[]).map(toEvent).filter(e=>e.dateValue>0).sort((a,b)=>a.dateValue-b.dateValue);
    addOptions('type-filter',events.map(e=>e.type),'All events');
    addOptions('area-filter',events.map(e=>e.area),'All areas');
    showFlyer(payload.currentMonthlyFlyer,'current');
    showFlyer(payload.nextMonthlyFlyer,'next');
    renderNext();
    render();
    delete window[callback];
    script.remove();
  };
  script.src=`${FEED_URL}?action=feed&callback=${callback}`;
  script.onerror=fail;
  document.body.appendChild(script);
  setTimeout(fail,15000);
}

['search','type-filter','area-filter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',render));
$('clear-filters').addEventListener('click',()=>{$('search').value='';$('type-filter').value='All events';$('area-filter').value='All areas';render();});
loadFeed();
