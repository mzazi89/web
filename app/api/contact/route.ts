import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Log the submission (for testing)
    console.log('Contact Form Submission:', {
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString()
    })

    // For now, just return success
    // You can replace this with email sending later
    return NextResponse.json(
      { message: 'Message received successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
