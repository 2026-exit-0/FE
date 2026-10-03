import test from 'node:test';
import assert from 'node:assert/strict';
import { selectReportScans, filterReportPeriod, reportChart, reportChange, metricValue } from '../src/utils/reportData.js';
const rows = [
 { session_id:'old',date:'2026.09.01',moisture:50,sebum:45,pore:60 },
 { session_id:'new',date:'2026.10.04',moisture:72,oil:30,spots:70 },
 { session_id:'demo',date:'2026.10.03',moisture:99,is_mock:true },
];
test('real report excludes demo records and never adds history',()=>{
 assert.equal(selectReportScans([], 'real').length,0);
 assert.equal(selectReportScans([rows[1],rows[2]],'real').length,1);
 assert.equal(selectReportScans([rows[1],rows[1]],'real').length,1);
});
test('periods filter actual dates, including the start day',()=>{
 const now=new Date('2026-10-04T12:00:00');
 assert.deepEqual(filterReportPeriod(rows,'week',now).map(x=>x.session_id),['new','demo']);
 assert.equal(filterReportPeriod([{date:'2026.09.28'},{date:'2026.09.27'}],'week',now).length,1);
 assert.equal(filterReportPeriod(rows,'all',now).length,3);
});
test('charts and changes use actual metric values in time order',()=>{
 const selected=selectReportScans(rows,'real');
 assert.deepEqual(reportChart(selected,'moisture').map(x=>x.score),[50,72]);
 assert.equal(reportChange(selected,'moisture'),22);
 assert.equal(reportChange(selected,'oil'),-15);
 assert.equal(reportChange(selected,'pore'),10);
 assert.equal(reportChange([rows[0]],'moisture'),null);
});
test('missing scores stay missing; zero is a real value',()=>{
 assert.equal(metricValue({},'overall'),null);
 assert.equal(metricValue({moisture:null},'moisture'),null);
 assert.equal(metricValue({moisture:0},'moisture'),0);
 assert.deepEqual(reportChart([{date:'invalid',moisture:50},{date:'2026.10.04',moisture:null}],'moisture'),[]);
});
