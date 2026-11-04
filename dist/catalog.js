export const products = [
  {id:'blush', name:'The Blush Edit', description:'Soft pink blooms. A beautifully gentle gesture.', price:1500, image:'photo-1563241527-3004b7be0ffd', tag:'A little romance', occasions:['romance','birthday'], alt:'An abundant arrangement of pink and cream flowers', detail:'An inspiration of soft pinks, warm cream, and a little greenery. A lovely starting point for an anniversary surprise or a birthday with a romantic touch.'},
  {id:'rose', name:'Rose Reverie', description:'Classic roses, for a not-so-ordinary love.', price:1800, image:'photo-1548094990-c16ca90f1f0d', tag:'For your person', occasions:['romance'], alt:'Romantic red roses in bloom', detail:'A classic rose-inspired arrangement for the moments that deserve a heartfelt gesture. Ask your florist about available rose colors and wrapping options.'},
  {id:'sunshine', name:'Pocket of Sunshine', description:'A bright little pick-me-up, just for them.', price:1200, image:'photo-1597848212624-a19eb35e2651', tag:'A brighter day', occasions:['birthday','just-because'], alt:'Golden yellow sunflowers with dark centers', detail:'A cheerful sunflower-inspired gift for birthdays, small victories, and everyday encouragement. A bright idea to make someone smile.'},
  {id:'petal', name:'Petal Poetry', description:'Delicate petals. A whole lot of feeling.', price:1650, image:'photo-1525310072745-f49212b5ac6d', tag:'Just because', occasions:['romance','just-because'], alt:'Delicate pale pink flowers with layers of petals', detail:'Soft, romantic flower inspiration for a thoughtful everyday gesture. Request your preferred seasonal blooms and let the florist suggest a palette.'},
  {id:'garden', name:'Garden Daydream', description:'A little wild. A little wonderful.', price:1950, image:'photo-1526045478516-99145907023c', tag:'Something lovely', occasions:['birthday','just-because'], alt:'A colorful mixed flower arrangement', detail:'A garden-inspired mix of textures and colors. Share a favorite color or occasion so the florist can suggest a personalized arrangement.'},
  {id:'sweet', name:'Sweet Simplicity', description:'Simple, soft, and straight from the heart.', price:1100, image:'photo-1490750967868-88aa4486c946', tag:'Little gestures', occasions:['just-because','birthday'], alt:'Delicate flowering branches in soft natural light', detail:'A light, delicate floral inspiration for a thank-you, a fresh start, or a little reminder that someone is on your mind.'}
];
export const sizes = [{id:'classic',label:'Classic',multiplier:1},{id:'generous',label:'Generous',multiplier:1.5}];
export const money = value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
export const imageUrl = (product,width=700) => `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=${width}&q=80`;
export const unitPrice = (product,size) => Math.round(product.price * sizes.find(s=>s.id===size).multiplier);
export function sanitizeBag(value){
  if(!Array.isArray(value)) return [];
  const result=[];
  for(const line of value.slice(0,100)){
    if(!line || !products.some(p=>p.id===line.id) || !sizes.some(s=>s.id===line.size) || !Number.isInteger(line.quantity) || line.quantity<1) continue;
    const existing=result.find(x=>x.id===line.id && x.size===line.size);
    if(existing)existing.quantity=Math.min(20,existing.quantity+line.quantity);
    else result.push({id:line.id,size:line.size,quantity:Math.min(20,line.quantity)});
  }
  return result;
}
export const subtotal = bag => bag.reduce((total,line)=>total+unitPrice(products.find(p=>p.id===line.id),line.size)*line.quantity,0);
export function localDate(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function buildSummary(bag,details){
  return ['Hello Blooms by Marra! I’d like to ask about this arrangement request.', '', ...bag.map(line=>{const p=products.find(p=>p.id===line.id);const s=sizes.find(s=>s.id===line.size);return `${line.quantity} × ${p.name} (${s.label}) — ${money(unitPrice(p,s.id)*line.quantity)} sample estimate`}), '',`Sample subtotal: ${money(subtotal(bag))} (delivery excluded)`,`Name: ${details.name}`,`Preference: ${details.fulfillment==='delivery'?'Delivery':'Pickup'}`,`Preferred date: ${details.date}`, ...(details.fulfillment==='delivery'&&details.area?[`Delivery area: ${details.area}`]:[]),`Card message: ${details.message||'None requested'}`,`Special requests: ${details.notes||'None'}`, '', 'These are sample arrangements and estimates. Please confirm actual flowers, availability, final price, delivery fees, timing, and payment details. This is an inquiry, not a confirmed order.'].join('\n');
}
