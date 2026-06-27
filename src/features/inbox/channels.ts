import { MessageCircle, Instagram, Facebook, type LucideIcon } from 'lucide-react'
import type { MessageChannel } from '@/types'

/** Metadados visuais e de marca de cada canal conectável. */
export interface ChannelMeta {
  canal: MessageChannel
  label: string
  /** Ícone do lucide-react usado nos badges e cards. */
  icon: LucideIcon
  /** Classe utilitária para o "ponto"/badge da cor da marca. */
  dot: string
  /** Texto do card de avatar (cor de fundo + ícone). */
  avatar: string
  /** Descrição curta exibida na tela de conexão. */
  descricao: string
  /** Passos resumidos de como conectar (mock da clínica). */
  comoConectar: string[]
}

export const CHANNELS: Record<MessageChannel, ChannelMeta> = {
  whatsapp: {
    canal: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    dot: 'bg-green-500',
    avatar: 'bg-green-100 text-green-600',
    descricao: 'Receba mensagens do WhatsApp Business da clínica.',
    comoConectar: [
      'Tenha uma conta WhatsApp Business (API Cloud da Meta).',
      'Autorize o número da clínica no aplicativo Meta Business.',
      'Cole o token de acesso e o ID do número de telefone.',
    ],
  },
  instagram: {
    canal: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    dot: 'bg-pink-500',
    avatar: 'bg-pink-100 text-pink-600',
    descricao: 'Responda os direct messages (DM) do perfil da clínica.',
    comoConectar: [
      'Use uma conta Instagram Profissional vinculada a uma página do Facebook.',
      'Conceda permissão de mensagens via login com o Facebook.',
      'Selecione o perfil que receberá os DMs aqui no Controly.',
    ],
  },
  facebook: {
    canal: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    dot: 'bg-blue-500',
    avatar: 'bg-blue-100 text-blue-600',
    descricao: 'Centralize o Messenger da página do Facebook da clínica.',
    comoConectar: [
      'Faça login com o Facebook e escolha a página da clínica.',
      'Autorize o acesso ao Messenger da página.',
      'Pronto: as conversas chegam direto nesta caixa de entrada.',
    ],
  },
}

/** Ordem fixa de exibição dos canais. */
export const CHANNEL_ORDER: MessageChannel[] = ['whatsapp', 'instagram', 'facebook']
