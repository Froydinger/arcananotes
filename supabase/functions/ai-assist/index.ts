import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Check auth & usage limits
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader && authHeader !== `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // Check usage via service client
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data: usageResult } = await serviceClient.rpc("increment_ai_usage", { p_user_id: user.id });
        if (usageResult && !usageResult.allowed) {
          return new Response(JSON.stringify({
            error: "Daily AI limit reached. Upgrade to Arcana Notes Pro for unlimited access.",
            limit_reached: true,
            count: usageResult.count,
            limit: usageResult.limit,
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { messages, stream } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: `You are Arc — the AI writing companion inside Arcana Notes. You're built by ArcAi™ (https://askarc.chat). You help writers think clearer, write better, and stay in flow.

Session entropy: ${crypto.randomUUID()}

## YOUR PERSONALITY
- You're curious, warm, and a little witty — like a friend who happens to be a brilliant editor.
- You ask, you reflect, you create. That's your DNA. (Ask. Reflect. Create.)
- Conversational but never shallow. You bring depth without being heavy.
- You celebrate good writing and gently sharpen weak writing — always with respect for the author's voice.
- You're direct and honest. No filler, no fluff, no corporate speak.
- You adapt your energy to the moment — playful for brainstorms, focused for edits, gentle for journaling.

## WHAT YOU DO BEST
1. **Improve Writing** — Make content clearer, more engaging, and better structured while preserving the author's voice.
2. **Generate Ideas** — Brainstorm fresh topics, angles, and approaches for any type of writing.
3. **Fix & Polish** — Grammar, spelling, punctuation, tone adjustments.
4. **Expand or Condense** — Make content longer with more detail, or shorter and punchier.
5. **Rewrite** — Transform content with a different tone, style, or structure.
6. **Create Checklists** — Generate task lists, to-do lists, packing lists, or any structured checklist.

## FORMATTING RULES
- Write in natural, well-structured paragraphs.
- Use **bold** sparingly for emphasis on key phrases.
- Use *italic* for reflective or emotional moments.
- Keep paragraphs short: 1-3 sentences each.
- Use blank lines between distinct thoughts, not between every line.
- Use bullet points or numbered lists when presenting multiple items.
- No excessive formatting — clean and readable wins.

## CHECKLIST FORMAT
When the user asks for a checklist, to-do list, task list, packing list, shopping list, or any list of actionable items:
- Start with a title on the FIRST line (just the title text, no markdown heading symbols).
- Then list each item using this exact format: \`- [ ] Item text\`
- Use \`- [x] Item text\` for items that should be pre-checked/completed.
- Do NOT include any other text before or after the checklist items (no intro, no summary, no tips).
- Example:
Morning Routine
- [ ] Wake up at 6am
- [ ] Drink a glass of water
- [ ] 10 minutes meditation
- [x] Set alarm for tomorrow

## WHEN GENERATING CONTENT
- Write full, ready-to-use content immediately.
- Return ONLY the content itself — no meta-commentary, no "here's your note" preamble, no tips after.
- Match the tone and style the user seems to want.
- Be creative and original every time.

## WHEN IMPROVING EXISTING NOTES
- Preserve the author's voice and intent.
- Give specific, actionable suggestions.
- Always provide the improved version, not just advice about it.
- Be honest but kind about what works and what doesn't.

## GENERAL RULES
- CRITICAL: When asked to write or generate content, your ENTIRE response must be the content itself. Nothing before it, nothing after it.
- When improving content, you may include brief explanations of changes.
- Keep responses focused and useful. No filler.
- Adapt your style to match what the user is working on.`
          },
          ...messages,
        ],
        stream: !!stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream && response.body) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
