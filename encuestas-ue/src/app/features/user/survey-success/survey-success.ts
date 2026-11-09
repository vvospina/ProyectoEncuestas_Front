import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-survey-success',
  styleUrl: './survey-success.scss',
  templateUrl: './survey-success.html',
})
export class SurveySuccess {
  // Datos que envía la pantalla de responder al navegar hasta aquí
  protected readonly surveyTitle: string = history.state?.titulo ?? 'Encuesta';
  protected readonly totalQuestions: number = history.state?.total ?? 0;
  protected readonly answeredQuestions: number = history.state?.respondidas ?? 0;
}
