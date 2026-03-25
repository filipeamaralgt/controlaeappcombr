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

  if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
    return {
      transcript: "",
      error: "No transcription provider configured (OPENAI_API_KEY or LOVABLE_API_KEY)",
    };
  }

  let lastError = "";

  // Provider 1: OpenAI Whisper directly (if key exists)
  if (OPENAI_API_KEY) {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-1");
      formData.append("prompt", "Transcreva este áudio em português do Brasil.");
      formData.append("language", "pt");
      formData.append("temperature", "0");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const transcript = (data?.text || "").trim();
        if (transcript) return { transcript };
      } else {
        const errText = await response.text();
        lastError = `openai: ${response.status} ${errText}`;
        console.error("OpenAI Whisper error:", lastError);
      }
    } catch (err) {
      lastError = `openai exception: ${err.message}`;
      console.error("OpenAI Whisper exception:", err);
    }
  }

  // Provider 2: Lovable Gateway Whisper endpoint (accepts any audio format via FormData)
  if (LOVABLE_API_KEY) {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "openai/whisper-1");
      formData.append("language", "pt");

      console.log("Trying Lovable Gateway Whisper, file:", audioFile.name, "type:", audioFile.type, "size:", audioFile.size);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const transcript = (data?.text || "").trim();
        console.log("Lovable Gateway Whisper result:", transcript ? transcript.substring(0, 80) : "(empty)");
        if (transcript) return { transcript };
      } else {
        const errText = await response.text();
        lastError = `lovable-gateway-whisper: ${response.status} ${errText}`;
        console.error("Lovable Gateway Whisper error:", lastError);
      }
    } catch (err) {
      lastError = `lovable-gateway-whisper exception: ${err.message}`;
      console.error("Lovable Gateway Whisper exception:", err);
    }
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
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY or LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioFile = await getAudioFileFromRequest(req);
    console.log("Received audio file:", audioFile.name, "type:", audioFile.type, "size:", audioFile.size);

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
