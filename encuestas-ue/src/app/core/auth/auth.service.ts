import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import Swal from 'sweetalert2';


export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Usamos la URL configurada en el environment
  private apiUrl = environment.apiUrl;

  currentUser = signal<any | null>(null);
  errorMessage = signal<string | null>(null);
  photoBase64 = signal<string | null>(null);
  loading = signal(false);

  authReady = signal<boolean>(false);
  profileUpdateSuccess = signal<boolean>(false);
  passwordResetSent = signal(false);

  // Alineamos los tipos de roles para coincidir con 'ADMIN' y 'USER' del HTML
  userRole = signal<'ADMIN' | 'USER' | 'Docente' | null>(null);

  private resolverAuthReady!: () => void;
  readonly authReadyPromise = new Promise<void>((resolve) => {
    this.resolverAuthReady = resolve;
  });

  constructor(private router: Router, private http: HttpClient) {
    this.restaurarSesion();
  }

  /** El backend devuelve `name`; el front (perfil) lee `displayName`. Dejamos ambos disponibles. */
  private normalizarUsuario(user: any): any {
    return { ...user, displayName: user.displayName ?? user.name ?? '' };
  }

  private restaurarSesion() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      const user = this.normalizarUsuario(JSON.parse(userStr));
      this.currentUser.set(user);

      // El backend expone el rol como roleId (1 = admin, 2 = usuario)
      const esAdmin = Number(user.roleId ?? user.role_id) === 1 || user.rol === 'Administrador';
      this.userRole.set(esAdmin ? 'ADMIN' : user.rol || 'USER');
      this.photoBase64.set(user.avatarBase64 || user.foto_perfil || null);
    }
    this.authReady.set(true);
    this.resolverAuthReady();
  }

  async registerWithEmail(name: string, email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {

      const payload: RegisterRequest = { name, email, password, status: 1 };

      await firstValueFrom(this.http.post(`${this.apiUrl}/users`, payload));

      // 1. Notificación visual de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Cuenta creada!',
        text: 'Tu usuario ha sido registrado correctamente. Redirigiendo...',
        timer: 2000,
        showConfirmButton: false
      });

      // 2. Esperamos 1.5 segundos para que el usuario lea el mensaje antes de redirigir
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);

    } catch (error: any) {
      console.error(error);

      this.errorMessage.set(
        error.error?.details || // para leer el backend
        error.error?.message ||
        error.error?.error ||
        (error.status === 0
          ? 'No se pudo conectar con el backend. Verifica que esté activo.'
          : 'No pudimos crear la cuenta. Verifica los datos.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const payload = { email, password };
      const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/login`, payload));

      // Guardamos el token y datos en localStorage
      this.guardarSesion(response);

      // Notificación de bienvenida
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Inicio de sesión exitoso.',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => {
        this.afterLogin();
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error.error?.error || 'Correo o contraseña incorrectos.');
    } finally {
      this.loading.set(false);
    }
  }

  private guardarSesion(data: any) {
    const token = data.token || data.access_token;
    const userData = this.normalizarUsuario(data.user || data.usuario || data);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    this.currentUser.set(userData);
    this.photoBase64.set(userData.avatarBase64 || userData.foto_perfil || null);

    // Mapeo explicito hacia 'ADMIN' o 'USER' para compatibilidad visual (roleId 1 = admin)
    const esAdmin = Number(userData.roleId ?? userData.role_id) === 1 || userData.rol === 'Administrador';
    this.userRole.set(esAdmin ? 'ADMIN' : 'USER');
  }

  async updateUserProfile(nombre: string, apellido: string, fotoBase64?: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.profileUpdateSuccess.set(false);
    try {
      // Concatenamos nombre y apellido en la propiedad "name" que espera la BD
      const nombreCompleto = `${nombre} ${apellido}`.trim();

      const currentUserData = this.currentUser() || {};
      const userId = currentUserData.id ?? currentUserData.userId;

      const payload: { name: string; avatarBase64?: string } = { name: nombreCompleto };
      if (fotoBase64) {
        payload.avatarBase64 = fotoBase64;
      }

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      await firstValueFrom(this.http.put(`${this.apiUrl}/users/${userId}`, payload, { headers }));

      // Actualizamos el estado global en localStorage y Signals
      const updatedUser = {
        ...currentUserData,
        name: nombreCompleto,
        displayName: nombreCompleto,
        ...(fotoBase64 ? { avatarBase64: fotoBase64 } : {}),
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.currentUser.set(updatedUser);

      if (fotoBase64) {
        this.photoBase64.set(fotoBase64);
      }

      this.profileUpdateSuccess.set(true);
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      this.errorMessage.set(error.error?.error || 'No pudimos actualizar tu perfil en la base de datos.');
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.userRole.set(null);
    this.router.navigate(['/session-closed']);
  }

  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem('token');
  }

  tieneSesionActiva(): boolean {
    return !!localStorage.getItem('token');
  }

  private async afterLogin(): Promise<void> {
    const rol = this.userRole();
    if (rol === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user/available-surveys']);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.passwordResetSent.set(false);
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/forgot-password`, { email }));

      this.passwordResetSent.set(true);
    } catch (error: any) {
      this.errorMessage.set(
        error.error?.details ||
        error.error?.message ||
        error.error?.error ||
        (error.status === 0
          ? 'No se pudo conectar con el backend. Verifica que esté activo.'
          : 'No pudimos enviar el correo de recuperación. Intenta de nuevo.'),
      );
    } finally {
      this.loading.set(false);
    }
  }


  async resetPasswordConfirm(token: string, newPassword: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword }));
      Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.', 'success');
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.errorMessage.set(error.error?.error || 'No se pudo actualizar la contraseña. Intenta enviar otro correo de recuperación.');
    } finally {
      this.loading.set(false);
    }
  }
}
