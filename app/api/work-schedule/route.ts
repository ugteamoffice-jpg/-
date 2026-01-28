import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4';
const API_KEY = process.env.TEABLE_API_KEY;

// --- GET משודרג: מעביר את כל הסינונים ל-Teable ---
export async function GET(request: Request) {
  try {
    // לוקח את כל הפרמטרים שהגיעו מהדפדפן (למשל ?date=2024-01-01 או ?filter=...)
    const { searchParams } = new URL(request.url);
    
    // אם לא נשלח 'take', נגדיר ברירת מחדל של 1000
    if (!searchParams.has('take')) {
      searchParams.set('take', '1000');
    }

    // בונה את הכתובת ל-Teable עם כל הסינונים המקוריים
    const endpoint = `${API_URL}/api/table/${TABLE_ID}/record?${searchParams.toString()}`;

    const response = await fetch(endpoint, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}` 
      },
      cache: 'no-store'
    });

    if (!response.ok) return NextResponse.json({ error: 'Failed' }, { status: response.status });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST (נשאר ללא שינוי - גרסה 4 שעובדת) ---
export async function POST(request: Request) {
  console.log("🔥🔥🔥 VERSION 4 (KEEPING IT) - POST REQUEST 🔥🔥🔥");

  try {
    const body = await request.json();
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'Missing Server API Key' }, { status: 500 });
    }

    const teablePayload = {
      fieldKeyType: "id", 
      typecast: true,
      records: [{ fields: body.fields }]
    };

    const endpoint = `${API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id`;
    
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
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
