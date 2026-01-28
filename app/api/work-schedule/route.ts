import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4';
const API_KEY = process.env.TEABLE_API_KEY;
const DATE_FIELD_ID = 'fldvNsQbfzMWTc7jakp';

// --- GET: שליפה ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = searchParams.get('take') || '1000';
    const dateParam = searchParams.get('date'); 

    let endpoint = `${API_URL}/api/table/${TABLE_ID}/record?take=${take}&fieldKeyType=id`;

    if (dateParam) {
      const filterObj = {
        operator: "and",
        filterSet: [{ fieldId: DATE_FIELD_ID, operator: "is", value: dateParam }]
      };
      endpoint += `&filter=${encodeURIComponent(JSON.stringify(filterObj))}`;
    }

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      cache: 'no-store'
    });

    if (!response.ok) return NextResponse.json({ error: 'Failed' }, { status: response.status });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST: יצירה ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!API_KEY) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

    const response = await fetch(`${API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldKeyType: "id", 
        typecast: true,
        records: [{ fields: body.fields }]
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: "Teable Error", details: errorData }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- PATCH: עריכה ---
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { recordId, fields } = body;

    if (!API_KEY) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

    const response = await fetch(`${API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldKeyType: "id",
        typecast: true,
        records: [{ id: recordId, fields: fields }]
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: "Update Failed", details: errorData }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE: מחיקה (התיקון) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (!API_KEY) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    if (!recordId) return NextResponse.json({ error: 'Missing Record ID' }, { status: 400 });

    console.log(`🗑️ Deleting record ${recordId}...`);

    // התיקון: שליחת ה-ID ישירות ב-URL ל-Teable
    const endpoint = `${API_URL}/api/table/${TABLE_ID}/record?recordIds=${recordId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Delete Error:", errorData);
      return NextResponse.json({ error: "Delete Failed", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
