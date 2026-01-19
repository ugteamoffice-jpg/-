import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const CUSTOMERS_TABLE_ID = "tbl4dSxUqAf6vsuGCsM"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = 100

    if (search) {
      const data = await teableClient.getRecords(CUSTOMERS_TABLE_ID, {
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
      const data = await teableClient.getRecords(CUSTOMERS_TABLE_ID, {
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
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fields } = body

    console.log("[v0] Creating customer with fields:", JSON.stringify(fields, null, 2))

    const data = await teableClient.createRecord(CUSTOMERS_TABLE_ID, fields)

    console.log("[v0] Customer created successfully:", data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error creating customer:", error)
    const errorMessage = error.message || error.toString()
    const errorDetails = error.details || {}
    const status = error.status || 500

    return NextResponse.json(
      {
        error: "Failed to create customer",
        details: errorMessage,
        teableError: errorDetails,
        status: status,
      },
      { status: 500 },
    )
  }
}
