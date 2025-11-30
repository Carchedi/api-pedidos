const express = require("express");
const { randomUUID } = require("crypto"); // Importa a função para gerar UUID
const app = express();
const port = 3000;

// Express entender o JSON no corpo das requisições
app.use(express.json());

// COLOCAR O PostgreSQL aqui.
let orders = [];

app.get("/", (req, res) => {
  res.send("Primeiro GET funcionando");
});

// Criar um novo pedido
app.post("/order", (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send({
      message:
        "O campo 'items' é obrigatório e deve ser um array que não pode ser vazio.",
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

// Listar todos os pedidos
app.get("/order/list", (req, res) => {
  res.status(200).send(orders);
});

app.listen(port, () => {
  console.log(`Exemplo de app escutando na porta ${port}`);
});
