import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const DRIVERS_TABLE_ID = "tbl39DxszH3whkjzovd" // ה-ID החדש מהקישור הראשון

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    // טעינת כל הנהגים
    const data = await teableClient.getRecords(DRIVERS_TABLE_ID, {
      fieldKeyType: "id",
      take: 1000
    })
    return NextResponse.json({ records: data.records || [], total: data.records?.length || 0 })
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fields } = await request.json()
    const data = await teableClient.createRecord(DRIVERS_TABLE_ID, fields)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
