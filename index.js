const express = require("express");
const { randomUUID } = require("crypto"); // Importa a função para gerar UUID
const app = express();
const port = 3000;

// Express entender o JSON no corpo das requisições
app.use(express.json());

// COLOCAR O PostgreSQL aqui.
let orders = [];

// Listar todos os pedidos
app.get("/order/list", (req, res) => {
  res.status(200).send(orders);
});

// Obter um pedido específico pelo ID
app.get("/order/:id", (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.numeroPedido === id);
  if (!order) {
    return res.status(404).send({ message: "Pedido não encontrado." });
  }
  res.status(200).send(order);
});

// Criar um novo pedido
app.post("/order", (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send({
      message:
        "O campo 'items' é obrigatório e deve ser um array com pelo menos um item.",
    });
  }

  const valorTotal = items.reduce((total, item) => {
    if (item.quantidadeItem == null || item.valorItem == null) {
      return total;
    }
    return total + item.quantidadeItem * item.valorItem;
  }, 0);

  const newOrder = {
    numeroPedido: randomUUID(), // Gera um UUID para o pedido
    valorTotal: valorTotal,
    dataCriacao: new Date().toISOString(),
    items: items,
  };

  orders.push(newOrder);
  res.status(201).send(newOrder);
});

// Atualizar um pedido pelo ID
app.put("/order/:id", (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  const orderIndex = orders.findIndex((o) => o.numeroPedido === id);

  if (orderIndex === -1) {
    return res.status(404).send({ message: "Pedido não encontrado." });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send({
      message:
        "O campo 'items' é obrigatório e deve ser um array com pelo menos um item.",
    });
  }

  const valorTotal = items.reduce((total, item) => {
    if (item.quantidadeItem == null || item.valorItem == null) {
      return total;
    }
    return total + item.quantidadeItem * item.valorItem;
  }, 0);

  const updatedOrder = {
    ...orders[orderIndex],
    valorTotal: valorTotal,
    items: items,
    dataAtualizacao: new Date().toISOString(), // atualiza a data do pedido
  };

  orders[orderIndex] = updatedOrder;
  res.status(200).send(updatedOrder);
});

// Remover um pedido pelo ID
app.delete("/order/:id", (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex((o) => o.numeroPedido === id);

  if (orderIndex === -1) {
    return res.status(404).send({ message: "Pedido não encontrado." });
  }

  orders.splice(orderIndex, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(
    `Clique para ver os pedidos: http://localhost:${port}/order/list`
  );
});
