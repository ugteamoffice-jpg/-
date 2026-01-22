import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

// עדכנתי את המזהה לחדש מהקישור ששלחת
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
      console.log("[v0] POST work-schedule: missing fields")
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const formattedFields: Record<string, any> = {}

    for (const [key, value] of Object.entries(body)) {
      console.log(`[v0] Processing field ${key}:`, value, `type: ${typeof value}, isArray: ${Array.isArray(value)}`)

      if (value !== "" && value !== null && value !== undefined) {
        // Convert date field to ISO timestamp
        // שים לב: אם שינית את ה-ID של שדה התאריך בטבלה החדשה, תצטרך לעדכן גם את השורה הזו:
        if (key === "fldT720jVmGMXFURUKL" && typeof value === "string") {
          formattedFields[key] = new Date(value + "T00:00:00.000Z").toISOString()
        }
        // Keep attachment field as-is (array with name and token)
        // כנ"ל לגבי שדה הקובץ:
        else if (key === "fldf2FIOvHqALxULqrs" && Array.isArray(value)) {
          formattedFields[key] = value
        }
        // Keep other array fields (like links)
        else if (Array.isArray(value) && value.length > 0) {
          formattedFields[key] = value
        }
        // Keep non-array fields
        else if (!Array.isArray(value)) {
          formattedFields[key] = value
        }
      }
    }

    console.log("[v0] POST work-schedule: formatted fields to send:", JSON.stringify(formattedFields, null, 2))
    console.log("[v0] POST work-schedule: file field value:", formattedFields.fldf2FIOvHqALxULqrs)

    const result = await teableClient.createRecord(TABLE_ID, formattedFields)
    console.log("[v0] POST work-schedule: record created successfully, result:", JSON.stringify(result, null, 2))

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
