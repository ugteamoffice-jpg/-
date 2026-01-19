import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const DRIVERS_TABLE_ID = "tblsMGUyHILuKGGASix"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = 100

    if (search) {
      const data = await teableClient.getRecords(DRIVERS_TABLE_ID, {
        fieldKeyType: "id",
        search: [search],
      })

      return NextResponse.json({
        records: data.records || [],
        total: data.total || 0,
        page: 1,
        pageSize: data.records?.length || 0,
      })
    }

    let allRecords: any[] = []
    let skip = 0
    const take = 1000

    while (true) {
      const data = await teableClient.getRecords(DRIVERS_TABLE_ID, {
        fieldKeyType: "id",
        take,
        skip,
      })

      if (!data.records || data.records.length === 0) {
        break
      }

      allRecords = [...allRecords, ...data.records]
      skip += take

      if (data.records.length < take) {
        break
      }
    }

    return NextResponse.json({
      records: allRecords,
      total: allRecords.length,
    })
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
    console.error("Error creating driver:", error)
    return NextResponse.json(
      {
        error: "Failed to create driver",
        details: error.message || "Unknown error",
        teableError: error,
      },
      { status: 500 },
    )
  }
}
