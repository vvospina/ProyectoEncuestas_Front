import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Survey {
  id: string;
  name: string;
  description: string;
  teacher: string;
  questions: number;
  status: 'ACTIVA' | 'BORRADOR' | 'CERRADA';
  createdAt: string;
}

@Component({
  selector: 'app-surveys',
  imports: [RouterLink],
  templateUrl: './surveys.html',
  styleUrl: './surveys.scss',
})
export class Surveys {
  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal('TODOS');

  protected readonly surveys = signal<Survey[]>([
    {
      id: 'survey-001',
      name: 'Evaluación Docente 2026-2',
      description: 'Evaluación de la experiencia académica y docente.',
      teacher: 'Carlos Pérez',
      questions: 10,
      status: 'ACTIVA',
      createdAt: '23 ago 2026',
    },
    {
      id: 'survey-002',
      name: 'Satisfacción Académica',
      description: 'Encuesta para conocer la satisfacción de los estudiantes.',
      teacher: 'María López',
      questions: 8,
      status: 'BORRADOR',
      createdAt: '22 ago 2026',
    },
    {
      id: 'survey-003',
      name: 'Evaluación del Curso',
      description: 'Evaluación general del desarrollo del curso.',
      teacher: 'Andrés Gómez',
      questions: 12,
      status: 'CERRADA',
      createdAt: '18 ago 2026',
    },
  ]);

  protected readonly filteredSurveys = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.surveys().filter((survey) => {
      const matchesSearch =
        !search ||
        survey.name.toLowerCase().includes(search) ||
        survey.teacher.toLowerCase().includes(search);

      const matchesStatus =
        status === 'TODOS' || survey.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value);
  }
}