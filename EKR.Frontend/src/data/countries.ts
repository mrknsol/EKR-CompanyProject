export interface CountryOption {
  code: string;
  dial: string;
  flag: string;
  name: { ru: string; en: string; zh: string; az: string };
}

/** Common wholesale partner countries */
export const COUNTRIES: CountryOption[] = [
  {
    code: 'CN',
    dial: '+86',
    flag: '🇨🇳',
    name: { ru: 'Китай', en: 'China', zh: '中国', az: 'Çin' },
  },
  {
    code: 'AZ',
    dial: '+994',
    flag: '🇦🇿',
    name: { ru: 'Азербайджан', en: 'Azerbaijan', zh: '阿塞拜疆', az: 'Azərbaycan' },
  },
  {
    code: 'KZ',
    dial: '+7',
    flag: '🇰🇿',
    name: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦', az: 'Qazaxıstan' },
  },
  {
    code: 'RU',
    dial: '+7',
    flag: '🇷🇺',
    name: { ru: 'Россия', en: 'Russia', zh: '俄罗斯', az: 'Rusiya' },
  },
  {
    code: 'UZ',
    dial: '+998',
    flag: '🇺🇿',
    name: { ru: 'Узбекистан', en: 'Uzbekistan', zh: '乌兹别克斯坦', az: 'Özbəkistan' },
  },
  {
    code: 'KG',
    dial: '+996',
    flag: '🇰🇬',
    name: { ru: 'Кыргызстан', en: 'Kyrgyzstan', zh: '吉尔吉斯斯坦', az: 'Qırğızıstan' },
  },
  {
    code: 'TR',
    dial: '+90',
    flag: '🇹🇷',
    name: { ru: 'Турция', en: 'Turkey', zh: '土耳其', az: 'Türkiyə' },
  },
  {
    code: 'AE',
    dial: '+971',
    flag: '🇦🇪',
    name: { ru: 'ОАЭ', en: 'UAE', zh: '阿联酋', az: 'BAƏ' },
  },
  {
    code: 'GE',
    dial: '+995',
    flag: '🇬🇪',
    name: { ru: 'Грузия', en: 'Georgia', zh: '格鲁吉亚', az: 'Gürcüstan' },
  },
  {
    code: 'UA',
    dial: '+380',
    flag: '🇺🇦',
    name: { ru: 'Украина', en: 'Ukraine', zh: '乌克兰', az: 'Ukrayna' },
  },
  {
    code: 'BY',
    dial: '+375',
    flag: '🇧🇾',
    name: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯', az: 'Belarus' },
  },
  {
    code: 'PL',
    dial: '+48',
    flag: '🇵🇱',
    name: { ru: 'Польша', en: 'Poland', zh: '波兰', az: 'Polşa' },
  },
];

export const COMPANY = {
  brand: 'ZEIR',
  company: 'EKR',
  factory: {
    country: 'China',
    region: 'Hebei',
    label: {
      ru: 'Фабрика · Хэбэй, Китай',
      en: 'Factory · Hebei, China',
      zh: '工厂 · 河北，中国',
      az: 'Fabrika · Hebei, Çin',
    },
  },
  office: {
    city: 'Guangzhou',
    label: {
      ru: 'Офис и шоурум · Гуанчжоу, Китай',
      en: 'Office & showroom · Guangzhou, China',
      zh: '办公室与展厅 · 广州，中国',
      az: 'Ofis və showroom · Guangzhou, Çin',
    },
  },
  email: 'wholesale@zeir.com',
  phone: '+86 20 0000 0000',
};

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

export function countryLabel(code: string, lang: 'ru' | 'en' | 'zh' | 'az') {
  const c = countryByCode(code);
  return c ? c.name[lang] : code;
}
