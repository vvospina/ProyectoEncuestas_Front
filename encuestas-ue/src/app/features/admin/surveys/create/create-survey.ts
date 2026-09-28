import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
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
  private readonly route = inject(ActivatedRoute);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /** 'create': encuesta nueva · 'edit': modificar una existente · 'view': solo lectura. */
  protected readonly mode = signal<'create' | 'edit' | 'view'>('create');
  private surveyId: string | null = null;

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

  constructor() {
    // Rutas: /surveys/create (nueva) · /surveys/:id/edit (editar) · /surveys/:id (ver)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.surveyId = id;
      this.mode.set(this.route.snapshot.data['mode'] === 'view' ? 'view' : 'edit');
      this.cargarEncuesta(id);
    }
  }

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

  /** Carga la encuesta existente (con sus preguntas) en el formulario, para editarla o verla. */
  private cargarEncuesta(id: string): void {
    this.encuestasService.obtenerEncuestaPorId(id).subscribe({
      next: (s: any) => {
        this.surveyForm.patchValue({
          title: s.title ?? '',
          description: s.description ?? '',
          status: Number(s.status) === 1 ? 'PUBLICADA' : 'INACTIVA',
        });

        this.questions.clear();
        (s.questions ?? []).forEach((q: any) => this.questions.push(this.preguntaDesdeBackend(q)));
        if (this.questions.length === 0) {
          this.questions.push(this.createQuestion());
        }

        if (this.mode() === 'view') {
          this.surveyForm.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar la encuesta', err);
        Swal.fire('Error', 'No pudimos cargar la encuesta.', 'error');
        this.router.navigate(['/admin/surveys']);
      },
    });
  }

  /** Convierte una pregunta del backend ('Escala' | 'Abierta' | 'Seleccion Multiple') al formulario. */
  private preguntaDesdeBackend(q: any): FormGroup {
    const tipo: TipoPregunta =
      q.questionType === 'Escala' ? 'ESCALA' :
      q.questionType === 'Abierta' ? 'ABIERTA' :
      'SELECCION_MULTIPLE';

    const grupo = this.createQuestion();
    grupo.patchValue({
      text: q.questionText,
      type: tipo,
      required: q.isRequired,
      status: 'ACTIVA',
      options: tipo === 'SELECCION_MULTIPLE'
        ? (q.options ?? []).map((o: any) => o.optionText).join('\n')
        : '',
    });
    return grupo;
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
    if (this.mode() === 'view') return;

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

    const solicitud = this.mode() === 'edit' && this.surveyId
      ? this.encuestasService.actualizarEncuesta(this.surveyId, payload)
      : this.encuestasService.crearEncuesta(payload);

    solicitud.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.router.navigate(['/admin/surveys']);
      },
      error: (err) => {
        console.error('Error al guardar la encuesta', err);
        this.saving.set(false);
        this.errorMessage.set(err.error?.error || 'No pudimos guardar la encuesta. Intenta de nuevo.');
      },
    });
  }
}
