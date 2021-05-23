import {format} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(
    date: string,
    newFormat: string = 'dd MMM yyyy'
  ): string {
  return format(new Date(date), newFormat,
      {locale: ptBR}
  );
}
