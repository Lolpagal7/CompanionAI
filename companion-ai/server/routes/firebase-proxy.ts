import { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';

// Extend Request interface for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin SDK (server-side only)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Secure authentication proxy
export async function handleAuthSignIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    // Create a custom token for the user
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    res.json({ 
      success: true, 
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      }
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
}

export async function handleAuthSignUp(req: Request, res: Response) {
  try {
    const { email, password, displayName } = req.body;
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });
    
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    res.json({ 
      success: true, 
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// Secure Firestore proxy
export async function handleFirestoreOperation(req: Request, res: Response) {
  try {
    const { operation, collection, docId, data, query, authToken } = req.body;
    
    // Verify the custom token
    const decodedToken = await auth.verifyIdToken(authToken);
    const uid = decodedToken.uid;
    
    let result;
    
    switch (operation) {
      case 'get':
        if (docId) {
          const doc = await db.collection(collection).doc(docId).get();
          if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
          }
          const docData = doc.data();
          if (docData?.userId !== uid) {
            return res.status(403).json({ error: 'Unauthorized access' });
          }
          result = { id: doc.id, ...docData };
        } else {
          // Query with user filtering
          let queryRef = db.collection(collection).where('userId', '==', uid);
          
          if (query?.orderBy) {
            queryRef = queryRef.orderBy(query.orderBy.field, query.orderBy.direction);
          }
          if (query?.limit) {
            queryRef = queryRef.limit(query.limit);
          }
          
          const snapshot = await queryRef.get();
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        break;
        
      case 'set':
        await db.collection(collection).doc(docId).set({ ...data, userId: uid });
        result = { success: true };
        break;
        
      case 'add':
        const docRef = await db.collection(collection).add({ ...data, userId: uid });
        result = { id: docRef.id, success: true };
        break;
        
      case 'update':
        const updateDocRef = db.collection(collection).doc(docId);
        const updateDoc = await updateDocRef.get();
        if (!updateDoc.exists || updateDoc.data()?.userId !== uid) {
          return res.status(403).json({ error: 'Unauthorized access' });
        }
        await updateDocRef.update(data);
        result = { success: true };
        break;
        
      case 'delete':
        const deleteDocRef = db.collection(collection).doc(docId);
        const deleteDoc = await deleteDocRef.get();
        if (!deleteDoc.exists || deleteDoc.data()?.userId !== uid) {
          return res.status(403).json({ error: 'Unauthorized access' });
        }
        await deleteDocRef.delete();
        result = { success: true };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('Firestore operation error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Secure storage proxy
export async function handleStorageOperation(req: MulterRequest, res: Response) {
  try {
    const { operation, fileName, authToken } = req.body;
    
    // Verify the custom token
    const decodedToken = await auth.verifyIdToken(authToken);
    const uid = decodedToken.uid;
    
    const bucket = storage.bucket();
    const filePath = `users/${uid}/${fileName}`;
    
    switch (operation) {
      case 'upload':
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No file provided' });
        }
        
        const fileRef = bucket.file(filePath);
        await fileRef.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });
        
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        
        res.json({ success: true, url, path: filePath });
        break;
        
      case 'download':
        const downloadFileRef = bucket.file(filePath);
        const [downloadUrl] = await downloadFileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        
        res.json({ success: true, url: downloadUrl });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error: any) {
    console.error('Storage operation error:', error);
    res.status(500).json({ error: error.message });
  }
}

export { upload };
