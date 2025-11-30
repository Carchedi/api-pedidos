const express = require("express");
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
  const { cliente, produto, valor } = req.body;

  if (!cliente || !produto || !valor) {
    return res.status(400).send({
      message: "Os campos 'cliente', 'produto' e 'valor' são obrigatórios.",
    });
  }

  const newOrder = {
    id: `v${Date.now()}`, // Gerando um ID único simples
    cliente,
    produto,
    valor,
    entregue: false,
    timestamp: new Date(),
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
