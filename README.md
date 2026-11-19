# StudyFlow — Organizador de Estudos e Rotinas

Aplicação completa em **React + TypeScript** para organizar seus estudos, rotinas diárias e acompanhar progresso.

## Funcionalidades

- 📅 **Dashboard do dia**: veja rotinas do dia, tarefas e estatísticas rápidas
- 📚 **Matérias**: cadastre matérias com meta de horas e acompanhe o progresso
- 🔄 **Rotinas recorrentes**: defina hábitos por dia da semana e horário
- ✅ **Tarefas**: com prioridade (alta/média/baixa) e prazo
- ⏱️ **Timer Pomodoro**: foco + pausa, com registro automático de sessão
- 📊 **Progresso**: total estudado, sessões e progresso por matéria
- 🌙 **Modo escuro**
- 💾 **Persistência local** (localStorage) — seus dados ficam no navegador

## Como rodar

```bash
cd study-organizer
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (geralmente http://localhost:5173).

## Tecnologias

- React 19 + TypeScript
- Vite
- Tailwind CSS (via CDN)
- LocalStorage para persistência

## Estrutura

```
src/
  components/Icons.tsx   → ícones SVG
  types/index.ts         → tipos TypeScript
  utils/storage.ts       → helpers de localStorage
  App.tsx                → aplicação completa
  main.tsx
```

Desenvolvido com ❤️ para organizar seus estudos.
