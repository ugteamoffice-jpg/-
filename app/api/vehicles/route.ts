import { NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const TABLE_ID = "tblbRTqAuL4OMkNnUu7" // ה-ID החדש מהקישור השני

export async function GET() {
  try {
    const data = await teableClient.getRecords(TABLE_ID, { fieldKeyType: "id", take: 1000 })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await teableClient.createRecord(TABLE_ID, body.fields)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
