import { type NextRequest, NextResponse } from "next/server"
import { teableClient } from "@/lib/teable-client"

const CUSTOMERS_TABLE_ID = "tblmUkwbvrUmxI3q1gd"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { fields } = body
    const { id } = params

    console.log("[v0] PATCH customer:", id, "Fields:", fields)

    const data = await teableClient.updateRecord(CUSTOMERS_TABLE_ID, id, fields)

    console.log("[v0] Update successful:", data)

    return NextResponse.json(data)
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || "Failed to update customer"
    const errorDetails = error?.response?.data || error?.data || {}

    return NextResponse.json(
      {
        error: "Failed to update customer",
        details: errorMessage,
        teableError: errorDetails,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await teableClient.deleteRecord(CUSTOMERS_TABLE_ID, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
