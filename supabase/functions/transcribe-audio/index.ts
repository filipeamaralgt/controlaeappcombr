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

async function transcribeAudio(audioFile: File): Promise<{ transcript: string; error?: string }> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const providers: Array<{
    name: string;
    url: string;
    token: string;
    model: string;
  }> = [];

  if (OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      url: "https://api.openai.com/v1/audio/transcriptions",
      token: OPENAI_API_KEY,
      model: "whisper-1",
    });
  }

  if (LOVABLE_API_KEY) {
    providers.push({
      name: "lovable-gateway",
      url: "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
      token: LOVABLE_API_KEY,
      model: "openai/whisper-1",
    });
  }

  if (providers.length === 0) {
    return {
      transcript: "",
      error: "No transcription provider configured (OPENAI_API_KEY or LOVABLE_API_KEY)",
    };
  }

  let lastError = "";

  for (const provider of providers) {
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", provider.model);
    formData.append("language", "pt");
    formData.append("temperature", "0");

    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.token}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return { transcript: (data?.text || "").trim() };
    }

    const errText = await response.text();
    lastError = `${provider.name}: ${response.status} ${errText}`;
    console.error("Transcription provider error:", lastError);
  }

  return { transcript: "", error: lastError || "Transcription failed" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioFile = await getAudioFileFromRequest(req);

    const { transcript, error } = await transcribeAudio(audioFile);

    if (!transcript) {
      if (error) console.error("Transcription failed:", error);
      return new Response(JSON.stringify({ error: "Transcription failed", transcript: "" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
