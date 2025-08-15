"use server";

import { summarizeClaim } from "@/ai/flows/summarize-claim";
import { z } from "zod";

const SummarizeClaimStateSchema = z.object({
    summary: z.string().optional(),
    error: z.string().optional(),
});

type SummarizeClaimState = z.infer<typeof SummarizeClaimStateSchema>;

export async function handleSummarizeClaim(
    prevState: SummarizeClaimState,
    formData: FormData
): Promise<SummarizeClaimState> {
    const claimDetails = formData.get("claimDetails");

    if (!claimDetails || typeof claimDetails !== "string") {
        return { error: "Invalid claim details provided." };
    }

    try {
        const result = await summarizeClaim({ claimDetails });
        return { summary: result.summary };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to generate summary: ${errorMessage}` };
    }
}
