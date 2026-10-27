export interface Country {
  name: string;
  nameEn: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'اليمن', nameEn: 'Yemen', code: 'YE', dialCode: '+967', flag: '🇾🇪' },
  { name: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'مصر', nameEn: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'الأردن', nameEn: 'Jordan', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'العراق', nameEn: 'Iraq', code: 'IQ', dialCode: '+964', flag: '🇮🇶' },
  { name: 'الكويت', nameEn: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'عُمان', nameEn: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'قطر', nameEn: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'البحرين', nameEn: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'المغرب', nameEn: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'الجزائر', nameEn: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'تونس', nameEn: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'ليبيا', nameEn: 'Libya', code: 'LY', dialCode: '+218', flag: '🇱🇾' },
  { name: 'السودان', nameEn: 'Sudan', code: 'SD', dialCode: '+249', flag: '🇸🇩' },
  { name: 'سوريا', nameEn: 'Syria', code: 'SY', dialCode: '+963', flag: '🇸🇾' },
  { name: 'لبنان', nameEn: 'Lebanon', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { name: 'فلسطين', nameEn: 'Palestine', code: 'PS', dialCode: '+970', flag: '🇵🇸' },
  { name: 'تركيا', nameEn: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'المملكة المتحدة', nameEn: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'الولايات المتحدة', nameEn: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'ألمانيا', nameEn: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'فرنسا', nameEn: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'ماليزيا', nameEn: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'إندونيسيا', nameEn: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'الهند', nameEn: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'باكستان', nameEn: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' }
];
