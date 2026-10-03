import test from 'node:test';
import assert from 'node:assert/strict';
import { safeStreamUrl, scanImages, scannerStatus } from '../src/utils/scanSafety.js';

test('HTTPS deployment never embeds HTTP device streams', () => {
  assert.equal(safeStreamUrl('http://192.168.4.1/stream', 'https://damdads.netlify.app/scan'), null);
  assert.equal(safeStreamUrl('javascript:alert(1)'), null);
  assert.equal(safeStreamUrl('https://camera.example/stream'), 'https://camera.example/stream');
  assert.equal(safeStreamUrl('/stream', 'https://camera.example/scan'), 'https://camera.example/stream');
});

test('local HTTP preview remains available when the page is HTTP', () => {
  assert.equal(safeStreamUrl('http://192.168.4.1/stream', 'http://localhost:3000'), 'http://192.168.4.1/stream');
});

test('missing real photos stay missing instead of becoming demo photos', () => {
  assert.deepEqual(scanImages({is_mock:false}), {white_image_url:null, uv_image_url:null});
  assert.deepEqual(scanImages(null), {white_image_url:null, uv_image_url:null});
});

test('previously persisted demo placeholders are removed from real results', () => {
  assert.equal(scanImages({is_mock:false, white_image_url:'/assets/demo_white_light.jpg'}).white_image_url, null);
});

test('explicit demo results retain example photos', () => {
  assert.equal(scanImages({is_mock:true}).uv_image_url, '/assets/demo_uv_light.jpg');
});

test('real photos including the collection server field names are preserved', () => {
  const actual = scanImages({white_img:'https://storage.example/white.jpg', uv_img:'https://storage.example/uv.jpg'});
  assert.equal(actual.white_image_url, 'https://storage.example/white.jpg');
  assert.equal(actual.uv_image_url, 'https://storage.example/uv.jpg');
});

test('SPA HTML and registry entries cannot masquerade as scanner health', () => {
  assert.throws(() => scannerStatus('<html>SPA</html>'));
  assert.throws(() => scannerStatus({ESP32_1:'192.168.1.5'}));
  assert.throws(() => scannerStatus({connected:'false', status:'ok'}));
});

test('only positive boolean health reports a connected scanner', () => {
  assert.equal(scannerStatus({connected:false,status:'unreachable'}).status,'unreachable');
  assert.equal(scannerStatus({connected:true,status:'ok'}).status,'ok');
  assert.equal(scannerStatus({connected:true,status:'unreachable'}).status,'unreachable');
});


test('local preview opt-in permits private HTTP streams only', () => {
  const page = 'https://damdads.netlify.app/scan';
  const options = { allowLocalHttp: true };
  for (const ip of ['192.168.4.1', '10.0.0.2', '172.16.0.2', '172.31.255.1']) {
    const url = `http://${ip}/stream`;
    assert.equal(safeStreamUrl(url, page), null);
    assert.equal(safeStreamUrl(url, page, options), url);
  }
  for (const url of ['http://52.79.241.24/stream', 'http://172.32.0.1/stream',
    'http://camera.example/stream', 'http://user:password@192.168.4.1/stream',
    'javascript:alert(1)', 'http://192.168.999.1/stream']) {
    assert.equal(safeStreamUrl(url, page, options), null);
  }
});
