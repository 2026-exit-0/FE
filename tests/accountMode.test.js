import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('account, mode and recommendation isolation', async t => {
  const oldStorage = globalThis.localStorage;
  const values = new Map([['damda_ai_mode','real'],['damda_token','A'],['damda_wishlist','[{"id":"legacy"}]']]);
  globalThis.localStorage = { getItem:k=>values.get(k)??null, setItem:(k,v)=>values.set(k,v), removeItem:k=>values.delete(k) };
  const server = await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true},server:{middlewareMode:true,watch:null,hmr:false}});
  try {
    const {default:client}=await server.ssrLoadModule('/src/api/client.js');
    const {default:auth}=await server.ssrLoadModule('/src/store/authStore.js');
    const {default:scans}=await server.ssrLoadModule('/src/store/scanStore.js');
    const {useModeStore:mode}=await server.ssrLoadModule('/src/store/modeStore.js');
    const {getRecommendations}=await server.ssrLoadModule('/src/api/products.js');
    const reply=(config,data)=>({config,data,status:200,statusText:'OK',headers:{}});
    client.defaults.adapter=async config=>reply(config,config.url==='/mypage'?{user_id:values.get('damda_token')}:[]);

    await t.test('wishlists survive returning to the same account but do not cross accounts',async()=>{
      await auth.getState().checkAuth();
      assert.deepEqual(auth.getState().wishlist,[]);
      auth.getState().toggleWish({id:'A-product'});
      values.set('damda_token','B');await auth.getState().checkAuth();
      assert.deepEqual(auth.getState().wishlist,[]);
      auth.getState().toggleWish({id:'B-product'});
      values.set('damda_token','A');await auth.getState().checkAuth();
      assert.deepEqual(auth.getState().wishlist.map(p=>p.id),['A-product']);
    });

    await t.test('mode switches restore real records and never merge demo history',async()=>{
      scans.getState().addScan({session_id:'real-scan',moisture:61,is_mock:false});
      mode.getState().setMode('mock');
      assert.ok(scans.getState().scans.every(s=>s.is_mock));
      assert.notEqual(scans.getState().currentScan.sessionId,'real-scan');
      mode.getState().setMode('real');
      assert.equal(scans.getState().currentScan.sessionId,'real-scan');
      assert.equal(scans.getState().scans.length,1);
    });

    await t.test('account reset removes skin inputs, in-progress flags and both mode caches',async()=>{
      scans.getState().setUserInputs({skin_type:'A-only'});
      scans.getState().setScannerStatus('scanning');
      scans.getState().setLoading(true);
      scans.getState().clearAll();
      assert.equal(scans.getState().userInputs,null);
      assert.equal(scans.getState().scannerStatus,'unknown');
      assert.equal(scans.getState().loading,false);
      mode.getState().setMode('mock');mode.getState().setMode('real');
      await new Promise(r=>setTimeout(r,20));
      assert.equal(scans.getState().currentScan,null);
      assert.equal(JSON.parse(values.get('skinlab_scan_store')).state.userInputs,null);
    });

    await t.test('recommendations use the session and label catalog fallback',async()=>{
      const calls=[];let fail=false;
      client.defaults.adapter=async config=>{
        calls.push(config.url);
        if(config.url.includes('/recommend')) {
          if(fail) throw Object.assign(new Error('unavailable'),{response:{status:503}});
          return reply(config,[{id:'personal'}]);
        }
        return reply(config,[{id:'general'}]);
      };
      assert.equal((await getRecommendations({},'session-1')).source,'personalized');
      assert.deepEqual(calls,['/scans/session-1/recommend']);
      calls.length=0;fail=true;
      assert.equal((await getRecommendations({},'session-1')).source,'catalog');
      assert.deepEqual(calls,['/scans/session-1/recommend','/products']);
    });

    await t.test('late survey response cannot repopulate a different account',async()=>{
      let release;
      client.defaults.adapter=config=>new Promise(resolve=>{release=()=>resolve(reply(config,{skin_type:'A-only'}));});
      const request=auth.getState().fetchSurvey();
      await new Promise(r=>setImmediate(r));
      values.set('damda_token','B');auth.setState({user:{user_id:'B'},survey:null});
      release();
      assert.equal(await request,null);
      assert.equal(auth.getState().survey,null);
    });
  } finally {
    await server.close();
    if(oldStorage===undefined) delete globalThis.localStorage;else globalThis.localStorage=oldStorage;
  }
});
