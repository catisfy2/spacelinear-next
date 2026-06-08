import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateQuizFromMaterial } from "@/lib/inngest/functions";
import { generateStudyPlan } from "@/lib/inngest/plan-functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateQuizFromMaterial, generateStudyPlan],
});
