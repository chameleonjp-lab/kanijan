// Actual anonymous Canvas scene; no real network or game rule modifications.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='https://kanijan.test';
(async()=>{
 const raw=fs.readFileSync(path.join(root,'index.html'),'utf8'),marker='function init(){';assert.equal(raw.split(marker).length,2);
 const html=raw.replace(marker,'window.__capture=()=>({phase:state.current,name:game.playerName,score:game.score,height:game.height,food:game.platform?{type:game.platform.type,x:game.platform.x,y:game.platform.y}:null,w:canvas.cssW,h:canvas.cssH});\n'+marker);
 const browser=await chromium.launch({headless:true});try{
 const context=await browser.newContext({viewport:{width:430,height:900},deviceScaleFactor:2,locale:'ja-JP',serviceWorkers:'block'}),unexpected=[],errors=[];
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(u.origin===origin&&u.pathname==='/'&&['GET','HEAD'].includes(r.method()))return route.fulfill({contentType:'text/html;charset=utf-8',body:r.method()==='HEAD'?'':html});unexpected.push('http');return route.abort('blockedbyclient')});
 await context.routeWebSocket('**/*',ws=>{unexpected.push('websocket');ws.close()});
 await context.addInitScript(()=>{let seed=19;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);window.open=()=>null;});
 const page=await context.newPage();page.on('pageerror',()=>errors.push('pageerror'));await page.goto(origin+'/');await page.fill('#nameInput','');await page.click('#startBtn');
 await page.waitForFunction(()=>{const s=__capture();return s.phase==='PLAYING'&&s.food&&s.food.x>s.w*.2&&s.food.x<s.w*.8&&Math.abs(s.food.x-s.w*.5)>s.w*.1&&s.food.y>20&&s.food.y<s.h-20;},{},{timeout:15000});
 const material=await page.evaluate(()=>{const canvas=document.querySelector('canvas'),d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();for(let i=0;i<d.length;i+=256)colors.add(d[i]+','+d[i+1]+','+d[i+2]);return{state:__capture(),width:canvas.width,height:canvas.height,colors:colors.size,png:canvas.toDataURL('image/png').split(',')[1]};});
 assert.equal(material.state.name,'');assert.equal(material.state.phase,'PLAYING');assert.ok(material.state.food);assert.ok(material.width>100&&material.height>100&&material.colors>10);assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
 const out=path.join(root,'test-artifacts');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'kanijan-real-scene.png'),Buffer.from(material.png,'base64'));delete material.png;fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({...material,seed:19,anonymous:true,externalRequests:0,source:'unmodified Canvas after normal anonymous start, natural first food movement; no forced jump or score'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
