import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const CUSTOMERS_TABLE_ID = "tblmUkwbvrUmxI3q1gd" // ה-ID החדש מהקישור השלישי

export async function GET(request: NextRequest) {
  try {
    const data = await teableClient.getRecords(CUSTOMERS_TABLE_ID, {
      fieldKeyType: "id",
      take: 1000,
    })
    return NextResponse.json({ records: data.records || [], total: data.total || 0 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await teableClient.createRecord(CUSTOMERS_TABLE_ID, body.fields)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
