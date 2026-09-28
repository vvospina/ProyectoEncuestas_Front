import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EncuestaDashboard } from '../../../shared/models/encuesta-dashboard.model';

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
  bars: Bar[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  // ── Selector de encuesta ─────────────────────────────────
  selectedSurvey = '';
  selectedDate = '';

  surveys: EncuestaDashboard[] = [
    { survey_id: 101, title: 'Evaluación docente - Carlos Martínez', created_at: '2026-03-12', close_date: '2026-04-12', status: 'ACTIVA' },
    { survey_id: 102, title: 'Satisfacción del curso - Q1', created_at: '2026-02-20', close_date: '2026-03-20', status: 'INACTIVA' },
    { survey_id: 103, title: 'Clima Laboral 2026', created_at: '2026-01-15', close_date: '2026-02-15', status: 'BORRADOR' },
  ];

  get filteredSurveys(): EncuestaDashboard[] {
    if (!this.selectedDate) return this.surveys;
    return this.surveys.filter((survey) => survey.created_at.slice(0, 10) === this.selectedDate);
  }

  // ── KPIs ─────────────────────────────────────────────────
  kpis = { totalRespuestas: 80, promedio: 4.2, participacion: 85 };

  // ── Preguntas con datos de barras ─────────────────────────
  questions: Question[] = [
    {
      id: 1,
      label: 'El docente demuestra dominio del tema impartido.',
      avg: 4.6,
      bars: [
        { label: 'Muy en<br>desacuerdo', value: 5,  pct: 10,  highlight: false },
        { label: 'En<br>desacuerdo',     value: 12, pct: 15,  highlight: false },
        { label: 'Neutral',              value: 24, pct: 30,  highlight: false },
        { label: 'De<br>acuerdo',        value: 48, pct: 60,  highlight: false },
        { label: 'Muy de<br>acuerdo',    value: 68, pct: 85,  highlight: true  },
      ],
    },
    {
      id: 2,
      label: 'La metodología de enseñanza facilita el aprendizaje.',
      avg: 4.2,
      bars: [
        { label: 'Muy en<br>desacuerdo', value: 8,  pct: 12,  highlight: false },
        { label: 'En<br>desacuerdo',     value: 14, pct: 18,  highlight: false },
        { label: 'Neutral',              value: 28, pct: 35,  highlight: false },
        { label: 'De<br>acuerdo',        value: 52, pct: 65,  highlight: true  },
        { label: 'Muy de<br>acuerdo',    value: 55, pct: 68,  highlight: false },
      ],
    },
    {
      id: 3,
      label: 'Fomenta la participación activa en clase.',
      avg: 3.8,
      bars: [
        { label: 'Muy en<br>desacuerdo', value: 10, pct: 15,  highlight: false },
        { label: 'En<br>desacuerdo',     value: 18, pct: 22,  highlight: false },
        { label: 'Neutral',              value: 35, pct: 44,  highlight: true  },
        { label: 'De<br>acuerdo',        value: 42, pct: 52,  highlight: false },
        { label: 'Muy de<br>acuerdo',    value: 40, pct: 50,  highlight: false },
      ],
    },
    {
      id: 4,
      label: 'Los materiales de apoyo son útiles y actualizados.',
      avg: 4.5,
      bars: [
        { label: 'Muy en<br>desacuerdo', value: 4,  pct: 8,   highlight: false },
        { label: 'En<br>desacuerdo',     value: 10, pct: 13,  highlight: false },
        { label: 'Neutral',              value: 20, pct: 25,  highlight: false },
        { label: 'De<br>acuerdo',        value: 50, pct: 62,  highlight: true  },
        { label: 'Muy de<br>acuerdo',    value: 65, pct: 81,  highlight: false },
      ],
    },
    {
      id: 5,
      label: 'Cumple con el horario establecido.',
      avg: 3.2,
      bars: [
        { label: 'Muy en<br>desacuerdo', value: 18, pct: 22,  highlight: false },
        { label: 'En<br>desacuerdo',     value: 25, pct: 31,  highlight: true  },
        { label: 'Neutral',              value: 30, pct: 37,  highlight: false },
        { label: 'De<br>acuerdo',        value: 35, pct: 44,  highlight: false },
        { label: 'Muy de<br>acuerdo',    value: 28, pct: 35,  highlight: false },
      ],
    },
  ];

  // ── Pregunta activa en el gráfico ─────────────────────────
  activeQuestionId = 1;

  get activeQuestion(): Question {
    return this.questions.find(q => q.id === this.activeQuestionId)!;
  }

  selectQuestion(id: number): void {
    this.activeQuestionId = id;
  }

  onDateChange(): void {
    if (!this.filteredSurveys.some((survey) => String(survey.survey_id) === this.selectedSurvey)) {
      this.selectedSurvey = '';
    }
  }

  onSurveyChange(_id: string): void {
    // TODO: cargar datos reales del backend cuando esté disponible
  }
}
