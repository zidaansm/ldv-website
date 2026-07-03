import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Setup providers
const google = createGoogleGenerativeAI({ 
  apiKey: process.env.GEMINI_API_KEY || "dummy" 
});

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY || "dummy" });

const openRouter = createOpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY || "dummy", 
  baseURL: "https://openrouter.ai/api/v1" 
});

// Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple In-Memory Rate Limiter (Best-Effort for Serverless)
const ipLimit = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  // --- 1. Rate Limiting ---
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const maxReq = 10; // Max 10 requests per minute per IP

  const userLim = ipLimit.get(ip) || { count: 0, timestamp: now };
  if (now - userLim.timestamp > window) {
    userLim.count = 1;
    userLim.timestamp = now;
  } else {
    userLim.count++;
  }
  ipLimit.set(ip, userLim);

  if (userLim.count > maxReq) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const { messages, lang } = await req.json();

    // --- 2. Fetch Context from Supabase ---
    let contextText = "";
    try {
      // Fetch data from multiple tables in parallel for efficiency
      const [
        { data: faq }, 
        { data: events },
        { data: members },
        { data: staff },
        { data: banlist },
        { data: menfess }
      ] = await Promise.all([
        supabase.from("faq").select("*"),
        supabase.from("events").select("*").eq("type", "upcoming"),
        supabase.from("members").select("name, motto"),
        supabase.from("staff").select("name, role"),
        supabase.from("banlist").select("name, reason, is_permanent, unban_date"),
        supabase.from("menfess").select("content, sender_name, is_anonymous").order("created_at", { ascending: false }).limit(10)
      ]);

      contextText += "FAQ:\n" + (faq && faq.length > 0 ? faq.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") : "No FAQ available.") + "\n\n";
      
      contextText += "Upcoming Events:\n" + (events && events.length > 0 ? events.map((e: any) => `- ${e.title} on ${e.date} at ${e.time}`).join("\n") : "No upcoming events.") + "\n\n";
      
      contextText += "LDV Staff/Team:\n" + (staff && staff.length > 0 ? staff.map((t: any) => `- ${t.name} (Role: ${t.role})`).join("\n") : "No staff listed.") + "\n\n";
      
      contextText += "LDV Members List:\n" + (members && members.length > 0 ? members.map((m: any) => `- ${m.name} (Motto: "${m.motto}")`).join("\n") : "No members listed.") + "\n\n";
      
      contextText += "Banned Users:\n" + (banlist && banlist.length > 0 ? banlist.map((b: any) => `- ${b.name} (Reason: ${b.reason}. Permanent: ${b.is_permanent ? 'Yes' : 'No'})`).join("\n") : "No banned users.") + "\n\n";
      
      contextText += "Recent Menfess (Secret Messages):\n" + (menfess && menfess.length > 0 ? menfess.map((m: any) => `- From ${m.is_anonymous ? 'Anonymous' : m.sender_name}: "${m.content}"`).join("\n") : "No secret messages yet.") + "\n\n";
    } catch (e) {
      console.error("Failed to fetch context from Supabase:", e);
      // We don't throw here; we still want the AI to reply even if context fails.
    }

    // --- 3. Construct System Prompt ---
    const systemPrompt = `You are Vita (also known as Dolce's Assistant), the official AI assistant for La Dolce Vita (LDV) community.
Your role is to help visitors by answering questions about LDV based ONLY on the context provided below.
If a user asks about members, staff, events, or banned users, use the provided context lists.
If a user asks something completely unrelated to LDV, gaming, or the context provided, politely decline to answer and steer them back to LDV topics.
Keep your answers brief, friendly, and in a gaming community tone.

Community Context & Database Records:
${contextText}

Language Instruction:
${
  lang === "id"
    ? "TOLONG JAWAB DALAM BAHASA INDONESIA YANG SANTAI DAN ASIK (pakai gaya bahasa anak gaul/gamer, sesekali boleh pakai terms Discord). JANGAN kaku."
    : "PLEASE ANSWER IN CASUAL, FRIENDLY ENGLISH. Use a slight gamer/Discord community tone."
}`;

    // --- 4. Stream Response ---
    // Sanitize messages to remove UI-specific fields like `id` which causes Groq/OpenAI to throw errors
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    console.log("sanitizedMessages:", JSON.stringify(sanitizedMessages, null, 2));

    let result;
    try {
      result = await streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: systemPrompt,
        messages: sanitizedMessages,
      });
    } catch (e) {
      console.warn("Groq failed, falling back to Gemini", e);
      result = await streamText({
        model: google("gemini-2.5-flash"),
        system: systemPrompt,
        messages: sanitizedMessages,
      });
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
