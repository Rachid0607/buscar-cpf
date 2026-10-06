# CRUD de Pessoas - JSON Server + Express

CRUD completo (cadastrar, listar, editar e excluir) de pessoas usando **Node.js/Express** como servidor e **JSON Server** como API REST sobre o arquivo `db.json`. Cada operação HTTP fica em uma página HTML separada, e as páginas se comunicam entre si (a listagem leva o CPF pela URL até as páginas de edição e exclusão).

Link do Render: LINK_DO_RENDER_AQUI

## Como rodar localmente

```bash
npm install
node server.js
```

Depois é só abrir http://localhost:3000.

## Páginas

| Página | Rota | Operação |
|---|---|---|
| Início | `/` | Menu com as 4 operações |
| Cadastrar | `/post/` | `POST /pessoas` (bloqueia CPF duplicado) |
| Listar | `/get/` | `GET /pessoas` e busca por CPF (`GET /pessoas?cpf=`) |
| Editar | `/put/` | Busca por CPF e `PUT /pessoas/:id` |
| Excluir | `/delete/` | Busca por CPF e `DELETE /pessoas/:id` |

## Tecnologias

- Node.js + Express 4
- JSON Server 0.17.4
- HTML, CSS e JavaScript (fetch)
- Docker (deploy no Render)
