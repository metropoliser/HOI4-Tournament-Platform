// Hearts of Iron 4 Nations with country codes
// Flag images will use country codes (ISO 2-letter codes mapped from HOI4 tags)
// Historical flags are used for the WW2 period (1938-1945) from Wikimedia Commons

export interface HOI4Nation {
  tag: string; // HOI4 3-letter country tag
  name: string;
  flagCode: string; // ISO 2-letter code for flag images
  historicalFlagUrl?: string; // Optional: Direct URL to WW2-era historical flag
}

export const HOI4_NATIONS: HOI4Nation[] = [
  // Major Powers - Using WW2-era historical flags (1938-1945)
  {
    tag: 'GER',
    name: 'Germany',
    flagCode: 'de',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Flag_of_German_Reich_%281935%E2%80%931945%29.svg/120px-Flag_of_German_Reich_%281935%E2%80%931945%29.svg.png'
  },
  {
    tag: 'SOV',
    name: 'Soviet Union',
    flagCode: 'su',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_the_Soviet_Union.svg/120px-Flag_of_the_Soviet_Union.svg.png'
  },
  {
    tag: 'USA',
    name: 'United States',
    flagCode: 'us',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/US_flag_48_stars.svg/120px-US_flag_48_stars.svg.png'
  },
  {
    tag: 'ENG',
    name: 'United Kingdom',
    flagCode: 'gb',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/120px-Flag_of_the_United_Kingdom.svg.png'
  },
  {
    tag: 'FRA',
    name: 'France',
    flagCode: 'fr',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/120px-Flag_of_France.svg.png'
  },
  {
    tag: 'ITA',
    name: 'Italy',
    flagCode: 'it',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Italy_%281861-1946%29_crowned.svg/120px-Flag_of_Italy_%281861-1946%29_crowned.svg.png'
  },
  {
    tag: 'JAP',
    name: 'Japan',
    flagCode: 'jp',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Naval_ensign_of_the_Empire_of_Japan.svg/120px-Naval_ensign_of_the_Empire_of_Japan.svg.png'
  },
  {
    tag: 'CHI',
    name: 'China',
    flagCode: 'cn',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Flag_of_the_Republic_of_China.svg/120px-Flag_of_the_Republic_of_China.svg.png'
  },

  // European Nations
  {
    tag: 'POL',
    name: 'Poland',
    flagCode: 'pl',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Poland_%281928%E2%80%931980%29.svg/120px-Flag_of_Poland_%281928%E2%80%931980%29.svg.png'
  },
  {
    tag: 'SPR',
    name: 'Spain',
    flagCode: 'es',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Flag_of_Spain_%281938%E2%80%931945%29.svg/120px-Flag_of_Spain_%281938%E2%80%931945%29.svg.png'
  },
  {
    tag: 'POR',
    name: 'Portugal',
    flagCode: 'pt',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Portugal.svg/120px-Flag_of_Portugal.svg.png'
  },
  {
    tag: 'HOL',
    name: 'Netherlands',
    flagCode: 'nl',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/120px-Flag_of_the_Netherlands.svg.png'
  },
  {
    tag: 'BEL',
    name: 'Belgium',
    flagCode: 'be',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Flag_of_Belgium_%28civil%29.svg/120px-Flag_of_Belgium_%28civil%29.svg.png'
  },
  { tag: 'LUX', name: 'Luxembourg', flagCode: 'lu' },
  {
    tag: 'SWE',
    name: 'Sweden',
    flagCode: 'se',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Sweden.svg/120px-Flag_of_Sweden.svg.png'
  },
  {
    tag: 'NOR',
    name: 'Norway',
    flagCode: 'no',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Norway.svg/120px-Flag_of_Norway.svg.png'
  },
  {
    tag: 'DEN',
    name: 'Denmark',
    flagCode: 'dk',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Denmark.svg/120px-Flag_of_Denmark.svg.png'
  },
  {
    tag: 'FIN',
    name: 'Finland',
    flagCode: 'fi',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Finland.svg/120px-Flag_of_Finland.svg.png'
  },
  {
    tag: 'ROM',
    name: 'Romania',
    flagCode: 'ro',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Flag_of_Romania_%281940%E2%80%931944%29.svg/120px-Flag_of_Romania_%281940%E2%80%931944%29.svg.png'
  },
  {
    tag: 'HUN',
    name: 'Hungary',
    flagCode: 'hu',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Hungary_%281915-1918%2C_1919-1946%29.svg/120px-Flag_of_Hungary_%281915-1918%2C_1919-1946%29.svg.png'
  },
  {
    tag: 'YUG',
    name: 'Yugoslavia',
    flagCode: 'rs',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Flag_of_the_Kingdom_of_Yugoslavia.svg/120px-Flag_of_the_Kingdom_of_Yugoslavia.svg.png'
  },
  {
    tag: 'GRE',
    name: 'Greece',
    flagCode: 'gr',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Flag_of_Greece_%281822-1978%29.svg/120px-Flag_of_Greece_%281822-1978%29.svg.png'
  },
  {
    tag: 'TUR',
    name: 'Turkey',
    flagCode: 'tr',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Flag_of_Turkey.svg/120px-Flag_of_Turkey.svg.png'
  },
  {
    tag: 'BUL',
    name: 'Bulgaria',
    flagCode: 'bg',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Flag_of_Bulgaria_%281948%E2%80%931967%29.svg/120px-Flag_of_Bulgaria_%281948%E2%80%931967%29.svg.png'
  },
  {
    tag: 'CZE',
    name: 'Czechoslovakia',
    flagCode: 'cz',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_Czechoslovakia.svg/120px-Flag_of_Czechoslovakia.svg.png'
  },
  {
    tag: 'AUS',
    name: 'Austria',
    flagCode: 'at',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_Austria.svg/120px-Flag_of_Austria.svg.png'
  },
  {
    tag: 'SWI',
    name: 'Switzerland',
    flagCode: 'ch',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Switzerland.svg/120px-Flag_of_Switzerland.svg.png'
  },
  { tag: 'IRE', name: 'Ireland', flagCode: 'ie' },
  { tag: 'ALB', name: 'Albania', flagCode: 'al' },
  { tag: 'EST', name: 'Estonia', flagCode: 'ee' },
  { tag: 'LAT', name: 'Latvia', flagCode: 'lv' },
  { tag: 'LIT', name: 'Lithuania', flagCode: 'lt' },

  // Americas
  {
    tag: 'CAN',
    name: 'Canada',
    flagCode: 'ca',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Canadian_Red_Ensign_%281921%E2%80%931957%29.svg/120px-Canadian_Red_Ensign_%281921%E2%80%931957%29.svg.png'
  },
  { tag: 'MEX', name: 'Mexico', flagCode: 'mx' },
  { tag: 'BRA', name: 'Brazil', flagCode: 'br' },
  { tag: 'ARG', name: 'Argentina', flagCode: 'ar' },
  { tag: 'CHL', name: 'Chile', flagCode: 'cl' },
  { tag: 'PER', name: 'Peru', flagCode: 'pe' },
  { tag: 'BOL', name: 'Bolivia', flagCode: 'bo' },
  { tag: 'PAR', name: 'Paraguay', flagCode: 'py' },
  { tag: 'URG', name: 'Uruguay', flagCode: 'uy' },
  { tag: 'VEN', name: 'Venezuela', flagCode: 've' },
  { tag: 'COL', name: 'Colombia', flagCode: 'co' },
  { tag: 'ECU', name: 'Ecuador', flagCode: 'ec' },

  // Asia & Pacific
  {
    tag: 'MAN',
    name: 'Manchukuo',
    flagCode: 'cn',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Flag_of_Manchukuo.svg/120px-Flag_of_Manchukuo.svg.png'
  },
  {
    tag: 'PRC',
    name: 'Communist China',
    flagCode: 'cn',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Flag_of_the_Chinese_Communist_Party_%281945%E2%80%931996%29.svg/120px-Flag_of_the_Chinese_Communist_Party_%281945%E2%80%931996%29.svg.png'
  },
  {
    tag: 'SIA',
    name: 'Siam',
    flagCode: 'th',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_Thailand.svg/120px-Flag_of_Thailand.svg.png'
  },
  {
    tag: 'RAJ',
    name: 'British Raj',
    flagCode: 'in',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/British_Raj_Red_Ensign.svg/120px-British_Raj_Red_Ensign.svg.png'
  },
  {
    tag: 'AST',
    name: 'Australia',
    flagCode: 'au',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/120px-Flag_of_Australia_%28converted%29.svg.png'
  },
  {
    tag: 'NZL',
    name: 'New Zealand',
    flagCode: 'nz',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Flag_of_New_Zealand.svg/120px-Flag_of_New_Zealand.svg.png'
  },
  {
    tag: 'SAF',
    name: 'South Africa',
    flagCode: 'za',
    historicalFlagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_South_Africa_%281928%E2%80%931994%29.svg/120px-Flag_of_South_Africa_%281928%E2%80%931994%29.svg.png'
  },
  { tag: 'PHI', name: 'Philippines', flagCode: 'ph' },
  { tag: 'INS', name: 'Indonesia', flagCode: 'id' },
  { tag: 'MAL', name: 'Malaya', flagCode: 'my' },
  { tag: 'NEP', name: 'Nepal', flagCode: 'np' },
  { tag: 'TIB', name: 'Tibet', flagCode: 'cn' },
  { tag: 'AFG', name: 'Afghanistan', flagCode: 'af' },
  { tag: 'PER', name: 'Persia', flagCode: 'ir' },
  { tag: 'IRQ', name: 'Iraq', flagCode: 'iq' },
  { tag: 'SAU', name: 'Saudi Arabia', flagCode: 'sa' },
  { tag: 'YEM', name: 'Yemen', flagCode: 'ye' },
  { tag: 'OMA', name: 'Oman', flagCode: 'om' },

  // Africa & Middle East
  { tag: 'ETH', name: 'Ethiopia', flagCode: 'et' },
  { tag: 'LIB', name: 'Liberia', flagCode: 'lr' },
  { tag: 'EGY', name: 'Egypt', flagCode: 'eg' },
];

// Helper function to get flag URL from CDN (for backward compatibility)
export function getFlagUrl(flagCode: string, size: '4x3' | '1x1' = '4x3'): string {
  return `https://flagcdn.com/w80/${flagCode}.png`;
}

// Helper function to get WW2-era historical flag URL by nation tag
// Prioritizes historicalFlagUrl if available, falls back to modern flagcdn.com
export function getHistoricalFlagUrl(tag: string): string {
  const nation = getNationByTag(tag);
  if (!nation) {
    return getFlagUrl('de'); // Default to Germany if nation not found
  }

  // Use historical flag if available, otherwise fall back to modern flag
  return nation.historicalFlagUrl || getFlagUrl(nation.flagCode);
}

// Helper function to get nation by tag
export function getNationByTag(tag: string): HOI4Nation | undefined {
  return HOI4_NATIONS.find(nation => nation.tag === tag);
}

// Helper function to get nation by name
export function getNationByName(name: string): HOI4Nation | undefined {
  return HOI4_NATIONS.find(nation => nation.name.toLowerCase() === name.toLowerCase());
}
