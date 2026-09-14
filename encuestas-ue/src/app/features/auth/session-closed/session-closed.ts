import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-session-closed',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './session-closed.html',
  styleUrl: './session-closed.scss',
})
export class SessionClosedComponent {}
