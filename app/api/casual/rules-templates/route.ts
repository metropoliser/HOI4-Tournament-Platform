import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';
import { sanitizeHTML, validateTemplateName } from '@/app/lib/validation';

// GET /api/casual/rules-templates - Get all rules templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Matchmakers and admins can view templates (needed for creating games)
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin or Matchmaker only' }, { status: 403 });
    }

    // Ensure table exists
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS rules_templates (
          id String,
          name String,
          rules String,
          created_by_uuid String,
          created_by_name String,
          created_at DateTime DEFAULT now(),
          INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    const result = await clickhouse.query({
      query: 'SELECT * FROM rules_templates ORDER BY created_at DESC',
      format: 'JSONEachRow',
    });
    const templates = await result.json();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching rules templates:', error);
    return NextResponse.json({ error: 'Failed to fetch rules templates' }, { status: 500 });
  }
}

// POST /api/casual/rules-templates - Create a new rules template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create rules templates
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, rules } = body;

    // Validate template name
    const nameValidation = validateTemplateName(name);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    // Validate and sanitize rules
    if (!rules) {
      return NextResponse.json({ error: 'Rules are required' }, { status: 400 });
    }
    const sanitizedRules = sanitizeHTML(rules);

    const templateId = randomUUID();
    const user = session.user as any;

    // Ensure table exists
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS rules_templates (
          id String,
          name String,
          rules String,
          created_by_uuid String,
          created_by_name String,
          created_at DateTime DEFAULT now(),
          INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    // Create the template
    await clickhouse.command({
      query: `
        INSERT INTO rules_templates
        (id, name, rules, created_by_uuid, created_by_name)
        VALUES ({id:String}, {name:String}, {rules:String}, {createdByUuid:String}, {createdByName:String})
      `,
      query_params: {
        id: templateId,
        name: nameValidation.sanitized,
        rules: sanitizedRules,
        createdByUuid: user.id,
        createdByName: user.name || 'Unknown',
      },
    });

    return NextResponse.json({
      success: true,
      templateId,
      message: 'Rules template created successfully'
    });
  } catch (error) {
    console.error('Error creating rules template:', error);
    return NextResponse.json({ error: 'Failed to create rules template' }, { status: 500 });
  }
}
