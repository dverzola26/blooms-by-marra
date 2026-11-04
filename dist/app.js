import {products,sizes,money,imageUrl,unitPrice,sanitizeBag,subtotal,localDate,buildSummary} from './catalog.js';
const $=selector=>document.querySelector(selector);
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='blooms-by-marra-bag-v1';
let bag=[];
try{bag=sanitizeBag(JSON.parse(localStorage.getItem(storageKey)||'[]'));}catch{}
let filter='all',search='',sort='featured',selectedProduct=null,toastTimer,bagViewVersion=0,orderDetails={name:'',fulfillment:'delivery',date:'',area:'',message:'',notes:''};
const productDialog=$('#product-dialog'),bagDialog=$('#bag-dialog');
function toast(message){
  clearTimeout(toastTimer);
  const region=bagDialog.open?$('#bag-status'):productDialog.open?$('#product-status'):$('#toast');
  for(const id of ['#bag-status','#product-status','#toast']){const other=$(id);if(other!==region){other.classList.remove('visible');other.textContent='';}}
  region.textContent=message;region.classList.add('visible');
  toastTimer=setTimeout(()=>{region.classList.remove('visible');region.textContent='';},5000);
}
function focusInBag(selectors){
  for(const selector of selectors){const control=bagDialog.querySelector(selector);if(control&&!control.disabled){control.focus();return;}}
  bagDialog.querySelector('[data-close]')?.focus();
}
function focusBagLine(index,direction){
  focusInBag([`[data-quantity="${index}"][data-delta="${direction}"]:not(:disabled)`,`[data-quantity="${index}"]:not(:disabled)`,`[data-remove="${index}"]`,'#prepare-request','[data-shop]']);
}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(bag));}catch{toast('Your bag is available for this visit. Browser storage is unavailable.');}updateCount();}
function updateCount(){const count=bag.reduce((n,l)=>n+l.quantity,0);$('#bag-count').textContent=count;$('#bag-open').setAttribute('aria-label',`Open shopping bag, ${count} ${count===1?'item':'items'}`);}
function showDialog(dialog){dialog.showModal();}
function renderProducts(){
  let list=products.filter(p=>(filter==='all'||p.occasions.includes(filter))&&`${p.name} ${p.description} ${p.detail}`.toLowerCase().includes(search.toLowerCase().trim()));
  if(sort==='price-asc')list.sort((a,b)=>a.price-b.price);if(sort==='price-desc')list.sort((a,b)=>b.price-a.price);if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));
  $('#product-grid').innerHTML=list.map(p=>`<article class="product-card"><button class="product-image-button" data-detail="${p.id}" aria-label="View ${p.name}"><img class="product-image" src="${imageUrl(p)}" srcset="${imageUrl(p,400)} 400w, ${imageUrl(p,800)} 800w" sizes="(max-width:760px) 45vw, 29vw" width="700" height="788" alt="${p.alt}" loading="lazy" decoding="async"><span class="product-tag">${p.tag}</span><span class="product-quick-view">A closer look ${icon('arrow')}</span></button><div class="product-copy"><button class="product-name" data-detail="${p.id}">${p.name}</button><p class="product-description">${p.description}</p><p class="product-price">${money(p.price)} <span>sample price</span></p><button class="add-quick" data-add="${p.id}" aria-label="Add ${p.name}, Classic, to bag">${icon('plus')}</button></div></article>`).join('');
  $('#empty-search').hidden=!!list.length;$('#result-count').textContent=`${list.length} sample ${list.length===1?'bouquet':'bouquets'} shown.`;
  attachImageFallbacks();
}
function setFilter(next){filter=next;document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});renderProducts();}
function attachImageFallbacks(){
  document.querySelectorAll('img:not([data-fallback-ready])').forEach(img=>{
    img.dataset.fallbackReady='true';
    const fallback=()=>{
      if(img.dataset.fallbackApplied)return;
      img.dataset.fallbackApplied='true';img.removeAttribute('srcset');img.classList.add('photo-fallback');
      if(img.alt!=='')img.alt='Floral illustration — sample photograph unavailable';
      img.src='assets/flower.svg';
    };
    img.addEventListener('error',fallback,{once:true});
    if(img.complete&&img.naturalWidth===0)fallback();
  });
}
function openProduct(id){
  const p=products.find(p=>p.id===id);if(!p)return;selectedProduct=p;
  $('#product-detail').innerHTML=`<div class="product-detail-grid"><img class="detail-photo" src="${imageUrl(p,900)}" alt="${p.alt}" width="700" height="900"><div class="detail-copy"><h2 id="product-title">${p.name}</h2><p class="detail-description">${p.detail}</p><p class="sample-note">Illustrative design and photography. Flowers, size, wrapping, and final price are confirmed by the florist.</p><fieldset class="size-fieldset"><legend>Choose your size</legend><div class="size-options">${sizes.map((s,i)=>`<label><input type="radio" name="size" value="${s.id}" ${i===0?'checked':''}>${s.label}</label>`).join('')}</div></fieldset><p class="detail-price" id="detail-price">${money(p.price)}</p><button class="button primary" id="detail-add">Add to your bag ${icon('plus')}</button><p class="detail-footnote">Sample estimate · No payment taken on this site</p></div></div>`;
  showDialog(productDialog);attachImageFallbacks();
}
function addToBag(id,size='classic'){
  const line=bag.find(l=>l.id===id&&l.size===size),p=products.find(p=>p.id===id);if(!p)return;
  if(line&&line.quantity>=20){toast('Maximum 20 of each arrangement. Ask the florist about larger requests.');return;}
  if(line)line.quantity++;else bag.push({id,size,quantity:1});persist();toast(`${p.name} added to your bag.`);
}
function renderBag(){
  bagViewVersion++;
  $('#bag-title').textContent='Your flower bag';$('#bag-step').textContent='';
  if(!bag.length){$('#bag-content').innerHTML=`<div class="bag-empty">${icon('bag')}<h3>A little room for lovely.</h3><p>Your bag is waiting for its first blooms.</p><button class="button primary" data-shop>Explore the flowers ${icon('arrow')}</button></div>`;return;}
  $('#bag-content').innerHTML=`${bag.map((l,i)=>{const p=products.find(p=>p.id===l.id),s=sizes.find(s=>s.id===l.size);return `<div class="bag-line"><img src="${imageUrl(p,180)}" width="76" height="96" alt="${p.alt}"><div><h3>${p.name}</h3><p>${s.label} · Sample arrangement</p><div class="quantity"><button data-quantity="${i}" data-delta="-1" aria-label="Decrease ${p.name} quantity" ${l.quantity===1?'disabled':''}>${icon('minus')}</button><span aria-label="Quantity ${l.quantity}">${l.quantity}</span><button data-quantity="${i}" data-delta="1" aria-label="Increase ${p.name} quantity" ${l.quantity>=20?'disabled':''}>${icon('plus')}</button><button class="remove-item" data-remove="${i}" aria-label="Remove ${p.name}, ${s.label}">Remove</button></div></div><p class="line-price">${money(unitPrice(p,s.id)*l.quantity)}</p></div>`}).join('')}<div class="bag-totals"><span>Sample subtotal</span><span>${money(subtotal(bag))}</span></div><p class="checkout-note">Illustrative prices only. Delivery fees are not included. The florist will confirm the final quote and flower availability.</p><button class="button primary wide" id="prepare-request">Personalize your request ${icon('arrow')}</button><button class="bag-continue" data-close>Keep browsing</button>`;
  attachImageFallbacks();
}
function openBag(){renderBag();showDialog(bagDialog);}
function renderRequest(){
  bagViewVersion++;
  $('#bag-title').textContent='Make it personal';$('#bag-step').textContent='STEP 1 OF 2 · YOUR REQUEST';
  $('#bag-content').innerHTML=`<p class="form-intro">A few thoughtful details for your florist. You’ll review everything before opening Messenger.</p><form class="request-form" id="request-form" novalidate><label for="customer-name">Your name <span class="required">*</span><input id="customer-name" name="name" autocomplete="name" maxlength="80" required value="${escapeHTML(orderDetails.name)}" aria-describedby="name-error"><span class="field-error" id="name-error"></span></label><div class="field-row"><label for="fulfillment">How would you like to receive it?<select id="fulfillment" name="fulfillment"><option value="delivery" ${orderDetails.fulfillment==='delivery'?'selected':''}>Request delivery</option><option value="pickup" ${orderDetails.fulfillment==='pickup'?'selected':''}>Request store pickup</option></select></label><label for="delivery-date">Preferred date <span class="required">*</span><input id="delivery-date" name="date" type="date" min="${localDate()}" max="${Number(localDate().slice(0,4))+2}-12-31" required value="${escapeHTML(orderDetails.date)}" aria-describedby="date-error date-hint"><span class="field-hint" id="date-hint">Subject to the florist’s availability.</span><span class="field-error" id="date-error"></span></label></div><label id="area-label" for="delivery-area" ${orderDetails.fulfillment==='pickup'?'hidden':''}>Delivery city / area <span class="required">*</span><input id="delivery-area" name="area" maxlength="160" autocomplete="address-level2" value="${escapeHTML(orderDetails.area)}" aria-describedby="area-error area-hint"><span class="field-hint" id="area-hint">Share a general area here. Confirm the full address privately with the florist.</span><span class="field-error" id="area-error"></span></label><label for="card-message">Gift card message <span class="field-hint">Optional · Up to 300 characters</span><textarea id="card-message" name="message" maxlength="300" placeholder="Something from the heart…">${escapeHTML(orderDetails.message)}</textarea></label><label for="order-notes">Anything else? <span class="field-hint">Optional · Favorite colors, flowers, or special requests</span><textarea id="order-notes" name="notes" maxlength="500" placeholder="Tell the florist what you have in mind…">${escapeHTML(orderDetails.notes)}</textarea></label><p class="checkout-note">Your name and request details stay in this page’s memory until you copy and send them. They are not submitted to a server or saved with your bag.</p><button class="button primary wide" type="submit">Review my request ${icon('arrow')}</button><button class="bag-continue" type="button" id="back-to-bag">Back to your bag</button></form>`;
  $('#delivery-area').required=orderDetails.fulfillment==='delivery';
  $('#customer-name').focus();
}
function collectDetails(){const form=$('#request-form');if(form){const data=new FormData(form);orderDetails=Object.fromEntries([...data].map(([key,value])=>[key,String(value).trim()]));}}
function validateRequest(){
  collectDetails();const errors={name:orderDetails.name?'':'Please enter your name.',date:!orderDetails.date?'Please choose a preferred date.':orderDetails.date<localDate()?'Please choose today or a future date.':orderDetails.date>`${Number(localDate().slice(0,4))+2}-12-31`?'Please choose a date within the next two years.':'',area:orderDetails.fulfillment==='delivery'&&!orderDetails.area?'Please enter a delivery city or area.':''};
  const ids={name:'customer-name',date:'delivery-date',area:'delivery-area'};let first;
  for(const [key,error]of Object.entries(errors)){const input=$('#'+ids[key]);$('#'+key+'-error').textContent=error;input.setAttribute('aria-invalid',String(!!error));if(error&&!first)first=input;}
  if(first){first.focus();return false;}return true;
}
function renderSummary(){
  bagViewVersion++;
  $('#bag-title').textContent='One lovely request';$('#bag-step').textContent='STEP 2 OF 2 · REVIEW & CONNECT';
  $('#bag-content').innerHTML=`<p class="summary-intro">Your flowers are a conversation away. Copy your request, open Messenger, and paste it into your chat with Blooms by Marra.</p><div class="summary-notice">This prepares an inquiry. It does not send a message, reserve flowers, or confirm an order. The florist confirms the total and payment directly.</div><label class="summary-label" for="request-summary">Your request summary</label><textarea class="request-summary" id="request-summary" readonly></textarea><p class="copy-help" id="copy-help">1. Copy the request below. 2. Open Messenger and paste it into your conversation.</p><div class="summary-actions"><button class="button primary" id="copy-request">1. Copy my request ${icon('gift')}</button><a class="button secondary" href="https://m.me/bloomsbymarra" target="_blank" rel="noopener noreferrer">2. Open Messenger ${icon('chat')}</a></div><button class="bag-continue" id="edit-request">Edit request details</button><button class="bag-continue" id="back-to-bag">Back to your bag</button>`;
  $('#request-summary').value=buildSummary(bag,orderDetails);$('#copy-request').focus();
}
document.addEventListener('click',async event=>{
  const target=event.target.closest('button,a');if(!target)return;
  if(target.matches('[data-filter]'))setFilter(target.dataset.filter);
  if(target.matches('[data-occasion]')){search='';$('#search').value='';setFilter(target.dataset.occasion);}
  if(target.matches('[data-detail]')){event.preventDefault();openProduct(target.dataset.detail);}
  if(target.matches('[data-add]'))addToBag(target.dataset.add);
  if(target.matches('[data-close]'))target.closest('dialog')?.close();
  if(target.matches('[data-shop]')){bagDialog.close();$('#shop').scrollIntoView();}
  if(target.matches('[data-quantity]')){
    const index=Number(target.dataset.quantity),delta=Number(target.dataset.delta);bag[index].quantity=Math.max(1,Math.min(20,bag[index].quantity+delta));persist();renderBag();focusBagLine(index,delta);
    toast(`${products.find(p=>p.id===bag[index].id).name}, quantity ${bag[index].quantity}. Sample subtotal ${money(subtotal(bag))}.`);
  }
  if(target.matches('[data-remove]')){const index=Number(target.dataset.remove),name=products.find(p=>p.id===bag[index].id).name;bag.splice(index,1);persist();renderBag();focusBagLine(Math.min(index,bag.length-1),1);toast(`${name} removed. ${bag.reduce((n,l)=>n+l.quantity,0)} items remain. Sample subtotal ${money(subtotal(bag))}.`);}
  if(target.id==='detail-add'){const id=selectedProduct.id,size=productDialog.querySelector('input[name=size]:checked').value;productDialog.close();addToBag(id,size);}
  if(target.id==='prepare-request')renderRequest();
  if(target.id==='back-to-bag'){collectDetails();renderBag();$('#prepare-request')?.focus();}
  if(target.id==='edit-request')renderRequest();
  if(target.id==='copy-request'){
    if(target.disabled)return;
    const version=bagViewVersion,summary=$('#request-summary'),help=$('#copy-help');
    if(!summary||!help)return;
    target.disabled=true;target.setAttribute('aria-busy','true');target.textContent='Copying your request…';
    let copied=false;
    try{await navigator.clipboard.writeText(summary.value);copied=true;}catch{}
    if(version!==bagViewVersion||!bagDialog.open||!target.isConnected||!summary.isConnected)return;
    target.disabled=false;target.removeAttribute('aria-busy');
    if(copied){target.textContent='Request copied';help.textContent='Copied! Open Messenger, paste your request, and send it when you’re ready.';toast('Request copied. Paste it into your Messenger conversation.');}
    else{target.textContent='Try copying again';summary.focus();summary.select();help.textContent='Automatic copying is unavailable. The text is selected: use your device’s Copy command, then paste it in Messenger.';toast('Automatic copying is unavailable. Copy the selected request text using your device’s Copy command.');}
  }
});
$('#sort').addEventListener('change',event=>{sort=event.target.value;renderProducts();});
$('#search').addEventListener('input',event=>{search=event.target.value;renderProducts();});
$('#search-clear').addEventListener('click',()=>{search='';$('#search').value='';renderProducts();$('#search').focus();});
$('#reset-filters').addEventListener('click',()=>{search='';$('#search').value='';sort='featured';$('#sort').value=sort;setFilter('all');});
$('#search-open').addEventListener('click',()=>{$('#catalog-search').hidden=false;$('#shop').scrollIntoView();setTimeout(()=>$('#search').focus({preventScroll:true}),100);});
$('#bag-open').addEventListener('click',openBag);
$('#menu-toggle').addEventListener('click',()=>{const open=$('#menu-toggle').getAttribute('aria-expanded')!=='true';$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#navigation').classList.toggle('open',open);});
$('#navigation').addEventListener('click',event=>{if(event.target.closest('a')){$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').setAttribute('aria-label','Open navigation');$('#navigation').classList.remove('open');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#navigation').classList.contains('open')){$('#menu-toggle').click();$('#menu-toggle').focus();}});
productDialog.addEventListener('change',event=>{if(event.target.name==='size')$('#detail-price').textContent=money(unitPrice(selectedProduct,event.target.value));});
bagDialog.addEventListener('change',event=>{if(event.target.id==='fulfillment'){$('#area-label').hidden=event.target.value==='pickup';$('#delivery-area').required=event.target.value==='delivery';}});
bagDialog.addEventListener('submit',event=>{if(event.target.id==='request-form'){event.preventDefault();if(validateRequest())renderSummary();}});
bagDialog.addEventListener('cancel',collectDetails);
bagDialog.addEventListener('close',()=>{collectDetails();bagViewVersion++;$('#bag-status').textContent='';});
productDialog.addEventListener('close',()=>{$('#product-status').textContent='';});
window.addEventListener('storage',event=>{
  if(event.storageArea&&event.storageArea!==localStorage)return;
  if(event.key!==storageKey&&event.key!==null)return;
  try{bag=sanitizeBag(JSON.parse(event.key===null?'[]':event.newValue||'[]'));}catch{bag=[];}
  updateCount();
  if(bagDialog.open){collectDetails();renderBag();focusInBag(['#prepare-request','[data-shop]']);}
  toast(bag.length?'Your bag was updated in another tab. Please review it. Your request details are kept.':'Your bag was cleared in another tab. Your request details are kept for this visit.');
});
$('#year').textContent=new Date().getFullYear();updateCount();renderProducts();attachImageFallbacks();
