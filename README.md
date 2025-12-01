# API de Gerenciamento de Pedidos

Uma API RESTful simples construída com Node.js, Express e PostgreSQL para gerenciar pedidos e seus itens.

## Funcionalidades

- Criar, listar, buscar, atualizar e deletar pedidos.
- Transações de banco de dados para garantir a consistência dos dados.
- Validação básica para a entrada de dados.

## Pré-requisitos

Antes de começar, você precisará ter as seguintes ferramentas instaladas em sua máquina:

- [Node.js](https://nodejs.org/en/) (versão 14 ou superior)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (um servidor de banco de dados rodando localmente ou remotamente)

## ⚙️ Instalação e Configuração

1.  **Clone o repositório:**

    ```bash
    git clone <url-do-seu-repositorio>
    cd <nome-do-diretorio>
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados:**

    a. Crie um banco de dados no PostgreSQL. Você pode usar o nome `banco_pedidos` como sugerido no código ou outro de sua preferência.

    b. Execute os seguintes comandos SQL para criar as tabelas `Order` e `Items`:

    ```sql
    CREATE TABLE "Order" (
        "orderId" UUID PRIMARY KEY,
        "value" DECIMAL(10, 2) NOT NULL,
        "creationDate" TIMESTAMP WITH TIME ZONE NOT NULL
    );

    CREATE TABLE "Items" (
        "itemId" SERIAL PRIMARY KEY,
        "orderId" UUID NOT NULL,
        "productId" VARCHAR(255) NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DECIMAL(10, 2) NOT NULL,
        CONSTRAINT fk_order
            FOREIGN KEY("orderId")
            REFERENCES "Order"("orderId")
            ON DELETE CASCADE
    );
    ```

    > **Nota:** A restrição `ON DELETE CASCADE` garante que, ao deletar um pedido, todos os seus itens associados também sejam removidos automaticamente.

    c. Atualize as credenciais de conexão com o banco de dados no arquivo `index.js`:

    ```javascript
    // /home/carchedi/Documentos/node/api_node/index.js

    const pool = new Pool({
      user: "seu_usuario", // Altere aqui
      host: "localhost",
      database: "banco_pedidos", // Altere se necessário
      password: "sua_senha", // Altere aqui
      port: 5432,
    });
    ```

## 🚀 Executando a Aplicação

Para iniciar o servidor, execute o comando:

```bash
node index.js
```

O servidor estará rodando em `http://localhost:3000`.

## Endpoints da API

A seguir estão os endpoints disponíveis na API.

---

### 1. Listar todos os Pedidos

- **URL:** `/order/list`
- **Método:** `GET`
- **Descrição:** Retorna uma lista de todos os pedidos, incluindo seus itens.
- **Resposta de Sucesso (200 OK):**
  ```json
  [
    {
      "numeroPedido": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "valorTotal": "150.50",
      "dataCriacao": "2025-12-01T15:30:00.000Z",
      "items": [
        {
          "productId": "PROD-001",
          "quantidadeItem": 2,
          "valorItem": "50.25"
        },
        {
          "productId": "PROD-002",
          "quantidadeItem": 1,
          "valorItem": "50.00"
        }
      ]
    }
  ]
  ```

### 2. Obter um Pedido Específico

- **URL:** `/order/:id`
- **Método:** `GET`
- **Descrição:** Retorna um pedido específico com base no seu ID.
- **Parâmetros da URL:**
  - `id` (string, obrigatório): O UUID do pedido.
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "numeroPedido": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "valorTotal": "150.50",
    "dataCriacao": "2025-12-01T15:30:00.000Z",
    "items": [
      {
        "productId": "PROD-001",
        "quantidadeItem": 2,
        "valorItem": "50.25"
      }
    ]
  }
  ```
- **Resposta de Erro (404 Not Found):**
  ```json
  {
    "message": "Pedido não encontrado."
  }
  ```

### 3. Criar um Novo Pedido

- **URL:** `/order`
- **Método:** `POST`
- **Descrição:** Cria um novo pedido com um ou mais itens.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "items": [
      {
        "productId": "PROD-003",
        "quantidadeItem": 1,
        "valorItem": 75.0
      },
      {
        "productId": "PROD-004",
        "quantidadeItem": 3,
        "valorItem": 25.5
      }
    ]
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "numeroPedido": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "valorTotal": 151.5,
    "dataCriacao": "2025-12-01T16:00:00.000Z",
    "items": [
      {
        "productId": "PROD-003",
        "quantidadeItem": 1,
        "valorItem": 75
      },
      {
        "productId": "PROD-004",
        "quantidadeItem": 3,
        "valorItem": 25.5
      }
    ]
  }
  ```
- **Resposta de Erro (400 Bad Request):** Se o campo `items` estiver ausente ou for inválido.

### 4. Atualizar um Pedido

- **URL:** `/order/:id`
- **Método:** `PUT`
- **Descrição:** Atualiza os itens de um pedido existente. Os itens antigos são removidos e substituídos pelos novos.
- **Parâmetros da URL:**
  - `id` (string, obrigatório): O UUID do pedido a ser atualizado.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "items": [
      {
        "productId": "PROD-005",
        "quantidadeItem": 1,
        "valorItem": 200.0
      }
    ]
  }
  ```
- **Resposta de Sucesso (200 OK):** Retorna o pedido atualizado.
- **Resposta de Erro (404 Not Found):** Se o pedido com o ID fornecido não existir.

### 5. Remover um Pedido

- **URL:** `/order/:id`
- **Método:** `DELETE`
- **Descrição:** Remove um pedido e todos os seus itens associados.
- **Parâmetros da URL:**
  - `id` (string, obrigatório): O UUID do pedido a ser removido.
- **Resposta de Sucesso:** `204 No Content` (sem corpo de resposta).
- **Resposta de Erro (404 Not Found):** Se o pedido com o ID fornecido não existir.
