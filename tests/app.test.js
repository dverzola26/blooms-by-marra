import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as catalog from '../dist/catalog.js';

// DOM/event doubles exercise the real application handlers without a browser.
// These tests do not establish rendered layout, native dialog, or AT behavior.
function harness(){
  const ids=new Map(),all=[],events={},windowEvents={};
  const document={activeElement:null,querySelector:s=>s.startsWith('#')?ids.get(s.slice(1))||null:all.find(n=>n.isConnected&&n.matches(s))||null,querySelectorAll:s=>all.filter(n=>n.isConnected&&n.matches(s)),addEventListener:(type,fn)=>events[type]=fn};
  class Element{
    constructor(tag='div',attrs={}){
      this.tagName=tag;this.attrs={...attrs};this.dataset={};this.children=[];this.listeners={};this.isConnected=true;this.open=false;this.disabled='disabled'in attrs;this.checked='checked'in attrs;this.value=attrs.value||'';this.alt=attrs.alt;this.textContent='';this.complete=false;this.naturalWidth=1;this._html='';
      const classes=new Set((attrs.class||'').split(/\s+/));this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)};
      for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
      if(attrs.id)ids.set(attrs.id,this);all.push(this);
    }
    get id(){return this.attrs.id||'';}
    get innerHTML(){return this._html;}
    set innerHTML(html){
      const disconnect=node=>{node.isConnected=false;if(node.id&&ids.get(node.id)===node)ids.delete(node.id);if(document.activeElement===node)document.activeElement=null;node.children.forEach(disconnect);};
      this.children.forEach(disconnect);this.children=[];this._html=html;
      for(const match of html.matchAll(/<([a-z][\w-]*)(\s[^<>]*?)?>/g)){
        const attrs={};for(const a of (match[2]||'').matchAll(/([:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[a[1]]=a[2]??a[3]??a[4]??'';
        const node=new Element(match[1],attrs);
        if(match[1]==='textarea')node.value=html.slice(match.index+match[0].length).split('</textarea>')[0];
        this.children.push(node);
      }
    }
    matches(selector){
      if(selector==='img:not([data-fallback-ready])')return this.tagName==='img'&&!this.dataset.fallbackReady;
      if(selector.includes(','))return selector.split(',').some(s=>this.matches(s));
      if(selector.startsWith('#'))return this.id===selector.slice(1);
      if(selector.includes(':not(:disabled)')&&this.disabled)return false;
      if(selector.includes(':checked')&&!this.checked)return false;
      const tag=selector.match(/^[a-z]+/)?.[0];if(tag&&tag!==this.tagName)return false;
      for(const m of selector.matchAll(/\[([\w-]+)(?:="?([^"\]]+)"?)?\]/g)){
        if(!(m[1]in this.attrs))return false;if(m[2]!==undefined&&this.attrs[m[1]]!==m[2])return false;
      }
      return true;
    }
    querySelector(selector){return this.children.find(n=>n.isConnected&&n.matches(selector))||this.children.map(n=>n.querySelector(selector)).find(Boolean)||null;}
    closest(selector){return this.matches(selector)?this:null;}
    setAttribute(k,v){this.attrs[k]=String(v);}
    removeAttribute(k){delete this.attrs[k];}
    addEventListener(type,fn){this.listeners[type]=fn;}
    focus(){if(this.isConnected&&!this.disabled)document.activeElement=this;}
    select(){this.selected=true;}
    scrollIntoView(){}
    showModal(){this.open=true;}
    close(){this.open=false;this.listeners.close?.();}
  }
  const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  for(const m of html.matchAll(/id="([^"]+)"/g))new Element('div',{id:m[1]});
  const bag=ids.get('bag-dialog');bag.children=[ids.get('bag-content'),ids.get('bag-status'),new Element('button',{'data-close':''})];
  const product=ids.get('product-dialog');product.children=[ids.get('product-detail'),ids.get('product-status')];
  const storage={getItem:()=>null,setItem(){}};
  const context=vm.createContext({...catalog,document,localStorage:storage,window:{addEventListener:(t,f)=>windowEvents[t]=f},navigator:{},setTimeout:()=>1,clearTimeout(){},FormData:class{constructor(){this.entries=[...ids.values()].filter(n=>n.attrs.name&&n.isConnected).map(n=>[n.attrs.name,n.value]);}[Symbol.iterator](){return this.entries[Symbol.iterator]();}}});
  vm.runInContext(fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*?;\n/,''),context);
  return {document,context,ids,Element,events,windowEvents,eval:code=>vm.runInContext(code,context),get:id=>ids.get(id),click:target=>events.click({target,preventDefault(){}}),openBag(quantity=2){this.eval(`bag=[{id:'blush',size:'classic',quantity:${quantity}}];renderBag();`);bag.open=true;}};
}

test('an already-failed image recovers once; decorative alternative text stays empty',()=>{
  const h=harness(),image=new h.Element('img',{src:'missing.jpg',alt:''});image.complete=true;image.naturalWidth=0;
  h.eval('attachImageFallbacks()');assert.equal(image.src,'assets/flower.svg');assert.equal(image.alt,'');
  image.src='unchanged';image.listeners.error();assert.equal(image.src,'unchanged');
});
test('a future image error also uses the fallback and removes responsive candidates',()=>{
  const h=harness(),image=new h.Element('img',{src:'photo.jpg',srcset:'photo.jpg 400w',alt:'Pink roses'});
  h.eval('attachImageFallbacks()');image.listeners.error();assert.equal(image.src,'assets/flower.svg');assert.equal(image.attrs.srcset,undefined);assert.match(image.alt,/unavailable/);
});
for(const [quantity,delta,expected]of [[2,-1,1],[19,1,20]])test(`quantity ${quantity} to ${expected} restores focus to an enabled line control`,async()=>{
  const h=harness();h.openBag(quantity);const button=h.get('bag-dialog').querySelector(`[data-quantity="0"][data-delta="${delta}"]`);button.focus();await h.click(button);
  assert.equal(h.eval('bag[0].quantity'),expected);assert.ok(h.document.activeElement);assert.equal(h.document.activeElement.disabled,false);assert.equal(h.document.activeElement.dataset.quantity,'0');assert.match(h.get('bag-status').textContent,new RegExp(`quantity ${expected}`));assert.equal(h.get('toast').textContent,'');
});
test('removing the final item focuses the empty-state action and announces inside the dialog',async()=>{
  const h=harness();h.openBag(1);await h.click(h.get('bag-dialog').querySelector('[data-remove="0"]'));
  assert.equal(h.eval('bag.length'),0);assert.ok('shop'in h.document.activeElement.dataset);assert.match(h.get('bag-status').textContent,/0 items remain/);
});
test('cross-tab clear resets bag and focus while preserving request fields in memory',()=>{
  const h=harness();h.openBag(2);h.eval("orderDetails.name='María 花';orderDetails.message='For you <3';");
  h.windowEvents.storage({key:null,newValue:null});assert.equal(h.eval('bag.length'),0);assert.equal(h.get('bag-count').textContent,0);assert.ok('shop'in h.document.activeElement.dataset);assert.equal(h.eval('orderDetails.name'),'María 花');assert.match(h.get('bag-status').textContent,/cleared/);
});
test('cross-tab replacement sanitizes new data and unrelated storage changes do not change the bag',()=>{
  const h=harness();h.openBag(1);h.windowEvents.storage({key:'unrelated',newValue:'[]'});assert.equal(h.eval('bag.length'),1);
  h.windowEvents.storage({key:'blooms-by-marra-bag-v1',newValue:JSON.stringify([{id:'rose',size:'classic',quantity:4},{id:'unknown',size:'classic',quantity:2}])});
  assert.equal(h.eval('bag.length'),1);assert.equal(h.eval('bag[0].id'),'rose');assert.equal(h.get('bag-count').textContent,4);assert.equal(h.document.activeElement.id,'prepare-request');
});
for(const reject of [false,true])test(`pending clipboard ${reject?'failure':'success'} cannot modify a replacement request step`,async()=>{
  const h=harness();h.openBag();h.eval('renderSummary()');let settle;
  h.context.navigator.clipboard={writeText:()=>new Promise((resolve,rejectPromise)=>settle=reject?rejectPromise:resolve)};
  const button=h.get('copy-request'),pending=h.click(button);assert.equal(button.disabled,true);assert.equal(button.attrs['aria-busy'],'true');h.eval('renderRequest()');settle(reject?new Error('denied'):undefined);await pending;
  assert.equal(h.document.activeElement.id,'customer-name');assert.equal(h.get('copy-help'),undefined);assert.equal(h.get('bag-status').textContent,'');
});
test('successful copying restores the control and announces within the modal',async()=>{
  const h=harness();h.openBag();h.eval('renderSummary()');let copied;h.context.navigator.clipboard={writeText:async text=>copied=text};const button=h.get('copy-request');await h.click(button);
  assert.match(copied,/not a confirmed order/);assert.equal(button.disabled,false);assert.equal(button.attrs['aria-busy'],undefined);assert.equal(button.textContent,'Request copied');assert.match(h.get('bag-status').textContent,/Request copied/);
});
test('clipboard denial keeps the request selectable and provides a retry',async()=>{
  const h=harness();h.openBag();h.eval('renderSummary()');const button=h.get('copy-request');await h.click(button);
  assert.equal(button.disabled,false);assert.equal(h.document.activeElement.id,'request-summary');assert.equal(h.get('request-summary').selected,true);assert.match(h.get('copy-help').textContent,/Copy command/);
});
test('a repeated copy click during the pending operation does not call the clipboard twice',async()=>{
  const h=harness();h.openBag();h.eval('renderSummary()');let resolve,calls=0;h.context.navigator.clipboard={writeText:()=>{calls++;return new Promise(r=>resolve=r);}};
  const button=h.get('copy-request'),pending=h.click(button);await h.click(button);assert.equal(calls,1);resolve();await pending;
});
test('adding from product details announces after the product dialog closes',async()=>{
  const h=harness();h.eval("openProduct('blush')");assert.equal(h.get('product-dialog').open,true);await h.click(h.get('detail-add'));
  assert.equal(h.get('product-dialog').open,false);assert.equal(h.eval('bag[0].size'),'classic');assert.match(h.get('toast').textContent,/added to your bag/);assert.equal(h.get('product-status').textContent,'');
});
test('closing the bag invalidates a pending copy without touching the closed step',async()=>{
  const h=harness();h.openBag();h.eval('renderSummary()');let resolve;h.context.navigator.clipboard={writeText:()=>new Promise(r=>resolve=r)};
  const pending=h.click(h.get('copy-request'));h.get('bag-dialog').close();resolve();await pending;assert.equal(h.get('bag-status').textContent,'');assert.equal(h.get('bag-dialog').open,false);
});
