/**
 * Canonical list of Paystack Ghana Banks and MoMo Providers
 * Includes aliases from legacy NUBAN codes to GHIPSS standard codes
 */

const GHANA_BANKS = [
  { name: 'MTN Mobile Money', code: 'MTN', type: 'mobile_money' },
  { name: 'Vodafone Cash / Telecel', code: 'VOD', type: 'mobile_money' },
  { name: 'AirtelTigo Money', code: 'ATL', type: 'mobile_money' },
  { name: 'Ecobank Ghana Limited', code: '130100', type: 'ghipss' },
  { name: 'GCB Bank Limited', code: '040100', type: 'ghipss' },
  { name: 'Fidelity Bank Ghana Limited', code: '240100', type: 'ghipss' },
  { name: 'Absa Bank Ghana Ltd', code: '030100', type: 'ghipss' },
  { name: 'Stanbic Bank Ghana Limited', code: '190100', type: 'ghipss' },
  { name: 'Access Bank Ghana', code: '280100', type: 'ghipss' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '230100', type: 'ghipss' },
  { name: 'Zenith Bank Ghana', code: '120100', type: 'ghipss' },
  { name: 'United Bank for Africa (UBA)', code: '060100', type: 'ghipss' },
  { name: 'CalBank PLC', code: '140100', type: 'ghipss' },
  { name: 'Consolidated Bank Ghana (CBG)', code: '340100', type: 'ghipss' },
  { name: 'Standard Chartered Bank Ghana', code: '020100', type: 'ghipss' },
  { name: 'ADB Bank Limited', code: '080100', type: 'ghipss' },
  { name: 'Republic Bank (GH) Limited', code: '110100', type: 'ghipss' },
  { name: 'First Atlantic Bank Limited', code: '170100', type: 'ghipss' },
  { name: 'First National Bank Ghana', code: '330100', type: 'ghipss' },
  { name: 'Société Générale Ghana', code: '090100', type: 'ghipss' },
  { name: 'Prudential Bank Limited', code: '180100', type: 'ghipss' },
  { name: 'FBNBank Ghana Limited', code: '200100', type: 'ghipss' },
  { name: 'Bank of Africa Ghana', code: '210100', type: 'ghipss' },
  { name: 'OmniBSIC Bank Ghana', code: '360100', type: 'ghipss' }
];

const BANK_ALIASES = {
  '014': '130100', // Ecobank
  '044': '280100', // Access
  '053': '120100', // Zenith
  '090115': '240100', // Fidelity
  '114': '040100', // GCB
  '039': '190100', // Stanbic
  '068': '020100', // Standard Chartered
  '010': '030100', // Absa
  'CBG': '340100', // CBG
  '058': '230100', // GTBank
  '033': '060100', // UBA
  '028': '110100', // Republic
  'TGO': 'ATL'     // AirtelTigo
};

function resolveGhanaBankCode(code) {
  if (!code) return '';
  const trimmed = String(code).trim();
  return BANK_ALIASES[trimmed] || trimmed;
}

function getBankNameByCode(code) {
  const resolved = resolveGhanaBankCode(code);
  const found = GHANA_BANKS.find(b => b.code === resolved);
  return found ? found.name : code;
}

module.exports = {
  GHANA_BANKS,
  BANK_ALIASES,
  resolveGhanaBankCode,
  getBankNameByCode
};
