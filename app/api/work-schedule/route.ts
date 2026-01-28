import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4';
const API_KEY = process.env.TEABLE_API_KEY;
const DATE_FIELD_ID = 'fldvNsQbfzMWTc7jakp'; // ה-ID של שדה התאריך

// --- GET (התיקון נמצא כאן) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = searchParams.get('take') || '1000';
    const dateParam = searchParams.get('date'); 

    // הוספתי כאן את &fieldKeyType=id כדי שהסינון יעבוד עם IDs!
    let endpoint = `${API_URL}/api/table/${TABLE_ID}/record?take=${take}&fieldKeyType=id`;

    if (dateParam) {
      const filterObj = {
        operator: "and",
        filterSet: [
          {
            fieldId: DATE_FIELD_ID,
            operator: "is",
            value: dateParam
          }
        ]
      };
      
      const encodedFilter = encodeURIComponent(JSON.stringify(filterObj));
      endpoint += `&filter=${encodedFilter}`;
    }

    console.log("🔍 Fetching URL:", endpoint);

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      cache: 'no-store'
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("GET Error:", err);
      return NextResponse.json({ error: 'Failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST (נשאר תקין ועובד) ---
export async function POST(request: Request) {
  console.log("🔥🔥🔥 POST CREATION 🔥🔥🔥");

  try {
    const body = await request.json();
    
    if (!API_KEY) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

    // התיקון הגדול שעשינו קודם (עובד מצוין)
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
      console.error("❌ Error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json({ error: "Teable Error", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
