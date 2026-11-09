import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { EncuestasService, CrearEncuestaPayload, mensajeError } from '../../../../core/services/encuestas.service';
import { Encuesta } from '../../../../shared/models/encuesta.models';
import { EstadoEncuestaAdmin, ESTADOS_ENCUESTA_ADMIN } from '../../../../shared/models/estado-encuesta-admin.model';
import { Pregunta, TipoPregunta, TIPOS_PREGUNTA } from '../../../../shared/models/pregunta.model';

/** Sirve para crear una encuesta y, si la ruta trae un ID, para editar un borrador. */
@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly encuestasService = inject(EncuestasService);

  private readonly encuestaId = this.route.snapshot.paramMap.get('id');
  private encuestaOriginal: Encuesta | null = null;
  protected readonly modoEdicion = this.encuestaId !== null;

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
    closeDate: new FormControl('', { nonNullable: true }),
    questions: new FormArray([this.createQuestion()]),
  });

  ngOnInit(): void {
    if (this.encuestaId) {
      this.cargarEncuesta(this.encuestaId);
    }
  }

  private cargarEncuesta(id: string): void {
    this.encuestasService.obtenerEncuestaPorId(id).subscribe({
      next: (encuesta) => {
        if (encuesta.estado !== 'BORRADOR') {
          Swal.fire('No se puede editar', 'Solo se pueden editar encuestas en borrador.', 'info');
          this.router.navigate(['/admin/surveys', id]);
          return;
        }

        this.encuestaOriginal = encuesta;
        this.surveyForm.patchValue({
          title: encuesta.titulo,
          description: encuesta.descripcion ?? '',
          closeDate: encuesta.fechaCierre ? new Date(encuesta.fechaCierre).toLocaleDateString('en-CA') : '',
        });

        this.questions.clear();
        encuesta.preguntas.forEach((pregunta) => this.questions.push(this.createQuestion(pregunta)));
        if (encuesta.preguntas.length === 0) {
          this.questions.push(this.createQuestion());
        }
      },
      error: (err) => {
        Swal.fire('Encuesta no disponible', mensajeError(err, 'No pudimos cargar la encuesta.'), 'error');
        this.router.navigate(['/admin/surveys']);
      },
    });
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

  createQuestion(pregunta?: Pregunta): FormGroup {
    const opciones = (pregunta?.opciones ?? []).filter((opcion) => opcion.estado === 'ACTIVA');

    return new FormGroup({
      id: new FormControl<string | null>(pregunta?.id ?? null),
      text: new FormControl(pregunta?.texto ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)],
      }),
      type: new FormControl<TipoPregunta>(pregunta?.tipo ?? 'ESCALA', { nonNullable: true, validators: [Validators.required] }),
      required: new FormControl(pregunta?.requerida ?? true, { nonNullable: true }),
      status: new FormControl<'ACTIVA' | 'INACTIVA'>(pregunta?.estado ?? 'ACTIVA', { nonNullable: true }),
      // Solo se usa si type === 'SELECCION_MULTIPLE'; una opción por línea en el textarea.
      options: new FormControl(pregunta?.tipo === 'SELECCION_MULTIPLE' ? opciones.map((o) => o.texto).join('\n') : '', { nonNullable: true }),
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

    const faltanOpciones = this.questions.controls.some(
      (question) => question.get('type')?.value === 'SELECCION_MULTIPLE' && this.getOpciones(question.get('options')?.value).length === 0,
    );
    if (faltanOpciones) {
      this.errorMessage.set('Las preguntas de selección múltiple necesitan al menos una opción.');
      return;
    }

    this.saving.set(true);
    this.saved.set(false);
    this.errorMessage.set(null);

    const closeDate = this.surveyForm.controls.closeDate.value;
    const payload: CrearEncuestaPayload = {
      titulo: this.surveyForm.controls.title.value.trim(),
      descripcion: this.surveyForm.controls.description.value.trim(),
      estado: this.surveyForm.controls.status.value,
      // La encuesta se puede responder hasta el final del día elegido
      fechaCierre: closeDate ? new Date(`${closeDate}T23:59:59`).toISOString() : null,
      preguntas: this.questions.controls.map((question, index) => ({
        id: question.get('id')?.value ?? undefined,
        texto: question.get('text')?.value.trim(),
        tipo: question.get('type')?.value,
        requerida: question.get('required')?.value,
        displayOrder: index + 1,
        estado: question.get('status')?.value,
        opciones: question.get('type')?.value === 'SELECCION_MULTIPLE' ? this.getOpciones(question.get('options')?.value) : undefined,
      })),
    };

    const original = this.encuestaOriginal;
    const guardado = original ? this.encuestasService.guardarEdicion(original, payload) : this.encuestasService.crearEncuesta(payload);

    guardado.subscribe({
      next: () => {
        this.saving.set(false);
        if (original) {
          this.router.navigate(['/admin/surveys', original.id]);
        } else {
          this.saved.set(true);
        }
      },
      error: (err) => {
        console.error('Error al guardar la encuesta', err);
        this.saving.set(false);
        this.errorMessage.set(mensajeError(err, 'No pudimos guardar la encuesta. Intenta de nuevo.'));
      },
    });
  }
}
