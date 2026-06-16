# Controly — Especificação do Backend

Lista completa das features a implementar no backend para suportar o frontend atual (hoje 100% em `localStorage`). Organizado por domínio, com endpoints REST sugeridos, regras de negócio e o que precisa existir além do que o front já faz.

Convenções: respostas em JSON; autenticação via `Authorization: Bearer <token>`; todos os recursos isolados por clínica (multi-tenant). IDs são strings (UUID). Datas em ISO 8601; campos de agenda em `YYYY-MM-DD` / `HH:MM`.

---

## 1. Autenticação e usuários

Hoje o front "loga" gravando o usuário no `localStorage`. No backend precisa virar autenticação real.

Features:

- Cadastro de usuário (profissional) e da clínica.
- Login com e-mail + senha, retornando token (JWT) e dados do usuário.
- Logout / invalidação de token (e refresh token).
- Recuperação de senha (e-mail com link/token).
- Perfil do usuário logado (nome, e-mail, clínica, cargo) — usado na sidebar e na saudação do dashboard.
- Atualização de perfil.
- Hash de senha (bcrypt/argon2), rate limiting no login.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria clínica + primeiro usuário |
| POST | `/auth/login` | Autentica, retorna token |
| POST | `/auth/logout` | Invalida sessão/token |
| POST | `/auth/refresh` | Renova o token |
| POST | `/auth/forgot-password` | Dispara e-mail de recuperação |
| POST | `/auth/reset-password` | Redefine a senha com token |
| GET | `/me` | Retorna o usuário autenticado |
| PATCH | `/me` | Atualiza nome/cargo/clínica |

Regras: e-mail único por sistema; papéis/perfis (admin, dentista, recepção) para controle de acesso futuro.

---

## 2. Pacientes

Espelha `patientsService` (list, get, create, update, remove).

Features:

- CRUD de pacientes.
- Busca por nome, CPF, telefone ou e-mail (a busca já existe no front e deve poder ir ao servidor com paginação).
- Validação de CPF e de unicidade (CPF/e-mail por clínica).
- Paginação e ordenação (por nome).
- Soft delete (não perder histórico clínico ao remover).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients?search=&page=&sort=` | Lista/paginada/busca |
| GET | `/patients/:id` | Detalhe |
| POST | `/patients` | Cria |
| PATCH | `/patients/:id` | Atualiza |
| DELETE | `/patients/:id` | Remove (soft delete) |

Campos: nome*, cpf, telefone, email, dataNascimento, observacoes, criadoEm, atualizadoEm.

---

## 3. Odontograma

Espelha `odontogramService` (get, setTooth, reset). Hoje gera resumo + laudo técnico no front.

Features:

- Obter o odontograma de um paciente (32 dentes na notação FDI; criar vazio/hígido se não existir).
- Atualizar um dente (status, marcação ortodôntica, observação).
- Reiniciar o odontograma (zerar marcações).
- Persistir histórico de alterações por dente (quem alterou e quando) — para auditoria clínica.
- Endpoint de resumo/estatísticas (contagens por status e marcação) — opcional, já que o front calcula, mas útil para relatórios.
- (Opcional) Gerar/baixar o laudo técnico em PDF no servidor.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients/:id/odontogram` | Mapa completo |
| PUT | `/patients/:id/odontogram/teeth/:numero` | Atualiza um dente |
| POST | `/patients/:id/odontogram/reset` | Reinicia |
| GET | `/patients/:id/odontogram/summary` | Contagens (resumo) |

Status do dente: `saudavel`, `carie`, `lesao_nao_cariosa`, `restaurado`, `tratamento`, `ausente`, `implante`. Marcação orto: `nenhum`, `bracket`, `banda`, `contencao`, `extracao`, `alinhador`.

---

## 4. Ortodontia

Espelha `orthoService` (get, save). É um registro único por paciente.

Features:

- Obter o plano ortodôntico do paciente.
- Criar/atualizar o plano (aparelho, status, datas, arcadas, queixa, objetivo, observação).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients/:id/ortho` | Plano ortodôntico |
| PUT | `/patients/:id/ortho` | Cria/atualiza |

Aparelho: `metalico`, `estetico`, `autoligado`, `lingual`, `alinhador`, `expansor`, `contencao`. Status: `planejado`, `ativo`, `contencao`, `finalizado`, `pausado`.

---

## 5. Radiografias

Espelha `radiografiasService` (list, count, add, remove). **Ponto crítico:** hoje a imagem é base64 no `localStorage` — no backend precisa ir para storage de arquivos.

Features:

- Upload de imagem (multipart) com armazenamento em object storage (S3/GCS) e geração de URL.
- Listar radiografias do paciente.
- Excluir radiografia (remover arquivo do storage também).
- Compressão/redimensionamento no servidor (hoje feito no browser) e geração de thumbnail.
- Metadados: tipo, data, observação, nome do arquivo.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients/:id/radiographs` | Lista |
| POST | `/patients/:id/radiographs` | Upload (multipart) |
| GET | `/radiographs/:id/file` | Servir imagem (URL assinada) |
| DELETE | `/radiographs/:id` | Excluir |

Tipos: `panoramica`, `periapical`, `interproximal`, `oclusal`, `telerradiografia`, `tomografia`, `outro`.

