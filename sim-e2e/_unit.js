'use strict';
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT='/home/user/Dead_Nexus',VENDOR='/home/user/Dead_Nexus/sim-e2e/vendor';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function srv(){return new Promise(r=>{const s=http.createServer((q,res)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end('nf');return;}res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});fs.createReadStream(fp).pipe(res);});s.listen(0,'127.0.0.1',()=>r(s));});}
function tests(){
  const out=[];const ok=(n,c,extra)=>out.push({n,pass:!!c,extra});
  const B=window.buildInitial,GVG=window.getVictoryGoals,SR=window.scenarioRule,ETS=window.euro_totalShares;
  // ---- S02 ----
  const s2=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:'S02'});
  const nonNpc2=s2.players.filter(p=>!p.isNpc).length;
  const g2=GVG(s2);
  const base=100,adj=(nonNpc2===2?-2:nonNpc2===3?-1:0);
  ok('S02 meta.scenario=S02',s2.meta.scenario==='S02');
  ok('S02 mnaNoCooldown=true',s2.meta.mnaNoCooldown===true);
  ok('S02 startHeat=3',s2.heat===3);
  ok('S02 allBloc (all seats bloc)',s2.players.filter(p=>!p.isNpc).every(p=>p.role==='bloc'));
  ok('S02 blocAssetBonus=175',SR(s2,'blocAssetBonus',0)===175); ok('S02 blocAsset = base+adj+bonus',g2.blocAsset===base+adj+SR(s2,'blocAssetBonus',0),`got ${g2.blocAsset} (base ${base} adj ${adj} bonus ${SR(s2,'blocAssetBonus',0)})`);
  ok('S02 scenarioRule mnaFloat=3',SR(s2,'mnaFloat',10)===3);
  ok('S02 scenarioRule mnaSerial=true',SR(s2,'mnaSerial',false)===true);
  ok('S02 scenarioRule mnaBotProb=1.0',SR(s2,'mnaBotProb',0.5)===1.0);
  ok('S02 scenarioRule mnaDesignateCredit=8',SR(s2,'mnaDesignateCredit',14)===8);
  // euro_totalShares uses float 3 for S02: bloc VANTA shares held by seats + 3
  const heldV=s2.players.reduce((a,p)=>a+((p.stocks&&p.stocks.VANTA)||0),0);
  ok('S02 euro_totalShares(VANTA)=held+3',ETS(s2,'VANTA')===heldV+3,`got ${ETS(s2,'VANTA')} held ${heldV}`);
  // ---- S03 ----
  const s3=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S03'});
  const real=s3.players.filter(p=>!p.isNpc);
  const realBloc=real.filter(p=>p.role==='bloc');
  const realGhost=real.filter(p=>p.role==='ghost');
  const npcBloc=s3.players.filter(p=>p.isNpc&&p.role==='bloc');
  const g3=GVG(s3);
  ok('S03 meta.scenario=S03',s3.meta.scenario==='S03');
  ok('S03 startHeat=4',s3.heat===4);
  ok('S03 startStock=12 (all blocs)',['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].every(b=>s3.stocks[b]===12),JSON.stringify(s3.stocks));
  ok('S03 lastStockSnapshot=12',s3.meta.lastStockSnapshot.VANTA===12);
  ok('S03 exactly 1 real Bloc',realBloc.length===1,`got ${realBloc.length}`);
  ok('S03 real Ghosts >=2',realGhost.length>=2,`got ${realGhost.length}`);
  ok('S03 NPC Bloc count=4',npcBloc.length===4,`got ${npcBloc.length}`);
  ok('S03 ghost rep bonus (rep=8: base5+3)',realGhost.every(p=>p.resources.rep>=8),`sample ${realGhost[0]&&realGhost[0].resources.rep}`);
  ok('S03 ghost credit bonus (+2 over 11x11 base)',realGhost.every(p=>p.resources.credit>=12),`sample ${realGhost[0]&&realGhost[0].resources.credit}`);
  ok('S03 real bloc influence +2 (=5)',realBloc[0]&&realBloc[0].resources.influence===5,`got ${realBloc[0]&&realBloc[0].resources.influence}`);
  ok('S03 ghostRepBattle=25',g3.ghostRepBattle===25,`got ${g3.ghostRepBattle}`);
  ok('S03 ghostRaids=3',g3.ghostRaids===3,`got ${g3.ghostRaids}`);
  ok('S03 SCENARIOS unlocked (selectable)',SR(s3,'ghostRising',false)===true);
  // ---- S04 (locked — 미구현 대형 시스템 의존) ----
  ok('S04 locked=true (scenarioRule)',SR({meta:{scenario:'S04'}},'locked',null)===true);
  ok('S04 lockReason present',typeof SR({meta:{scenario:'S04'}},'lockReason','')==='string'&&SR({meta:{scenario:'S04'}},'lockReason','').length>0);
  // ---- S05 골드러시 ----
  const s5=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'AXIOM',humans:null,scenario:'S05'});
  const g5=GVG(s5);
  const nn5=s5.players.filter(p=>!p.isNpc).length;const adj5=(nn5===2?-2:nn5===3?-1:0);
  const bloc5=s5.players.find(p=>p.role==='bloc'&&!p.isNpc);
  ok('S05 meta.scenario=S05',s5.meta.scenario==='S05');
  ok('S05 startHeat=5',s5.heat===5);
  ok('S05 startStock=13 (all blocs)',['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].every(b=>s5.stocks[b]===13),JSON.stringify(s5.stocks));
  ok('S05 lastStockSnapshot=13',s5.meta.lastStockSnapshot.VANTA===13);
  ok('S05 roundLimit override=8',SR(s5,'roundLimit',12)===8);
  ok('S05 zoneIncomeBonus=1',SR(s5,'zoneIncomeBonus',0)===1);
  ok('S05 blocAsset=base+adj+25',g5.blocAsset===100+adj5+25,`got ${g5.blocAsset} (adj ${adj5})`);
  ok('S05 all-seat credit +5 (bloc 8+5=13)',bloc5&&bloc5.resources.credit>=13,`got ${bloc5&&bloc5.resources.credit}`);
  ok('S05 ghostRepBattle standard (no override)',g5.ghostRepBattle===45+Math.floor(adj5/2),`got ${g5.ghostRepBattle}`);
  // ---- S06 마켓 크래시 ----
  const s6=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'CARBON',humans:null,scenario:'S06'});
  const g6=GVG(s6);
  const nn6=s6.players.filter(p=>!p.isNpc).length;const adj6=(nn6===2?-2:nn6===3?-1:0);
  const bloc6=s6.players.find(p=>p.role==='bloc'&&!p.isNpc);
  ok('S06 meta.scenario=S06',s6.meta.scenario==='S06');
  ok('S06 startHeat=6',s6.heat===6);
  ok('S06 startStock=5 (all blocs)',['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].every(b=>s6.stocks[b]===5),JSON.stringify(s6.stocks));
  ok('S06 lastStockSnapshot=5',s6.meta.lastStockSnapshot.VANTA===5);
  ok('S06 all-seat credit -3 (bloc 8-3=5)',bloc6&&bloc6.resources.credit===5,`got ${bloc6&&bloc6.resources.credit}`);
  ok('S06 all-seat influence -1 (bloc 3-1=2)',bloc6&&bloc6.resources.influence===2,`got ${bloc6&&bloc6.resources.influence}`);
  ok('S06 shortLowPriceMult=2',SR(s6,'shortLowPriceMult',1)===2);
  ok('S06 each bloc seeded SCANDAL card',s6.players.filter(p=>p.role==='bloc').every(p=>(p.discard||[]).includes('SCANDAL')),`sample discard ${JSON.stringify(bloc6&&bloc6.discard)}`);
  ok('S06 blocAsset=base+adj (no bonus)',g6.blocAsset===100+adj6,`got ${g6.blocAsset}`);
  // ---- S01 unchanged (fallbacks) ----
  const s1=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'CIPHER',humans:null,scenario:'S01'});
  const g1=GVG(s1);
  const nn1=s1.players.filter(p=>!p.isNpc).length;const adj1=(nn1===2?-2:nn1===3?-1:0);
  ok('S01 blocAsset = base+adj (no bonus)',g1.blocAsset===100+adj1,`got ${g1.blocAsset}`);
  ok('S01 ghostRepBattle standard (45+adj/2)',g1.ghostRepBattle===45+Math.floor(adj1/2),`got ${g1.ghostRepBattle}`);
  ok('S01 euro_totalShares uses float 10',ETS(s1,'VANTA')===s1.players.reduce((a,p)=>a+((p.stocks&&p.stocks.VANTA)||0),0)+10);
  ok('S01 heat=5',s1.heat===5);
  ok('S01 startStock=8',s1.stocks.VANTA===8);
  return out;
}
(async()=>{const server=await srv();const port=server.address().port;const br=await chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium'});const pg=await br.newPage();
await pg.route('**/*',route=>{const u=route.request().url();const send=f=>route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:fs.readFileSync(path.join(VENDOR,f))});if(u.includes('unpkg.com')&&u.includes('react-dom'))return send('react-dom.production.min.js');if(u.includes('unpkg.com')&&u.includes('/react@'))return send('react.production.min.js');if(u.includes('unpkg.com')&&u.includes('babel'))return send('babel.min.js');if(u.includes('fonts.g'))return route.fulfill({status:200,contentType:'text/css',body:''});return route.continue();});
await pg.goto(`http://127.0.0.1:${port}/simulator/v0.5/`,{waitUntil:'load',timeout:30000});
await pg.waitForFunction(()=>typeof window.reducer==='function'&&typeof window.buildInitial==='function'&&typeof window.getVictoryGoals==='function'&&typeof window.scenarioRule==='function'&&typeof window.euro_totalShares==='function',{timeout:45000});
const res=await pg.evaluate(tests);
let fail=0;for(const t of res){console.log((t.pass?'  PASS ':'  FAIL ')+t.n+(t.extra?'  ['+t.extra+']':''));if(!t.pass)fail++;}
console.log('\n'+(fail===0?'ALL '+res.length+' UNIT TESTS PASSED':fail+' / '+res.length+' FAILED'));
await br.close();server.close();process.exit(fail===0?0:1);})();
