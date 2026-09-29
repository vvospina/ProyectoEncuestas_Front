import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  token: string | null = null;

  form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    this.auth.errorMessage.set(null);
    // Atrapamos el token de la URL (ej: ?token=xyz)
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    const { newPassword } = this.form.getRawValue();
    this.auth.resetPasswordConfirm(this.token, newPassword);
  }
}
