const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI;

/**
 * Initializes the Gemini API client.
 */
function initGemini() {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment.");
    return null;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

const PLATFORM_RULES = {
  'LinkedIn': 'Style: Professional, authoritative, industry-expert tone. Structure: Strong hook, bullet points for readability, professional storytelling, 3-5 relevant hashtags. Goal: B2B authority.',
  'Facebook': 'Style: Engaging, community-focused, relatable tone. Structure: Conversational, question at the end to boost comments, emojis throughout, 2-3 hashtags. Goal: High engagement/reach.',
  'Instagram': 'Style: Vibrant, lifestyle-oriented, punchy tone. Structure: Short sentences, many emojis, storytelling focus, up to 15 relevant hashtags. Goal: Visual impact/brand image.',
  'Default': 'Style: Engaging and helpful social media manager tone. Structure: Balanced hook, clear information, and relevant hashtags.'
};

const IMAGE_AESTHETICS = {
  'LinkedIn': 'Professional business photography, clean 3D render, minimalist corporate office, professional studio lighting, neutral or blue-toned color palette. Cinematic and high-end B2B look.',
  'Facebook': 'Relatable lifestyle photography, vibrant outdoor or home settings, friendly and warm lighting, natural colors. Emotional and community-oriented aesthetic.',
  'Instagram': 'High-fashion aesthetic, vibrant and saturated colors, creative and trendy compositions, soft sunset or neon lighting, shallow depth of field. Trendy and visually "pop" aesthetic.',
  'Default': 'High-quality professional photography with balanced lighting and clear subjects.'
};

/**
 * Generates social media content based on platform, topic, and style.
 * @param {Object} params - Generation parameters.
 * @param {string} params.platform - Target platform (e.g., LinkedIn, Instagram).
 * @param {string} params.topic - The main topic or context of the post.
 * @param {string} [params.style] - Optional style/tone (e.g., professional, witty).
 * @returns {Promise<string>} - The generated content.
 */
async function generatePost({ platform, topic, style = "engaging" }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES['Default'];

  const prompt = `
    You are a world-class social media strategist. 
    Create a highly optimized ${style} post for ${platform} about the following topic:
    
    Topic: ${topic}
    
    Platform-Specific Strategy: ${rules}
    
    Language: ALWAYS respond in POLISH.
    Content structure: 
    1. Chwytliwy nagłówek (Hook)
    2. Wartościowa treść (Body)
    3. Wezwanie do działania (Call to Action)
    4. Odpowiednie hashtagi
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Post Error:", error);
    throw new Error("Failed to generate optimized post.");
  }
}

/**
 * Generates a visual prompt for image generation based on a social media post, platform and aspect ratio.
 * @param {string} postContent - The content of the post to base the prompt on.
 * @param {string} aspectRatio - The desired format (e.g., '1:1', '9:16', '16:9').
 * @param {string} platform - The target platform for aesthetic optimization.
 * @returns {Promise<string>} - The generated visual prompt.
 */
async function generateVisualPrompt(postContent, aspectRatio = '1:1', platform = 'Default') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const aesthetic = IMAGE_AESTHETICS[platform] || IMAGE_AESTHETICS['Default'];

  const formatDescription = 
    aspectRatio === '9:16' ? 'vertical Story/Reels format (9:16 aspect ratio). Focus on a vertical composition with the main subject centered.' :
    aspectRatio === '16:9' ? 'landscape format (16:9 aspect ratio). Create a wide, cinematic composition.' :
    aspectRatio === '4:5' ? 'portrait format (4:5 aspect ratio). Optimized for Instagram feed.' :
    'square format (1:1 aspect ratio). Balanced composition.';

  const prompt = `
    Create a perfect visual prompt for an image generator (like Imagen 3) based on this social media post.
    Platform Aesthetics to target: ${aesthetic}
    Image Format: ${formatDescription}

    Post Content snippet for context: ${postContent.substring(0, 300)}
    
    Instructions:
    - Describe a single, powerful scene that reflects the post's message.
    - Focus on lighting, composition, and specific stylistic keywords from the aesthetics guide.
    - Zero text in the image.
    - Output exactly one detailed paragraph of visual description.
    
    Visual Prompt:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Prompt Error:", error);
    return "A professional high-quality image representing the core topic of the post.";
  }
}

/**
 * Generates an image using the Nano Banana (Gemini 3.1 Flash Image) model.
 * @param {string} visualPrompt - The descriptive prompt for the image.
 * @param {string} aspectRatio - The desired format (e.g., '1:1', '9:16', '16:9').
 * @returns {Promise<Buffer>} - The generated image data.
 */
async function generateNanoBananaImage(visualPrompt, aspectRatio = '1:1') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  // Using the absolute latest model ID (Nano Banana 2/3.1)
  const model = ai.getGenerativeModel({ 
    model: "gemini-3.1-flash-image-preview",
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspect_ratio: aspectRatio
      }
    }
  });

  try {
    const result = await model.generateContent(visualPrompt);
    const response = await result.response;
    
    // Look for the binary image part in the response
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    
    if (part && part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    } else {
      // Direct text fallback (sometimes preview models return base64 in text field)
      const text = response.text();
      if (text && text.length > 500) return Buffer.from(text, 'base64');
      throw new Error("No image data part found in 3.1 response.");
    }
  } catch (error) {
    console.error("Nano Banana 3.1 Image Error:", error);
    throw new Error(`Technical failure creating ${aspectRatio} image. Check API limits or model availability.`);
  }
}

module.exports = { generatePost, generateVisualPrompt, generateNanoBananaImage };


