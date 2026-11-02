// Full interception: no real HTTP, WebSocket, service worker or score submission.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),engines=require('playwright');
const{inspectShareTarget}=require('./share-visibility.cjs'),root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'index.html'),'utf8'),marker='function init(){';assert.equal(raw.split(marker).length,2);
const html=raw.replace(marker,'window.__shareTest={restoreReceipt,state:()=>({currentScreen:state.current,receipt:game.receipt,finalScore:game.finalScore,finalHeight:game.finalHeight,finalCombo:game.finalCombo,submissionId:game.submissionId}),t};\n'+marker),{source,catalogs}=JSON.parse(raw.match(/<script id="localeData" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const origin='https://kanijan.test',publicUrl='https://chameleonjp.codeberg.page/kanijan/';
async function visible(page,selector){const el=page.locator(selector);assert.ok(await el.isVisible(),selector);await el.scrollIntoViewIfNeeded();const a=await el.evaluate(inspectShareTarget);assert.ok(a.visible&&a.viewport&&a.unclipped&&a.hit&&a.fits&&a.width>=44&&a.height>=44,selector+' '+JSON.stringify(a));return el;}
(async()=>{
 const engine=process.env.BROWSER||'chromium';assert.ok(['chromium','webkit'].includes(engine));const browser=await engines[engine].launch({headless:true});const unexpected=[],errors=[],intents=[];let submissions=0,cases=0;
 try{
 const context=await browser.newContext({viewport:{width:402,height:874},locale:'ja-JP',isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.routeWebSocket('**/*',ws=>{unexpected.push('websocket');ws.close();});
 await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());
  if(u.origin===origin&&u.pathname==='/'&&['GET','HEAD'].includes(req.method()))return route.fulfill({contentType:'text/html;charset=utf-8',body:req.method()==='HEAD'?'':html});
  if(u.origin==='https://x.com'&&u.pathname==='/intent/post'&&req.method()==='GET'){intents.push(u.searchParams.get('text'));return route.fulfill({contentType:'text/html',body:'<title>Mock X composer</title>'});}
  if(u.hostname.endsWith('.supabase.co')&&u.pathname.endsWith('/get_best_score_ranking')&&req.method()==='POST')return route.fulfill({json:[]});
  if(/submit|record_game_play|start/.test(u.pathname))submissions++;
  unexpected.push('http');return route.abort('blockedbyclient');
 });
 await context.addInitScript(()=>{localStorage.setItem('kanijan:sound','off');localStorage.setItem('kanijan:volume','0');});
 const page=await context.newPage();page.on('pageerror',()=>errors.push('pageerror'));await page.goto(origin+'/');
 for(const phase of ['home','normal','retire']){
  if(phase!=='home'){await page.evaluate(phase=>{const reason=phase==='retire'?'リタイア':'タイムアップ';localStorage.setItem('kanijan:last-result:v1',JSON.stringify({payload:{id:null,name:'',score:5100,height:20,combo:20,reason,retired:phase==='retire',version:'kanijan-common-20261031'},status:'guest'}));if(!__shareTest.restoreReceipt())throw Error('Invalid fixture');},phase);await page.waitForFunction(()=>__shareTest.state().currentScreen==='RESULT');await page.waitForFunction(()=>document.querySelector('#rankingList').textContent.length>0);}
  const section=phase==='home'?'home':'result',selector=phase==='home'?'#shareHomeBtn':'#shareResultBtn';
  for(const [lang,catalog]of Object.entries(catalogs)){
   await page.locator('#languageSelect').evaluate((el,lang)=>{el.value=lang;el.dispatchEvent(new Event('change'));},lang);assert.equal(await page.locator('html').getAttribute('lang'),lang);
   const t=(s,...args)=>(catalog[source.indexOf(s)]||s).replace(/\{(\d+)\}/g,(_,i)=>args[i]);
   const expected=(phase==='home'?t('カニジャン\n飛んでくる🍣🍤を、🦀に当たる直前でジャンプ！\n{0}',publicUrl):t('カニジャン\nジャン点：{0}点\n高さ：{1}段\n最大コンボ：{2}\n飛んでくる🍣🍤を🦀でジャンプ！\n{3}',5100,20,20,publicUrl))+'\n#カニジャン #ゲーム制作';
   const frozen=await page.evaluate(()=>JSON.stringify(__shareTest.state()));
   for(const viewport of [{width:402,height:874},{width:874,height:402}]){
    await page.setViewportSize(viewport);await visible(page,`#${section}Screen .common-ranking-link`);const el=await visible(page,selector);
    assert.equal(await el.textContent(),t('Xでシェア'));assert.deepEqual(await el.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).color})),{bg:'rgb(0, 0, 0)',fg:'rgb(255, 255, 255)'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const n=intents.length,opened=context.waitForEvent('page');await el.tap();const popup=await opened;await popup.waitForURL('https://x.com/intent/post**');assert.equal(new URL(popup.url()).searchParams.get('text'),expected);assert.equal(intents.length,n+1);assert.equal(intents[n],expected);await popup.close();
    await page.evaluate(()=>{window.__originalOpen=window.open;window.open=()=>null;});await el.tap();assert.equal(await page.locator('#commonShareText').inputValue(),expected);assert.equal(await page.locator('#commonShareFallback').isVisible(),true);await page.click('#commonShareClose');await page.evaluate(()=>{window.open=window.__originalOpen;delete window.__originalOpen});assert.equal(intents.length,n+1);assert.equal(await page.locator('#commonShareCopy').isVisible(),false);
    assert.equal(await page.evaluate(()=>JSON.stringify(__shareTest.state())),frozen);assert.equal(submissions,0);
    fs.mkdirSync(path.join(root,'test-artifacts'),{recursive:true});await page.screenshot({path:path.join(root,'test-artifacts',`${engine}-${phase}-${lang}-${viewport.width}x${viewport.height}.png`),fullPage:true});cases++;
   }
  }
 }
 assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);assert.equal(submissions,0);console.log(JSON.stringify({engine,cases,languages:15,orientations:2,phases:3,realIntentAndFallback:true,externalRequests:0,scoreRequests:submissions}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
