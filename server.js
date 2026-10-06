//Importa o módulo express (servidor principal da aplicação)
const express = require('express');

//Importa a biblioteca json-server (cria a API REST a partir do db.json)
const jsonServer = require('json-server');

//Importa o módulo path, usado para montar os caminhos dos arquivos
//path.join(__dirname, ...) funciona em qualquer sistema (Windows, Linux do Docker/Render)
const path = require('path');

//Cria a instância do express
//Correção em relação ao original: lá o app express era criado e nunca usado,
//porque quem subia na porta era o "server" do json-server.
//Agora o express é o app principal e o json-server é montado dentro dele.
const app = express();

//Cria um roteador com o arquivo db.json
//O roteador define as rotas da API. Cada coleção do JSON vira uma rota:
//"pessoas" -> GET, POST, PUT e DELETE em /pessoas
const router = jsonServer.router(path.join(__dirname, 'db.json'));

//Importa os padrões do json-server (logger, CORS, no-cache e arquivos estáticos)
//O "static" aponta para a nossa pasta public, para não depender da pasta onde o node foi executado
const middlewares = jsonServer.defaults({ static: path.join(__dirname, 'public') });

//Define a porta em que o servidor irá rodar
//O Render define a variável de ambiente PORT; localmente usamos a 3000
const porta = process.env.PORT || 3000;

//Define a rota principal
//Enviando o arquivo index.html (página inicial com o menu das 4 operações)
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Configura o express para servir os arquivos estáticos da pasta public
//Ex.: /post/ -> public/post/index.html e /style.css -> public/style.css
app.use(express.static(path.join(__dirname, 'public')));

//Funções que são executadas em cada requisição feita ao servidor (padrões do json-server)
app.use(middlewares);

//Usa o roteador do json-server dentro do express
//É isso que expõe a API em /pessoas
app.use(router);

//Inicia o servidor na porta definida e exibe uma mensagem no console
app.listen(porta, function() {
    console.log(`Servidor (Express + JSON Server) rodando em http://localhost:${porta}`);
});
