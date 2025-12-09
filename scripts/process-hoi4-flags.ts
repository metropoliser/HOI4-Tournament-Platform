import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import TGA from 'tga';

interface CountryMetadata {
  name: string;
  color: [number, number, number];
  graphicalCulture?: string;
  graphicalCulture2d?: string;
}

interface HOI4Nation {
  tag: string;
  name: string;
  color: [number, number, number];
  graphicalCulture?: string;
  flags: {
    base?: string;
    communism?: string;
    democratic?: string;
    fascism?: string;
    neutrality?: string;
    variants?: { [key: string]: string };
  };
}

const FLAGS_RAW_DIR = path.join(process.cwd(), 'app', 'flags_raw');
const COUNTRIES_DIR = path.join(FLAGS_RAW_DIR, 'countries');
const OUTPUT_FLAGS_DIR = path.join(process.cwd(), 'public', 'flags');
const OUTPUT_MAPPING_FILE = path.join(process.cwd(), 'app', 'lib', 'hoi4NationsComplete.ts');

// Map country names from metadata to HOI4 tags
const COUNTRY_NAME_TO_TAG: { [key: string]: string } = {
  'Germany': 'GER',
  'Soviet Union': 'SOV',
  'USA': 'USA',
  'United Kingdom': 'ENG',
  'France': 'FRA',
  'Italy': 'ITA',
  'Japan': 'JAP',
  'China': 'CHI',
  'Poland': 'POL',
  'Spain': 'SPR',
  'Portugal': 'POR',
  'Holland': 'HOL',
  'Belgium': 'BEL',
  'Luxemburg': 'LUX',
  'Sweden': 'SWE',
  'Norway': 'NOR',
  'Denmark': 'DEN',
  'Finland': 'FIN',
  'Romania': 'ROM',
  'Hungary': 'HUN',
  'Yugoslavia': 'YUG',
  'Greece': 'GRE',
  'Turkey': 'TUR',
  'Bulgaria': 'BUL',
  'Czechoslovakia': 'CZE',
  'Austria': 'AUS',
  'Switzerland': 'SWI',
  'Ireland': 'IRE',
  'Albania': 'ALB',
  'Estonia': 'EST',
  'Latvia': 'LAT',
  'Lithuania': 'LIT',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  'Brazil': 'BRA',
  'Argentina': 'ARG',
  'Chile': 'CHL',
  'Peru': 'PER',
  'Bolivia': 'BOL',
  'Paraguay': 'PAR',
  'Uruguay': 'URG',
  'Venezula': 'VEN',
  'Colombia': 'COL',
  'Ecuador': 'ECU',
  'Manchukou': 'MAN',
  'ComChina': 'PRC',
  'Siam': 'SIA',
  'British Raj': 'RAJ',
  'Australia': 'AST',
  'New Zealand': 'NZL',
  'South Africa': 'SAF',
  'Philippines': 'PHI',
  'Indonesia': 'INS',
  'Malaysia': 'MAL',
  'Nepal': 'NEP',
  'Tibet': 'TIB',
  'Afghanistan': 'AFG',
  'Persia': 'PER',
  'Iraq': 'IRQ',
  'Saudi Arabia': 'SAU',
  'Ethiopia': 'ETH',
  'Liberia': 'LIB',
  'Egypt': 'EGY',
  'Partisans': 'PAR',
  'Iceland': 'ICE',
  'Finland': 'FIN',
  'East Germany': 'DDR',
  'West Germany': 'WGR',
  'Korea': 'KOR',
  'Pakistan': 'PAK',
  'Israel': 'ISR',
  'Palestine': 'PAL',
  'Lebanon': 'LEB',
  'Jordan': 'JOR',
  'Syria': 'SYR',
  'Croatia': 'CRO',
  'Slovakia': 'SLO',
  'Serbia': 'SER',
  'Bosnia': 'BOS',
  'Montenegro': 'MNT',
  'Macedonia': 'MAC',
  'Slovenia': 'SLV',
  'Kosovo': 'KOS',
};

