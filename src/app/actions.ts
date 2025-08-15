
"use server";

import { summarizeRequest } from "@/ai/flows/summarize-request";
import { z } from "zod";

const SummarizeRequestStateSchema = z.object({
    summary: z.string().optional(),
    error: z.string().optional(),
});

type SummarizeRequestState = z.infer<typeof SummarizeRequestStateSchema>;

export async function handleSummarizeRequest(
    prevState: SummarizeRequestState,
    formData: FormData
): Promise<SummarizeRequestState> {
    const requestDetails = formData.get("requestDetails");

    if (!requestDetails || typeof requestDetails !== "string") {
        return { error: "Invalid request details provided." };
    }

    try {
        const result = await summarizeRequest({ requestDetails });
        return { summary: result.summary };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to generate summary: ${errorMessage}` };
    }
}
