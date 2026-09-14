import { Item } from './item.model';
import { Pregunta } from './pregunta.model';

export interface Encuesta {
  id: string;
  titulo: string;
  profesor: Item;
  preguntas: Pregunta[];
}
