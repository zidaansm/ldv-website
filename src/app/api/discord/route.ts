import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("https://discord.com/api/v9/invites/ladolcevita?with_counts=true", {
      next: { revalidate: 60 }, // Cache the result for 60 seconds to prevent rate limiting
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Discord" }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
