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

## 8.5 Mensagens / Caixa de entrada unificada

Espelha `inboxService` (connections, connect, disconnect, conversations, messages, reply, markRead, unreadTotal). Hoje é tudo local com dados de exemplo. O objetivo do recurso é **centralizar num só lugar as mensagens das redes da clínica** (WhatsApp, Instagram e Facebook), para o funcionário não precisar abrir um aplicativo de cada vez. O grande trabalho de backend é **integrar de fato** com as plataformas e manter as conversas sincronizadas em tempo real.

### 8.5.1 Conexão de canais

Features:

- Conectar/desconectar cada canal da clínica (uma conta por canal): WhatsApp, Instagram, Facebook.
- Fluxo OAuth com a Meta (Facebook Login) para Instagram e Messenger; WhatsApp Business via Meta Cloud API (token + phone number ID).
- Guardar com segurança tokens de acesso (criptografados em repouso) e renovar tokens de longa duração.
- Status da conexão (`conectado`, `desconectado`, `erro`) e reautenticação quando o token expira.
- Registro do webhook de cada canal para receber mensagens em tempo real.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/inbox/connections` | Lista status de cada canal |
| POST | `/inbox/connections/:canal/connect` | Inicia/conclui OAuth e ativa o canal |
| DELETE | `/inbox/connections/:canal` | Desconecta o canal (revoga token) |

Canais: `whatsapp`, `instagram`, `facebook`. Status: `conectado`, `desconectado`, `erro`.

### 8.5.2 Conversas e mensagens

Features:

- Listar conversas (uma conversa = um contato dentro de um canal), ordenadas pela última mensagem, com filtro por canal e contagem de não lidas.
- Listar mensagens de uma conversa (histórico, paginado).
- Enviar resposta pelo canal de origem (a resposta sai pela API da rede correta).
- Marcar conversa como lida (zera o contador).
- Total de não lidas (badge da sidebar).
- Receber mensagens recebidas via **webhook** de cada plataforma e gravar na conversa correspondente (criando a conversa se for um contato novo).
- (Opcional) vincular a conversa a um paciente já cadastrado (`pacienteId`) por telefone/e-mail.
- (Futuro) atribuição de conversa a um atendente, status (aberta/resolvida), respostas rápidas/templates e anexos (imagem/áudio/documento).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/inbox/conversations?canal=&unread=` | Lista/filtra conversas |
| GET | `/inbox/conversations/:id/messages?page=` | Mensagens da conversa |
| POST | `/inbox/conversations/:id/messages` | Envia resposta pelo canal |
| PATCH | `/inbox/conversations/:id/read` | Marca como lida |
| GET | `/inbox/unread-count` | Total de não lidas |
| POST | `/inbox/webhooks/:canal` | Webhook de entrada (Meta) |

Direção da mensagem: `recebida`, `enviada`.

Regras e integrações:

- **WhatsApp:** Meta Cloud API (ou Twilio). Atenção à janela de 24h de atendimento e ao uso de *templates* aprovados para iniciar conversa fora dela.
- **Instagram + Facebook:** Meta Graph API / Messenger Platform; a conta do Instagram precisa ser Profissional e estar vinculada a uma página do Facebook; permissões `instagram_manage_messages` e `pages_messaging`.
- **Webhooks:** verificação de assinatura (X-Hub-Signature), idempotência (não duplicar mensagem reenviada) e fila para processar picos.
- **Tempo real no front:** WebSocket/SSE para empurrar novas mensagens sem recarregar.
- **Multi-tenant + LGPD:** conversas isoladas por clínica; dados de contato são pessoais (consentimento, retenção e exclusão).

Infra necessária: fila de jobs para webhooks, canal de tempo real (WebSocket/SSE), storage para anexos, cofre de segredos para os tokens.

---

## 9. Finanças

Espelha `financeService` (lançamentos + resumo) e `orcamentosService` (orçamentos). Cobre três frentes: lançamentos (receitas/despesas), contas a receber e orçamentos / plano de tratamento.

### 9.1 Lançamentos (receitas e despesas)

Features:

- CRUD de lançamentos (receita ou despesa).
- Filtro por tipo (receita/despesa), categoria, status e período.
- Marcar como pago/recebido (mudança rápida de status — já existe no front).
- Vínculo opcional com paciente (e com orçamento).
- Resumo consolidado: total recebido, a receber, despesas pagas/pendentes e saldo.
- (Futuro) relatórios por período, fluxo de caixa e DRE simples.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/transactions?type=&status=&from=&to=` | Lista/filtra |
| POST | `/transactions` | Cria |
| PATCH | `/transactions/:id` | Atualiza |
| PATCH | `/transactions/:id/status` | Marca pago/pendente |
| DELETE | `/transactions/:id` | Exclui |
| GET | `/finance/summary?from=&to=` | Totais consolidados |

Tipo: `receita`, `despesa`. Situação: `pago`, `pendente`. Formas: `dinheiro`, `pix`, `cartao_credito`, `cartao_debito`, `transferencia`, `boleto`, `convenio`. Categorias: `procedimento`, `produto`, `material`, `salario`, `aluguel`, `equipamento`, `imposto`, `marketing`, `outro`.

### 9.2 Contas a receber

Deriva das receitas com status `pendente`.

Features:

- Listar receitas pendentes ordenadas por vencimento.
- Destacar títulos atrasados (vencimento < hoje).
- Receber (baixar) um título → muda status para pago.
- (Futuro) parcelamento, lembrete de cobrança automática (integra com automações), juros/multa.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/receivables` | Receitas pendentes |
| PATCH | `/transactions/:id/status` | Receber (status = pago) |