---

## 6. Agenda / Consultas

Espelha `appointmentsService` (list, listByDate, countByDate, countsBetween, create, update, remove).

Features:

- CRUD de consultas.
- Listar por data e por intervalo (a agenda usa visão semanal com contagem por dia).
- Contagem de consultas por dia (para os indicadores do calendário).
- Troca rápida de status (já existe no front via popover).
- Validações: horário final > inicial; impedir sobreposição de horários (conflito de agenda) — regra nova.
- Filtros por paciente e por status.
- (Futuro) disparar automações ao criar/confirmar consulta (ver seção 8).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/appointments?date=` | Consultas do dia |
| GET | `/appointments?from=&to=` | Intervalo (semana) |
| GET | `/appointments/counts?from=&to=` | Contagem por dia |
| POST | `/appointments` | Cria |
| PATCH | `/appointments/:id` | Atualiza (inclui status) |
| DELETE | `/appointments/:id` | Exclui |

Status: `agendado`, `confirmado`, `atendido`, `atrasado`, `faltou`, `cancelado`.

---

## 7. Estoque

Espelha `stockService` (list, lowStock, create, update, remove, adjust).

Features:

- CRUD de itens.
- Ajuste de quantidade (+/-) — botões de incremento/decremento na tela.
- Filtro de itens em nível mínimo (estoque baixo) e contagem de alertas.
- Busca por nome, categoria e fornecedor.
- Alertas de validade próxima (o front já destaca; o backend pode notificar).
- (Futuro) histórico de movimentação de estoque.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/stock?search=&lowOnly=` | Lista/busca/filtro |
| POST | `/stock` | Cria |
| PATCH | `/stock/:id` | Atualiza |
| PATCH | `/stock/:id/adjust` | Ajusta quantidade (delta) |
| DELETE | `/stock/:id` | Remove |

Categorias: `material`, `instrumental`, `ortodontia`, `descartavel`, `medicamento`, `epi`, `outro`.

---

## 8. Automações (WhatsApp)

Espelha `automationsService` (list, create, update, toggle, remove). Hoje é só rascunho local — o grande trabalho de backend é **executar** de fato.

Features:

- CRUD de automações.
- Ativar/desativar (toggle).
- Motor de execução: avaliar gatilhos e enviar mensagens de WhatsApp.
- Integração com WhatsApp Business API (provedor: Meta Cloud API, Twilio, etc.).
- Templates com variáveis (`{{nome}}`, `{{horario}}`) e renderização com dados reais.
- Agendador (cron/fila) para gatilhos temporais: lembrete 24h, retorno periódico, aniversário.
- Log de envios (entregue, lido, falhou) e reprocessamento.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/automations` | Lista |
| POST | `/automations` | Cria |
| PATCH | `/automations/:id` | Atualiza |
| PATCH | `/automations/:id/toggle` | Ativa/desativa |
| DELETE | `/automations/:id` | Remove |
| GET | `/automations/:id/logs` | Histórico de envios |

Gatilhos: `agendamento_criado`, `lembrete_24h`, `pos_consulta`, `aniversario`, `retorno_periodico`. Canal: `whatsapp`.

Infra necessária: fila de jobs (BullMQ/Sidekiq/Celery), worker agendado, webhook para status de entrega do provedor.

---

## 9. Dashboard / Indicadores

A tela inicial agrega dados de vários domínios. Vale um endpoint consolidado para evitar várias chamadas.

Features:

- Consultas de hoje, total de pacientes, itens em estoque baixo, automações ativas, registros no odontograma.
- Lista de pacientes recentes.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard` | Métricas agregadas + recentes |

---

## 10. Requisitos transversais (infraestrutura)

Itens que não são de um domínio só, mas precisam existir:

- **Banco de dados** relacional (PostgreSQL recomendado) com schema para todas as entidades.
- **Multi-tenant**: todo recurso pertence a uma clínica; isolamento por `clinica_id` em cada query.
- **Autenticação/autorização**: JWT + middleware de permissão por papel.
- **Validação** de entrada (schema validation) e tratamento de erros padronizado.
- **Migrations** e seeds (equivalente ao `seed.ts` atual para ambiente de demo).
- **Object storage** para radiografias (substituir base64).
- **Fila/agendador** para automações e lembretes.
- **Logs de auditoria** (quem criou/alterou/excluiu) — importante em contexto clínico.
- **Soft delete** em entidades clínicas (paciente, consulta, radiografia).
- **Paginação, ordenação e busca** padronizadas.
- **CORS, rate limiting, HTTPS**.
- **LGPD**: dados sensíveis de saúde — criptografia em repouso, política de retenção, consentimento e exportação/exclusão de dados do paciente.
- **Documentação da API** (OpenAPI/Swagger).
- **Testes** (unitários e de integração) e ambiente de staging.

---

## Resumo por prioridade

Fase 1 (MVP — paridade com o front): Auth real, Pacientes, Odontograma, Ortodontia, Agenda, Estoque, Radiografias (com storage), Dashboard.

Fase 2 (diferencial): Motor de automações + WhatsApp, lembretes agendados, logs de envio, auditoria, laudo em PDF.

Fase 3 (escala/compliance): multi-tenant robusto, papéis/permissões, LGPD completa, relatórios e histórico de movimentações.
