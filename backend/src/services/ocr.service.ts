import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ParsedWord {
  word: string;
  meaning: string;
  example: string;
}

export async function parseTextToWords(text: string): Promise<ParsedWord[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an English vocabulary extractor.
Given the following text, extract all English vocabulary words with their meanings and example sentences.
Return ONLY a valid JSON array. No markdown, no code fences, no explanation whatsoever.
Each item must have exactly these fields: "word" (English word), "meaning" (Korean or English meaning), "example" (example sentence).
If no vocabulary words are found, return an empty array [].

Text:
${text}

JSON:`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip accidental markdown code fences
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
    return parsed as ParsedWord[];
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${json.slice(0, 300)}`);
  }
}
