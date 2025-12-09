import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';
import { validateNewsTitle, validateNewsExcerpt, validateNewsContent, validateNewsCategory } from '@/app/lib/validation';

// GET /api/news - Get all news (published only for non-admins)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = session?.user && ['admin', 'matchmaker'].includes((session.user as any)?.role);

    // If admin, show all news. Otherwise, only published news
    const query = isAdmin
      ? 'SELECT * FROM news ORDER BY created_at DESC'
      : 'SELECT * FROM news WHERE published = 1 ORDER BY created_at DESC';

    const result = await clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const news = await result.json();

    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST /api/news - Create new news item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'matchmaker'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, excerpt, content, category, published } = body;

    if (!title || !excerpt || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY: Validate news content
    const titleValidation = validateNewsTitle(title);
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    const excerptValidation = validateNewsExcerpt(excerpt);
    if (!excerptValidation.valid) {
      return NextResponse.json({ error: excerptValidation.error }, { status: 400 });
    }

    const contentValidation = validateNewsContent(content);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    if (!validateNewsCategory(category)) {
      return NextResponse.json({
        error: 'Invalid category. Must be one of: Tournament, Update, Announcement'
      }, { status: 400 });
    }

    const newsId = randomUUID();
    const user = session.user as any;

    await clickhouse.command({
      query: `
        INSERT INTO news (id, title, excerpt, content, category, published, created_by_uuid, created_by_name)
        VALUES ({id:String}, {title:String}, {excerpt:String}, {content:String}, {category:String}, {published:UInt8}, {createdByUuid:String}, {createdByName:String})
      `,
      query_params: {
        id: newsId,
        title,
        excerpt,
        content,
        category,
        published: published ? 1 : 0,
        createdByUuid: user.id,
        createdByName: user.name || 'Unknown',
      },
    });

    return NextResponse.json({ success: true, id: newsId });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}
