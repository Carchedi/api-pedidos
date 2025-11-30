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

app.listen(port, () => {
  console.log(`Exemplo de app escutando na porta ${port}`);
});
