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

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function audioFormatFromMime(mime: string): "wav" | "mp3" | "ogg" | "webm" {
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
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

  if (OPENAI_API_KEY) {
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "whisper-1");
    formData.append("prompt", "Transcreva este áudio em português do Brasil.");
    formData.append("language", "pt");
    formData.append("temperature", "0");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const transcript = (data?.text || "").trim();
      if (transcript) return { transcript };
    } else {
      const errText = await response.text();
      lastError = `openai: ${response.status} ${errText}`;
      console.error("Transcription provider error:", lastError);
    }
  }

  if (LOVABLE_API_KEY) {
    const bytes = new Uint8Array(await audioFile.arrayBuffer());
    const base64Audio = uint8ToBase64(bytes);
    const format = audioFormatFromMime(audioFile.type || "audio/webm");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva este áudio em português do Brasil. Retorne apenas a transcrição.",
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format,
                },
              },
            ],
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        const transcript = content.trim();
        if (transcript) return { transcript };
      }
      if (Array.isArray(content)) {
        const transcript = content
          .map((item: any) => (typeof item === "string" ? item : item?.text || ""))
          .join(" ")
          .trim();
        if (transcript) return { transcript };
      }
    } else {
      const errText = await response.text();
      lastError = `lovable-gateway: ${response.status} ${errText}`;
      console.error("Transcription provider error:", lastError);
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
