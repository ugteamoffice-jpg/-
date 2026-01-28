import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
  // שיניתי את השם של הגרסה כדי שתדע שזה החדש
  console.log("🔥🔥🔥 VERSION 4 - FORCE BODY PARAM 🔥🔥🔥");

  try {
    const body = await request.json();
    
    if (!API_KEY) {
      console.error("❌ Missing API KEY");
      return NextResponse.json({ error: 'Missing Server API Key' }, { status: 500 });
    }

    // --- התיקון: אנחנו מכניסים את ההגדרה גם לכאן ---
    const teablePayload = {
      fieldKeyType: "id", // <--- הוספנו את זה כאן כדי לכפות על השרת להבין
      typecast: true,
      records: [{ fields: body.fields }]
    };

    // משאירים גם בכתובת ליתר ביטחון
    const endpoint = `${API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id`;
    
    console.log("🚀 Payload being sent:", JSON.stringify(teablePayload, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teablePayload),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Teable Error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json({ error: "Teable Error", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ SUCCESS! Record created.");
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
