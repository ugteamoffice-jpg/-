import { NextResponse } from 'next/server';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblx9sU53v205240294'; // שים לב: וודא שזה ה-ID הנכון של טבלת סידור עבודה!
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
      const errorText = await response.text();
      console.error("Teable GET Error:", errorText);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// יצירת רשומה (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // בדיקה שהמפתח קיים
    if (!API_KEY) {
      console.error("Missing API KEY");
      return NextResponse.json({ error: 'Missing Server API Key' }, { status: 500 });
    }

    console.log("Sending payload to Teable:", JSON.stringify(body, null, 2)); // לוג לבדיקה

    const response = await fetch(`${API_URL}/api/table/${TABLE_ID}/record`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Teable POST Error:", errorText); // כאן נראה את השגיאה האמיתית בטרמינל
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// מחיקת רשומה (DELETE) - בונוס, כדי שהמחיקה תעבוד
export async function DELETE(request: Request) {
    // נצטרך לוגיקה לחילוץ ID מה-URL בנפרד, או ליצור קובץ route בתיקייה [id]
    // כרגע נשאיר את זה פשוט כדי לא לסבך, המחיקה בטבלה עובדת דרך נתיב אחר בדרך כלל
    return NextResponse.json({ message: "Delete implemented in [id]/route.ts" });
}
