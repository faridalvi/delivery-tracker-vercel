import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// GET all deliveries
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT
        d.id,
        d.tracking_code,
        d.recipient_name,
        d.recipient_phone,
        d.package_description,
        d.status,
        d.created_at,
        l.latitude,
        l.longitude,
        l.accuracy,
        l.consent_given,
        l.google_maps_link,
        l.created_at as location_time
      FROM deliveries d
      LEFT JOIN locations l ON d.id = l.delivery_id
      ORDER BY d.created_at DESC
    `;

    return NextResponse.json({ deliveries: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST create new delivery
export async function POST(request) {
  try {
    const { name, phone, description } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const trackingCode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const { rows } = await sql`
      INSERT INTO deliveries (tracking_code, recipient_name, recipient_phone, package_description)
      VALUES (${trackingCode}, ${name}, ${phone}, ${description || ''})
      RETURNING id, tracking_code
    `;

    return NextResponse.json({
      success: true,
      trackingCode: rows[0].tracking_code,
      id: rows[0].id
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create delivery' }, { status: 500 });
  }
}

// DELETE a delivery
export async function DELETE(request) {
  try {
    const { id } = await request.json();

    await sql`DELETE FROM deliveries WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
