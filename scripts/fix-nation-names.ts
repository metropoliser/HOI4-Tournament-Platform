import fs from 'fs';
import path from 'path';

const COUNTRIES_DIR = path.join(process.cwd(), 'app', 'flags_raw', 'countries');
const OUTPUT_MAPPING_FILE = path.join(process.cwd(), 'app', 'lib', 'hoi4NationsComplete.ts');

// Build tag-to-name mapping from the metadata files
async function buildTagToNameMapping(): Promise<{ [tag: string]: string }> {
  const metadataFiles = fs.readdirSync(COUNTRIES_DIR).filter(f => f.endsWith('.txt'));
  const tagToName: { [tag: string]: string } = {};

  // Manual mapping of tags to their file names (from the user's list)
  const manualMapping: { [tag: string]: string } = {
    'GER': 'Germany', 'ENG': 'United Kingdom', 'SOV': 'Soviet Union',
    'SWE': 'Sweden', 'FRA': 'France', 'LUX': 'Luxemburg', 'BEL': 'Belgium',
    'HOL': 'Holland', 'CZE': 'Czechoslovakia', 'POL': 'Poland', 'AUS': 'Austria',
    'LIT': 'Lithuania', 'EST': 'Estonia', 'LAT': 'Latvia', 'SPR': 'Spain',
    'ITA': 'Italy', 'ROM': 'Romania', 'YUG': 'Yugoslavia', 'SER': 'Serbia',
    'SWI': 'Switzerland', 'TUR': 'Turkey', 'GRE': 'Greece', 'ALB': 'Albania',
    'NOR': 'Norway', 'DEN': 'Denmark', 'BUL': 'Bulgaria', 'POR': 'Portugal',
    'FIN': 'Finland', 'IRE': 'Ireland', 'HUN': 'Hungary', 'AFG': 'Afghanistan',
    'ARG': 'Argentina', 'AST': 'Australia', 'BHU': 'Bhutan', 'BOL': 'Bolivia',
    'BRA': 'Brazil', 'CAN': 'Canada', 'CHI': 'China', 'CHL': 'Chile',
    'COL': 'Colombia', 'COS': 'Costa Rica', 'ECU': 'Ecuador', 'ELS': 'El Salvador',
    'ETH': 'Ethiopia', 'GUA': 'Guatemla', 'HON': 'Honduras', 'IRQ': 'Iraq',
    'JAP': 'Japan', 'KOR': 'Korea', 'LIB': 'Liberia', 'MEX': 'Mexico',
    'MEN': 'Mengkukuo', 'NEP': 'Nepal', 'NIC': 'Nicaragua', 'NZL': 'New Zealand',
    'PAN': 'Panama', 'PER': 'Persia', 'PHI': 'Philippines', 'PRU': 'Peru',
    'SAF': 'South Africa', 'SAU': 'Saudi Arabia', 'SIA': 'Siam', 'SIK': 'Sinkiang',
    'TIB': 'Tibet', 'URG': 'Uruguay', 'VEN': 'Venezula', 'YUN': 'Yunnan',
    'USA': 'USA', 'MON': 'Mongolia', 'TAN': 'Tannu Tuva', 'PAR': 'Paraguay',
    'CUB': 'Cuba', 'DOM': 'Dominican Republic', 'HAI': 'Haiti', 'YEM': 'Yeman',
    'OMA': 'Oman', 'SLO': 'Slovakia', 'RAJ': 'British Raj', 'CRO': 'Croatia',
    'GXC': 'Guangxi', 'PRC': 'ComChina', 'SHX': 'Shanxi', 'XSM': 'Xibei San Ma',
    'ICE': 'Iceland', 'LEB': 'Lebanon', 'JOR': 'Jordan', 'SYR': 'Syria',
    'EGY': 'Egypt', 'LBA': 'Libya', 'WGR': 'West Germany', 'DDR': 'East Germany',
    'PAL': 'Palestine', 'ISR': 'Israel', 'VIN': 'Vietnam', 'CAM': 'Cambodia',
    'MAL': 'Malaysia', 'INS': 'Indonesia', 'LAO': 'Laos', 'MNT': 'Montenegro',
    'UKR': 'Ukraine', 'GEO': 'Georgia', 'KAZ': 'Kazakhstan', 'AZR': 'Azerbaijan',
    'ARM': 'Armenia', 'BLR': 'Belarus', 'ANG': 'Angola', 'MZB': 'Mozambique',
    'ZIM': 'Zimbabwe', 'COG': 'Congo', 'KEN': 'Kenya', 'PAK': 'Pakistan',
    'BOT': 'Botswana', 'MAN': 'Manchukou', 'BAH': 'Bahamas', 'BAN': 'Bangladesh',
    'BLZ': 'Belize', 'BRM': 'Burma', 'CRC': 'Curacao', 'GDL': 'Guadeloupe',
    'GYA': 'Guyana', 'JAM': 'Jamaica', 'JAN': 'Jan Mayen', 'KYR': 'Kyrgyzstan',
    'MAD': 'Madagascar', 'MOL': 'Moldova', 'PNG': 'Papua New Guinea', 'PUE': 'Puerto Rico',
    'QAT': 'Qatar', 'SCO': 'Scotland', 'SRL': 'Sri Lanka', 'SUR': 'Suriname',
    'TAJ': 'Tajikistan', 'TRI': 'Trinidad and Tobago', 'TMS': 'Turkmenistan',
    'UAE': 'United Arab Emirates', 'UZB': 'Uzbekistan', 'KUW': 'Kuwait',
    'CYP': 'Cyprus', 'MLT': 'Malta', 'ALG': 'Algeria', 'MOR': 'Morocco',
    'TUN': 'Tunisia', 'SUD': 'Sudan', 'ERI': 'Eritrea', 'DJI': 'Djibouti',
    'SOM': 'Somalia', 'UGA': 'Uganda', 'RWA': 'Rwanda', 'BRD': 'Burundi',
    'TZN': 'Tanzania', 'ZAM': 'Zambia', 'MLW': 'Malawi', 'GAB': 'Gabon',
    'RCG': 'Republic of Congo', 'EQG': 'Equatorial Guinea', 'CMR': 'Cameroon',
    'CAR': 'Central African Republic', 'CHA': 'Chad', 'NGA': 'Nigeria',
    'DAH': 'Dahomey', 'TOG': 'Togo', 'GHA': 'Ghana', 'IVO': 'Ivory Coast',
    'VOL': 'Upper Volta', 'MLI': 'Mali', 'SIE': 'Sierra Leone', 'GNA': 'Guinea',
    'GNB': 'Guinea-Bissau', 'SEN': 'Senegal', 'GAM': 'Gambia', 'WLS': 'Wales',
    'NGR': 'Niger', 'CSA': 'CSA', 'USB': 'USB', 'MRT': 'Mauritania',
    'NMB': 'Namibia', 'WES': 'Western Sahara', 'BAS': 'British Antilles',
    'CAY': 'Cayenne', 'MLD': 'Maldives', 'FIJ': 'Fiji', 'FSM': 'Micronesia',
    'TAH': 'Tahiti', 'GUM': 'Guam', 'SOL': 'Solomon', 'SAM': 'Samoa',
    'HAW': 'Hawaii', 'SLV': 'Slovenia', 'BOS': 'Bosnia', 'HRZ': 'Herzegovina',
    'MAC': 'Macedonia', 'NIR': 'Northern Ireland', 'BAY': 'Bavaria',
    'MEK': 'Mecklenburg', 'PRE': 'Prussia', 'SAX': 'Saxony', 'HAN': 'Hanover',
    'WUR': 'Wurtemberg', 'SHL': 'Schleswig-Holstein', 'CAT': 'Catalonia',
    'NAV': 'Navarra', 'GLC': 'Galicia', 'ADU': 'Andalusia', 'BRI': 'Brittany',
    'OCC': 'Occitania', 'COR': 'Corsica', 'KUR': 'Kurdistan', 'TRA': 'Transylvania',
    'DNZ': 'Danzig', 'SIL': 'Silesia', 'KSH': 'Kashubia', 'DON': 'Don Republic',
    'KUB': 'Kuban Republic', 'BUK': 'Bukharan Republic', 'ALT': 'Altay',
    'KAL': 'Kalmykia', 'KAR': 'Karelia', 'CRI': 'Crimea', 'TAT': 'Tatarstan',
    'CIN': 'Chechnya Ingushetia', 'DAG': 'Dagestan', 'BYA': 'Buryatia',
    'CKK': 'Chukotka', 'FER': 'Fareastern Republic', 'YAK': 'Yakutia',
    'VLA': 'Vladivostok', 'KKP': 'Karakalpakstan', 'YAM': 'Yamalia',
    'TAY': 'Taymyria', 'OVO': 'Ostyak Vogulia', 'NEN': 'Nenetsia', 'KOM': 'Komi',
    'ABK': 'Abkhazia', 'KBK': 'Kabardino Balkaria', 'NOA': 'North Ossetia',
    'VGE': 'Volga Germany', 'BSK': 'Bashkortostan', 'KHI': 'Khiva',
    'UDM': 'Udmurtia', 'CHU': 'Chuvashia', 'MEL': 'Mariel', 'RIF': 'Rif',
    'HAR': 'Harar', 'TIG': 'Tigray', 'AFA': 'Afar', 'BEG': 'Benishangul-Gumuz',
    'GBA': 'Gambela', 'SID': 'Sidamo', 'ORO': 'Oromo', 'QEM': 'Qemant',
    'KHA': 'Khakassia', 'AOI': 'Italian East Africa', 'LBV': 'Lombardy Venetia',
    'PAP': 'Papal States', 'TOS': 'Tuscany', 'SPM': 'Sardinia Piedmont',
    'TTS': 'The Two Sicilies', 'SMI': 'Sami', 'GRN': 'Greenland', 'RAP': 'Rapa Nui',
    'YUC': 'Yucatan', 'RIG': 'Rio Grande', 'QUE': 'Quebec', 'KAT': 'Katanga',
    'BIA': 'Biafra', 'WLA': 'Welsh Argentina', 'CBV': 'Cabo Verde', 'BAR': 'Barotseland',
    'EVE': 'Evenkia', 'SOK': 'Sokoto', 'THU': 'Thuringia', 'HES': 'Hesse',
    'RHI': 'Rhineland', 'UBD': 'United Baltic Duchy', 'KOS': 'Kosovo',
    'RKB': 'Reichskommisariat Belgien', 'RKN': 'Reichskommisariat Niederlande',
    'RKG': 'Reichskommisariat Norwegen', 'RKU': 'Reichskommisariat Ukraine',
    'RKO': 'Reichskommisariat Ostland', 'RKK': 'Reichskommisariat Kaukasien',
    'RKT': 'Reichskommisariat Turkestan', 'RKM': 'Reichskommisariat Moskowien',
    'RKL': 'Reichskommisariat Urals', 'GEN': 'Generalgouvernement',
    'RKH': 'Bohmen Mahren', 'RKI': 'Reichskommisariat Iberien',
    'RKC': 'Reichskommisariat Balkan', 'RGB': 'Reichskommisariat Grossbritannien',
    'RKA': 'Reichskommisariat Mittelafrika', 'RNA': 'Reichskommisariat Nordafrika',
    'RKV': 'Reichskommisariat Klein Venedig', 'RAN': 'Reichskommisariat Anden',
    'RCO': 'Reichskommisariat Kolumbus', 'RUS': 'Reichskommisariat Nordamerika',
    'RHD': 'Reichskommisariat Grosshindustan', 'RAR': 'Reichskommisariat Arabien',
    'ROA': 'Reichskommisariat Ostasien', 'RAA': 'Reichskommisariat Australasien',
    'GAR': 'Guarani', 'INC': 'Inca', 'MIS': 'Miskito', 'MAY': 'Maya',
    'INU': 'Inuit', 'CHR': 'Charrua', 'ITZ': 'Itza', 'NAH': 'Nahua',
    'IAS': 'Isthmo Amerindia', 'DIP': 'Partisans', 'PSH': 'Pashtunistan',
    'HYD': 'Hyderabad', 'MYS': 'Mysore', 'RJP': 'Rajputana',
    'CIP': 'Central Indian Provinces', 'RAS': 'Madras States',
    'NWF': 'North Western Frontier States', 'KAS': 'Kashmir', 'MPU': 'Manipur',
    'WIS': 'Western Indian States', 'KOL': 'Kolhapur and Deccan States',
    'KHL': 'Khalistan', 'SIN': 'Sindh', 'KLT': 'Kalat', 'SKK': 'Sikkim',
    'FSA': 'Federation of South Arabia', 'ASY': 'Assyria', 'BHR': 'Bahrain',
    'IMO': 'Omani Imamate', 'BLC': 'Balochistan', 'EZO': 'Ezo Republic',
    'OKN': 'Okinawa', 'ANU': 'Ainu', 'PLU': 'Palau', 'FOR': 'Formosa',
    'TML': 'Timor Leste', 'CHM': 'Champa', 'SNG': 'Singapore', 'SAR': 'Sarawak',
    'SAB': 'Sabah', 'BRN': 'Brunei', 'WPG': 'West Papua', 'KUM': 'Kumul Khanate',
    'GSM': 'Gansu Ma', 'GDC': 'Guangdong', 'KHM': 'Khotan Ma', 'NXM': 'Ningxia Ma',
    'SND': 'Shandong', 'SIC': 'Sichuan', 'XIC': 'Xian',
    'RNG': 'Reorganized National Government', 'PSR': 'Philippine Second Republic',
    'HBC': 'Hebei-Chahar'
  };

  for (const [tag, fileName] of Object.entries(manualMapping)) {
    tagToName[tag] = fileName;
  }

  console.log(`✅ Built tag-to-name mapping for ${Object.keys(tagToName).length} countries`);
  return tagToName;
}

