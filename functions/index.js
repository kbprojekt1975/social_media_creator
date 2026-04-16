const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe");
const { generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, generateNanoBananaImage } = require("./gemini");


// Initialize Firebase Admin
// In Cloud Functions, this works automatically with default credentials
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// --- CONFIGURATION ---
const TOKENS_PER_PLN = 1000000; // 1 PLN = 1,000,000 tokens (adjust margin here)
const CREDIT_RATIO = 0.20; // 20% of payment goes to user token balance
const MIN_TOKENS_FOR_GEN = 1000; // Minimal buffer to allow generation
const IMAGE_COST = 10000; // 10,000 tokens for one image (10x a post)

// Helper to get Stripe instance (using secret from environment)
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not set in environment.");
  }
  return stripe(secretKey);
};

// --- ROUTES --- (Stripe extension handles checkout and webhooks)


// Gemini Content Generation
app.post("/generate", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { platform, topic, style, plannedPrompt } = req.body;

    if (!platform || !topic) {
      return res.status(400).json({ error: "Platform and topic are required." });
    }

    const { content, tokens } = await generatePost({ platform, topic, style, plannedPrompt });
    
    // Check balance and deduct cost
    const userRef = db.collection("users").doc(decodedToken.uid);
    
    let historyId = null;
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data() || {};
      const currentBalance = userData.balance || 0;

      if (currentBalance < tokens && currentBalance < MIN_TOKENS_FOR_GEN) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct balance
      t.update(userRef, { 
        balance: admin.firestore.FieldValue.increment(-tokens) 
      });

      // Save to history
      const historyRef = userRef.collection("history").doc();
      historyId = historyRef.id;
      t.set(historyRef, {
        platform,
        topic,
        style,
        content,
        tokensUsed: tokens,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ content, tokensUsed: tokens, historyId });

  } catch (error) {
    if (error.message === "INSUFFICIENT_FUNDS") {
      return res.status(402).json({ error: "Brak tokenów na koncie. Doładuj portfel, aby generować dalej." });
    }
    console.error("Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Generate Image Prompt (using Nano Banana visual engine)
app.post("/generate-image-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { postContent, aspectRatio, platform } = req.body;
    if (!postContent) return res.status(400).send("Post content is required.");

    const prompt = await generateVisualPrompt(postContent, aspectRatio || '1:1', platform || 'Default');
    res.json({ prompt });


  } catch (error) {
    console.error("Prompt Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Generate Post Plan (PEaaS)
app.post("/generate-plan", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { platform, topic, style } = req.body;
    if (!platform || !topic) {
      return res.status(400).json({ error: "Platform and topic are required." });
    }

    const plan = await generatePostPlan({ platform, topic, style });
    res.json({ plan });

  } catch (error) {
    console.error("Plan Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Sync English Prompt with modified Polish Strategy
app.post("/sync-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { polishPlan, platform, topic, style } = req.body;
    if (!polishPlan) return res.status(400).send("Polish plan is required.");

    const englishPrompt = await syncEnglishPrompt({ polishPlan, platform, topic, style });
    res.json({ englishPrompt });

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});


// Endpoint: Generate Image (Nano Banana / Gemini 2.5 Flash Image)
app.post("/generate-image", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { prompt, aspectRatio } = req.body;
    if (!prompt) return res.status(400).send("Prompt is required.");

    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();
    const balance = userDoc.data()?.balance || 0;

    if (balance < IMAGE_COST) {
      return res.status(402).json({ error: "Brak tokenów na obraz. Koszt: 1,000,000 tokenów." });
    }

    // Call Nano Banana (AI Studio) with technical aspectRatio
    const buffer = await generateNanoBananaImage(prompt, aspectRatio || '1:1');


    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `generated/${decodedToken.uid}/${Date.now()}.png`;
    const file = bucket.file(fileName);

    await file.save(buffer, { contentType: 'image/png' });
    await file.makePublic();
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Deduct tokens
    await userRef.update({ 
      balance: admin.firestore.FieldValue.increment(-IMAGE_COST) 
    });

    res.json({ imageUrl: downloadUrl, cost: IMAGE_COST });
  } catch (error) {
    console.error("Nano Banana Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});


// --- STRIPE EXTENSION TOKEN GRANT TRIGGER ---
// Przyznaje tokeny, gdy subskrypcja zostanie utworzona (status active/trialing)
exports.grantTokens = onDocumentCreated({
  document: "customers/{userId}/subscriptions/{subscriptionId}",
  memory: "512MiB"
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const subscription = snapshot.data();
  const userId = event.params.userId;

  // Stripe używa statusów 'active' lub 'trialing'
  if (subscription.status === "active" || subscription.status === "trialing") {
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    if (!userData.lastSubscriptionId || userData.lastSubscriptionId !== event.params.subscriptionId) {
      console.log(`🎁 Przyznawanie 200k tokenów dla ${userId} (Sub: ${event.params.subscriptionId})`);
      await userRef.set({
        balance: admin.firestore.FieldValue.increment(200000),
        lastSubscriptionId: event.params.subscriptionId,
        subscriptionStatus: subscription.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }
});

// Aktualizuje status subskrypcji w dokumencie użytkownika
exports.onSubscriptionUpdate = onDocumentUpdated({
  document: "customers/{userId}/subscriptions/{subscriptionId}",
  memory: "512MiB"
}, async (event) => {
  const after = event.data.after.data();
  const before = event.data.before.data();
  const userId = event.params.userId;

  if ((after.status === "active" || after.status === "trialing") && before.status !== after.status) {
    const userRef = admin.firestore().collection("users").doc(userId);
    await userRef.update({
      subscriptionStatus: after.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});




// Export the app as a Cloud Function
exports.api = onRequest({
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "GEMINI_API_KEY"],
  cors: true,
  memory: "1GiB"
}, app);
