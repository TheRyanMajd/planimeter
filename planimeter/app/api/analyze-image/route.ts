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
          role: "user",
          content: [
            {
              type: "text",
              text:
                "IDENTIFY THE OBJECT IN THE IMAGE AND OUTPUT THE AREA OF THE OBJECT TO THE BEST OF YOUR ABILITIES. ONLY OUTPUT THE AREA AND INCLUDE THE UNITS. DO NOT PRINT ANYTHING ELSE. IF THERE IS AN ERROR OR THE OBJECT IS IN 3 DIMENSIONS OR THE OBJECT's AREA CAN NOT BE CALCULATED, SAY I'm Too Lazy to Calculate all that. 🥀, Here is an example, if the image provided is an index card, it is safe to assume that it is of standard size and that the length and width of a index card is 5 inches by 3 inches giving an answer of 15in^2.",
            },
            {
              type: "image_url",
              image_url: { url: base64DataUrl },
            },
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
