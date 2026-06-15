# Controly · Gestão Odontológica

SaaS para clínicas odontológicas: cadastro de pacientes, **odontograma interativo** com dentes anatômicos e marcações ortodônticas, **plano de tratamento ortodôntico**, **radiografias** por paciente, **gestão de estoque** e **automação de atendimento via WhatsApp**.

Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router**. Os dados são persistidos localmente no `localStorage` através de uma camada de serviços — basta trocar essa camada por chamadas a uma API quando o backend estiver pronto.

## Como rodar

> Importante: se você abriu este projeto logo após a configuração inicial, apague a pasta `node_modules` e reinstale para garantir um estado limpo.

```bash
# (uma vez) limpeza, caso necessário
rm -rf node_modules

npm install      # instala as dependências
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção (tsc + vite) -> dist/
npm run preview  # serve o build de produção
npm run lint     # ESLint
```

## Arquitetura de pastas

```
src/
├── main.tsx                  # ponto de entrada (RouterProvider)
├── router.tsx                # definição das rotas
├── index.css                 # Tailwind v4 + tema da marca
│
├── types/                    # tipos de domínio (Patient, Odontograma, Radiografia, StockItem, OrthoTreatment...)
├── lib/                      # utilitários (storage, id, cn, format)
├── data/                     # seeds e constantes (layout FDI, formas dos dentes, status, marcadores orto)
├── services/                 # camada de dados (localStorage) — patients, odontogram, radiografias, stock, ortho, automations
│
├── components/
│   ├── layout/               # AppLayout, Sidebar, Topbar
│   └── ui/                   # Button, Card, Input, Modal, Badge, EmptyState
│
└── features/                 # módulos por funcionalidade
    ├── dashboard/            # visão geral + métricas (inclui alerta de estoque)
    ├── patients/             # lista, formulário, ficha e panorama do paciente
    ├── odontogram/           # mapa de dentes interativo (Tooth, ToothPanel, Legend)
    ├── ortho/                # plano de tratamento ortodôntico
    ├── radiografias/         # exames de imagem por paciente (upload local)
    ├── stock/                # gerenciamento de estoque
    └── automations/          # fluxos de WhatsApp
```

A regra é simples: **lógica de dados fica em `services/`**, **estado de domínio em `types/`**, e cada tela vive em `features/<modulo>/`. Componentes genéricos reutilizáveis ficam em `components/ui`.

## Funcionalidades

- **Pacientes** — cadastro, edição, busca, exclusão; ficha individual com dados de contato e link direto para o WhatsApp.
- **Panorama do paciente** — aba inicial da ficha com resumo: idade e contato, condições do odontograma agrupadas, status ortodôntico e contagem de radiografias, com atalhos para cada seção.
- **Odontograma** — notação FDI (32 dentes). Cada dente é desenhado com a **forma anatômica real** do seu tipo (incisivo, canino, pré-molar, molar) e a arcada superior é espelhada (raiz para cima). Clique em um dente para definir a condição (saudável, cárie, restaurado, em tratamento, ausente, implante), aplicar uma **marcação ortodôntica** e registrar observações.
- **Ortodontia** — além das marcações por dente (bráquete, banda, **contenção**, extração indicada, alinhador) sobrepostas no odontograma, há uma aba de **plano de tratamento**: tipo de aparelho (metálico, estético, autoligado, lingual, alinhador, expansor, contenção), arcadas, início, previsão de término, queixa, objetivo e status.
- **Radiografias** — espaço por paciente para anexar exames de imagem (panorâmica, periapical, interproximal, oclusal, telerradiografia, tomografia). As imagens são reduzidas e guardadas localmente (base64) com data, tipo e observação; visualização ampliada em modal.
- **Estoque** — cadastro de itens por categoria (material, instrumental, ortodontia, descartável, medicamento, EPI), com quantidade, **estoque mínimo**, unidade, fornecedor e validade. Ajuste rápido de quantidade (+/−), alerta de itens no nível mínimo e destaque de validade próxima.
- **Automações WhatsApp** — crie fluxos por gatilho (lembrete 24h, pós-consulta, retorno periódico, aniversário, novo agendamento) com mensagens personalizáveis (`{{nome}}`, `{{horario}}`) e ative/desative cada um.

## Próximos passos sugeridos

1. Substituir os `services/` por um cliente de API real (mantendo a mesma interface).
2. Migrar imagens de radiografia para storage de objetos (S3/GCS) em vez de base64 no `localStorage`.
3. Integrar um provedor de WhatsApp Business para disparo efetivo das automações.
4. Autenticação e múltiplas clínicas (multi-tenant).
