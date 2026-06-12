# PoliclínicaMed

Sistema de prontuário eletrônico e gestão da Policlínica Municipal de Alto Alegre do Maranhão.

## Módulos

| Rota | Módulo | Perfil |
|---|---|---|
| `/login` | Acesso por perfil profissional | Todos |
| `/recepcao` | Fila do dia, painel de chamadas (com voz) e cadastro de pacientes com busca no CadSUS | Recepcionista |
| `/triagem` | Sinais vitais, IMC e classificação de risco Manchester | Enfermagem |
| `/prontuario` | Atendimento completo: anamnese, exame físico, CID-10 (RNDS), conduta, encaminhamentos, agendamento, registro tardio e resultados de exames | Médico |
| `/documentos` | Receituário (busca ANVISA), atestado, declaração, solicitação de exames e encaminhamento — com prévia imprimível | Médico |
| `/gestao` | Indicadores, produção por profissional, BPA e APAC | Gestor |
| `/agendar` | Agendamento online público para pacientes | Público |

## Tecnologias

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** com design system próprio (`app/globals.css`)
- **lucide-react** para ícones
- Integrações: RNDS/FHIR (CadSUS e CID-10) e ANVISA (medicamentos), com fallback local

## Como rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

```
app/            Rotas e telas (App Router)
components/     AppShell (sidebar + topbar) e DocPreview (documentos imprimíveis)
lib/auth.ts     Sessão do usuário e proteção de rotas
```

## Avisos importantes

- **Autenticação**: o login atual é demonstrativo (credenciais fixas no código). Antes de uso em produção com dados reais de pacientes, implemente autenticação real (ex.: Supabase Auth, já presente nas dependências) e proteção de rotas no servidor.
- **Dados**: os dados são armazenados no `localStorage` do navegador — não há persistência em banco. Para uso real, conecte um backend (Supabase) respeitando a LGPD.
