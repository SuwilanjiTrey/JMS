// lib/aiServices.ts
export async function queryAI(query: string, context: any) {
  // Call the actual Gemini API, not your own /api/ai endpoint
  const geminiApiKey = process.env.GOOGLE_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Updated to use v1 API with correct model name
  const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

  const prompt = `${query}\n\nContext: ${JSON.stringify(context, null, 2)}`;

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    // Extract the text from Gemini's response structure
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("No response text found in Gemini API response");
    }

    return responseText;
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
