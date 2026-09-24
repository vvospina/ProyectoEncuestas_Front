import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

  protected readonly nombre = computed(() => {
    const displayName = this.auth.currentUser()?.displayName?.trim();
    return displayName || '(sin nombre)';
  });

  /** Evita que un admin sea enviado a /user/profile/edit y viceversa. */
  protected get editProfilePath(): string {
    return this.router.url.startsWith('/admin') ? '/admin/profile/edit' : '/user/profile/edit';
  }
}