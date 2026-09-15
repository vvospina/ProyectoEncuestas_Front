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
import { TipoEncuesta, TIPOS_ENCUESTA } from '../../../../shared/models/tipo-encuesta.model';

interface Teacher {
  id: string;
  name: string;
}

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

  protected readonly tiposEncuesta = TIPOS_ENCUESTA;

  /**
   * Datos temporales para construir la interfaz.
   * Cuando Backend esté conectado, estos datos vendrán desde GET /api/teachers.
   */
  protected readonly teachers: Teacher[] = [
    { id: 'teacher-001', name: 'Docente de ejemplo 1' },
    { id: 'teacher-002', name: 'Docente de ejemplo 2' },
    { id: 'teacher-003', name: 'Docente de ejemplo 3' },
  ];

  protected readonly surveyForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(150)],
    }),

    tipoEncuesta: new FormControl<TipoEncuesta | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    teacherId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    questions: new FormArray([this.createQuestion()]),
  });

  get questions(): FormArray {
    return this.surveyForm.controls.questions;
  }

  /** Todas las preguntas utilizan obligatoriamente la escala estandarizada 1 - 5. */
  createQuestion(): FormGroup {
    return new FormGroup({
      text: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)],
      }),
      scaleMin: new FormControl(1, { nonNullable: true }),
      scaleMax: new FormControl(5, { nonNullable: true }),
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

  getTeacherName(): string {
    const teacherId = this.surveyForm.controls.teacherId.value;
    return this.teachers.find((t) => t.id === teacherId)?.name ?? 'Sin docente seleccionado';
  }

  getQuestionText(index: number): string {
    return this.questions.at(index).get('text')?.value ?? '';
  }

  isQuestionInvalid(index: number): boolean {
    const textControl = this.questions.at(index).get('text');
    return !!(textControl?.touched && textControl.invalid);
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
      tipo: this.surveyForm.controls.tipoEncuesta.value as TipoEncuesta,
      profesorId: this.surveyForm.controls.teacherId.value,
      preguntas: this.questions.controls.map((question) => ({
        texto: question.get('text')?.value.trim(),
        tipo: 'Escala 1 - 5',
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