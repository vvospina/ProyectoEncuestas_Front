import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-survey-success',
  styleUrl: './survey-success.scss',
  templateUrl: './survey-success.html',
})
export class SurveySuccess {
  // reemplazar por los datos reales que entregue el flujo de diligenciamiento cuando esté conectado al backend
  protected readonly teacherName = 'Carlos Martínez';
  protected readonly totalQuestions = 10;
  protected readonly answeredQuestions = 10;
}
