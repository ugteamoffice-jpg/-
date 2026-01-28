import { NextResponse } from 'next/server';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4'; 
const API_KEY = process.env.TEABLE_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = searchParams.get('take') || '1000';

    const response = await fetch(`${API_URL}/api/table/${TABLE_ID}/record?take=${take}`, {
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

export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    
    if (!API_KEY) return NextResponse.json({ error: 'Missing Server API Key' }, { status: 500 });

    const teablePayload = {
      typecast: true,
      records: [{ fields: body.fields }]
    };

    // בניית הכתובת
    const endpoint = `${API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id`;
    
    // --- לוג קריטי: נדפיס בדיוק לאן אנחנו שולחים ---
    console.log("🚀 SENDING REQUEST TO:", endpoint);
    console.log("📦 PAYLOAD:", JSON.stringify(teablePayload, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teablePayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Teable Error Response:", JSON.stringify(errorData, null, 2));
      return NextResponse.json({ error: "Teable Error", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Success! Record Created:", data);
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Critical Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