### 9.3 Orçamentos / Plano de tratamento

Espelha `orcamentosService`.

Features:

- CRUD de orçamentos por paciente, com itens (descrição, dente, quantidade, valor unitário) e desconto.
- Cálculo de total no servidor (não confiar só no front).
- Aprovar orçamento → **gera automaticamente uma conta a receber** (receita pendente) vinculada, evitando duplicidade.
- Mudança de status (rascunho → aprovado → concluído / recusado).
- (Futuro) gerar PDF do orçamento para o paciente assinar.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/budgets?patientId=` | Lista (por paciente) |
| GET | `/budgets/:id` | Detalhe |
| POST | `/budgets` | Cria |
| PATCH | `/budgets/:id` | Atualiza |
| POST | `/budgets/:id/approve` | Aprova e gera receita |
| DELETE | `/budgets/:id` | Exclui |

Status: `rascunho`, `aprovado`, `recusado`, `concluido`.

Regra de negócio importante: ao aprovar, criar a transação vinculada (`orcamentoId`) em uma única operação (idealmente transacional no banco) e não duplicar se já houver lançamento para aquele orçamento.

---

## 10. Dashboard / Indicadores

A tela inicial agrega dados de vários domínios. Vale um endpoint consolidado para evitar várias chamadas.

Features:

- Consultas de hoje, total de pacientes, itens em estoque baixo, automações ativas, registros no odontograma.
- Indicadores financeiros (saldo, a receber) — opcional no card do dashboard.
- Lista de pacientes recentes.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard` | Métricas agregadas + recentes |

---

## 11. Planos e Assinaturas (Billing)

Surge a partir da tela pública de planos (`/planos`). Define o que cada clínica pode usar e gera a receita do produto.

Planos atuais (referência do front):

- **Individual** — R$ 129/mês · 1 profissional · módulos clínicos + financeiro.
- **Equipe** — R$ 249/mês · até 5 profissionais · automações WhatsApp + relatórios.
- **Personalizado** — sob consulta · profissionais ilimitados / multiunidade · contato comercial.

Features:

- Catálogo de planos (nome, preço mensal/anual, limites, recursos).
- Ciclo de cobrança mensal e anual (anual com desconto — "2 meses grátis").
- Assinatura da clínica: plano atual, status (ativa, trial, inadimplente, cancelada), data de renovação.
- Período de teste (trial) e fluxo de upgrade/downgrade.
- **Enforcement de limites** por plano: nº de profissionais, acesso a automações/relatórios, etc. (middleware que bloqueia recursos fora do plano).
- Integração com gateway de pagamento (Stripe, Pagar.me, Asaas, Iugu) — assinaturas recorrentes, cartão/boleto/Pix.
- Webhooks do gateway para atualizar status (pagamento aprovado, falhou, estornado).
- Faturas/recibos da assinatura e histórico de cobranças.
- Lead do plano "Personalizado": registrar contato comercial (form/e-mail).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/plans` | Catálogo de planos |
| GET | `/subscription` | Assinatura atual da clínica |
| POST | `/subscription` | Assina/escolhe plano |
| PATCH | `/subscription` | Upgrade/downgrade/cancelamento |
| GET | `/subscription/invoices` | Histórico de cobranças |
| POST | `/billing/webhook` | Webhook do gateway |
| POST | `/leads/contact` | Contato do plano personalizado |

Observação importante: o front hoje "vende dados locais" e o login é fictício — billing real só faz sentido depois da **autenticação real (seção 1)** e do **multi-tenant (seção 12)**.

---

## 12. Requisitos transversais (infraestrutura)

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

Fase 1 (MVP — paridade com o front): Auth real, Pacientes, Odontograma, Ortodontia, Agenda, Estoque, Radiografias (com storage), Finanças (lançamentos + contas a receber + orçamentos), Dashboard.

Fase 2 (diferencial + monetização): Motor de automações + WhatsApp, **Mensagens / caixa de entrada unificada** (WhatsApp + Instagram + Facebook via Meta API, webhooks e tempo real), lembretes agendados, logs de envio, auditoria, laudo/orçamento em PDF, relatórios financeiros (fluxo de caixa), **Billing/Assinaturas** (gateway de pagamento + enforcement de limites por plano).

Fase 3 (escala/compliance): multi-tenant robusto, papéis/permissões, LGPD completa, relatórios avançados e histórico de movimentações (estoque e financeiro).
