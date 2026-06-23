# Evolução AC — Alojamento Conjunto RN

Plataforma para **evolução diária do recém-nascido** em unidade de acompanhamento
conjunto. Foco em uso no **celular**, com cálculos automáticos e geração do texto
no formato do prontuário.

> Ferramenta de apoio. Percentis, bilirrubina e Capurro devem ser **conferidos pelo
> profissional** antes do uso assistencial.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** (Postgres + Auth + RLS) — login único da equipe
- **Vercel** (deploy + Cron de expurgo)

## Recursos
- Formulário de evolução espelhando o modelo do serviço (botões, chaves
  Normal/Alterado, reflexos, etc.).
- Caixa **"copiar para o prontuário"** gerada em tempo real.
- Cálculos: horas de vida (corte 08:00 editável), tendência de peso (g/dia, %),
  Capurro somático, idade gestacional (DUM/USG).
- **Em desenvolvimento:** painel de passagem com export PDF; percentis INTERGROWTH-21st;
  bilirrubina AAP-2022 + curva de prematuro; gráficos; extração da ficha de parto.

## Extração da ficha de parto — sem IA
Extração **100% no dispositivo**: `pdf.js` lê o texto selecionável (ou rasteriza e
roda **Tesseract.js** quando o PDF é imagem) e um **parser regex** ancorado nos
rótulos da FOLHA DE SALA DE PARTO preenche os campos. Nenhum dado do paciente sai
do navegador; o arquivo-fonte não é armazenado.

## Privacidade / retenção
Dados clínicos sensíveis com RLS. Registros são **excluídos 7 dias após a alta**
(botão "Dar alta" + cron). Veja `supabase/migrations/0001_init.sql`.

## Desenvolvimento
```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev                  # http://localhost:3000
```

Aplique o schema em `supabase/migrations/0001_init.sql` no seu projeto Supabase.
