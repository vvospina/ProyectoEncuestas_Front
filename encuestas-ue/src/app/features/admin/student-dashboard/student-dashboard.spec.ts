import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EncuestasService } from '../../../core/services/encuestas.service';
import { StudentDashboard } from './student-dashboard';

describe('StudentDashboard', () => {
  let fixture: ComponentFixture<StudentDashboard>;
  const estudiante = { id: 1, name: 'Estudiante', email: 'estudiante@example.com' };
  const dashboard = {
    student: estudiante,
    answeredSurveys: [
      {
        surveyId: 10,
        surveyTitle: 'Encuesta de bienvenida',
        submittedAt: '2026-01-15T12:00:00.000Z',
        details: [{ questionId: 1, questionText: '¿Cómo te fue?', answer: 'Muy bien' }],
      },
    ],
    pendingSurveys: [{ surveyId: 11, title: 'Encuesta pendiente', closeDate: null }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentDashboard],
      providers: [
        {
          provide: EncuestasService,
          useValue: {
            listarEstudiantesActivos: () => of([estudiante]),
            obtenerDashboardEstudiante: () => of(dashboard),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the selected student responses and pending surveys', async () => {
    const option = fixture.nativeElement.querySelector('.student-option') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Encuesta de bienvenida');
    expect(fixture.nativeElement.textContent).toContain('Muy bien');
    expect(fixture.nativeElement.textContent).toContain('Encuesta pendiente');
  });
});
