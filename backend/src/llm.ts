import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedReceipt {
  merchant: string;
  date: string;
  lineItems: Array<{ name: string; amount: number }>;
  total: number;
  confidence: number;
}

async function parseReceiptImage(base64Image: string): Promise<ParsedReceipt> {
  const prompt = `You are a receipt parser. Extract the following information from the receipt image:
1. Merchant name
2. Date (ISO format YYYY-MM-DD)
3. Line items (name and amount) - EXCLUDE subtotals, taxes, tips, and delivery fees
4. Total amount (final total to pay)
5. Confidence score (0-1, how confident you are in the extraction)

Return ONLY valid JSON in this format, no markdown or explanation:
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "lineItems": [{"name": "string", "amount": number}],
  "total": number,
  "confidence": number
}

Important:
- Line items should be the actual products/services, not fees or tax
- If date is unclear, use today's date
- Confidence should reflect image quality and clarity
- If any field is missing or unclear, make a reasonable best guess and lower confidence accordingly`;

  try {
    const message = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = message.choices[0].message.content || '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      merchant: parsed.merchant || 'Unknown',
      date: parsed.date || new Date().toISOString().split('T')[0],
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      total: typeof parsed.total === 'number' ? parsed.total : 0,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    };
  } catch (error) {
    console.error('Error parsing receipt:', error);
    throw new Error('Failed to parse receipt image');
  }
}

export { parseReceiptImage };
