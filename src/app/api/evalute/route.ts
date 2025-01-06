import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GroqClient } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { promptId, modelIds } = await req.json();

    // Fetch prompt content
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Evaluate prompt across multiple models
    const evaluations = await Promise.all(
      modelIds.map(async (modelId: string) => {
        const startTime = Date.now();

        // Call Groq API
        const groq = new GroqClient(process.env.GROQ_API_KEY);
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt.content }],
          model: "mixtral-8x7b-32768",
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Store response and metrics
        return prisma.response.create({
          data: {
            promptId,
            modelId,
            content: response.choices[0].message.content,
            responseTimeMs: responseTime,
            tokenCount: response.usage.total_tokens,
            // Add your relevancy and accuracy scoring logic here
            relevancyScore: calculateRelevancy(
              prompt.content,
              response.choices[0].message.content
            ),
            accuracyScore: calculateAccuracy(
              prompt.content,
              response.choices[0].message.content
            ),
          },
        });
      })
    );

    return NextResponse.json(evaluations);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
