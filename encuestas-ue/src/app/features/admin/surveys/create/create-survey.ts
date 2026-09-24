import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { EncuestasService, CrearEncuestaPayload } from '../../../../core/services/encuestas.service';
import { EstadoEncuestaAdmin, ESTADOS_ENCUESTA_ADMIN } from '../../../../shared/models/estado-encuesta-admin.model';
import { TipoPregunta, TIPOS_PREGUNTA } from '../../../../shared/models/pregunta.model';

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  private readonly router = inject(Router);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly estados = ESTADOS_ENCUESTA_ADMIN;
  protected readonly tiposPregunta = TIPOS_PREGUNTA;

  protected readonly surveyForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(150)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    status: new FormControl<EstadoEncuestaAdmin>('BORRADOR', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    questions: new FormArray([this.createQuestion()]),
  });

  get questions(): FormArray {
    return this.surveyForm.controls.questions;
  }

  getTipoLabel(tipo: string | undefined): string {
    return this.tiposPregunta.find((t) => t.value === tipo)?.label ?? '';
  }

  getOpciones(texto: string | undefined): string[] {
    return (texto ?? '')
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  
  getQuestionText(index: number): string {
    const questionGroup = this.questions.at(index) as FormGroup;
    return questionGroup?.get('text')?.value ?? '';
  }

  isQuestionInvalid(index: number): boolean {
    const questionGroup = this.questions.at(index) as FormGroup;
    const control = questionGroup?.get('text');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  createQuestion(): FormGroup {
    return new FormGroup({
      text: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)],
      }),
      type: new FormControl<TipoPregunta>('ESCALA', { nonNullable: true, validators: [Validators.required] }),
      required: new FormControl(true, { nonNullable: true }),
      status: new FormControl<'ACTIVA' | 'INACTIVA'>('ACTIVA', { nonNullable: true }),
      // Solo se usa si type === 'SELECCION_MULTIPLE'; una opción por línea en el textarea.
      options: new FormControl('', { nonNullable: true }),
    });
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion());
    this.saved.set(false);
  }

  removeQuestion(index: number): void {
    if (this.questions.length === 1) return;
    this.questions.removeAt(index);
    this.saved.set(false);
  }

  cancel(): void {
    this.router.navigate(['/admin/surveys']);
  }

  save(): void {
    if (this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      this.saved.set(false);
      return;
    }

    this.saving.set(true);
    this.saved.set(false);
    this.errorMessage.set(null);

    const payload: CrearEncuestaPayload = {
      titulo: this.surveyForm.controls.title.value.trim(),
      descripcion: this.surveyForm.controls.description.value.trim(),
      estado: this.surveyForm.controls.status.value,
      preguntas: this.questions.controls.map((question, index) => ({
        texto: question.get('text')?.value.trim(),
        tipo: question.get('type')?.value,
        requerida: question.get('required')?.value,
        displayOrder: index + 1,
        estado: question.get('status')?.value,
        opciones:
          question.get('type')?.value === 'SELECCION_MULTIPLE'
            ? (question.get('options')?.value as string)
                .split('\n')
                .map((o: string) => o.trim())
                .filter(Boolean)
            : undefined,
      })),
    };

    this.encuestasService.crearEncuesta(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (err) => {
        console.error('Error al crear la encuesta', err);
        this.saving.set(false);
        this.errorMessage.set('No pudimos guardar la encuesta. Intenta de nuevo.');
      },
    });
  }
}