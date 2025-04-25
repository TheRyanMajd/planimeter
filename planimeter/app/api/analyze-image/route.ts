import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { base64DataUrl } = await req.json();

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: [
            "You are an expert image analysis assistant whose sole job is to compute the two-dimensional area of the main object in an image.",
            "When given an image, follow these rules exactly:",
            "1. Identify the single primary object in the image.",
            "2. Estimate its projected area in standard units (e.g. inches for U.S. paper sizes, centimeters otherwise).",
            "3. Output ONLY the numeric value and unit (e.g. “15 in²” or “387 cm²”), with no extra text or punctuation.",
            "4. If you cannot calculate the area (object is 3D, no scale reference, etc.), respond exactly: “I’m Too Lazy to Calculate That 🥀”.",
            "5. Use common size assumptions: index card = 5 in × 3 in, US letter = 8.5 in × 11 in, legal = 8.5 in × 14 in, etc."
          ].join("\n")
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Here is the image—please analyze it and return the area per the instructions above." },
            { type: "image_url", image_url: { url: base64DataUrl } }
          ],
        },
      ],
    });

    return NextResponse.json({
      result: response.choices[0]?.message?.content ?? "No response.",
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json({ result: "Failed to analyze image." }, { status: 500 });
  }
}
