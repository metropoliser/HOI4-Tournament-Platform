import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { validateNewsTitle, validateNewsExcerpt, validateNewsContent, validateNewsCategory } from '@/app/lib/validation';

// GET /api/news/[id] - Get single news item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await clickhouse.query({
      query: 'SELECT * FROM news WHERE id = {id:String}',
      query_params: { id },
      format: 'JSONEachRow',
    });

    const news = await result.json() as any[];

    if (news.length === 0) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json(news[0]);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// PUT /api/news/[id] - Update news item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'matchmaker'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    await clickhouse.command({
      query: `
        ALTER TABLE news
        UPDATE
          title = {title:String},
          excerpt = {excerpt:String},
          content = {content:String},
          category = {category:String},
          published = {published:UInt8},
          updated_at = now()
        WHERE id = {id:String}
        SETTINGS mutations_sync = 2
      `,
      query_params: {
        id,
        title,
        excerpt,
        content,
        category,
        published: published ? 1 : 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

// DELETE /api/news/[id] - Delete news item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'matchmaker'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await clickhouse.command({
      query: 'ALTER TABLE news DELETE WHERE id = {id:String} SETTINGS mutations_sync = 2',
      query_params: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
