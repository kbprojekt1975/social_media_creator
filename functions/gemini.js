const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

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

/**
 * Helper to call Gemini with retry logic for 429 errors.
 */
async function withRetry(fn, maxRetries = 3, delay = 2000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes("429") || error.message?.includes("Resource exhausted");
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`[Gemini Retry] Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw lastError;
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
async function generatePostPlan({ platform, topic, style = "engaging", workspaceContext }) {
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
    
    ${workspaceContext ? `WORKSPACE CONTEXT (MANDATORY RULES):
    - Brand Directives: ${workspaceContext.contentDirectives || "Brak szczegółowych wytycznych."}
    - Visual Aesthetic: ${workspaceContext.visualStyle || "Standardowa estetyka social media."}` : ''}
    
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
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
    let text = response.text().trim();
    
    console.log("Gemini Plan Raw Output:", text);

    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON object found in text:", text);
      throw new Error("MODEL_JSON_ERROR: AI returned no JSON.");
    }
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON Parse Error. Extracted text was:", jsonMatch[0]);
      throw new Error("MODEL_JSON_ERROR: AI returned invalid JSON format.");
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
async function syncEnglishPrompt({ polishPlan, platform, topic, style, workspaceContext }) {
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
    
    ${workspaceContext ? `WORKSPACE CONTEXT (MANDATORY RULES):
    - Brand Directives: ${workspaceContext.contentDirectives || "Brak szczegółowych wytycznych."}
    - Visual Aesthetic: ${workspaceContext.visualStyle || "Standardowa estetyka social media."}` : ''}
    
    Requirements for the Technical Prompt (Target):
    1. Language: Write the prompt in ENGLISH.
    2. Constraint: The prompt must instruct the AI to write the final post in POLISH.
    3. Detail: Include specific instructions on tone, structure, and formatting based on the Polish input.
    
    Response format: Return ONLY the text of the generated instructions. No markdown blocks.
  `;

  try {
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
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
async function generatePost({ platform, topic, style = "engaging", plannedPrompt = null, workspaceContext }) {
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
      
      ${workspaceContext ? `WORKSPACE CONTEXT (MANDATORY RULES):
      - Brand Directives: ${workspaceContext.contentDirectives || "Brak szczegółowych wytycznych."}
      - Visual Aesthetic: ${workspaceContext.visualStyle || "Standardowa estetyka social media."}` : ''}
      
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
    console.log("Generating post for:", platform, "Topic:", topic);
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
    const content = response.text();
    const tokens = response.usageMetadata?.totalTokenCount || 500;
    console.log("Generation successful, tokens:", tokens);
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Post Error Detail:", error);
    throw new Error(`Failed to generate optimized post: ${error.message}`);
  }
}

/**
 * Generates a visual prompt for image or video generation based on a social media post.
 * @param {string} postContent - The content of the post to base the prompt on.
 * @param {string} aspectRatio - The desired format (e.g., '1:1', '9:16', '16:9').
 * @param {string} platform - The target platform for aesthetic optimization.
 * @param {string} type - Visualization type: 'image' (default) or 'video'.
 * @param {Object} workspaceContext - Optional brand workspace context.
 * @returns {Promise<string>} - The generated visual prompt.
 */
async function generateVisualPrompt(postContent, aspectRatio = '1:1', platform = 'Default', type = 'image', workspaceContext = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const aesthetic = IMAGE_AESTHETICS[platform] || IMAGE_AESTHETICS['Default'];

  const prompt = `
    Jesteś dyrektorem kreatywnym i ekspertem od Prompt Engineeringu. 
    Twoim zadaniem jest stworzenie opisu wizualnego dla modelu AI (${type === 'video' ? 'wideo' : 'obraz'}), bazując na treści posta.
    
    Platforma: ${platform}
    Estetyka platformy: ${aesthetic}
    Format: ${aspectRatio}
    
    ${workspaceContext ? `WYTYCZNE PRZESTRZENI ROBOCZEJ (MARKI):
    ${workspaceContext.visualStyle}` : ''}

    Treść posta:
    "${postContent.substring(0, 500)}"
    
    ZWRÓĆ DANE W FORMACIE JSON:
    {
      "polishDescription": "Krótki, sugestywny opis sceny po polsku dla użytkownika (bez technicznego żargonu).",
      "englishPrompt": "Technical English prompt for ${type === 'video' ? 'Veo 3.1' : 'Nano Banana'} (detailed, lighting, composition, camera settings, no text, cinema quality)."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in visual prompt output:", text);
      throw new Error("MODEL_JSON_ERROR: AI returned no JSON for visual prompt.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Visual Prompt Error:", error);
    return {
      polishDescription: `Wysokiej jakości ${type} przedstawiający: ${postContent.substring(0, 50).trim()}...`,
      englishPrompt: `High quality cinematic ${type} of ${postContent.substring(0, 50).trim()}, professional lighting, 8k, highly detailed.`
    };
  }
}

/**
 * Translates a user-edited Polish prompt into a technical English prompt for the generation models.
 */
async function translateToTechnicalPrompt(polishPrompt, type = 'image', aspectRatio = '1:1') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Transform the following Polish visual description into a high-end, technical English prompt for ${type === 'video' ? 'Veo 3.1 Video Generator' : 'Nano Banana Image Generator'}.
    
    Polish Description:
    "${polishPrompt}"
    
    Aspect Ratio: ${aspectRatio}
    
    Requirements for the English Prompt:
    - Strictly in ENGLISH.
    - Use technical terms for lighting, camera lens, and composition.
    - No text in the image/video.
    - For video, include specific motion and camera trajectory instructions.
    - Output ONLY the final technical prompt text.
  `;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Translation Error (Retries Failed):", error);
    return polishPrompt; // Fallback to original if translation fails
  }
}

