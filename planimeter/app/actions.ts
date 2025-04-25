"use server"

// import { revalidatePath } from "next/cache";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeImage(base64DataUrl: string): Promise<string> {
  return await client.chat.completions
    .create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "IDENTIFY THE OBJECT IN THE IMAGE AND OUTPUT THE AREA OF THE OBJECT TO THE BEST OF YOUR ABILITIES. ONLY OUTPUT THE AREA AND INCLUDE THE UNITS. DO NOT PRINT ANYTHING ELSE. IF THERE IS AN ERROR OR THE OBJECT IS IN 3 DIMENSIONS OR THE OBJECT's AREA CAN NOT BE CALCULATED, SAY THAT" },
            {
              type: "image_url",
              image_url: { url: base64DataUrl },
            },
          ],
        },
      ],
    })
    .then((res) => res.choices[0]?.message?.content || "No response.");
  
}
