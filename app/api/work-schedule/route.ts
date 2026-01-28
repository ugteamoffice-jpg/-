import { NextResponse } from 'next/server';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4'; // ה-ID של טבלת סידור עבודה
const API_KEY = process.env.TEABLE_API_KEY;

// קריאת נתונים (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = searchParams.get('take') || '1000';

    const response = await fetch(`${API_URL}/api/table/${TABLE_ID}/record?take=${take}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// יצירת רשומה (POST) - התיקון נמצא כאן
export async function POST(request: Request) {
  try {
    const body = await request.json(); // אנחנו מקבלים { fields: {...} } מהלקוח
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'Missing Server API Key' }, { status: 500 });
    }

    // --- התיקון: עטיפת הנתונים במבנה ש-Teable דורש ---
    const teablePayload = {
      typecast: true, // מאפשר המרה חכמה של שדות
      records: [
        {
          fields: body.fields 
        }
      ]
    };

    console.log("Sending payload to Teable:", JSON.stringify(teablePayload, null, 2));

    const response = await fetch(`${API_URL}/api/table/${TABLE_ID}/record`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teablePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Teable POST Error:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
