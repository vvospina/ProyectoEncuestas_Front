import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../../../environment/environment';
import { getFirestore } from 'firebase/firestore';

/**
 * Aquí prendemos Firebase UNA sola vez para toda la app.
 * Cualquier archivo que necesite hablar con Firebase Authentication
 * debe importar `firebaseAuth` desde aquí, nunca crear su propia
 * instancia con initializeApp().
 */
const firebaseApp = initializeApp(environment.firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const firestoreDb = getFirestore(firebaseApp);
