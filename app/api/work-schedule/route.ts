import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const TABLE_ID = "tblUgEhLuyCwEK2yWG4"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const skip = Number.parseInt(searchParams.get("skip") || "0")
    const take = Number.parseInt(searchParams.get("take") || "100")
    const orderBy = searchParams.get("orderBy")
    const filter = searchParams.get("filter")

    const options: any = {
      fieldKeyType: "id",
      cellFormat: "json",
      skip,
      take,
    }

    if (orderBy) {
      options.orderBy = JSON.parse(orderBy)
    }

    if (filter) {
      options.filter = JSON.parse(filter)
    }

    const data = await teableClient.getRecords(TABLE_ID, options)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching work schedule:", error)
    return NextResponse.json({ error: "Failed to fetch work schedule" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST work-schedule: request received")
    const body = await request.json()
    console.log("[v0] POST work-schedule: body received:", JSON.stringify(body, null, 2))

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const formattedFields: Record<string, any> = {}

    for (const [key, value] of Object.entries(body)) {
      if (value !== "" && value !== null && value !== undefined) {
        // ID מעודכן לשדה תאריך
        if (key === "fldvNsQbfzMWTc7jakp" && typeof value === "string") {
          formattedFields[key] = new Date(value + "T00:00:00.000Z").toISOString()
        }
        // ID מעודכן לשדה קובץ
        else if (key === "fldKkq5oyBm8CwcAIvH" && Array.isArray(value)) {
          formattedFields[key] = value
        }
        else if (Array.isArray(value) && value.length > 0) {
          formattedFields[key] = value
        }
        else if (!Array.isArray(value)) {
          formattedFields[key] = value
        }
      }
    }

    const result = await teableClient.createRecord(TABLE_ID, formattedFields)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] POST work-schedule: error creating record:", error)
    return NextResponse.json(
      {
        error: "Failed to create record",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
