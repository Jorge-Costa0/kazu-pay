# Kazu Pay - Setup Instructions

## Como rodar o projeto no seu computador

### 1. Requisitos
- Node.js 20+ instalado
- PostgreSQL database (ou use uma instância online como Neon)

### 2. Instalação
```bash
# Clone ou extraia os arquivos do projeto
cd kazu-pay

# Instale as dependências
npm install
```

### 3. Configuração do Banco de Dados
Crie um arquivo `.env` na raiz do projeto com:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/kazupay"
SESSION_SECRET="your-super-secret-session-key-here"
REPL_ID="your-replit-app-id"
REPLIT_DOMAINS="localhost:5000"
ISSUER_URL="https://replit.com/oidc"
```

### 4. Inicializar o Banco
```bash
# Aplicar o schema do banco
npm run db:push
```

### 5. Rodar o Projeto
```bash
# Modo desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5000`

### 6. Estrutura do Projeto

```
kazu-pay/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── lib/            # Utilitários e tipos
│   │   └── pages/          # Páginas da aplicação
├── server/                 # Backend Express
│   ├── db.ts              # Configuração do banco
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Operações do banco
│   └── replitAuth.ts      # Autenticação
├── shared/                 # Código compartilhado
│   └── schema.ts          # Schema do banco (Drizzle)
└── package.json
```

### 7. Funcionalidades Implementadas

✅ **Carteira Digital**
- Saldo em Kwanzas
- Transações completas
- Histórico detalhado

✅ **Pagamentos**
- Contas (ENDE, EPAL, Internet)
- Recargas de telemóvel
- Interface mobile-first

✅ **Educação Financeira**
- Sistema de níveis e XP
- Lições interativas
- Conquistas e badges
- Gamificação completa

✅ **Autenticação**
- Login seguro via Replit
- Sessões persistentes
- Proteção de rotas

✅ **Interface**
- Design responsivo
- Tema angolano
- Componentes modernos
- Navegação intuitiva

### 8. Para Produção

Para usar em produção, você precisará:
1. Configurar autenticação própria (remover Replit Auth)
2. Integrar APIs reais (Multicaixa, MCX Express)
3. Configurar processamento de pagamentos
4. Adicionar certificados SSL
5. Configurar ambiente de deploy

### 9. Tecnologias Usadas

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter
- **Backend**: Express.js, PostgreSQL, Drizzle ORM
- **UI**: Shadcn/ui, Lucide Icons
- **Estado**: TanStack Query
- **Formulários**: React Hook Form + Zod

### 10. Suporte

Este é um projeto MVP completo com todas as funcionalidades básicas do Kazu Pay implementadas. Para dúvidas sobre implementação ou customização, consulte o código ou documentação das tecnologias usadas.

---
**Feito em Angola, para Angola 🇦🇴**