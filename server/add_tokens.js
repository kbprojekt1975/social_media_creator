const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function addTokens() {
  const db = admin.firestore();
  try {
    // Pobierz wszystkich zalogowanych użytkowników z Firebase Auth
    const listUsersResult = await admin.auth().listUsers(100);
    
    if (listUsersResult.users.length === 0) {
      console.log('Brak autoryzowanych użytkowników.');
      return;
    }

    const batch = db.batch();
    listUsersResult.users.forEach(userRecord => {
      const userRef = db.collection('users').doc(userRecord.uid);
      batch.set(userRef, { 
        balance: 50000000, 
        email: userRecord.email
      }, { merge: true });
      console.log(`Dodano środki dla: ${userRecord.email} (${userRecord.uid})`);
    });

    await batch.commit();
    console.log('Gotowe! Doładowano konta wszystkim użytkownikom.');
  } catch (error) {
    console.error('Błąd:', error);
  }
}

addTokens();
