# Controly · Gestão Odontológica

SaaS para clínicas odontológicas: cadastro de pacientes, **odontograma interativo** (mapa de dentes com observações por dente) e **automação de atendimento via WhatsApp**.

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
├── types/                    # tipos de domínio (Patient, Odontograma, Automation...)
├── lib/                      # utilitários (storage, id, cn, format)
├── data/                     # seeds e constantes (layout FDI dos dentes, status)
├── services/                 # camada de dados (localStorage) — patients, odontogram, automations
│
├── components/
│   ├── layout/               # AppLayout, Sidebar, Topbar
│   └── ui/                   # Button, Card, Input, Modal, Badge, EmptyState
│
└── features/                 # módulos por funcionalidade
    ├── dashboard/            # visão geral + métricas
    ├── patients/             # lista, formulário e ficha do paciente
    ├── odontogram/           # mapa de dentes interativo (Tooth, ToothPanel, Legend)
    └── automations/          # fluxos de WhatsApp
```

A regra é simples: **lógica de dados fica em `services/`**, **estado de domínio em `types/`**, e cada tela vive em `features/<modulo>/`. Componentes genéricos reutilizáveis ficam em `components/ui`.

## Funcionalidades

- **Pacientes** — cadastro, edição, busca, exclusão; ficha individual com dados de contato e link direto para o WhatsApp.
- **Odontograma** — notação FDI (32 dentes, arcadas superior e inferior). Clique em um dente para definir a condição (saudável, cárie, restaurado, em tratamento, ausente, implante) e registrar uma observação. Dentes com observação ganham um marcador; a aba "Registros" consolida tudo.
- **Automações WhatsApp** — crie fluxos por gatilho (lembrete 24h, pós-consulta, retorno periódico, aniversário, novo agendamento) com mensagens personalizáveis (`{{nome}}`, `{{horario}}`) e ative/desative cada um.

## Próximos passos sugeridos

1. Substituir os `services/` por um cliente de API real (mantendo a mesma interface).
2. Integrar um provedor de WhatsApp Business para disparo efetivo das automações.
3. Autenticação e múltiplas clínicas (multi-tenant).
