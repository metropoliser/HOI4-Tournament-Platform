import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { sanitizeHTML, validateTemplateName } from '@/app/lib/validation';

// GET /api/casual/rules-templates/[id] - Get a specific rules template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Matchmakers and admins can view templates
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin or Matchmaker only' }, { status: 403 });
    }

    const { id: templateId } = await params;

    const result = await clickhouse.query({
      query: 'SELECT * FROM rules_templates WHERE id = {templateId:String}',
      query_params: { templateId },
      format: 'JSONEachRow',
    });

    const templates = await result.json();

    if (templates.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template: templates[0] });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PATCH /api/casual/rules-templates/[id] - Update a rules template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update rules templates
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id: templateId } = await params;
    const body = await request.json();
    const { name, rules } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const params_obj: any = { templateId };

    if (name !== undefined) {
      const nameValidation = validateTemplateName(name);
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error }, { status: 400 });
      }
      updates.push('name = {name:String}');
      params_obj.name = nameValidation.sanitized;
    }

    if (rules !== undefined) {
      if (!rules) {
        return NextResponse.json({ error: 'Rules cannot be empty' }, { status: 400 });
      }
      const sanitizedRules = sanitizeHTML(rules);
      updates.push('rules = {rules:String}');
      params_obj.rules = sanitizedRules;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await clickhouse.command({
      query: `
        ALTER TABLE rules_templates
        UPDATE ${updates.join(', ')}
        WHERE id = {templateId:String}
      `,
      query_params: params_obj,
    });

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/casual/rules-templates/[id] - Delete a rules template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete rules templates
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id: templateId } = await params;

    await clickhouse.command({
      query: `
        ALTER TABLE rules_templates
        DELETE WHERE id = {templateId:String}
      `,
      query_params: { templateId },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
