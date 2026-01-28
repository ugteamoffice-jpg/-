import { NextResponse } from 'next/server';

const API_URL = 'https://teable-production-bedd.up.railway.app';
const TABLE_ID = 'tblUgEhLuyCwEK2yWG4'; // טבלת סידור עבודה
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

// יצירת רשומה (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json(); // מקבלים { fields: {...} }
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'Missing Server API Key' }, { status: 500 });
    }

    console.log("🔵 מנסה ליצור רשומה חדשה...");
    
    // הכנת המידע לשליחה
    const teablePayload = {
      typecast: true, // מאפשר המרת סוגי נתונים אוטומטית
      records: [
        {
          fields: body.fields 
        }
      ]
    };

    // --- התיקון הקריטי: הוספת ?fieldKeyType=id לכתובת ---
    const endpoint = `${API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teablePayload),
    });

    // --- טיפול בשגיאות מפורט (כמו שביקשת) ---
    if (!response.ok) {
      const errorData = await response.json(); // מנסה לקרוא את השגיאה כ-JSON
      
      console.error("❌ שגיאה ביצירת רשומה ב-Teable:");
      console.error(JSON.stringify(errorData, null, 2)); // מדפיס את השגיאה בצורה יפה וקריאה
      
      // מחזיר את השגיאה המדויקת לקלינט
      return NextResponse.json({ 
        error: "Teable Error", 
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ הרשומה נוצרה בהצלחה:", data);
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ שגיאה כללית בשרת:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
