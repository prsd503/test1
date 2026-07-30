app.get('/', (req, res) => {
  res.status(200).send('Hello, World! Backend is running.');
});
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios'); // Optional, if you want to verify reCAPTCHA via API

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  // Replace escaped newlines or literal escaped slash-n sequences
  privateKey = privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  })
});

const db = admin.firestore();
const app = express();

app.use(cors({ origin: 'https://prsd503.github.io' }));
app.use(express.json());

// Example API endpoint that fetches data from Firebase
app.get('/api/get-data', async (req, res) => {
  try {
    const snapshot = await db.collection('your-collection').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example API endpoint with reCAPTCHA verification using your secret key
app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is missing' });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    
    const response = await axios.post(verifyUrl);
    if (response.data.success) {
      return res.status(200).json({ success: true, message: 'reCAPTCHA verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed', errors: response.data['error-codes'] });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
