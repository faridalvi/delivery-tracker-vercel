import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET single delivery by tracking code
export async function GET(request, { params }) {
  try {
    const { code } = params;

    const { rows } = await sql`
      SELECT id, recipient_name, package_description, status
      FROM deliveries
      WHERE tracking_code = ${code}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    return NextResponse.json({ delivery: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