async function parseCountryMetadata(filePath: string): Promise<CountryMetadata | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let color: [number, number, number] = [128, 128, 128]; // Default gray
    let graphicalCulture: string | undefined;
    let graphicalCulture2d: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse color: color = { 64  160  167 }
      if (trimmed.startsWith('color = {')) {
        const colorMatch = trimmed.match(/color\s*=\s*\{\s*(\d+)\s+(\d+)\s+(\d+)\s*\}/);
        if (colorMatch) {
          color = [parseInt(colorMatch[1]), parseInt(colorMatch[2]), parseInt(colorMatch[3])];
        }
      }

      // Parse graphical culture
      if (trimmed.startsWith('graphical_culture =')) {
        graphicalCulture = trimmed.split('=')[1]?.trim();
      }

      if (trimmed.startsWith('graphical_culture_2d =')) {
        graphicalCulture2d = trimmed.split('=')[1]?.trim();
      }
    }

    const fileName = path.basename(filePath, '.txt');
    const tag = COUNTRY_NAME_TO_TAG[fileName];

    return {
      name: fileName,
      color,
      graphicalCulture,
      graphicalCulture2d,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

async function getAllFlags(): Promise<{ [tag: string]: string[] }> {
  const flagFiles = fs.readdirSync(FLAGS_RAW_DIR).filter(f => f.endsWith('.tga'));
  const flagsByTag: { [tag: string]: string[] } = {};

  for (const flagFile of flagFiles) {
    // Parse flag filename: TAG_ideology.tga or TAG.tga
    const baseName = path.basename(flagFile, '.tga');
    const parts = baseName.split('_');
    const tag = parts[0];

    if (!flagsByTag[tag]) {
      flagsByTag[tag] = [];
    }

    flagsByTag[tag].push(flagFile);
  }

  return flagsByTag;
}

async function convertTgaToPng(inputPath: string, outputPath: string): Promise<void> {
  try {
    // Read TGA file
    const tgaBuffer = fs.readFileSync(inputPath);
    const tga = new TGA(tgaBuffer);

    // Convert to PNG using Sharp
    await sharp(tga.pixels, {
      raw: {
        width: tga.width,
        height: tga.height,
        channels: 4 // RGBA
      }
    })
      .png()
      .resize(128, null, { // Resize to max width 128px, maintain aspect ratio
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFile(outputPath);
  } catch (error) {
    // Silently skip files that can't be converted
    // console.error(`Error converting ${inputPath}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting HOI4 flags processing...');

  // Create output directories
  if (!fs.existsSync(OUTPUT_FLAGS_DIR)) {
    fs.mkdirSync(OUTPUT_FLAGS_DIR, { recursive: true });
  }

  // Parse all country metadata
  console.log('📖 Parsing country metadata...');
  const metadataFiles = fs.readdirSync(COUNTRIES_DIR).filter(f => f.endsWith('.txt'));
  const metadataByName: { [name: string]: CountryMetadata } = {};

  for (const metadataFile of metadataFiles) {
    const filePath = path.join(COUNTRIES_DIR, metadataFile);
    const metadata = await parseCountryMetadata(filePath);
    if (metadata) {
      metadataByName[metadata.name] = metadata;
    }
  }

  console.log(`✅ Parsed ${Object.keys(metadataByName).length} country metadata files`);

  // Get all flags grouped by tag
  console.log('🏴 Finding all flag files...');
  const flagsByTag = await getAllFlags();
  const totalTags = Object.keys(flagsByTag).length;
  console.log(`✅ Found flags for ${totalTags} country tags`);

  // Convert flags and build mapping
  console.log('🎨 Converting TGA flags to PNG...');
  const nations: { [tag: string]: HOI4Nation } = {};
  let convertedCount = 0;

  for (const [tag, flags] of Object.entries(flagsByTag)) {
    // Find matching metadata
    let metadata: CountryMetadata | undefined;
    for (const [name, meta] of Object.entries(metadataByName)) {
      if (COUNTRY_NAME_TO_TAG[name] === tag) {
        metadata = meta;
        break;
      }
    }

    // Create nation entry
    const nation: HOI4Nation = {
      tag,
      name: metadata?.name || tag,
      color: metadata?.color || [128, 128, 128],
      graphicalCulture: metadata?.graphicalCulture,
      flags: {},
    };

    // Convert each flag
    for (const flagFile of flags) {
      const baseName = path.basename(flagFile, '.tga');
      const parts = baseName.split('_');

      // Determine flag type
      let flagType: string;
      if (parts.length === 1) {
        flagType = 'base';
      } else if (parts.length === 2 && ['communism', 'democratic', 'fascism', 'neutrality'].includes(parts[1])) {
        flagType = parts[1];
      } else {
        // Variant flag (e.g., GER_german_kaiserreich_neutrality)
        flagType = 'variant_' + parts.slice(1).join('_');
      }

      // Convert TGA to PNG
      const inputPath = path.join(FLAGS_RAW_DIR, flagFile);
      const outputFileName = `${baseName}.png`;
      const outputPath = path.join(OUTPUT_FLAGS_DIR, outputFileName);

      await convertTgaToPng(inputPath, outputPath);

      // Store flag path
      const flagUrl = `/flags/${outputFileName}`;
      if (flagType === 'base' || ['communism', 'democratic', 'fascism', 'neutrality'].includes(flagType)) {
        nation.flags[flagType as keyof typeof nation.flags] = flagUrl;
      } else {
        if (!nation.flags.variants) {
          nation.flags.variants = {};
        }
        nation.flags.variants[flagType.replace('variant_', '')] = flagUrl;
      }

      convertedCount++;
      if (convertedCount % 100 === 0) {
        console.log(`   Converted ${convertedCount} flags...`);
      }
    }

    nations[tag] = nation;
  }

  console.log(`✅ Converted ${convertedCount} flags to PNG`);

  // Generate TypeScript mapping file
  console.log('📝 Generating TypeScript mapping file...');
  const tsContent = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from HOI4 game files on ${new Date().toISOString()}
// Contains all nations from Hearts of Iron 4 with their flags and metadata

export interface HOI4Nation {
  tag: string; // 3-letter country tag
  name: string; // Country name
  color: [number, number, number]; // RGB color
  graphicalCulture?: string; // Graphical culture
  flags: {
    base?: string; // Base flag
    communism?: string; // Communist ideology flag
    democratic?: string; // Democratic ideology flag
    fascism?: string; // Fascist ideology flag
    neutrality?: string; // Neutrality ideology flag
    variants?: { [key: string]: string }; // Special variant flags
  };
}

export const HOI4_NATIONS: { [tag: string]: HOI4Nation } = ${JSON.stringify(nations, null, 2)};

// Helper function to get nation by tag
export function getNationByTag(tag: string): HOI4Nation | undefined {
  return HOI4_NATIONS[tag];
}

// Helper function to get flag URL by tag and ideology
export function getFlagUrl(tag: string, ideology?: 'communism' | 'democratic' | 'fascism' | 'neutrality'): string | undefined {
  const nation = getNationByTag(tag);
  if (!nation) return undefined;

  if (ideology && nation.flags[ideology]) {
    return nation.flags[ideology];
  }

  return nation.flags.base || nation.flags.neutrality || nation.flags.democratic;
}

// Get all available nations as an array
export function getAllNations(): HOI4Nation[] {
  return Object.values(HOI4_NATIONS);
}

// Get nations sorted by name
export function getNationsSortedByName(): HOI4Nation[] {
  return getAllNations().sort((a, b) => a.name.localeCompare(b.name));
}
`;

  fs.writeFileSync(OUTPUT_MAPPING_FILE, tsContent, 'utf-8');
  console.log(`✅ Generated mapping file: ${OUTPUT_MAPPING_FILE}`);

  console.log('\n🎉 Processing complete!');
  console.log(`   Total nations: ${Object.keys(nations).length}`);
  console.log(`   Total flags converted: ${convertedCount}`);
  console.log(`   Output directory: ${OUTPUT_FLAGS_DIR}`);
}

main().catch(console.error);
