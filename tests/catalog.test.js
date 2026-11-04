import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeBag,subtotal,buildSummary,products,sizes,unitPrice,localDate} from '../dist/catalog.js';

test('untrusted browser storage accepts only valid products, variants, and bounded integer quantities',()=>{
  const bag=sanitizeBag([null,{id:'blush',size:'classic',quantity:2},{id:'blush',size:'classic',quantity:100},{id:'unknown',size:'classic',quantity:1},{id:'rose',size:'unknown',quantity:1},{id:'rose',size:'classic',quantity:-1},{id:'rose',size:'classic',quantity:1.5},{id:'garden',size:'generous',quantity:3}]);
  assert.deepEqual(bag,[{id:'blush',size:'classic',quantity:20},{id:'garden',size:'generous',quantity:3}]);
  assert.deepEqual(sanitizeBag({unexpected:'value'}),[]);
});
test('subtotal accounts for arrangement size and quantity without adding unknown delivery fees',()=>{
  const bag=[{id:'blush',size:'classic',quantity:2},{id:'garden',size:'generous',quantity:1}];
  assert.equal(subtotal(bag),5925);assert.equal(subtotal([]),0);
  for(const p of products)for(const s of sizes)assert.equal(unitPrice(p,s.id),Math.round(p.price*s.multiplier));
});
test('delivery request preserves messages and includes estimate and confirmation limits',()=>{
  const summary=buildSummary([{id:'blush',size:'classic',quantity:2}],{name:'Alex',date:'2026-12-20',fulfillment:'delivery',area:'Valenzuela',message:'Happy birthday! <3',notes:'Cream wrapping please.'});
  for(const text of ['2 × The Blush Edit (Classic)','Delivery area: Valenzuela','Happy birthday! <3','Cream wrapping please.','delivery excluded','sample estimate','not a confirmed order'])assert.ok(summary.includes(text),text);
});
test('pickup request omits a stale delivery area and handles optional fields',()=>{
  const summary=buildSummary([{id:'sweet',size:'generous',quantity:1}],{name:'Alex',date:'2026-12-20',fulfillment:'pickup',area:'Previously entered city',message:'',notes:''});
  assert.ok(summary.includes('Preference: Pickup'));assert.ok(!summary.includes('Previously entered city'));assert.ok(summary.includes('None requested'));
});
test('date input minimum follows local calendar date',()=>{
  const today=new Date();assert.equal(localDate(),[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-'));
});
