import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EncuestasService, mensajeError } from '../../../core/services/encuestas.service';
import { DashboardEstudiante, EstudianteDashboard } from '../../../shared/models/dashboard-estudiante.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
})
export class StudentDashboard implements OnInit, OnDestroy {
  private readonly encuestasService = inject(EncuestasService);
  private dashboardRequest?: Subscription;

  protected readonly estudiantes = signal<EstudianteDashboard[]>([]);
  protected readonly estudianteSeleccionado = signal<EstudianteDashboard | null>(null);
  protected readonly dashboard = signal<DashboardEstudiante | null>(null);
  protected readonly terminoBusqueda = signal('');
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly cargandoEstudiantes = signal(false);
  protected readonly cargandoDashboard = signal(false);

  protected readonly estudiantesFiltrados = computed(() => {
    const termino = this.terminoBusqueda().trim().toLocaleLowerCase();
    return this.estudiantes()
      .filter((estudiante) =>
        `${estudiante.name} ${estudiante.email}`.toLocaleLowerCase().includes(termino),
      )
      .slice(0, 10);
  });

  ngOnInit(): void {
    this.cargandoEstudiantes.set(true);
    this.encuestasService.listarEstudiantesActivos().subscribe({
      next: (estudiantes) => {
        this.estudiantes.set(estudiantes);
        this.cargandoEstudiantes.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(mensajeError(err, 'No pudimos cargar las personas.'));
        this.cargandoEstudiantes.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.dashboardRequest?.unsubscribe();
  }

  protected buscarEstudiante(event: Event): void {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value);
  }

  protected seleccionarEstudiante(estudiante: EstudianteDashboard): void {
    this.dashboardRequest?.unsubscribe();
    this.estudianteSeleccionado.set(estudiante);
    this.terminoBusqueda.set(`${estudiante.name} ${estudiante.email}`);
    this.dashboard.set(null);
    this.errorMensaje.set(null);
    this.cargandoDashboard.set(true);

    this.dashboardRequest = this.encuestasService.obtenerDashboardEstudiante(estudiante.id).subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.cargandoDashboard.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(mensajeError(err, 'No pudimos cargar las estadísticas de la persona.'));
        this.cargandoDashboard.set(false);
      },
    });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
