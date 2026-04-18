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

const STYLE_GUIDELINES = {
  'Profesjonalny': 'Tone: Expert, reliable, and authoritative. Use clear, industry-standard language. Focus on facts and insights.',
  'Humorystyczny': 'Tone: Funny, witty, and lighthearted. Use wordplay, clever observations, and appropriate humor. Keep it relatable and entertaining.',
  'Entuzjastyczny': 'Tone: High energy, positive, and motivating. Use exclamations (sparingly but effectively), encouraging words, and a "can-do" attitude.',
  'Nietuzinkowy': 'Tone: Unique, bold, and unconventional. Think outside the box, use surprising metaphors, and challenge the status quo. Be provocative but tasteful.',
  'Default': 'Tone: Engaging, helpful, and balanced.'
};

/**
 * Generates technical instructions (prompt) for a social media post.
 * @param {Object} params - Parameters.
 */
async function generatePostPlan({ platform, topic, style = "engaging" }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES['Default'];

  const prompt = `
    You are a professional Prompt Engineer and Social Media Strategist.
    Goal: Write a detailed instruction (prompt) for an AI model to write a post.
    
    Topic: ${topic}
    Platform: ${platform}
    Style: ${style}
    Style Guidelines: ${STYLE_GUIDELINES[style] || STYLE_GUIDELINES['Default']}
    
    Requirements for the output JSON:
    1. "polishPlan": A user-friendly summary of the strategy in POLISH (max 3-4 sentences).
    2. "englishPrompt": A technical, highly detailed instruction for another AI model in ENGLISH. 
       This instruction must specifically mention that the final post must be in POLISH.
       Include ${rules} and ${style} guidelines.
    
    JSON Schema:
    {
      "polishPlan": "string",
      "englishPrompt": "string"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    console.log("Gemini Plan Raw Output:", text);

    // Clean up potential markdown code blocks
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error. Raw text was:", text);
      throw new Error("MODEL_JSON_ERROR: AI returned invalid format.");
    }

    // Normalize keys
    const normalized = {
      polishPlan: jsonResponse.polishPlan || jsonResponse.PolishPlan || jsonResponse.polish_plan || "",
      englishPrompt: jsonResponse.englishPrompt || jsonResponse.EnglishPrompt || jsonResponse.english_prompt || ""
    };

    if (!normalized.polishPlan && !normalized.englishPrompt) {
       throw new Error("EMPTY_FIELDS: AI returned empty plan.");
    }

    return normalized;
  } catch (error) {
    console.error("Gemini Plan Error:", error);
    return {
      polishPlan: `💡 Błąd planowania: ${error.message}. Spróbuj ponownie lub użyj domyślnego promptu poniżej.`,
      englishPrompt: `Write a high-quality LinkedIn post in POLISH about ${topic}. Tone: ${style}. Platform rules: ${platform}.`
    };
  }
}

/**
 * Transforms a modified Polish strategy into a fresh technical English prompt.
 * @param {Object} params - Parameters.
 */
async function syncEnglishPrompt({ polishPlan, platform, topic, style }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `
    You are an expert Prompt Engineer. 
    Transform the following Polish strategy into a highly detailed, technical English instruction (prompt) for an AI model that will write the final post.
    
    Context:
    - Topic: ${topic}
    - Platform: ${platform}
    - Style: ${style}
    
    User's Polish Strategy (Source):
    "${polishPlan}"
    
    Requirements for the Technical Prompt (Target):
    1. Language: Write the prompt in ENGLISH.
    2. Constraint: The prompt must instruct the AI to write the final post in POLISH.
    3. Detail: Include specific instructions on tone, structure, and formatting based on the Polish input.
    
    Response format: Return ONLY the text of the generated instructions. No markdown blocks.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Sync Prompt Error:", error);
    throw new Error("Failed to synchronize English instructions.");
  }
}

/**
 * Generates social media content based on platform, topic, and style.
 * @param {Object} params - Generation parameters.
 * @param {string} params.platform - Target platform.
 * @param {string} params.topic - The main topic.
 * @param {string} [params.style] - Optional style.
 * @param {string} [params.plannedPrompt] - Optional pre-generated instructions.
 * @returns {Promise<Object>} - The generated content and token count.
 */
