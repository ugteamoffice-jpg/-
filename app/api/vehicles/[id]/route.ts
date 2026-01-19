import { NextResponse } from "next/server"

const TEABLE_API_URL = process.env.TEABLE_API_URL
const TEABLE_APP_TOKEN = process.env.TEABLE_APP_TOKEN
const TABLE_ID = "tblRSYoKFHCaDyivO9k"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { fields } = body
    const recordId = params.id

    const response = await fetch(`${TEABLE_API_URL}/api/table/${TABLE_ID}/record/${recordId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEABLE_APP_TOKEN}`,
      },
      body: JSON.stringify({
        fieldKeyType: "id",
        typecast: true,
        record: { fields },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update vehicle")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating vehicle:", error)
    return NextResponse.json({ error: error.message || "Failed to update vehicle" }, { status: 500 })
  }
}
