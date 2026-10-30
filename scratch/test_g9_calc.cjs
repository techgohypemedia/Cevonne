// Test script to verify metric extraction & formatting
const mockInsights = [
  {
    campaign_name: 'Retargeting - Cart Dropoffs',
    adset_name: 'Dropoffs 7d',
    ad_name: 'Lipstick Rose Ad',
    spend: '1450.50',
    impressions: '6200',
    reach: '5400',
    clicks: '180',
    ctr: '2.90',
    cpc: '8.05',
    actions: [{ action_type: 'purchase', value: '4' }],
    action_values: [{ action_type: 'purchase', value: '3800' }]
  },
  {
    campaign_name: 'Top Funnel - Cold Traffic',
    adset_name: 'Broad Beauty Interests',
    ad_name: 'Reel Hook 1',
    spend: '2000.00',
    impressions: '8000',
    reach: '7200',
    clicks: '200',
    ctr: '2.50',
    cpc: '10.00',
    actions: [{ action_type: 'purchase', value: '2' }],
    action_values: [{ action_type: 'purchase', value: '1990' }]
  }
];

const number = (v) => {
  const p = Number(v);
  return Number.isFinite(p) ? p : 0;
};

const actionVal = (actions, type) => {
  if (!Array.isArray(actions)) return 0;
  const match = actions.find(a => String(a.action_type || '').toLowerCase() === type);
  return number(match?.value);
};

let totalSpend = 0;
let totalImpressions = 0;
let totalClicks = 0;
let totalPurchases = 0;
let totalPurchaseValue = 0;

for (const r of mockInsights) {
  totalSpend += number(r.spend);
  totalImpressions += number(r.impressions);
  totalClicks += number(r.clicks);
  totalPurchases += actionVal(r.actions, 'purchase');
  totalPurchaseValue += actionVal(r.action_values, 'purchase');
}

const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
const roas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
const cpp = totalPurchases > 0 ? totalSpend / totalPurchases : 0;

console.log('Total Spend:', totalSpend.toFixed(2));
console.log('Purchases:', totalPurchases);
console.log('Revenue:', totalPurchaseValue);
console.log('ROAS:', roas.toFixed(2) + 'x');
console.log('CPP:', cpp.toFixed(2));
console.log('CTR:', ctr.toFixed(2) + '%');
console.log('CPC:', cpc.toFixed(2));

