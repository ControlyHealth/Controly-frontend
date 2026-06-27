/**
 * Geometria 3D de um dente com formato anatômico aproximado.
 *
 * Em vez de "esfera + cone", revolucionamos um perfil (coroa bojuda que afina
 * no colo e segue numa raiz cônica) com LatheGeometry e ajustamos a escala por
 * tipo: incisivo fino (lâmina), canino longo, pré-molar médio, molar largo.
 *
 * `THREE` é passado como argumento porque a biblioteca é carregada via CDN em
 * runtime dentro de cada componente.
 */
export type ToothType3D = 'incisivo' | 'canino' | 'premolar' | 'molar'

export function buildToothGeometry(THREE: any, type: ToothType3D): any {
  const v = (x: number, y: number) => new THREE.Vector2(x, y)
  // perfil de baixo (ápice da raiz) para cima (topo da coroa); x = raio
  const profile = [
    v(0.0, -1.05), // ápice (fecha embaixo)
    v(0.05, -0.92),
    v(0.1, -0.62),
    v(0.135, -0.3),
    v(0.13, -0.04), // colo cervical
    v(0.155, 0.1),
    v(0.225, 0.28), // bojo da coroa
    v(0.225, 0.44),
    v(0.17, 0.55),
    v(0.075, 0.61),
    v(0.0, 0.63), // topo (fecha em cima)
  ]
  const geo = new THREE.LatheGeometry(profile, 24)

  // ajuste anatômico por tipo (x = mésio-distal, y = altura, z = vestíbulo-lingual)
  if (type === 'incisivo') geo.scale(1.0, 1.05, 0.5)
  else if (type === 'canino') geo.scale(0.92, 1.28, 0.72)
  else if (type === 'premolar') geo.scale(1.08, 0.98, 0.9)
  else geo.scale(1.5, 0.88, 1.3) // molar largo

  geo.computeVertexNormals()
  return geo
}

/** Multiplicador de tamanho geral por tipo, para o footprint no arco. */
export function toothFootprint(type: ToothType3D): number {
  return type === 'molar' ? 1.2 : type === 'premolar' ? 1.0 : type === 'canino' ? 1.0 : 0.92
}
