# Karol Glow

Loja de cosméticos e beleza feminina da Karol Glow: site público (home, catálogo e página de produto) e painel administrativo (produtos, catálogo e vendas), com API em Node.js e banco PostgreSQL. O design vem do Figma e está implementado para desktop (1440 px) e mobile (390 px).

> **Estado atual:** o front-end e a API estão prontos e testados separadamente. A **integração do front com a API ainda não foi feita**: as telas continuam usando os dados de exemplo em memória (`src/stores`). Veja [Próximos passos](#próximos-passos).

## Stack

- **Front-end:** [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/), [Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/) e [Tailwind CSS v4](https://tailwindcss.com/)
- **API:** Node.js 20+ com [Express 5](https://expressjs.com/), [`pg`](https://node-postgres.com/) e [zod](https://zod.dev/)
- **Banco de dados:** PostgreSQL 14+ (esquema em `db/schema.sql`)
- Fontes locais via Fontsource: Fraunces (títulos) e Plus Jakarta Sans (interface)

## Como rodar

### 1. Front-end

```bash
npm install
cp .env.example .env.local   # preencha conforme o arquivo de exemplo
npm run dev                  # http://localhost:5173
```

| Comando           | O que faz                                  |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Servidor de desenvolvimento com hot reload |
| `npm run build`   | Gera a versão de produção em `dist/`       |
| `npm run preview` | Serve a build de produção localmente       |

Em desenvolvimento, as chamadas para `/api` são encaminhadas para `http://localhost:3001` (veja `vite.config.js`).

### 2. Banco de dados

Use um PostgreSQL local ou o do `docker-compose.yml`. As credenciais ficam só em variáveis de ambiente (nunca no repositório):

```bash
export POSTGRES_USER=...      # defina os valores no seu terminal ou em um arquivo .env ignorado pelo git
export POSTGRES_PASSWORD=...
docker compose up -d db
```

### 3. API

```bash
cd server
npm install
cp .env.example .env          # ajuste DATABASE_URL e demais variáveis
npm run migrate               # cria as tabelas (db/schema.sql)
npm run seed                  # (opcional) produtos de exemplo
npm run admin:create -- voce@exemplo.com "Seu Nome"   # pede a senha no terminal
npm run dev                   # http://localhost:3001
```

| Comando (em `server/`) | O que faz                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | API com reinício automático                                       |
| `npm start`            | API em modo normal                                                |
| `npm run migrate`      | Aplica `db/schema.sql`                                            |
| `npm run seed`         | Insere produtos de exemplo (pode rodar mais de uma vez)           |
| `npm run admin:create` | Cria ou atualiza um usuário administrador                         |
| `npm test`             | Testes de integração (precisa de `TEST_DATABASE_URL`, banco de teste) |

> Os testes criam e apagam dados. Aponte `TEST_DATABASE_URL` **somente** para um banco descartável.

## Endpoints da API

Públicos:

| Método | Rota                   | Descrição                                                  |
| ------ | ---------------------- | ---------------------------------------------------------- |
| GET    | `/api/health`          | Verifica API e banco                                       |
| GET    | `/api/products`        | Lista com filtros (`q`, `category`, `brand`, `skin`, `minPrice`, `maxPrice`, `inStock`, `onSale`, `sort`, `page`, `perPage`) |
| GET    | `/api/products/:id`    | Produto com variações                                      |
| GET    | `/api/catalog`         | Categorias, marcas, tipos de pele e de variação            |

Administração (exigem sessão):

| Método              | Rota                                | Descrição                                      |
| ------------------- | ----------------------------------- | ---------------------------------------------- |
| POST                | `/api/auth/login`                   | Entrar                                         |
| GET                 | `/api/auth/me`                      | Usuário da sessão                              |
| POST                | `/api/auth/logout`                  | Sair                                           |
| GET/POST/PUT/PATCH/DELETE | `/api/admin/products[/:id]`   | CRUD de produtos                               |
| POST/PUT/DELETE     | `/api/admin/catalog/:lista[/:id]`   | Categorias, marcas, tipos de pele e de variação |
| GET/POST            | `/api/admin/sales`                  | Lista e registra vendas                        |
| GET                 | `/api/admin/sales/stats`            | Resumo do dia                                  |
| POST                | `/api/admin/sales/:id/undo`         | Desfaz uma venda                               |

## Segurança

- Sessão por cookie `HttpOnly`, `SameSite=Strict` (e `Secure` em produção); no banco fica apenas o hash do token.
- Senhas com hash forte e comparação em tempo constante; mensagens de erro de login genéricas.
- Proteção contra CSRF, limite de requisições, bloqueio após tentativas de login falhas e prazo de sessão por validade e inatividade.
- Todas as consultas usam parâmetros; entradas são validadas com zod; cabeçalhos de segurança via Helmet.
- Variáveis de ambiente e chaves nunca são versionadas (veja `.gitignore`); use os arquivos `*.example` como modelo.

## Rotas do site

| Rota                  | Tela                                            | Acesso    |
| --------------------- | ----------------------------------------------- | --------- |
| `/`                   | Home                                            | Público   |
| `/produtos`           | Catálogo com filtros e paginação                | Público   |
| `/produtos/:id`       | Página do produto                               | Público   |
| `/componentes`        | Vitrine de componentes                          | Público   |
| `/login`              | Login do painel                                 | Visitante |
| `/admin/produtos`     | Lista de produtos                               | Admin     |
| `/admin/produtos/novo`| Cadastro de produto                             | Admin     |
| `/admin/produtos/:id` | Edição de produto                               | Admin     |
| `/admin/catalogo`     | Categorias, marcas, tipos de pele e de variação | Admin     |
| `/admin/vendas`       | Registro de vendas e histórico                  | Admin     |

## Estrutura do projeto

```
db/                  Esquema PostgreSQL
docker-compose.yml   PostgreSQL para desenvolvimento
docs/figma-ref/      Capturas do Figma usadas como referência
server/              API (Express + pg)
  src/routes/        auth, products, catalog, sales
  src/middleware/    sessão, CSRF e cabeçalhos
  scripts/           migrate, seed, create-admin
  test/              Testes de integração
src/                 Front-end
  components/        Componentes do site e do painel (components/admin)
  layouts/           MainLayout e AdminLayout
  router/            Rotas e guardas de navegação
  stores/            Pinia: products, cart, auth
  views/             Telas (views/admin para o painel)
```

## Design

- Arquivo do Figma: **Karol-Glow** (páginas `style`, `ui`, `desk-prototype` e `mobile-prototype`).
- Cores: ameixa `#3a1632`, ameixa suave `#6e5868`, lilás `#b565e0`, lilás claro `#f1e6f7`, creme `#fbf6ee`, linha `#e8dde6` (classes `bg-plum`, `text-plum-muted`, `text-lilac`, `bg-lilac-soft`, `border-line`, `font-display`, `font-ui`).
- Breakpoint mobile/desktop: `768px` (`md:`).

## Próximos passos

- Ligar o front à API: trocar as stores por chamadas a `/api` e usar o login da API (hoje o painel ainda usa o login local de desenvolvimento).
- Upload de imagens de produto e fotos reais nas categorias.
- Carrinho e checkout.
- Publicação (variáveis de produção, HTTPS e proxy reverso).

## Licença

[MIT](LICENSE) © 2026 Big Space Creative