/**
 * Refines an existing post based on user instructions.
 * @param {string} originalPost - The previously generated post.
 * @param {string} instructions - The user's instructions for refinement.
 * @returns {Promise<Object>} - The refined post content and token count.
 */
async function refinePost(originalPost, instructions, workspaceContext = null) {
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
    
    ${workspaceContext ? `MANDATORY BRAND RULES (WORKSPACE):
    - Tone/Style: ${workspaceContext.contentDirectives}` : ''}
    
    Zastosuj te zmiany do posta. 
    Zwróć TYLKO nową, gotową treść posta w docelowym języku (zawsze po polsku, o ile klient nie poprosił inaczej).
  `;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const content = response.text().trim();
    
    if (!content) {
      throw new Error("Model Gemini zwrócił pustą odpowiedź.");
    }

    const tokens = response.usageMetadata?.totalTokenCount || 250;
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Refine Post Error Details:", error);
    // If it's a safety error or other specific AI error, pass it through
    const errorMessage = error.message?.includes("safety") 
      ? "Treść została zablokowana przez filtry bezpieczeństwa AI." 
      : error.message;
    throw new Error(`Błąd ulepszania posta: ${errorMessage}`);
  }
}

/**
 * Refines a visual prompt using "Deep Scene Reconstruction".
 * Context-aware: takes Version 1 (Anchor) and Last Version to prevent style drift.
 */
async function refineVisualPrompt(v1PromptObject, lastPromptObject, instructions, workspaceContext = null, mediaUrl = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  let promptParts = [];

  // OPTIMIZATION: If we have an image, we send it for multimodal analysis
  if (mediaUrl) {
    try {
      const axios = require('axios');
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      
      promptParts.push({
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      });
    } catch (e) {
      console.error("Multimodal analysis fetch failed:", e);
    }
  }

  const textPrompt = `
    Jesteś ekspertem od edycji wizualnej AI (Visual Auditor). Twoim celem jest stworzenie technicznego promptu, który zachowa 100% spójności z pierwowzorem, wprowadzając jedynie wskazane poprawki.

    KONTEKST (KOTWICA):
    - ORYGINALNY POMYSŁ (V1): "${v1PromptObject?.englishPrompt || v1PromptObject?.polishDescription}"
    - OSTATNI STAN: "${lastPromptObject?.englishPrompt || lastPromptObject?.polishDescription}"
    - ZMIANA UŻYTKOWNIKA: "${instructions}"

    ZADANIA AUDYTU:
    1. Zidentyfikuj relacje przestrzenne (Spatial Relationships) między obiektami na obrazie (np. odległości, pozycje).
    2. Zmapuj oświetlenie (kierunek, temperatura) oraz charakterystykę obiektywu (depth of field).
    3. Zachowaj rysy twarzy i pozę postaci zgodnie z V1 (Seed Persistence).

    HIERARCHIA PROMPTU (BARDZO WAŻNE):
    1. [START]: Kompozycja i relacje przestrzenne (np. "Fixed composition, [A] positioned [X] relative to [B]").
    2. [ŚRODEK]: Mapowanie oświetlenia i technika (np. "Identical lighting mapping, 35mm lens").
    3. [KONIEC]: Szczegóły obiektu i wprowadzona modyfikacja.

    WYMAGANIA:
    - Syntetyzuj opis: Maksymalnie 200 słów. Tylko twarde dane techniczne.
    - Używaj fraz: "Maintaining exact composition", "Photogrammetric consistency".
    - Umieść najważniejsze parametry techniczne na samym początku promptu.

    ZWRÓĆ DANE TYLKO JAKO JSON:
    {
      "polishDescription": "Zwięzły opis zmian po polsku.",
      "englishPrompt": "Hierarchical technical EN prompt (max 200 words).",
      "aiDetectionLog": "Raport dwujęzyczny w formacie: 'PL: [Krótki opis po polsku] | EN: [Technical summary in English]'"
    }
  `;

  promptParts.push(textPrompt);

  try {
    const result = await withRetry(() => model.generateContent(promptParts));
    const response = await result.response;
    const text = response.text().trim();
    
    // Robust JSON extraction for production reliability
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in visual refinement output:", text);
      throw new Error("AI nie zwróciło poprawnego formatu JSON.");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      polishDescription: parsed.polishDescription || "Poprawiony projekt",
      englishPrompt: parsed.englishPrompt || "",
      aiDetectionLog: parsed.aiDetectionLog || "Analiza zakończona pomyślnie"
    };
  } catch (error) {
    console.error("Refine Visual Error (Visual Auditor):", error);
    throw new Error(`Błąd audytu wizualnego: ${error.message}`);
  }
}

/**
 * Synchronizes the English technical prompt based on manual edits to the Polish description.
 */
async function syncVisualPrompt({ polishDescription, aspectRatio = '1:1', type = 'image', workspaceContext = null }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Transform the following Polish visual description into a high-end, technical English prompt for ${type === 'video' ? 'Veo 3.1 Video Generator' : 'Nano Banana Image Generator'}.
    
    Polish Description:
    "${polishDescription}"
    
    Aspect Ratio: ${aspectRatio}
    
    ${workspaceContext ? `MANDATORY BRAND STYLE: ${workspaceContext.visualStyle}` : ''}
    
    Requirements:
    - Strictly in ENGLISH.
    - Technical terminology (lens, lighting, textures).
    - No text in image.
    
    Return ONLY the English prompt text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Sync Visual Prompt Error:", error);
    return `Cinematic ${type} based on: ${polishDescription}`;
  }
}


/**
 * Generates a video using the Veo 3.1 model via Google AI Studio (Gemini API) REST.
 * We use predictLongRunning as it's the only supported method for this model.
 */
async function generateVeoVideo(visualPrompt, aspectRatio = '1:1', imageBase64 = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found.");

  const modelId = "models/veo-3.1-lite-generate-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:predictLongRunning?key=${apiKey}`;

  const instance = { prompt: visualPrompt };
  if (imageBase64) {
    instance.image = {
      bytesBase64Encoded: imageBase64,
      mimeType: "image/png"
    };
  }

  const payload = {
    instances: [instance],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      durationSeconds: 6
    }
  };

  console.log("Initiating Veo 3.1 via AI Studio REST (predictLongRunning)...");

  try {
    const response = await axios.post(url, payload);
    const data = response.data;

    if (data.name) {
      console.log("Video generation started as LRO in AI Studio:", data.name);
      return { status: "processing", operationName: data.name };
    } else {
      console.log("Unexpected AI Studio REST Response:", JSON.stringify(data, null, 2));
      throw new Error("Nie otrzymano nazwy operacji z AI Studio.");
    }
  } catch (error) {
    console.error("AI Studio REST Video Error:", error.response?.data || error.message);
    throw new Error(`Błąd AI Studio (REST): ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Generates an image using the Nano Banana (Gemini 3.1 Flash Image) model via REST API.
 * Supports Image-to-Image by providing originalImageBase64 as context.
 */
async function generateNanoBananaImage(visualPrompt, aspectRatio = '1:1', originalImageBase64 = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ 
      parts: [
        // If we have an original image, provide it as context for Image-to-Image refinement
        ...(originalImageBase64 ? [{ inlineData: { data: originalImageBase64, mimeType: "image/png" } }] : []),
        { text: visualPrompt }
      ] 
    }],
    generationConfig: {
      responseModalities: ["IMAGE"]
    }
  };

  try {
    const response = await axios.post(url, payload);
    const data = response.data;
    
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (part && part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    } else {
      console.error("Nano Banana REST Response Error:", JSON.stringify(data, null, 2));
      throw new Error("Nie otrzymano danych obrazu z modelu Nano Banana.");
    }
  } catch (error) {
    console.error("Nano Banana REST Error:", error.response?.data || error.message);
    throw new Error(`Błąd techniczny generowania obrazu: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Generates a full campaign plan based on multiple parameters.
 */
async function generateCampaignPlan(data) {
  const { 
    name, 
    goal, 
    productDescription, 
    usp, 
    duration, 
    platforms,
    intensity,
    toneOfVoice,
    mainCTA,
    targetAudience,
    problemSolved,
    workspaceContext
  } = data;

  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const platformRules = platforms.map(p => `[${p}]: ${PLATFORM_RULES[p] || PLATFORM_RULES['Default']}`).join('\n');

  const prompt = `
    Jesteś dyrektorem marketingu i ekspertem od strategii social media. Twoim zadaniem jest stworzenie kompletnej strategii kampanii.

    DANE KAMPANII:
    - Nazwa: ${name}
    - Cele: ${goal}
    - Produkt/Usługa: ${productDescription}
    - USP (Unikalna wartość): ${usp}
    - Rozwiązywany problem: ${problemSolved || 'Nie określono'}
    - Grupa docelowa (Persona): ${targetAudience}
    - Czas trwania: ${duration} dni
    - Platformy: ${platforms.join(', ')}
    - Intensywność/Faza: ${intensity} (Steady = stały szum, Teaser-Launch = budowanie napięcia, Sprint = agresywna sprzedaż)
    - Ton komunikacji: ${toneOfVoice}
    - Główne CTA: ${mainCTA || 'Nie określono'}

    ${workspaceContext ? `WYTYCZNE MARKI (MANDATORY):
    - Strategia treści: ${workspaceContext.contentDirectives}
    - Estetyka wizualna: ${workspaceContext.visualStyle}` : ''}

    ZASADY DLA KANAŁÓW:
    ${platformRules}

    WYMAGANIA DOTYCZĄCE WYJŚCIA (JSON):
    Stwórz listę postów (harmonogram), rozłożoną w czasie. 
    Dla każdego elementu podaj:
    1. "day": numer dnia lub etap (np. "Dzień 1", "Dzień 3").
    2. "platform": na którą platformę jest ten post.
    3. "topic": konkretny temat posta (krótki, gotowy do wrzucenia do generatora).
    4. "visualIdea": sugestia co powinno być na obrazku/wideo.
    5. "rationale": dlaczego ten post realizuje cel: ${goal}.

    ZWRÓĆ DANE TYLKO W FORMACIE JSON (tablica obiektów):
    [
      {
        "day": "string",
        "platform": "string",
        "topic": "string",
        "visualIdea": "string",
        "rationale": "string"
      }
    ]

    Pamiętaj o specyfice platform: 
    - LinkedIn: merytoryka, autorytet, B2B.
    - TikTok/IG: energia, trendy, wizualny "wow".
    - FB: społeczność, relacje.

    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Robust JSON extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("MODEL_JSON_ERROR: AI nie zwróciło poprawnego formatu JSON.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Campaign Plan Error:", error);
    throw new Error(`Błąd generowania kampanii: ${error.message}`);
  }
}

/**
 * Refines a custom campaign goal using AI.
 */
async function refineCampaignGoal(rawGoal) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Jesteś ekspertem od strategii marketingowej. Użytkownik podał własny cel kampanii, który może być niejasny lub mało profesjonalny.
    Twoim zadaniem jest zredagowanie go tak, aby brzmiał jak profesjonalny cel biznesowy (SMART), zachowując jednak intencję użytkownika.

    SUROWY CEL UŻYTKOWNIKA:
    "${rawGoal}"

    ZWRÓĆ DANE W FORMACIE JSON:
    {
      "refinedGoal": "Krótka, profesjonalna nazwa celu (np. 'Zwiększenie retencji klientów o 20%')",
      "description": "Rozwinięcie celu i uzasadnienie strategiczne (max 2 zdania)."
    }

    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI nie zwróciło poprawnego formatu JSON.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Refine Goal Error:", error);
    throw new Error("Nie udało się zredagować celu.");
  }
}

/**
 * Refines a product description using AI.
 */
async function refineProductDescription(rawDescription) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Jesteś copywriterem sprzedażowym. Użytkownik podał opis swojego produktu lub usługi.
    Twoim zadaniem jest zredagowanie go tak, aby brzmiał profesjonalnie, zachęcająco i podkreślał korzyści, zachowując jednak wszystkie fakty podane przez użytkownika.

    SUROWY OPIS:
    "${rawDescription}"

    ZWRÓĆ TYLKO ZREDAGOWANY TEKST (max 3-4 zdania).
    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Refine Product Error:", error);
    throw new Error("Nie udało się zredagować opisu produktu.");
  }
}

/**
 * Refines a USP (Unique Selling Proposition) using AI.
 */
async function refineUSP(rawUSP) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Jesteś ekspertem od brandingu. Użytkownik podał swoje USP (Unique Selling Proposition).
    Twoim zadaniem jest zredagowanie go tak, aby było krótkie, uderzające (punchy) i zapadało w pamięć.

    SUROWY USP:
    "${rawUSP}"

    ZWRÓĆ TYLKO ZREDAGOWANE USP (max 1 zdanie).
    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Refine USP Error:", error);
    throw new Error("Nie udało się zredagować USP.");
  }
}

module.exports = { generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, translateToTechnicalPrompt, generateNanoBananaImage, generateVeoVideo, refinePost, refineVisualPrompt, generateCampaignPlan, refineCampaignGoal, refineProductDescription, refineUSP };


