import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const DRIVERS_TABLE_ID = "tblsMGUyHILuKGGASix"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { fields } = await request.json()

    const data = await teableClient.updateRecord(DRIVERS_TABLE_ID, id, fields)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error updating driver:", error)
    return NextResponse.json(
      {
        error: "Failed to update driver",
        details: error.message || "Unknown error",
        teableError: error,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await teableClient.deleteRecord(DRIVERS_TABLE_ID, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting driver:", error)
    return NextResponse.json(
      {
        error: "Failed to delete driver",
        details: error.message || "Unknown error",
        teableError: error,
      },
      { status: 500 },
    )
  }
}
