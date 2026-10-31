import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.slice(html.indexOf('function startReady(){'),html.indexOf('function startGame(){'));
const code=html.slice(html.indexOf('async function submitRankingOnce(){'),html.indexOf('/* 15. シェア */'));
function setup(rpc=async()=>[]){
 const els=new Map();const get=id=>{if(!els.has(id))els.set(id,{value:'',textContent:'',innerHTML:''});return els.get(id);};
 const game={playerName:'',finalScore:42,wasRetired:false,rankingSubmitStarted:false,rankingFetched:false};
 const c=vm.createContext({game,state:{},STATES:{READY:'ready'},setState(){},localStorage:{setItem(){}},performance:{now:()=>0},Object,Array,Math,Number,GAME_SLUG:'kanijan',CLIENT_VERSION:'test',$:get,supabaseRpc:rpc});
 vm.runInContext('let rankingRun=0,rankingRequest=0;'+start+code+';globalThis.api={startReady,submitRankingOnce,fetchRanking,newPlay(){rankingRun++;game.rankingSubmitStarted=false;game.rankingFetched=false;}};',c);
 return {game,api:c.api,get};
}
test('blank and whitespace names can start without public submission',async()=>{for(const name of ['', ' \t　 ']){const calls=[];const x=setup(async(fn,p)=>{calls.push({fn,p});return[];});x.get('nameInput').value=name;x.api.startReady();await x.api.submitRankingOnce();await x.api.fetchRanking();assert.deepEqual(calls.map(x=>x.fn),['get_best_score_ranking']);assert.equal(calls[0].p.p_limit,30);}});
test('changing input later cannot publish a guest result',async()=>{const calls=[];const x=setup(async fn=>{calls.push(fn);return[];});x.api.startReady();x.get('nameInput').value='New name';await x.api.submitRankingOnce();assert.equal(calls.length,0);});
test('started name and current score are sent once despite result re-entry and ranking retry',async()=>{const calls=[];const x=setup(async(fn,p)=>{calls.push({fn,p});return[];});x.get('nameInput').value='First';x.api.startReady();x.get('nameInput').value='Second';await x.api.submitRankingOnce();await x.api.submitRankingOnce();await x.api.fetchRanking(true);assert.equal(calls.filter(x=>x.fn==='submit_score').length,1);assert.equal(calls[0].p.p_display_name,'First');assert.equal(calls[0].p.p_score,42);});
test('send failure preserves the result and does not block ranking reads',async()=>{const x=setup(async fn=>{if(fn==='submit_score')throw new Error('offline');return[];});x.get('nameInput').value='Name';x.api.startReady();await x.api.submitRankingOnce();await x.api.fetchRanking();assert.equal(x.game.finalScore,42);assert.match(x.get('submitStatus').textContent,/保持/);assert.match(x.get('rankingList').innerHTML,/まだランキング/);});
test('older ranking response cannot overwrite a newer one',async()=>{const pending=[];const x=setup(()=>new Promise(resolve=>pending.push(resolve)));const a=x.api.fetchRanking(true),b=x.api.fetchRanking(true);pending[1]([{rank_no:1,display_name:'new',best_score:42}]);await b;pending[0]([{rank_no:1,display_name:'old',best_score:42}]);await a;assert.match(x.get('rankingList').innerHTML,/new/);assert.doesNotMatch(x.get('rankingList').innerHTML,/old/);});
