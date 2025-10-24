// Secure Firebase API replacement - all operations go through backend proxy
// This completely eliminates client-side Firebase SDK usage for maximum security

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

interface FirestoreResult {
  success?: boolean;
  id?: string;
  error?: string;
  [key: string]: any;
}

class SecureFirebaseAPI {
  private authToken: string | null = null;
  private currentUser: User | null = null;

  // Authentication methods
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.authToken = result.token;
        this.currentUser = result.user;
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createUserWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.authToken = result.token;
        this.currentUser = result.user;
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  signOut(): void {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('authToken');
    }
    return this.authToken;
  }

  // Firestore operations
  async addDoc(collection: string, data: any): Promise<FirestoreResult> {
    return this.firestoreOperation('add', collection, null, data);
  }

  async setDoc(collection: string, docId: string, data: any): Promise<FirestoreResult> {
    return this.firestoreOperation('set', collection, docId, data);
  }

  async getDoc(collection: string, docId: string): Promise<FirestoreResult> {
    return this.firestoreOperation('get', collection, docId);
  }

  async getDocs(collection: string, query?: any): Promise<FirestoreResult> {
    return this.firestoreOperation('get', collection, null, null, query);
  }

  async updateDoc(collection: string, docId: string, data: any): Promise<FirestoreResult> {
    return this.firestoreOperation('update', collection, docId, data);
  }

  async deleteDoc(collection: string, docId: string): Promise<FirestoreResult> {
    return this.firestoreOperation('delete', collection, docId);
  }

  private async firestoreOperation(
    operation: string, 
    collection: string, 
    docId?: string | null, 
    data?: any, 
    query?: any
  ): Promise<FirestoreResult> {
    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/firestore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          collection,
          docId,
          data,
          query,
          authToken,
        }),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Storage operations
  async uploadFile(fileName: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('operation', 'upload');
      formData.append('authToken', authToken);

      const response = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getFileUrl(fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'download',
          fileName,
          authToken,
        }),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// Create singleton instance
export const secureFirebaseAPI = new SecureFirebaseAPI();

// Export individual methods for easier migration
export const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getCurrentUser,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  uploadFile,
  getFileUrl,
} = secureFirebaseAPI;
