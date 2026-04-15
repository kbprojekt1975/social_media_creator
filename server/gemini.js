const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getSecret } = require("./secrets");

let genAI;

/**
 * Initializes the Gemini API client.
 */
async function initGemini() {
  if (genAI) return genAI;

  const apiKey = await getSecret("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in secrets or environment.");
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

/**
 * Generates social media content based on platform, topic, and style.
 * @param {Object} params - Generation parameters.
 * @param {string} params.platform - Target platform (e.g., LinkedIn, Instagram).
 * @param {string} params.topic - The main topic or context of the post.
 * @param {string} [params.style] - Optional style/tone (e.g., professional, witty).
 * @returns {Promise<string>} - The generated content.
 */
async function generatePost({ platform, topic, style = "engaging" }) {
  const ai = await initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert social media manager. 
    Create a ${style} post for ${platform} about the following topic:
    
    Topic: ${topic}
    
    Guidelines:
    - Use appropriate hashtags for ${platform}.
    - Ensure the tone matches the requested style: ${style}.
    - If it's for Instagram, include suggestions for visual content description.
    - If it's for LinkedIn, keep it professional but insightful.
    - Keep it concise and impactful.
    
    Response format: Return only the final post content.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate content from Gemini.");
  }
}

module.exports = { generatePost };
