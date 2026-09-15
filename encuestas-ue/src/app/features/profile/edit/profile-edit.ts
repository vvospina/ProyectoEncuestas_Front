import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { comprimirImagenABase64 } from '../../../shared/utils/imagen.util';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss',
})
export class ProfileEditComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  auth = inject(AuthService);

  archivoSeleccionado: File | null = null;
  previewFoto = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    this.auth.errorMessage.set(null);
    this.auth.profileUpdateSuccess.set(false);

    const displayName = this.auth.currentUser()?.displayName?.trim() ?? '';
    const partes = displayName.split(' ');
    this.form.setValue({
      nombre: partes[0] ?? '',
      apellido: partes.slice(1).join(' '),
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.archivoSeleccionado = archivo;
    this.previewFoto.set(URL.createObjectURL(archivo));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
    }
    const { nombre, apellido } = this.form.getRawValue();

        let fotoBase64: string | undefined;
        if (this.archivoSeleccionado) {
            fotoBase64 = await comprimirImagenABase64(this.archivoSeleccionado);
        }

        await this.auth.updateUserProfile(nombre, apellido, fotoBase64);
    }
}