import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const TABLE_ID = "tblUgEhLuyCwEK2yWG4"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const recordId = params.id
    const body = await request.json()

    // ID מעודכן לשדה תאריך
    if (body.fldvNsQbfzMWTc7jakp && typeof body.fldvNsQbfzMWTc7jakp === "string") {
      const dateValue = body.fldvNsQbfzMWTc7jakp
      if (dateValue.length === 10 && dateValue.includes("-")) {
        body.fldvNsQbfzMWTc7jakp = `${dateValue}T00:00:00.000Z`
      }
    }

    const fieldsToUpdate = Object.entries(body)
      .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    const result = await teableClient.updateRecord(TABLE_ID, recordId, fieldsToUpdate)

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("[v0] Error updating record:", error)
    return NextResponse.json(
      { error: "Failed to update record", details: error.message || String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const recordId = params.id
    await teableClient.deleteRecord(TABLE_ID, recordId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting record:", error)
    return NextResponse.json(
      { error: "Failed to delete record", details: error.message || String(error) },
      { status: 500 },
    )
  }
}