async function generatePost({ platform, topic, style = "engaging", plannedPrompt = null }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES['Default'];

  let prompt;
  if (plannedPrompt) {
    prompt = `
      Follow these specific instructions to write a social media post:
      ---
      ${plannedPrompt}
      ---
      Original context (if not covered above):
      Topic: ${topic}
      Platform: ${platform}
      Style: ${style}
      
      Output ONLY the post content.
    `;
  } else {
    prompt = `
      You are a world-class social media strategist. 
      Create a highly optimized ${style} post for ${platform} about the following topic:
      
      Topic: ${topic}
      Style: ${style}
      Style Guidelines: ${STYLE_GUIDELINES[style] || STYLE_GUIDELINES['Default']}
      
      Platform-Specific Strategy: ${rules}
      
      Language: ALWAYS respond in POLISH.
      Content structure: 
      1. Chwytliwy nagłówek (Hook)
      2. Wartościowa treść (Body)
      3. Wezwanie do działania (Call to Action)
      4. Odpowiednie hashtagi
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    const tokens = response.usageMetadata?.totalTokenCount || 500; // Fallback
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Post Error:", error);
    throw new Error("Failed to generate optimized post.");
  }
}

/**
 * Generates a visual prompt for image or video generation based on a social media post.
 * @param {string} postContent - The content of the post to base the prompt on.
 * @param {string} aspectRatio - The desired format (e.g., '1:1', '9:16', '16:9').
 * @param {string} platform - The target platform for aesthetic optimization.
 * @param {string} type - Visualization type: 'image' (default) or 'video'.
 * @returns {Promise<string>} - The generated visual prompt.
 */
async function generateVisualPrompt(postContent, aspectRatio = '1:1', platform = 'Default', type = 'image') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const aesthetic = IMAGE_AESTHETICS[platform] || IMAGE_AESTHETICS['Default'];

  const formatDescription = 
    aspectRatio === '9:16' ? 'vertical format (9:16 aspect ratio).' :
    aspectRatio === '16:9' ? 'landscape format (16:9 aspect ratio).' :
    aspectRatio === '4:5' ? 'portrait format (4:5 aspect ratio).' :
    'square format (1:1 aspect ratio).';

  const motionDirectives = type === 'video' 
    ? `SPECIFIC VIDEO INTRUCTIONS: Focus on movement and cinematic motion. 
       Describe camera movement (pan, tilt, zoom, or dolly). 
       Describe the action and speed of movement (e.g., slow motion, high speed, fluid transition). 
       The scene should feel ALIVE and dynamic.`
    : `IMAGE INSTRUCTIONS: Focus on a powerful static composition. Detail textures, lighting, and a single moment in time.`;

  const prompt = `
    You are a professional visual director. Create a perfect prompt for an AI ${type === 'video' ? 'video' : 'image'} generator.
    Platform Aesthetics: ${aesthetic}
    Format: ${formatDescription}
    
    ${motionDirectives}

    Post Content for context: ${postContent.substring(0, 300)}
    
    Final Instructions:
    - Describe a single, powerful cinematic scene.
    - Focus on professional lighting and high-end composition.
    - Zero text in the visuals.
    - Output exactly one detailed, technical paragraph in ENGLISH.
    
    ${type === 'video' ? 'Video' : 'Visual'} Prompt:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini Prompt Error:", error);
    return `A high-quality ${type} representing the topic: ${postContent.substring(0, 50)}...`;
  }
}

/**
 * Refines an existing post based on user instructions.
 * @param {string} originalPost - The previously generated post.
 * @param {string} instructions - The user's instructions for refinement.
 * @returns {Promise<Object>} - The refined post content and token count.
 */
async function refinePost(originalPost, instructions) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Jesteś profesjonalnym Social Media Managerem.
    Masz poniższy wygenerowany post:
    ---
    ${originalPost}
    ---
    
    Klient poprosił o wprowadzenie następujących zmian:
    "${instructions}"
    
    Zastosuj te zmiany do posta. 
    Zwróć TYLKO nową, gotową treść posta w docelowym języku (zawsze po polsku, o ile klient nie poprosił inaczej).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    const tokens = response.usageMetadata?.totalTokenCount || 250;
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Refine Post Error:", error);
    throw new Error("Nie udało się zaktualizować posta.");
  }
}

/**
 * Refines a visual prompt based on user instructions.
 * @param {string} originalPrompt - The previously generated English prompt.
 * @param {string} instructions - The user's instructions in Polish.
 * @returns {Promise<string>} - The updated English prompt.
 */
async function refineVisualPrompt(originalPrompt, instructions) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    You are a professional visual Prompt Engineer guiding an image/video AI model.
    You have the following original technical prompt (in English):
    ---
    ${originalPrompt}
    ---
    
    The user requested the following change (usually in Polish):
    "${instructions}"
    
    Update the original English technical prompt to reflect the user's requested change.
    Return ONLY the updated English technical prompt. Do not add any conversational text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini Refine Visual Prompt Error:", error);
    throw new Error("Nie udało się zaktualizować opisu wizualnego.");
  }
}


/**
 * Generates a video using the Veo 3.1 Lite model.
 * @param {string} visualPrompt - The descriptive prompt for the video.
 * @param {string} aspectRatio - The desired format (e.g., '1:1', '9:16', '16:9').
 * @returns {Promise<Buffer>} - The generated video data (MP4).
 */
async function generateVeoVideo(visualPrompt, aspectRatio = '1:1') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  // Veo 3.1 Lite is optimized for speed/cost (0.05-0.08$)
  const model = ai.getGenerativeModel({ 
    model: "veo-3.1-lite-generate-preview",
    generationConfig: {
      responseModalities: ["VIDEO"],
      videoConfig: {
        aspect_ratio: aspectRatio
      }
    }
  });

  try {
    const result = await model.generateContent(visualPrompt);
    const response = await result.response;
    
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    
    if (part && part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    } else {
      throw new Error("No video data part found in Veo response.");
    }
  } catch (error) {
    console.error("Veo 3.1 Lite Error:", error);
    throw new Error(`Technical failure creating video. Check model availability or API limits.`);
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
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    
    if (part && part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    } else {
      throw new Error("No image data part found in 3.1 response.");
    }
  } catch (error) {
    console.error("Nano Banana Image Error:", error);
    throw new Error(`Technical failure creating ${aspectRatio} image.`);
  }
}

module.exports = { generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, generateNanoBananaImage, generateVeoVideo, refinePost, refineVisualPrompt };


