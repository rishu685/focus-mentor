import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGroqKey: !!process.env.GROQ_API_KEY,
    keyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
    keyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'Not found'
  });
}