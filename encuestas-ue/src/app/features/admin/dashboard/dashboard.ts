import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EncuestaDashboard } from '../../../shared/models/encuesta-dashboard.model';
import { EncuestasService, EstadisticasEncuesta } from '../../../core/services/encuestas.service';
import Swal from 'sweetalert2';

interface Bar {
  label: string;
  value: number;
  pct: number;
  highlight: boolean;
}

interface Question {
  id: number;
  label: string;
  tipo: string;
  avg: number;
  bars: Bar[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly encuestasService = inject(EncuestasService);

  selectedSurvey = '';
  selectedDate = '';
  isLoading = false;

  surveys: EncuestaDashboard[] = [];
  questions: Question[] = [];
  kpis = { totalRespuestas: 0, promedio: 0.0 };
  activeQuestionId = -1;

  ngOnInit(): void {
    this.encuestasService.obtenerEncuestasAdmin().subscribe({
      next: (data: any[]) => {
        this.surveys = data.map((s) => ({
          survey_id: s.surveyId || s.id,
          title: s.title || s.name || s.titulo || 'Sin título',
          created_at: s.createdAt ? s.createdAt.split('T')[0] : '',
          close_date: s.closeDate || '',
          status: Number(s.status) === 1 ? 'ACTIVA' : 'INACTIVA',
        }));
      },
      error: (err) => {
        console.error('Error al cargar encuestas para el Dashboard:', err);
      },
    });
  }

  get filteredSurveys(): EncuestaDashboard[] {
    if (!this.selectedDate) return this.surveys;
    return this.surveys.filter((survey) => survey.created_at === this.selectedDate);
  }

  get activeQuestion(): Question | undefined {
    return this.questions.find((q) => q.id === this.activeQuestionId);
  }

  selectQuestion(id: number): void {
    this.activeQuestionId = id;
  }

  onDateChange(): void {
    if (!this.filteredSurveys.some((survey) => String(survey.survey_id) === this.selectedSurvey)) {
      this.selectedSurvey = '';
      this.resetStats();
    }
  }

  onSurveyChange(id: string): void {
    if (!id) {
      this.resetStats();
      return;
    }

    this.isLoading = true;
    this.resetStats();

    // Consumimos directamente el endpoint de estadísticas agregadas del backend
    this.encuestasService.obtenerEstadisticas(id).subscribe({
      next: (stats: EstadisticasEncuesta) => {
        this.procesarEstadisticasBackend(stats);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando estadísticas del backend:', err);
        // Respaldo en caso de fallo: intentar con resultados brutos
        this.encuestasService.obtenerEncuestaParaResponder(id).subscribe({
          next: (encuesta) => {
            this.encuestasService.obtenerResultadosBrutos(id).subscribe({
              next: (respuestas) => {
                this.procesarEstadisticasBrutas(encuesta.preguntas, respuestas);
                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
                Swal.fire('Error', 'No se pudieron cargar los resultados de la encuesta.', 'error');
              },
            });
          },
          error: () => {
            this.isLoading = false;
            Swal.fire('Error', 'No se pudo cargar la estructura de la encuesta.', 'error');
          },
        });
      },
    });
  }

  private resetStats(): void {
    this.kpis = { totalRespuestas: 0, promedio: 0.0 };
    this.questions = [];
    this.activeQuestionId = -1;
  }

  /**
   * Procesa las estadísticas entregadas por GET /surveys/:id/statistics
   */
  private procesarEstadisticasBackend(stats: EstadisticasEncuesta): void {
    this.kpis.totalRespuestas = stats.totalSubmissions;
    let sumTotalEscala = 0;
    let countTotalEscala = 0;
    const questionsList: Question[] = [];

    (stats.questionsSummary || []).forEach((q) => {
      const tipoNormalizado = (q.questionType || '').toLowerCase();
      if (tipoNormalizado === 'abierta') return;

      const bars: Bar[] = [];

      if (tipoNormalizado === 'escala') {
        let qSum = 0;
        let qCount = 0;
        const optionsCount = q.optionsCount || {};

        [1, 2, 3, 4, 5].forEach((val) => {
          const count = optionsCount[String(val)] || 0;
          bars.push({
            label: String(val),
            value: count,
            pct: q.totalAnswers > 0 ? (count / q.totalAnswers) * 100 : 0,
            highlight: false,
          });
          qSum += val * count;
          qCount += count;
        });

        const maxVal = Math.max(...bars.map((b) => b.value));
        if (maxVal > 0) bars.forEach((b) => (b.highlight = b.value === maxVal));

        const avg = qCount > 0 ? Number((qSum / qCount).toFixed(1)) : 0;
        sumTotalEscala += qSum;
        countTotalEscala += qCount;

        questionsList.push({
          id: q.questionId,
          label: q.questionText,
          tipo: 'ESCALA',
          avg,
          bars,
        });
      } else if (tipoNormalizado.includes('multiple')) {
        const optionsCount = q.optionsCount || {};
        const totalAnswers = q.totalAnswers || 1;

        Object.keys(optionsCount).forEach((key) => {
          const count = optionsCount[key];
          bars.push({
            label: key,
            value: count,
            pct: totalAnswers > 0 ? (count / totalAnswers) * 100 : 0,
            highlight: false,
          });
        });

        const maxVal = Math.max(...bars.map((b) => b.value));
        if (maxVal > 0) bars.forEach((b) => (b.highlight = b.value === maxVal));

        questionsList.push({
          id: q.questionId,
          label: q.questionText,
          tipo: 'SELECCION_MULTIPLE',
          avg: 0,
          bars,
        });
      }
    });

    this.questions = questionsList;
    this.activeQuestionId = questionsList.length > 0 ? questionsList[0].id : -1;
    this.kpis.promedio = countTotalEscala > 0 ? Number((sumTotalEscala / countTotalEscala).toFixed(1)) : 0.0;
  }

  /**
   * Fallback de cálculo en frontend si el endpoint directo no estuviera disponible
   */
  private procesarEstadisticasBrutas(preguntasDef: any[], respuestasBD: any[]): void {
    this.kpis.totalRespuestas = respuestasBD.length;
    let generalSum = 0;
    let generalCount = 0;
    const questionsList: Question[] = [];

    preguntasDef.forEach((p) => {
      if (p.tipo === 'ABIERTA' || p.tipo === 'Abierta') return;

      let qSum = 0;
      let qCount = 0;
      const bars: Bar[] = [];

      if (p.tipo === 'ESCALA' || p.tipo === 'Escala') {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const optionValMap: Record<number, number> = {};
        (p.opciones || []).forEach((opt: any) => (optionValMap[Number(opt.id)] = Number(opt.texto)));

        respuestasBD.forEach((r) => {
          const detalle = (r.details || []).find((d: any) => Number(d.questionId) === Number(p.id));
          if (detalle && detalle.optionId) {
            const numValue = optionValMap[Number(detalle.optionId)];
            if (numValue >= 1 && numValue <= 5) {
              counts[numValue]++;
              qSum += numValue;
              qCount++;
              generalSum += numValue;
              generalCount++;
            }
          }
        });

        const avg = qCount > 0 ? qSum / qCount : 0;
        [1, 2, 3, 4, 5].forEach((val) => {
          bars.push({
            label: String(val),
            value: counts[val],
            pct: qCount > 0 ? (counts[val] / qCount) * 100 : 0,
            highlight: false,
          });
        });

        const maxVal = Math.max(...bars.map((b) => b.value));
        if (maxVal > 0) bars.forEach((b) => (b.highlight = b.value === maxVal));

        questionsList.push({
          id: Number(p.id),
          label: p.texto || p.enunciado,
          tipo: 'ESCALA',
          avg: Number(avg.toFixed(1)),
          bars,
        });
      } else if (p.tipo === 'SELECCION_MULTIPLE' || p.tipo === 'Seleccion Multiple') {
        const counts: Record<string, number> = {};
        const optionNameMap: Record<number, string> = {};

        (p.opciones || []).forEach((opt: any) => {
          counts[opt.texto] = 0;
          optionNameMap[Number(opt.id)] = opt.texto;
        });

        respuestasBD.forEach((r) => {
          (r.details || []).forEach((detalle: any) => {
            if (Number(detalle.questionId) === Number(p.id) && detalle.optionId) {
              const textValue = optionNameMap[Number(detalle.optionId)];
              if (textValue !== undefined) {
                counts[textValue] = (counts[textValue] || 0) + 1;
                qCount++;
              }
            }
          });
        });

        Object.keys(counts).forEach((key) => {
          bars.push({
            label: key,
            value: counts[key],
            pct: qCount > 0 ? (counts[key] / qCount) * 100 : 0,
            highlight: false,
          });
        });

        const maxVal = Math.max(...bars.map((b) => b.value));
        if (maxVal > 0) bars.forEach((b) => (b.highlight = b.value === maxVal));

        questionsList.push({
          id: Number(p.id),
          label: p.texto || p.enunciado,
          tipo: 'SELECCION_MULTIPLE',
          avg: 0,
          bars,
        });
      }
    });

    this.questions = questionsList;
    this.activeQuestionId = questionsList.length > 0 ? questionsList[0].id : -1;
    this.kpis.promedio = generalCount > 0 ? Number((generalSum / generalCount).toFixed(1)) : 0;
  }
}
