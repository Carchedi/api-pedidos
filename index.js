const express = require("express");
const { randomUUID } = require("crypto"); // Importa a função para gerar UUID
const { Pool } = require("pg");

const app = express();
const port = 3000;

// Express entender o JSON no corpo das requisições
app.use(express.json());

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  user: "postgres", // seu usuário
  host: "localhost",
  database: "banco_pedidos", 
  password: "M@rina2024!",
  port: 5432,
});

// Listar todos os pedidos
app.get("/order/list", async (req, res) => {
  try {
    // Busca todos os pedidos e seus itens
    const { rows: orders } = await pool.query(`
      SELECT
        o."orderId" AS "numeroPedido",
        o.value AS "valorTotal",
        o."creationDate" AS "dataCriacao",
        json_agg(json_build_object(
          'productId', i."productId",
          'quantidadeItem', i.quantity,
          'valorItem', i.price
        )) AS items
      FROM "Order" o
      LEFT JOIN "Items" i ON o."orderId" = i."orderId"
      GROUP BY o."orderId"
      ORDER BY o."creationDate" DESC;
    `);
    res.status(200).send(orders);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao buscar pedidos." });
  }
});

// Obter um pedido específico pelo ID
app.get("/order/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `
      SELECT
        o."orderId" AS "numeroPedido",
        o.value AS "valorTotal",
        o."creationDate" AS "dataCriacao",
        (SELECT json_agg(json_build_object('productId', i."productId", 'quantidadeItem', i.quantity, 'valorItem', i.price)) FROM "Items" i WHERE i."orderId" = o."orderId") AS items
      FROM "Order" o
      WHERE o."orderId" = $1
    `,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).send({ message: "Pedido não encontrado." });
    }
    res.status(200).send(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao buscar pedido." });
  }
});

// Criar um novo pedido
app.post("/order", async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .send({
        message:
          "O campo 'items' é obrigatório e deve ser um array com pelo menos um item.",
      });
  }

  const valorTotal = items.reduce(
    (total, item) => total + item.quantidadeItem * item.valorItem,
    0
  );
  const newOrderId = randomUUID();
  const creationDate = new Date();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      'INSERT INTO "Order" ("orderId", value, "creationDate") VALUES ($1, $2, $3)',
      [newOrderId, valorTotal, creationDate]
    );

    for (const item of items) {
      if (!item.productId) {
        // Faz o rollback para cancelar a inserção do pedido
        await client.query("ROLLBACK");
        return res.status(400).send({ message: "O campo 'productId' é obrigatório para todos os itens." });
      }

      await client.query(
        'INSERT INTO "Items" ("orderId", "productId", quantity, price) VALUES ($1, $2, $3, $4)',
        [newOrderId, item.productId, item.quantidadeItem, item.valorItem]
      );
    }

    await client.query("COMMIT");

    const newOrder = {
      numeroPedido: newOrderId,
      valorTotal,
      dataCriacao: creationDate.toISOString(),
      items,
    };
    res.status(201).send(newOrder);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).send({ message: "Erro ao criar pedido." });
  } finally {
    client.release();
  }
});

// Atualizar um pedido pelo ID
app.put("/order/:id", async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .send({
        message:
          "O campo 'items' é obrigatório e deve ser um array com pelo menos um item.",
      });
  }

  const valorTotal = items.reduce(
    (total, item) => total + item.quantidadeItem * item.valorItem,
    0
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      'SELECT "orderId" FROM "Order" WHERE "orderId" = $1',
      [id]
    );
    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send({ message: "Pedido não encontrado." });
    }

    await client.query('UPDATE "Order" SET value = $1 WHERE "orderId" = $2', [
      valorTotal,
      id,
    ]);
    await client.query('DELETE FROM "Items" WHERE "orderId" = $1', [id]);

    for (const item of items) {
      if (!item.productId) {
        await client.query("ROLLBACK");
        return res.status(400).send({ message: "O campo 'productId' é obrigatório para todos os itens." });
      }

      await client.query(
        'INSERT INTO "Items" ("orderId", "productId", quantity, price) VALUES ($1, $2, $3, $4)',
        [id, item.productId, item.quantidadeItem, item.valorItem]
      );
    }

    await client.query("COMMIT");

    const { rows } = await client.query(
      'SELECT "creationDate" FROM "Order" WHERE "orderId" = $1',
      [id]
    );

    const updatedOrder = {
      numeroPedido: id,
      valorTotal,
      dataCriacao: rows[0].creationDate,
      items,
    };
    res.status(200).send(updatedOrder);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).send({ message: "Erro ao atualizar pedido." });
  } finally {
    client.release();
  }
});

// Remover um pedido pelo ID
app.delete("/order/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // A restrição ON DELETE CASCADE no banco de dados cuidaria disso automaticamente,
    // mas fazemos explicitamente para clareza.
    await client.query('DELETE FROM "Items" WHERE "orderId" = $1', [id]);
    const result = await client.query(
      'DELETE FROM "Order" WHERE "orderId" = $1',
      [id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send({ message: "Pedido não encontrado." });
    }

    await client.query("COMMIT");
    res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).send({ message: "Erro ao remover pedido." });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(
    `Clique para ver os pedidos: http://localhost:${port}/order/list`
  );
});
