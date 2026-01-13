import dotenv from "dotenv";
dotenv.config();

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const synthesizeSpeech = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).send("Text is required.");
  }

  // Clean unwanted lines
  const cleanedText = text
    .split("\n")
    .filter(
      (line) =>
        !line.trim().startsWith("#") &&
        !line.trim().startsWith("*") &&
        !line.trim().startsWith("//")
    )
    .join("\n");

  if (!cleanedText.trim()) {
    return res.status(400).send("No readable text found after filtering.");
  }

  try {
    // ElevenLabs text → Speech
    const audioStream = await client.textToSpeech.convert(
      process.env.ELEVENLABS_VOICE_ID,
      {
        text: cleanedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }
    );

    // Stream → Buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }

    const audioBuffer = Buffer.concat(chunks);

    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (error) {
    console.error("ElevenLabs Error:", error);
    res.status(500).send("Failed to synthesize speech.");
  }
};
