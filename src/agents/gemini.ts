import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env";

export async function connectGeminiSession(onText: (text: string) => void) {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

	const genAI = new GoogleGenerativeAI(apiKey);

	const model = genAI.getGenerativeModel({
		model: env.GEMINI_MODEL,
	});

	return {
		async sendFrame(base64Jpeg: string) {
			const result = await model.generateContent([
				"Describe what you see in this screenshot and give advice.",
				{
					inlineData: {
						data: base64Jpeg,
						mimeType: "image/jpeg",
					},
				},
			]);

			const text = result.response.text();
			onText(text);
		},
	};
}
