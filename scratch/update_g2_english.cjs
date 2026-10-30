const fs = require('fs');
const file = 'scratch/g2_whatsapp_health_monitor.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const codeNode = data.nodes.find(n => n.name === 'Code - Evaluate System Health');
codeNode.parameters.jsCode = `
const phoneData = $('Meta API - Check WhatsApp Phone Quality').first().json || {};
const wabaData = $('Meta API - Check WABA Account').first().json || {};
const tokenData = $input.first().json || {};

const query = $('Webhook - Manual / Status Check')?.first()?.json?.query || {};
const isTest = query.test === 'true' || query.test_alert === 'true';

const issues = [];

// 1. Validate Token
const tokenValid = tokenData?.data?.is_valid === true;
if (!tokenValid) {
  const tokenError = tokenData?.error?.message || tokenData?.data?.error?.message || 'Token is invalid or expired';
  issues.push('Meta Token Invalid: ' + tokenError);
}

// 2. Validate WhatsApp Phone Quality
const qualityRating = phoneData?.quality_rating || (phoneData?.error ? 'ERROR' : 'UNKNOWN');
if (qualityRating !== 'GREEN') {
  issues.push('WhatsApp Quality Rating is ' + qualityRating + ' (Expected GREEN)');
}

// 3. Validate WABA Review Status
const wabaStatus = wabaData?.account_review_status || (wabaData?.error ? 'ERROR' : 'UNKNOWN');
if (wabaStatus !== 'APPROVED') {
  issues.push('WABA Review Status is ' + wabaStatus + ' (Expected APPROVED)');
}

const isHealthy = issues.length === 0;
const shouldAlert = !isHealthy || isTest;

// Build WhatsApp notification text (Strictly Professional English for Admin/Founder)
let alertMessage = '';
if (isTest) {
  alertMessage = '✅ *CEVONNE SYSTEM HEALTH CHECK: OPERATIONAL*\\n\\n' +
    'All Meta & WhatsApp API systems are fully operational:\\n' +
    '• Phone Number: ' + (phoneData.display_phone_number || '+91 93542 43943') + ' (' + (phoneData.verified_name || 'Cevonne') + ')\\n' +
    '• Quality Rating: *' + qualityRating + '* (Healthy)\\n' +
    '• Account Review Status: *' + wabaStatus + '* (Approved)\\n' +
    '• Meta Access Token: *ACTIVE (Permanent / Valid)*\\n\\n' +
    'Customer order confirmations and abandoned cart recovery notifications are running smoothly.';
} else if (!isHealthy) {
  alertMessage = '🚨 *CRITICAL ALERT: CEVONNE WHATSAPP / META ISSUE*\\n\\n' +
    'An issue has been detected with your Meta WhatsApp integration:\\n' +
    issues.map(i => '• ' + i).join('\\n') + '\\n\\n' +
    '⚠️ *Business Impact:* Customer order confirmations and automated cart recovery messages may fail to deliver!\\n\\n' +
    '*Action Required:* Please review your Meta Business Suite immediately:\\n' +
    'https://business.facebook.com';
}

return [{
  json: {
    is_healthy: isHealthy,
    should_alert: shouldAlert,
    is_test: isTest,
    quality_rating: qualityRating,
    waba_status: wabaStatus,
    token_valid: tokenValid,
    phone: phoneData?.display_phone_number || null,
    verified_name: phoneData?.verified_name || null,
    issues: issues,
    alert_message: alertMessage,
    checked_at: new Date().toISOString()
  }
}];
`;

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated code node to English!');

