require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const { getSecret } = require('./secrets');
const { generatePost } = require('./gemini');


// Service Account Initialization
try {
  const serviceAccount = require("./serviceAccountKey.json");
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.warn("⚠️  WARNING: Firebase Emulators detected in environment variables!");
    console.warn(`Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST || 'Not set'}`);
    console.warn(`Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'Not set'}`);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`
  });
  
  console.log(`✅ Firebase Admin initialized for project: ${projectId}`);
} catch (e) {
  console.error("❌ Firebase Admin could not be initialized. Make sure serviceAccountKey.json is present and valid.");
  console.error(e.message);
}

let db;
if (admin.apps.length > 0) {
  db = admin.firestore();
  console.log("📂 Firestore connection established (Real Firebase)");
} else {
  console.warn("⚠️ Firestore will not be available because Firebase Admin was not initialized.");
}
const app = express();

let stripeInstance;
async function getStripe() {
  if (!stripeInstance) {
    const secretKey = await getSecret('STRIPE_SECRET_KEY');
    stripeInstance = require('stripe')(secretKey);
  }
  return stripeInstance;
}

// Stripe Webhook needs raw body
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const stripe = await getStripe();
  const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;

    // Update user in Firestore
    await db.collection('users').doc(userId).set({
      subscription: {
        status: 'active',
        plan: planId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    console.log(`Updated subscription for user: ${userId}`);
  }

  res.json({received: true});
});

app.use(cors());
app.use(express.json());

// Global Debug Log
app.use((req, res, next) => {
  fs.appendFileSync('auth_errors.log', `[${new Date().toISOString()}] ${req.method} ${req.url}\n`);
  next();
});

// Auth Middleware
const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    fs.appendFileSync('auth_errors.log', `[${new Date().toISOString()}] Missing token\n`);
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Verify Token Error:', error.message);
    fs.appendFileSync('auth_errors.log', `[${new Date().toISOString()}] Verify Token Error: ${error.message}\n`);
    res.status(401).send('Invalid token');
  }
};

app.post('/create-checkout-session', verifyToken, async (req, res) => {
  console.log(`💳 Incoming checkout request from user: ${req.user.uid} for price: ${req.body.priceId}`);
  const { priceId } = req.body;
  const userId = req.user.uid;
  const stripe = await getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/payment',
      metadata: {
        userId: userId,
        planId: priceId
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate', verifyToken, async (req, res) => {
  const { platform, topic, style } = req.body;

  if (!platform || !topic) {
    return res.status(400).json({ error: 'Platform and topic are required.' });
  }

  try {
    const content = await generatePost({ platform, topic, style });
    
    // Optional: Save to history in Firestore
    await db.collection('users').doc(req.user.uid).collection('history').add({
      platform,
      topic,
      style,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ content });
  } catch (error) {
    console.error('API Generate Error:', error);
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running and listening on: http://0.0.0.0:${PORT}`);
  console.log(`🔗 Local reach: http://localhost:${PORT}`);
});
