import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  auth = inject(AuthService);

  protected readonly nombre = computed(() => this.dividirNombre().nombre);
  protected readonly apellido = computed(() => this.dividirNombre().apellido);

  private dividirNombre(): { nombre: string; apellido: string } {
    const displayName = this.auth.currentUser()?.displayName?.trim() ?? '';
    if (!displayName) return { nombre: '(sin nombre)', apellido: '' };
    const partes = displayName.split(' ');
    return {
      nombre: partes[0],
      apellido: partes.slice(1).join(' ') || '(sin apellido)',
    };
  }
}