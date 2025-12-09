import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// POST /api/casual/steam-workshop - Fetch Steam Workshop modpack data
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication to prevent SSRF attacks
    const session = await auth();
    if (!session?.user || !['admin', 'matchmaker'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    // SECURITY: Strict URL validation to prevent SSRF
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Only allow specific Steam Workshop URLs
    const allowedPattern = /^https?:\/\/(www\.)?steamcommunity\.com\/sharedfiles\/filedetails\/\?id=\d+/;
    if (!allowedPattern.test(url)) {
      return NextResponse.json({
        error: 'Invalid Steam Workshop URL. Must be a valid workshop item URL.'
      }, { status: 400 });
    }

    // Fetch the Steam Workshop page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Steam Workshop page');
    }

    const html = await response.text();

    // Extract title - try multiple patterns
    let title = 'Steam Workshop Modpack';
    const titlePatterns = [
      /<div class="workshopItemTitle">([^<]+)<\/div>/,
      /<title>Steam Workshop::([^<]+)<\/title>/,
      /<h1[^>]*>([^<]+)<\/h1>/
    ];
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1].trim()) {
        title = match[1].trim();
        break;
      }
    }

    // Extract creator/author - try multiple patterns
    let createdBy = 'Unknown';
    const creatorPatterns = [
      /<div class="friendBlockContent">\s*([^<\n]+)\s*<\/div>/,
      /workshopItemAuthorName">\s*<a[^>]*>([^<]+)<\/a>/,
      /by\s+<a[^>]*class="[^"]*hoverunderline[^"]*"[^>]*>([^<]+)<\/a>/i,
    ];
    for (const pattern of creatorPatterns) {
      const match = html.match(pattern);
      if (match && match[1].trim() && match[1].trim() !== '') {
        createdBy = match[1].trim();
        break;
      }
    }

    // Extract dates from details stats
    const detailsStatsMatch = html.match(/<div class="detailsStatsContainerRight">([\s\S]*?)<\/div>\s*<\/div>/);
    let createdDate = 'Unknown';
    let updatedDate = 'Unknown';

    if (detailsStatsMatch) {
      const statsHtml = detailsStatsMatch[1];

      // Extract posted date
      const postedMatch = statsHtml.match(/Posted[^<]*<\/div>\s*<div class="detailsStatRight">([^<]+)<\/div>/i);
      if (postedMatch) {
        createdDate = postedMatch[1].trim();
      }

      // Extract updated date
      const updatedMatch = statsHtml.match(/Updated[^<]*<\/div>\s*<div class="detailsStatRight">([^<]+)<\/div>/i);
      if (updatedMatch) {
        updatedDate = updatedMatch[1].trim();
      } else {
        updatedDate = createdDate; // If no update date, use creation date
      }
    }

    // If dates still not found, try alternative patterns
    if (createdDate === 'Unknown') {
      const dateMatch = html.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4}(?:\s+@\s+\d{1,2}:\d{2}[ap]m)?)/i);
      if (dateMatch) {
        createdDate = dateMatch[1].trim();
        updatedDate = createdDate;
      }
    }

    // Extract preview image - try multiple patterns
    let previewUrl = '';
    const imagePatterns = [
      /<meta property="og:image" content="([^"]+)"/i,
      /<img[^>]+id="previewImage"[^>]+src="([^"]+)"/i,
      /<img[^>]+id="previewImageMain"[^>]+src="([^"]+)"/i,
    ];
    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        previewUrl = match[1];
        break;
      }
    }

    return NextResponse.json({
      title,
      createdBy,
      createdDate,
      updatedDate,
      previewUrl,
    });
  } catch (error) {
    console.error('Error fetching Steam Workshop data:', error);

    // Return fallback data instead of error
    return NextResponse.json({
      title: 'Steam Workshop Modpack',
      createdBy: 'Unknown',
      createdDate: 'Unknown',
      updatedDate: 'Unknown',
      previewUrl: '',
    });
  }
}
