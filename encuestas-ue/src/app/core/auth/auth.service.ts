import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, User, browserLocalPersistence, OAuthProvider, onAuthStateChanged, setPersistence, signInWithEmailAndPassword,
  signInWithPopup, signOut, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.config';
import { environment } from '../../../environment/environment';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '../config/firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = firebaseAuth;

  currentUser = signal<User | null>(null);
  errorMessage = signal<string | null>(null);
  photoBase64 = signal<string | null>(null);
  loading = signal(false);
  
  // 1. Declaración de las signals faltantes
  authReady = signal<boolean>(false);
  profileUpdateSuccess = signal<boolean>(false);
  passwordResetSent = signal(false);
  userRole = signal<'ADMIN' | 'USER' | null>(null);

  constructor(private router: Router) {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);
      await this.actualizarRol(user);
      await this.cargarFotoPerfil(user);
      this.authReady.set(true);
      this.resolverAuthReady();
    });
  }

  // 2. Método wrapper para actualizar la signal del rol cuando cambia el Auth State
  private async actualizarRol(user: User | null): Promise<void> {
    if (!user) {
      this.userRole.set(null);
      return;
    }
    const rol = await this.obtenerRol();
    this.userRole.set(rol);
  }
  private resolverAuthReady!: () => void;
  readonly authReadyPromise = new Promise<void>((resolve) => {
    this.resolverAuthReady = resolve;
  });

  private async cargarFotoPerfil(user: User | null): Promise<void> {
    if (!user) {
      this.photoBase64.set(null);
      return;
    }
    const snapshot = await getDoc(doc(firestoreDb, 'users', user.uid));
    this.photoBase64.set(snapshot.exists() ? (snapshot.data()['photoBase64'] ?? null) : null);
  }

  async updateUserProfile(nombre: string, apellido: string, fotoBase64?: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.profileUpdateSuccess.set(false);
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado.');

      await updateProfile(user, { displayName: `${nombre} ${apellido}`.trim() });

      if (fotoBase64) {
        await setDoc(doc(firestoreDb, 'users', user.uid), { photoBase64: fotoBase64 }, { merge: true });
        this.photoBase64.set(fotoBase64);
      }

      this.currentUser.set(user);
      this.profileUpdateSuccess.set(true);
    } catch {
      this.errorMessage.set('No pudimos actualizar tu perfil. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      await signInWithEmailAndPassword(this.auth, email, password);
      await this.afterLogin();
    } catch (error) {
      this.errorMessage.set(this.traducirError(error));
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithMicrosoft(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({ prompt: 'select_account' });

      await setPersistence(this.auth, browserLocalPersistence);
      await signInWithPopup(this.auth, provider);
      await this.afterLogin();
    } catch (error) {
      this.errorMessage.set(this.traducirError(error));
    } finally {
      this.loading.set(false);
    }
  }

  async registerWithEmail(nombre: string, apellido: string, email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(credential.user, { displayName: `${nombre} ${apellido}`.trim() });
      await this.afterLogin();
    } catch (error) {
      this.errorMessage.set(this.traducirErrorRegistro(error));
    } finally {
      this.loading.set(false);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.passwordResetSent.set(false);
    try {
      await sendPasswordResetEmail(this.auth, email);
      this.passwordResetSent.set(true);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      if (code === 'auth/user-not-found') {
        this.passwordResetSent.set(true);
      } else {
        this.errorMessage.set(this.traducirErrorRecuperacion(error));
      }
    } finally {
      this.loading.set(false);
    }
  }

  private traducirErrorRecuperacion(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/invalid-email':
        return 'El correo no tiene un formato válido.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
      default:
        return 'No pudimos enviar el correo de recuperación. Intenta de nuevo.';
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/session-closed']);
  }

  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.getIdToken() : null;
  }
  /** Revisa el estado real de Firebase al instante, sin depender del signal. */
  tieneSesionActiva(): boolean {
    return !!this.auth.currentUser;
  }

  private async afterLogin(): Promise<void> {
    const rol = await this.obtenerRol();

    if (rol === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user/available-surveys']);
    }
  }

  private async obtenerRol(): Promise<'ADMIN' | 'USER'> {
    if (!environment.production && environment.devForceRole) {
      return environment.devForceRole as 'ADMIN' | 'USER';
    }

    const tokenResult = await this.auth.currentUser?.getIdTokenResult();
    const rol = tokenResult?.claims['role'];

    return rol === 'ADMIN' ? 'ADMIN' : 'USER';
  }

  private traducirError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
      case 'auth/popup-closed-by-user':
        return 'Cerraste la ventana antes de terminar el inicio de sesión.';
      default:
        return 'No pudimos iniciar sesión. Intenta de nuevo.';
    }
  }

  private traducirErrorRegistro(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este correo.';
      case 'auth/invalid-email':
        return 'El correo no tiene un formato válido.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      default:
        return 'No pudimos crear la cuenta. Intenta de nuevo.';
    }
  }
}