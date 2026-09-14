import { Component, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

interface Teacher {
  id: string;
  name: string;
}

interface SurveyQuestion {
  text: string;
  scaleMin: number;
  scaleMax: number;
}

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);

  /**
   * Datos temporales para construir la interfaz.
   *
   * Cuando Backend esté conectado, estos datos vendrán
   * desde GET /api/teachers.
   */
  protected readonly teachers: Teacher[] = [
    {
      id: 'teacher-001',
      name: 'Docente de ejemplo 1',
    },
    {
      id: 'teacher-002',
      name: 'Docente de ejemplo 2',
    },
    {
      id: 'teacher-003',
      name: 'Docente de ejemplo 3',
    },
  ];

  protected readonly surveyForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(150),
      ],
    }),

    teacherId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    questions: new FormArray([
      this.createQuestion(),
    ]),
  });

  constructor(private readonly router: Router) {}

  get questions(): FormArray {
    return this.surveyForm.controls.questions;
  }

  /**
   * Todas las preguntas utilizan obligatoriamente
   * la escala estandarizada 1 - 5.
   */
  createQuestion(): FormGroup {
    return new FormGroup({
      text: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(500),
        ],
      }),

      scaleMin: new FormControl(1, {
        nonNullable: true,
      }),

      scaleMax: new FormControl(5, {
        nonNullable: true,
      }),
    });
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion());

    this.saved.set(false);
  }

  removeQuestion(index: number): void {
    if (this.questions.length === 1) {
      return;
    }

    this.questions.removeAt(index);

    this.saved.set(false);
  }

  getTeacherName(): string {
    const teacherId = this.surveyForm.controls.teacherId.value;

    return (
      this.teachers.find((teacher) => teacher.id === teacherId)?.name ??
      'Sin docente seleccionado'
    );
  }

  getQuestionText(index: number): string {
    return this.questions.at(index).get('text')?.value ?? '';
  }

  isQuestionInvalid(index: number): boolean {
    const question = this.questions.at(index);

    const textControl = question.get('text');

    return !!(
      textControl?.touched &&
      textControl.invalid
    );
  }

  cancel(): void {
    this.router.navigate(['/admin/surveys']);
  }

  async save(): Promise<void> {
    if (this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      this.saved.set(false);

      return;
    }

    this.saving.set(true);
    this.saved.set(false);

    /*
     * TODO BACKEND
     *
     * Cuando Node.js esté disponible:
     *
     * SurveyService.createSurvey({
     *   title,
     *   teacherId,
     *   questions
     * });
     *
     * POST /api/surveys
     */

    const payload: {
      title: string;
      teacherId: string;
      questions: SurveyQuestion[];
    } = {
      title: this.surveyForm.controls.title.value.trim(),

      teacherId: this.surveyForm.controls.teacherId.value,

      questions: this.questions.controls.map((question) => ({
        text: question.get('text')?.value.trim(),
        scaleMin: 1,
        scaleMax: 5,
      })),
    };

    console.log('Encuesta preparada para enviar:', payload);

    // Simulación temporal del guardado.
    await new Promise((resolve) => setTimeout(resolve, 800));

    this.saving.set(false);
    this.saved.set(true);
  }
}