import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4';
const API_KEY = process.env.TEABLE_API_KEY;
const DATE_FIELD_ID = 'fldvNsQbfzMWTc7jakp'; // ה-ID של שדה התאריך שלך

// --- GET חכם: מתרגם סינון תאריך לפורמט של Teable ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = searchParams.get('take') || '1000';
    const dateParam = searchParams.get('date'); // הממשק שולח ?date=YYYY-MM-DD

    // התחלת בניית כתובת ה-API
    let endpoint = `${API_URL}/api/table/${TABLE_ID}/record?take=${take}`;

    // אם נשלח תאריך לסינון, נוסיף אותו בפורמט ש-Teable מבין
    if (dateParam) {
      // Teable דורש פילטר בפורמט JSON מקודד
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

    console.log("🔍 Fetching from Teable:", endpoint);

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error("GET Error:", await response.text());
      return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST (נשאר תקין מגרסה 4) ---
export async function POST(request: Request) {
  console.log("🔥🔥🔥 POST REQUEST - CREATING RIDE 🔥🔥🔥");

  try {
    const body = await request.json();
    
    if (!API_KEY) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

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
      console.error("❌ Teable POST Error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json({ error: "Teable Error", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Server POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
