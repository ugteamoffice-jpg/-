import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

// עדכנתי את המזהה לחדש מהקישור ששלחת
const TABLE_ID = "tblUgEhLuyCwEK2yWG4"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const recordId = params.id
    const body = await request.json()

    // Convert date format if exists
    // שים לב: כאן נמצא ה-ID של שדה התאריך. אם הוא השתנה בטבלה החדשה, תצטרך לעדכן אותו גם פה:
    if (body.fldT720jVmGMXFURUKL && typeof body.fldT720jVmGMXFURUKL === "string") {
      const dateValue = body.fldT720jVmGMXFURUKL
      if (dateValue.length === 10 && dateValue.includes("-")) {
        body.fldT720jVmGMXFURUKL = `${dateValue}T00:00:00.000Z`
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
