import { NextResponse } from "next/server"

const TEABLE_API_URL = process.env.TEABLE_API_URL
const TEABLE_APP_TOKEN = process.env.TEABLE_APP_TOKEN
const TABLE_ID = "tblRSYoKFHCaDyivO9k"

export async function GET() {
  try {
    const response = await fetch(`${TEABLE_API_URL}/api/table/${TABLE_ID}/record?fieldKeyType=id&take=1000`, {
      headers: {
        Authorization: `Bearer ${TEABLE_APP_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch vehicles")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch vehicles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fields } = body

    const response = await fetch(`${TEABLE_API_URL}/api/table/${TABLE_ID}/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEABLE_APP_TOKEN}`,
      },
      body: JSON.stringify({
        fieldKeyType: "id",
        typecast: true,
        records: [{ fields }],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create vehicle")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json({ error: error.message || "Failed to create vehicle" }, { status: 500 })
  }
}
