// ─── English ─────────────────────────────────────────────────────────────────

const ONES_EN = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS_EN = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function chunk3EN(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES_EN[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return TENS_EN[t] + (o !== 0 ? '-' + ONES_EN[o] : '');
  }
  const h = Math.floor(n / 100);
  const rem = n % 100;
  return ONES_EN[h] + ' Hundred' + (rem !== 0 ? ' ' + chunk3EN(rem) : '');
}

function intToWordsEN(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  if (n >= 1_000_000_000) {
    parts.push(chunk3EN(Math.floor(n / 1_000_000_000)) + ' Billion');
    n %= 1_000_000_000;
  }
  if (n >= 1_000_000) {
    parts.push(chunk3EN(Math.floor(n / 1_000_000)) + ' Million');
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    parts.push(chunk3EN(Math.floor(n / 1_000)) + ' Thousand');
    n %= 1_000;
  }
  if (n > 0) parts.push(chunk3EN(n));
  return parts.join(' ');
}

type CurrencyNames = [string, string, string, string]; // [singCur, plurCur, singCent, plurCent]

const CURRENCY_EN: Record<string, CurrencyNames> = {
  USD: ['US Dollar', 'US Dollars', 'Cent', 'Cents'],
  LBP: ['Lebanese Pound', 'Lebanese Pounds', 'Piastre', 'Piastres'],
  EUR: ['Euro', 'Euros', 'Cent', 'Cents'],
  GBP: ['British Pound', 'British Pounds', 'Penny', 'Pence'],
  SAR: ['Saudi Riyal', 'Saudi Riyals', 'Halala', 'Halalas'],
  AED: ['UAE Dirham', 'UAE Dirhams', 'Fils', 'Fils'],
};

export function amountToWordsEN(amount: number, currencyCode = 'USD'): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  const [singCur, plurCur, singCent, plurCent] =
    CURRENCY_EN[currencyCode] ?? [currencyCode, currencyCode + 's', 'Cent', 'Cents'];

  let result = intToWordsEN(whole) + ' ' + (whole === 1 ? singCur : plurCur);
  if (cents > 0) {
    result += ' and ' + String(cents).padStart(2, '0') + '/100 ' + (cents === 1 ? singCent : plurCent);
  }
  return result + ' Only';
}

// ─── Arabic ──────────────────────────────────────────────────────────────────

const ONES_AR = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
  'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
];
const TENS_AR = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS_AR = [
  '', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة',
];

function chunk3AR(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(HUNDREDS_AR[Math.floor(n / 100)]);
    n %= 100;
  }
  if (n >= 20) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    parts.push(o > 0 ? ONES_AR[o] + ' و' + TENS_AR[t] : TENS_AR[t]);
  } else if (n > 0) {
    parts.push(ONES_AR[n]);
  }
  return parts.join(' و');
}

function intToWordsAR(n: number): string {
  if (n === 0) return 'صفر';
  const parts: string[] = [];

  if (n >= 1_000_000_000) {
    const b = Math.floor(n / 1_000_000_000);
    n %= 1_000_000_000;
    if (b === 1) parts.push('مليار');
    else if (b === 2) parts.push('ملياران');
    else if (b <= 10) parts.push(chunk3AR(b) + ' مليارات');
    else parts.push(chunk3AR(b) + ' مليار');
  }

  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    n %= 1_000_000;
    if (m === 1) parts.push('مليون');
    else if (m === 2) parts.push('مليونان');
    else if (m <= 10) parts.push(chunk3AR(m) + ' ملايين');
    else parts.push(chunk3AR(m) + ' مليون');
  }

  if (n >= 1_000) {
    const k = Math.floor(n / 1_000);
    n %= 1_000;
    if (k === 1) parts.push('ألف');
    else if (k === 2) parts.push('ألفان');
    else if (k <= 10) parts.push(chunk3AR(k) + ' آلاف');
    else parts.push(chunk3AR(k) + ' ألفاً');
  }

  if (n > 0) parts.push(chunk3AR(n));

  return parts.join(' و');
}

type CurrencyNamesAR = [string, string]; // [currencyName, centName]

const CURRENCY_AR: Record<string, CurrencyNamesAR> = {
  USD: ['دولاراً أمريكياً', 'سنتاً'],
  LBP: ['ليرة لبنانية', 'قرشاً'],
  EUR: ['يورو', 'سنتاً'],
  GBP: ['جنيهاً إسترلينياً', 'بنساً'],
  SAR: ['ريالاً سعودياً', 'هللة'],
  AED: ['درهماً إماراتياً', 'فلساً'],
};

export function amountToWordsAR(amount: number, currencyCode = 'USD'): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  const [curName, centName] = CURRENCY_AR[currencyCode] ?? [currencyCode, 'سنتاً'];

  let result = intToWordsAR(whole) + ' ' + curName;
  if (cents > 0) {
    result += ' و' + intToWordsAR(cents) + ' ' + centName;
  }
  return result + ' فقط لا غير';
}
