export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

/** Formata um número como moeda brasileira (R$). */
export function formatBRL(valor: number): string {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Mantém a palavra no singular se a quantidade for 1; senão concatena "s". */
export function pluralizar(qtd: number, palavra: string): string {
  return qtd === 1 ? palavra : palavra + 's'
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
