/**
 * Utilidades de regra de negócio para deduplicação de cadastros.
 *
 * `RegraDeNegocioError` é lançado pelos services quando um cadastro viola uma
 * regra (duplicidade, conflito de horário). As páginas capturam e exibem a
 * mensagem sem fechar o formulário.
 */

export class RegraDeNegocioError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RegraDeNegocioError'
  }
}

/** Normaliza texto para comparação: minúsculas, sem acentos, espaços colapsados. */
export function chaveTexto(s?: string): string {
  return (s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
}

/** Mantém apenas dígitos (para comparar CPF, CNPJ e telefone com/sem máscara). */
export function soDigitos(s?: string): string {
  return (s ?? '').replace(/\D/g, '')
}

/** E-mail normalizado para comparação. */
export function chaveEmail(s?: string): string {
  return (s ?? '').trim().toLowerCase()
}
