import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_MODEL = "openai/gpt-image-2.5-flare";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

// Aspect ratio -> OpenAI size (multiples of 16, within ratio/pixel constraints)
const SIZE_BY_RATIO: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1536x864",
  "9:16": "864x1536",
  "4:3": "1216x912",
  "3:4": "912x1216",
  "3:2": "1296x864",
  "2:3": "864x1296",
  "21:9": "2016x864",
};

async function urlToBlob(url: string): Promise<Blob> {
  if (url.startsWith("data:")) {
    const [meta, base64] = url.split(",", 2);
    const mime = /data:(.*?);/.exec(meta)?.[1] || "image/png";
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch source image (${res.status})`);
  return await res.blob();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free for everyone — no subscription or usage gating.
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { prompt, edit_instruction, source_image_url, aspect_ratio } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const size = SIZE_BY_RATIO[aspect_ratio] ?? "1024x1024";
    const isEdit = !!(edit_instruction && source_image_url);

    let response: Response;
    if (isEdit) {
      const imageBlob = await urlToBlob(source_image_url);
      const form = new FormData();
      form.append("model", IMAGE_MODEL);
      form.append("prompt", edit_instruction);
      form.append("size", size);
      form.append("image", new File([imageBlob], "source.png", { type: imageBlob.type || "image/png" }));

      response = await fetch(`${GATEWAY}/images/edits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: form,
      });
    } else {
      response = await fetch(`${GATEWAY}/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: `Generate a beautiful, high-quality image based on this description: ${prompt}`,
          size,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Image generation failed (${response.status}). ${errText.slice(0, 200)}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    const remoteUrl = data.data?.[0]?.url;
    const imageUrl = b64 ? `data:image/png;base64,${b64}` : remoteUrl;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image was generated. Try a different prompt." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload the image to storage
    let binaryData: Uint8Array;
    if (b64) {
      binaryData = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } else {
      const imgRes = await fetch(remoteUrl);
      if (!imgRes.ok) throw new Error(`Could not download generated image (${imgRes.status})`);
      binaryData = new Uint8Array(await imgRes.arrayBuffer());
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await serviceClient.storage
      .from("note-images")
      .upload(filePath, binaryData, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return the generated image as fallback
      return new Response(JSON.stringify({ image_url: imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedUrlData } = await serviceClient.storage
      .from("note-images")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    const finalUrl = signedUrlData?.signedUrl || imageUrl;

    return new Response(JSON.stringify({ image_url: finalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
