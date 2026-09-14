import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, User, browserLocalPersistence, OAuthProvider, onAuthStateChanged, setPersistence, signInWithEmailAndPassword,
  signInWithPopup, signOut, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.config';
import { environment } from '../../../environment/environment';

/**
  AuthService = el "encargado" de todo lo relacionado a sesión de usuario.
  Ningún componente debe hablar con Firebase directamente: siempre pasa por aquí.*/
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = firebaseAuth;

  /**
   * "signal" = una cajita reactiva: cuando su valor cambia, todo lo
   * que la usa en el HTML se actualiza solo, sin que tengamos que
   * escribir código para refrescar la pantalla.
   */
  currentUser = signal<User | null>(null);
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  constructor(private router: Router) {
    // Esto se ejecuta automáticamente cada vez que Firebase detecta
    // que el usuario inició o cerró sesión (incluso al recargar la página).
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
    });
  }

  /** Login con correo y contraseña (formulario clásico) */
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

  /** Login con el botón "Iniciar sesión con Microsoft" */
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

  /** Crea una cuenta nueva con correo y contraseña, y guarda el nombre completo */
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

  /** true cuando el correo de recuperación ya se envió (o "se hizo como que se envió") */
  passwordResetSent = signal(false);

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
        // Por seguridad, no le decimos al usuario si el correo existe o no
        // en la base de datos (evita que alguien "adivine" correos registrados).
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

  /**
   * Este es el token que Angular debe mandar en cada petición al
   * backend (header "Authorization: Bearer <token>"). Node.js lo
   * valida con el SDK de Firebase Admin (ver punto F01 del PDF).
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.getIdToken() : null;
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
    // 1. SOLO desarrollo: fuerza un rol mientras no haya backend/claims reales.
    //    Ver environment.development.ts -> devForceRole.
    if (!environment.production && environment.devForceRole) {
      return environment.devForceRole as 'ADMIN' | 'USER';
    }

    // 2. Rol real: viene como "custom claim" dentro del token de Firebase.
    //    Alguien con el SDK de administrador (Node.js) debe asignarlo
    //    al crear el usuario (ver F01 del documento del reto).
    const tokenResult = await this.auth.currentUser?.getIdTokenResult();
    const rol = tokenResult?.claims['role'];

    return rol === 'ADMIN' ? 'ADMIN' : 'USER';
  }

  /** Convierte los códigos de error de Firebase en mensajes entendibles */
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
