import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EncuestasService, EstadisticasEncuesta, mensajeError } from '../../../core/services/encuestas.service';
import { Encuesta } from '../../../shared/models/encuesta.models';

interface Bar {
  label: string;
  value: number;
  pct: number;
  highlight: boolean;
}

interface Question {
  id: number;
  label: string;
  avg: number;
  positivas: number;
  neutras: number;
  negativas: number;
  bars: Bar[];
}

const PREGUNTAS_INICIALES = 5;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly encuestasService = inject(EncuestasService);

  private readonly encuestas = signal<Encuesta[]>([]);
  private readonly estadisticas = signal<EstadisticasEncuesta | null>(null);

  errorMensaje = signal<string | null>(null);
  cargando = signal(false);

  // ── Filtros ──────────────────────────────────────────────
  selectedSurvey = signal('');
  filtroEstado = signal('TODOS');
  fechaDesde = signal('');
  fechaHasta = signal('');

  surveys = computed(() => {
    const estado = this.filtroEstado();
    return this.encuestas()
      .filter((encuesta) => encuesta.estado !== 'BORRADOR')
      .filter((encuesta) => estado === 'TODOS' || encuesta.estado === estado);
  });

  // ── Resumen general ──────────────────────────────────────
  resumen = computed(() => {
    const encuestas = this.encuestas();
    const contar = (estado: string) => encuestas.filter((encuesta) => encuesta.estado === estado).length;
    return {
      total: encuestas.length,
      publicadas: contar('PUBLICADA'),
      borradores: contar('BORRADOR'),
      inactivas: contar('INACTIVA'),
      respuestas: encuestas.reduce((total, encuesta) => total + (encuesta.totalRespuestas ?? 0), 0),
    };
  });

  // ── Encuesta seleccionada ────────────────────────────────
  kpis = computed(() => {
    const datos = this.estadisticas();
    return {
      totalRespuestas: datos?.totalSubmissions ?? 0,
      promedio: datos?.averageScore ?? 0,
      participacion: datos?.participation ?? 0,
      estudiantesRespondieron: datos?.studentsAnswered ?? 0,
      totalEstudiantes: datos?.totalStudents ?? 0,
    };
  });

  clasificacion = computed(() => {
    const { positive = 0, neutral = 0, negative = 0 } = this.estadisticas()?.sentiment ?? {};
    const total = positive + neutral + negative;
    const porcentaje = (valor: number) => (total ? Math.round((valor / total) * 100) : 0);
    return {
      total,
      positivas: positive,
      neutras: neutral,
      negativas: negative,
      pctPositivas: porcentaje(positive),
      pctNeutras: porcentaje(neutral),
      pctNegativas: porcentaje(negative),
    };
  });

  questions = computed<Question[]>(() =>
    (this.estadisticas()?.questionsSummary ?? [])
      .filter((pregunta) => pregunta.questionType === 'Escala' && pregunta.optionsCount)
      .map((pregunta, indice) => ({
        id: indice + 1,
        label: pregunta.questionText,
        avg: pregunta.average ?? 0,
        positivas: pregunta.sentiment?.positive ?? 0,
        neutras: pregunta.sentiment?.neutral ?? 0,
        negativas: pregunta.sentiment?.negative ?? 0,
        bars: this.aBarras(pregunta.optionsCount!),
      })),
  );

  seleccionMultiple = computed(() =>
    (this.estadisticas()?.questionsSummary ?? [])
      .filter((pregunta) => pregunta.questionType === 'Seleccion Multiple' && pregunta.optionsCount)
      .map((pregunta) => {
        const opciones = Object.entries(pregunta.optionsCount!);
        const total = opciones.reduce((suma, [, valor]) => suma + valor, 0);
        return {
          id: pregunta.questionId,
          label: pregunta.questionText,
          opciones: opciones.map(([texto, valor]) => ({
            texto,
            valor,
            pct: total ? Math.round((valor / total) * 100) : 0,
          })),
        };
      }),
  );

  comentarios = computed(() =>
    (this.estadisticas()?.questionsSummary ?? [])
      .filter((pregunta) => pregunta.questionType === 'Abierta')
      .map((pregunta) => ({ id: pregunta.questionId, label: pregunta.questionText, respuestas: pregunta.openAnswers ?? [] })),
  );

  // ── Pregunta activa en el gráfico ─────────────────────────
  activeQuestionId = signal(1);
  activeQuestion = computed(() => this.questions().find((q) => q.id === this.activeQuestionId()) ?? null);

  verTodas = signal(false);
  preguntasVisibles = computed(() => (this.verTodas() ? this.questions() : this.questions().slice(0, PREGUNTAS_INICIALES)));
  hayMasPreguntas = computed(() => this.questions().length > PREGUNTAS_INICIALES);

  ngOnInit(): void {
    this.encuestasService.listarEncuestas().subscribe({
      next: (encuestas) => {
        this.encuestas.set(encuestas);
        this.seleccionarPrimera();
      },
      error: (err) => this.errorMensaje.set(mensajeError(err, 'No pudimos cargar las encuestas.')),
    });
  }

  selectQuestion(id: number): void {
    this.activeQuestionId.set(id);
  }

  onSurveyChange(id: string): void {
    this.selectedSurvey.set(id);
    this.cargarEstadisticas();
  }

  onEstadoChange(estado: string): void {
    this.filtroEstado.set(estado);
    if (!this.surveys().some((encuesta) => encuesta.id === this.selectedSurvey())) {
      this.seleccionarPrimera();
    }
  }

  onFechaDesde(valor: string): void {
    this.fechaDesde.set(valor);
    this.cargarEstadisticas();
  }

  onFechaHasta(valor: string): void {
    this.fechaHasta.set(valor);
    this.cargarEstadisticas();
  }

  private seleccionarPrimera(): void {
    const primera = this.surveys()[0];
    this.selectedSurvey.set(primera?.id ?? '');
    if (primera) {
      this.cargarEstadisticas();
    } else {
      this.estadisticas.set(null);
    }
  }

  private cargarEstadisticas(): void {
    const id = this.selectedSurvey();
    if (!id) return;

    this.errorMensaje.set(null);
    this.cargando.set(true);
    this.encuestasService.obtenerEstadisticas(id, { desde: this.fechaDesde(), hasta: this.fechaHasta() }).subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
        this.activeQuestionId.set(1);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(mensajeError(err, 'No pudimos cargar los resultados.'));
        this.cargando.set(false);
      },
    });
  }

  private aBarras(conteos: Record<string, number>): Bar[] {
    const opciones = Object.entries(conteos).sort(([a], [b]) => Number(a) - Number(b));
    const maximo = Math.max(0, ...opciones.map(([, valor]) => valor));
    return opciones.map(([opcion, valor]) => ({
      label: opcion,
      value: valor,
      pct: maximo ? (valor / maximo) * 100 : 0,
      highlight: valor > 0 && valor === maximo,
    }));
  }
}
