import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAIGateway } from "./aiGateway.server";
import { createNotification } from "./notifications.server";

const ikigaiSchema = z.object({
  love: z.string().min(10).max(2000),
  great: z.string().min(10).max(2000),
  need: z.string().min(10).max(2000),
  paid: z.string().min(10).max(2000),
});

const inputSchema = z.object({
  name: z.string().max(120).optional().default(""),
  path: z.enum(["starting", "existing"]),
  youtubeUrl: z.string().max(500).optional().default(""),
  ikigai: ikigaiSchema,
});

const blueprintTool = {
  type: "function",
  function: {
    name: "emit_brand_blueprint",
    description:
      "Return a complete personal brand blueprint derived from the user's Ikigai answers.",
    parameters: {
      type: "object",
      properties: {
        contentPillars: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
          description:
            "3 to 5 specific content pillar topics this creator should own.",
        },
        brandVoice: {
          type: "string",
          description:
            "2-3 sentences describing their ideal communication style.",
        },
        targetAudience: {
          type: "string",
          description: "Specific description of who their content serves.",
        },
        monetisationAngle: {
          type: "string",
          description: "How they can make money from this niche.",
        },
        youtubeNiche: {
          type: "string",
          description:
            "One precise sentence describing their YouTube niche.",
        },
        brandSummary: {
          type: "string",
          description:
            "One paragraph (4-6 sentences) that can be injected into every video brief to keep it on-brand.",
        },
      },
      required: [
        "contentPillars",
        "brandVoice",
        "targetAudience",
        "monetisationAngle",
        "youtubeNiche",
        "brandSummary",
      ],
      additionalProperties: false,
    },
  },
} as const;

export const generateBrandBlueprint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const systemPrompt = `You are an elite personal brand strategist for YouTube creators. Given a creator's Ikigai answers (what they love, what they're great at, what the world needs, what they can be paid for), you produce a tight, opinionated personal brand blueprint. Be specific, concrete, and decisive — no hedging, no generic advice. Always call the emit_brand_blueprint tool with your answer.`;

    const userPrompt = `Creator name: ${data.name}
Starting point: ${data.path === "existing" ? `Already has a YouTube channel${data.youtubeUrl ? ` (${data.youtubeUrl})` : ""}` : "Just starting out"}

# Ikigai
1. What they love (could talk about for hours):
${data.ikigai.love}

2. What they are great at (skills that come naturally):
${data.ikigai.great}

3. What the world needs (problems they see that need solving):
${data.ikigai.need}

4. What they can be paid for (what people would pay them to teach or do):
${data.ikigai.paid}

Based on these four Ikigai answers, generate a personal brand blueprint by calling emit_brand_blueprint. Make sure contentPillars are 3-5 specific topic territories (not generic categories), brandVoice is 2-3 sentences, and brandSummary is a single tight paragraph suitable for injecting into a video brief.`;

    const aiResult = await callAIGateway({
      userId,
      callType: "blueprint",
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [blueprintTool],
      toolChoice: { type: "function", function: { name: "emit_brand_blueprint" } },
      maxTokens: 2000,
    });

    const toolCall = aiResult.rawResponse?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) throw new Error("AI did not return a blueprint");

    let parsed: any;
    try {
      parsed = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
    } catch {
      throw new Error("Failed to parse blueprint from AI response");
    }

    const outSchema = z.object({
      contentPillars: z.array(z.string().min(1)).min(3).max(5),
      brandVoice: z.string().min(1),
      targetAudience: z.string().min(1),
      monetisationAngle: z.string().min(1),
      youtubeNiche: z.string().min(1),
      brandSummary: z.string().min(1),
    });
    const blueprint = outSchema.parse(parsed);

    try {
      await createNotification(
        userId,
        "blueprint_created",
        "Brand blueprint created",
        `Your Personal Brand Blueprint for ${blueprint.youtubeNiche} is ready.`,
        { niche: blueprint.youtubeNiche },
      );
    } catch (e) {
      console.error("notification failed", e);
    }

    return blueprint;
  });