async function fixNationNames() {
  console.log('🔧 Fixing nation names in mapping file...');

  // Read current mapping file
  const content = fs.readFileSync(OUTPUT_MAPPING_FILE, 'utf-8');

  // Build proper tag-to-name mapping
  const tagToName = await buildTagToNameMapping();

  // Parse the JSON from the file
  const jsonMatch = content.match(/export const HOI4_NATIONS: \{ \[tag: string\]: HOI4Nation \} = ({[\s\S]*?});/);
  if (!jsonMatch) {
    console.error('❌ Could not find nations object in file');
    return;
  }

  const nationsObj = JSON.parse(jsonMatch[1]);

  // Update names and filter out dynamic countries
  let updated = 0;
  let removed = 0;
  const updatedNations: any = {};

  for (const [tag, nation] of Object.entries(nationsObj) as [string, any][]) {
    // Skip dynamic countries (D01-D99)
    if (/^D\d{2}$/.test(tag)) {
      removed++;
      continue;
    }

    // Update name if we have a better one
    if (tagToName[tag]) {
      nation.name = tagToName[tag];
      updated++;
    }

    updatedNations[tag] = nation;
  }

  // Regenerate the file with updated names
  const newContent = content.replace(
    /export const HOI4_NATIONS: \{ \[tag: string\]: HOI4Nation \} = {[\s\S]*?};/,
    `export const HOI4_NATIONS: { [tag: string]: HOI4Nation } = ${JSON.stringify(updatedNations, null, 2)};`
  );

  fs.writeFileSync(OUTPUT_MAPPING_FILE, newContent, 'utf-8');

  console.log(`✅ Updated ${updated} nation names`);
  console.log(`✅ Removed ${removed} dynamic countries (D01-D99)`);
  console.log(`✅ Total nations: ${Object.keys(updatedNations).length}`);
}

fixNationNames().catch(console.error);
