import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let recordId = body.recordId

    // Strict regex check: Teable record IDs must start with 'rec' followed by alphanumeric characters
    const recordIdRegex = /^rec[a-zA-Z0-9]+$/

    // Convert to string first if needed
    const recordIdString = typeof recordId === "string" ? recordId : String(recordId)

    if (!recordIdRegex.test(recordIdString)) {
      console.error("[v0] CRITICAL: Invalid ID blocked at API entry:", recordId)
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          details: "Record ID must match pattern: ^rec[a-zA-Z0-9]+$",
          received: recordId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] DELETE FILE - Raw recordId received:", recordId, typeof recordId)

    // If recordId is an object, reject immediately
    if (typeof recordId === "object" && recordId !== null) {
      console.error("[v0] ERROR: recordId is an object:", JSON.stringify(recordId))
      return new Response(
        JSON.stringify({
          error: "Invalid Record ID format",
          details: "Received object instead of string",
          received: JSON.stringify(recordId),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Convert to string and trim
    recordId = String(recordId).trim()

    const BASE_ID = "bse1pHIESYWysl2D4VR"
    const TABLE_ID = "tblVAQGlYOLfvCZdqgj"
    const FIELD_ID = "fldf2FIOvHqALxULqrs"

    const patchUrl = `https://teable-production-bedd.up.railway.app/api/base/${BASE_ID}/table/${TABLE_ID}/record/${recordId}`

    console.log("[v0] DELETE FILE - Validated Record ID:", recordId)
    console.log("[v0] DELETE FILE - Full URL:", patchUrl)

    const response = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TEABLE_APP_TOKEN}`,
      },
      body: JSON.stringify({
        fields: {
          [FIELD_ID]: null,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Delete file error:", response.status, errorText)
      return NextResponse.json({ error: `Failed to delete file: ${errorText}` }, { status: response.status })
    }

    const result = await response.json()
    console.log("[v0] File deleted successfully:", result)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Delete file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
