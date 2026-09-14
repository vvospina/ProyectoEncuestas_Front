import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Un validador "de grupo": en vez de revisar un solo campo, recibe TODO
 * el formulario y compara 2 campos entre sí. Angular lo ejecuta cada vez
 * que cualquiera de los dos cambia.
 */
function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmarPassword = control.get('confirmarPassword')?.value;
  return password === confirmarPassword ? null : { passwordsDistintas: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  mostrarPassword = signal(false);
  mostrarConfirmarPassword = signal(false);

  form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  constructor() {
    // Evita que un error viejo del login se quede "pegado" en pantalla
    // si el usuario navega de /login a /register.
    this.auth.errorMessage.set(null);
  }

  get confirmarPasswordTieneError(): boolean {
    const control = this.form.controls.confirmarPassword;
    if (!control.touched) return false;
    if (control.invalid) return true;
    return !!this.form.errors?.['passwordsDistintas'];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, apellido, email, password } = this.form.getRawValue();
    this.auth.registerWithEmail(nombre, apellido, email, password);
  }

  alternarPassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  alternarConfirmarPassword(): void {
    this.mostrarConfirmarPassword.update((v) => !v);
  }
}