import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64ToUint8Array(base64: string): Uint8Array {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getAudioFileFromRequest(req: Request): Promise<File> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) throw new Error("No audio file provided");
    return audioFile;
  }

  const body = await req.json();
  const audioBase64 = body.audioBase64 as string | undefined;
  const mimeType = (body.mimeType as string | undefined) || "audio/webm";

  if (!audioBase64) throw new Error("No audio provided");

  const bytes = base64ToUint8Array(audioBase64);
  const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  return new File([bytes], `audio.${extension}`, { type: mimeType });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioFile = await getAudioFileFromRequest(req);

    // Use OpenAI-compatible transcription endpoint (accepts real audio files)
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "openai/whisper-1");
    formData.append("language", "pt");
    formData.append("temperature", "0");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Transcription failed", transcript: "" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const transcript = (data?.text || "").trim();

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio error:", e);
    return new Response(JSON.stringify({ error: e.message, transcript: "" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
