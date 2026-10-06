// ============================================================
// Página CADASTRAR (POST)
// Envia uma nova pessoa para a API do JSON Server
// ============================================================

//Endereço da API. Caminho ABSOLUTO porque esta página fica em /post/
//(fetch('pessoas') relativo viraria /post/pessoas e quebraria)
const API = '/pessoas';

//Elementos da página
const form = document.getElementById('form-cadastro');
const campoCpf = document.getElementById('cpf');
const campoTelefone = document.getElementById('telefone');
const botaoSalvar = document.getElementById('btn-salvar');
const mensagem = document.getElementById('mensagem');


// ---------- Máscaras ----------

//Formata o CPF enquanto o usuário digita: 000.000.000-00
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')                 // deixa só os números
        .slice(0, 11)                        // CPF tem 11 dígitos
        .replace(/(\d{3})(\d)/, '$1.$2')     // 000.0
        .replace(/(\d{3})(\d)/, '$1.$2')     // 000.000.0
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // 000.000.000-00
}

//Formata o telefone: (00) 0000-0000 (fixo) ou (00) 00000-0000 (celular)
function mascaraTelefone(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length === 0) return '';
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

//Aplica as máscaras a cada tecla digitada
campoCpf.addEventListener('input', function() {
    campoCpf.value = mascaraCPF(campoCpf.value);
});

campoTelefone.addEventListener('input', function() {
    campoTelefone.value = mascaraTelefone(campoTelefone.value);
});


// ---------- Mensagens ----------

//Mostra uma mensagem de feedback na própria página
//tipo: 'sucesso', 'erro' ou 'info' | link (opcional): { href, texto }
function mostrarMensagem(texto, tipo, link) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;

    if (link) {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.texto;
        mensagem.append(' ', a);
    }

    mensagem.hidden = false;
    mensagem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

//Esconde a mensagem
function esconderMensagem() {
    mensagem.hidden = true;
}

//Transforma qualquer erro em um texto amigável
//(fetch lança TypeError quando não consegue falar com o servidor)
function textoDoErro(erro) {
    if (erro instanceof TypeError) return 'Não foi possível conectar ao servidor.';
    return erro.message;
}


// ---------- Cadastro ----------

//Lê os campos do formulário e monta o objeto pessoa
function lerFormulario() {
    const campos = form.elements;

    return {
        cpf: campos.cpf.value,
        nome: campos.nome.value.trim(),
        sobrenome: campos.sobrenome.value.trim(),
        email: campos.email.value.trim(),
        idade: Number(campos.idade.value),
        telefone: campos.telefone.value,
        rua: campos.rua.value.trim(),
        bairro: campos.bairro.value.trim(),
        cidade: campos.cidade.value.trim(),
        estado: campos.estado.value,
        rg: campos.rg.value.trim()
    };
}

//GET /pessoas?cpf=... para saber se o CPF já está cadastrado
async function cpfJaCadastrado(cpf) {
    const resposta = await fetch(`${API}?cpf=${encodeURIComponent(cpf)}`);

    if (!resposta.ok) {
        throw new Error(`Erro ao verificar o CPF (status ${resposta.status}).`);
    }

    const lista = await resposta.json();
    return lista.length > 0;
}

//POST /pessoas com os dados do formulário
async function cadastrarPessoa(pessoa) {
    const resposta = await fetch(API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pessoa)
    });

    if (!resposta.ok) {
        throw new Error(`Erro ao cadastrar (status ${resposta.status}).`);
    }

    return resposta.json();
}

//Envio do formulário
//O navegador já valida os campos obrigatórios e os formatos (required/pattern) antes deste evento
form.addEventListener('submit', async function(evento) {
    evento.preventDefault();
    esconderMensagem();

    const pessoa = lerFormulario();
    botaoSalvar.disabled = true;

    try {
        //Bloqueia CPF duplicado
        if (await cpfJaCadastrado(pessoa.cpf)) {
            mostrarMensagem(`Já existe uma pessoa cadastrada com o CPF ${pessoa.cpf}.`, 'erro');
            campoCpf.focus();
            return;
        }

        const criada = await cadastrarPessoa(pessoa);

        //Limpa o formulário e mostra o link para a listagem
        form.reset();
        mostrarMensagem(
            `${criada.nome} ${criada.sobrenome} cadastrado(a) com sucesso! (ID ${criada.id})`,
            'sucesso',
            { href: '/get/', texto: 'Ver lista' }
        );
    } catch (erro) {
        mostrarMensagem(textoDoErro(erro), 'erro');
    } finally {
        botaoSalvar.disabled = false;
    }
});

//Ao clicar em "Limpar", some também a mensagem
form.addEventListener('reset', esconderMensagem);
