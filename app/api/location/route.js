import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const { tracking_code, latitude, longitude, accuracy, consent_given } = await request.json();

    // Validate required fields
    if (!tracking_code || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate consent
    if (!consent_given) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Find the delivery
    const { rows: deliveryRows } = await sql`
      SELECT id, status FROM deliveries WHERE tracking_code = ${tracking_code}
    `;

    if (deliveryRows.length === 0) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const delivery = deliveryRows[0];

    if (delivery.status === 'location_received') {
      return NextResponse.json({ error: 'Location already shared' }, { status: 400 });
    }

    // Get client info
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
    const userAgent = headersList.get('user-agent') || '';

    // Generate Google Maps link
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Insert location
    await sql`
      INSERT INTO locations (delivery_id, latitude, longitude, accuracy, consent_given, ip_address, user_agent, google_maps_link)
      VALUES (${delivery.id}, ${latitude}, ${longitude}, ${accuracy}, ${consent_given}, ${ipAddress}, ${userAgent}, ${googleMapsLink})
    `;

    // Update delivery status
    await sql`
      UPDATE deliveries SET status = 'location_received', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${delivery.id}
    `;

    return NextResponse.json({ success: true, message: 'Location saved successfully' });
  } catch (error) {
    console.error('Error saving location:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
