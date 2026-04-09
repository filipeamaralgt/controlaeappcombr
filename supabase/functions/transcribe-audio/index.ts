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

function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  });
}

function getAudioFormat(mimeType: string): "wav" | "mp3" | "m4a" | "webm" | "ogg" {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes("wav")) return "wav";
  if (normalizedMimeType.includes("mpeg") || normalizedMimeType.includes("mp3")) return "mp3";
  if (normalizedMimeType.includes("mp4") || normalizedMimeType.includes("m4a") || normalizedMimeType.includes("aac")) {
    return "m4a";
  }
  if (normalizedMimeType.includes("ogg")) return "ogg";
  return "webm";
}

function extractChatTranscript(data: any): string {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
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
  const extension = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
  return new File([bytes], `audio.${extension}`, { type: mimeType });
}

async function transcribeAudio(audioFile: File): Promise<{ transcript: string; error?: string }> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const transcriptionPrompt = "Transcreva este áudio em português do Brasil. Retorne apenas a transcrição literal, sem comentários.";
  const canUseOpenAIKey = !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith("sk-") && !OPENAI_API_KEY.includes("xxxx") && OPENAI_API_KEY.length > 20;

  if (!canUseOpenAIKey && !LOVABLE_API_KEY) {
    return {
      transcript: "",
      error: "No transcription provider configured (OPENAI_API_KEY or LOVABLE_API_KEY)",
    };
  }

  let lastError = "";

  // Provider 1: Lovable Gateway
  if (LOVABLE_API_KEY) {
    try {
      for (const model of ["whisper-1", "openai/whisper-1"]) {
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("model", model);
        formData.append("prompt", transcriptionPrompt);
        formData.append("language", "pt");
        formData.append("temperature", "0");

        console.log("Trying Lovable Gateway audio/transcriptions, file:", audioFile.name, "type:", audioFile.type, "size:", audioFile.size, "model:", model);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const transcript = (data?.text || data?.transcript || "").trim();
          console.log("Lovable Gateway audio/transcriptions result:", transcript ? transcript.substring(0, 80) : "(empty)");
          if (transcript) return { transcript };
        } else {
          const errText = await response.text();
          lastError = `lovable-gateway-audio-transcriptions (${model}): ${response.status} ${errText}`;
          console.error("Lovable Gateway audio/transcriptions error:", lastError);
        }
      }

      const audioBase64 = await fileToBase64(audioFile);
      const format = getAudioFormat(audioFile.type || audioFile.name || "audio/webm");

      console.log("Trying Lovable Gateway chat/completions audio fallback, format:", format, "size:", audioFile.size);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-audio-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: transcriptionPrompt },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format,
                  },
                },
              ],
            },
          ],
          temperature: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const transcript = extractChatTranscript(data);
        console.log("Lovable Gateway chat/completions audio result:", transcript ? transcript.substring(0, 80) : "(empty)");
        if (transcript) return { transcript };
      } else {
        const errText = await response.text();
        lastError = `lovable-gateway-chat-audio: ${response.status} ${errText}`;
        console.error("Lovable Gateway chat/completions audio error:", lastError);
      }
    } catch (err) {
      lastError = `lovable-gateway exception: ${err.message}`;
      console.error("Lovable Gateway transcription exception:", err);
    }
  }

  // Provider 2: OpenAI Whisper directly (if key exists and doesn't look like a placeholder)
  if (canUseOpenAIKey) {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-1");
      formData.append("prompt", transcriptionPrompt);
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
