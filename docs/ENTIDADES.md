# Entidades do Controly

Documento explicativo de todas as entidades (modelos de dados) existentes na aplicação até o momento. As definições vivem em `src/types/index.ts` e são persistidas via `localStorage` (camada `src/lib/storage.ts`), cada uma com seu serviço em `src/services/`.

> Convenção: `ID` é uma `string`. Campos marcados com `?` são opcionais. Datas são strings ISO (`criadoEm`, `atualizadoEm`) ou no formato `YYYY-MM-DD` (campos de agenda).

---

## User — Usuário / Profissional

Representa o profissional logado. Usado para personalizar a aplicação (ex.: saudação no dashboard). Serviço: `src/services/user.ts` (`current()`, `currentName()`, `save()`).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `ID` | Identificador do usuário |
| `nome` | `string` | Nome exibido |
| `email` | `string?` | E-mail de contato |
| `clinica` | `string?` | Nome da clínica |
| `cargo` | `string?` | Cargo/função (ex.: Cirurgião-dentista) |

---

## Patient — Paciente

Cadastro central de pacientes da clínica. Serviço: `src/services/patients.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `ID` | Identificador |
| `nome` | `string` | Nome completo |
| `cpf` | `string?` | CPF |
| `telefone` | `string?` | Telefone/WhatsApp |
| `email` | `string?` | E-mail |
| `dataNascimento` | `string?` | Data de nascimento |
| `observacoes` | `string?` | Anotações livres |
| `criadoEm` | `string` | Data de criação |
| `atualizadoEm` | `string` | Última atualização |

---

## Odontograma + ToothRecord — Mapa dental

Representa a condição dental de um paciente. O `Odontograma` agrupa os dentes (`ToothRecord`) indexados pelo número do dente. Serviço: `src/services/odontogram.ts`.

**Odontograma**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pacienteId` | `ID` | Paciente dono do mapa |
| `dentes` | `Record<number, ToothRecord>` | Dentes mapeados pelo número |
| `atualizadoEm` | `string` | Última atualização |

**ToothRecord (dente)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `numero` | `number` | Número do dente |
| `status` | `ToothStatus` | Condição clínica |
| `orto` | `OrtoMarker?` | Marcação ortodôntica sobreposta |
| `observacao` | `string?` | Anotação do dente |
| `atualizadoEm` | `string` | Última atualização |

**ToothStatus:** `saudavel`, `carie`, `lesao_nao_cariosa`, `restaurado`, `tratamento`, `ausente`, `implante`.

**OrtoMarker** (marcador ortodôntico independente da condição): `nenhum`, `bracket`, `banda`, `contencao`, `extracao`, `alinhador`.

---

## Radiografia — Imagens radiográficas

Exames de imagem vinculados a um paciente, com a imagem armazenada localmente em base64. Serviço: `src/services/radiografias.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `ID` | Identificador |
| `pacienteId` | `ID` | Paciente associado |
| `tipo` | `RadiografiaTipo` | Tipo do exame |
| `data` | `string` | Data do exame |
| `observacao` | `string?` | Anotação |
| `imagem` | `string?` | Imagem em dataURL (base64) |
| `nomeArquivo` | `string?` | Nome do arquivo original |
| `criadoEm` | `string` | Data de criação |

**RadiografiaTipo:** `panoramica`, `periapical`, `interproximal`, `oclusal`, `telerradiografia`, `tomografia`, `outro`.

---

## StockItem — Item de estoque

Controle de insumos e materiais da clínica, com alerta de estoque mínimo. Serviço: `src/services/stock.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `ID` | Identificador |
| `nome` | `string` | Nome do item |
| `categoria` | `StockCategory` | Categoria |
| `quantidade` | `number` | Quantidade atual |
| `minimo` | `number` | Quantidade mínima (gatilho de alerta) |
| `unidade` | `string` | Unidade de medida |
| `fornecedor` | `string?` | Fornecedor |
| `validade` | `string?` | Data de validade |
| `observacao` | `string?` | Anotação |
| `criadoEm` | `string` | Data de criação |
| `atualizadoEm` | `string` | Última atualização |

**StockCategory:** `material`, `instrumental`, `ortodontia`, `descartavel`, `medicamento`, `epi`, `outro`.

---

## OrthoTreatment — Tratamento ortodôntico

Plano de tratamento ortodôntico de um paciente. Serviço: `src/services/ortho.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pacienteId` | `ID` | Paciente em tratamento |
| `aparelho` | `OrthoAppliance?` | Tipo de aparelho |
| `status` | `OrthoStatus` | Estágio do tratamento |
| `inicio` | `string?` | Data de início |
| `previsaoFim` | `string?` | Previsão de término |
| `arcadas` | `'superior' \| 'inferior' \| 'ambas'?` | Arcadas tratadas |
| `queixa` | `string?` | Queixa principal |
| `objetivo` | `string?` | Objetivo do tratamento |
| `observacao` | `string?` | Anotação |
| `atualizadoEm` | `string` | Última atualização |

**OrthoAppliance:** `metalico`, `estetico`, `autoligado`, `lingual`, `alinhador`, `expansor`, `contencao`.

**OrthoStatus:** `planejado`, `ativo`, `contencao`, `finalizado`, `pausado`.

---

## Automation — Automação (WhatsApp)

Regras de mensagens automáticas via WhatsApp, disparadas por gatilhos. Serviço: `src/services/automations.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `ID` | Identificador |
| `nome` | `string` | Nome da automação |
| `gatilho` | `AutomationTrigger` | Evento que dispara |
| `canal` | `AutomationChannel` | Canal de envio (`whatsapp`) |
| `mensagem` | `string` | Texto enviado |
| `ativo` | `boolean` | Liga/desliga a regra |
| `criadoEm` | `string` | Data de criação |
| `atualizadoEm` | `string` | Última atualização |

**AutomationTrigger:** `agendamento_criado`, `lembrete_24h`, `pos_consulta`, `aniversario`, `retorno_periodico`.

**AutomationChannel:** `whatsapp`.

---

## Appointment — Consulta / Agenda

Agendamentos de consultas dos pacientes. Serviço: `src/services/appointments.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `ID` | Identificador |
| `pacienteId` | `ID` | Paciente da consulta |
| `data` | `string` | Data (`YYYY-MM-DD`) |
| `inicio` | `string` | Hora de início (`HH:MM`) |
| `fim` | `string` | Hora de término (`HH:MM`) |
| `procedimento` | `string?` | Procedimento previsto |
| `status` | `AppointmentStatus` | Situação da consulta |
| `observacao` | `string?` | Anotação |
| `criadoEm` | `string` | Data de criação |
| `atualizadoEm` | `string` | Última atualização |

**AppointmentStatus:** `agendado`, `confirmado`, `atendido`, `atrasado`, `faltou`, `cancelado`.

---

## Relações entre entidades

- **Patient** é o eixo central: **Odontograma**, **Radiografia**, **OrthoTreatment** e **Appointment** referenciam um paciente via `pacienteId`.
- **Odontograma** contém vários **ToothRecord** (um por dente).
- **Automation** e **StockItem** são independentes (não ligados a um paciente específico).
- **User** representa quem opera o sistema, fora do domínio clínico.
