// ============================================================
// Página EDITAR (PUT)
// 1) Busca a pessoa pelo CPF (GET /pessoas?cpf=...) e preenche o formulário
// 2) Atualiza com PUT /pessoas/:id enviando o objeto completo
// Também aceita ?cpf= na URL (vindo da página Listar) e busca sozinha
// ============================================================

//Endereço da API. Caminho ABSOLUTO porque esta página fica em /put/
const API = '/pessoas';

//Campos editáveis de cada pessoa (o id vem da URL do PUT)
const CAMPOS = ['cpf', 'nome', 'sobrenome', 'email', 'idade', 'telefone', 'rua', 'bairro', 'cidade', 'estado', 'rg'];

//Elementos da página
const formBusca = document.getElementById('form-busca');
const campoBusca = document.getElementById('busca-cpf');
const botaoBuscar = document.getElementById('btn-buscar');
const formEdicao = document.getElementById('form-edicao');
const botaoAtualizar = document.getElementById('btn-atualizar');
const botaoCancelar = document.getElementById('btn-cancelar');
const perfilAvatar = document.getElementById('perfil-avatar');
const perfilNome = document.getElementById('perfil-nome');
const perfilDetalhe = document.getElementById('perfil-detalhe');
const mensagem = document.getElementById('mensagem');

//Pessoa carregada pela busca (guarda o id e o CPF original)
let pessoaAtual = null;


// ---------- Máscaras ----------

//Formata o CPF enquanto o usuário digita: 000.000.000-00
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

//Formata o telefone: (00) 0000-0000 ou (00) 00000-0000
function mascaraTelefone(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length === 0) return '';
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

//Aplica a máscara de CPF no campo de busca e no campo do formulário
[campoBusca, formEdicao.elements.cpf].forEach(function(campo) {
    campo.addEventListener('input', function() {
        campo.value = mascaraCPF(campo.value);
    });
});

formEdicao.elements.telefone.addEventListener('input', function(evento) {
    evento.target.value = mascaraTelefone(evento.target.value);
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

function esconderMensagem() {
    mensagem.hidden = true;
}

function textoDoErro(erro) {
    if (erro instanceof TypeError) return 'Não foi possível conectar ao servidor.';
    return erro.message;
}


// ---------- API ----------

//GET /pessoas?cpf=... -> devolve a pessoa encontrada ou null
async function buscarPorCpf(cpf) {
    const resposta = await fetch(`${API}?cpf=${encodeURIComponent(cpf)}`);

    if (!resposta.ok) {
        throw new Error(`Erro ao buscar (status ${resposta.status}).`);
    }

    const lista = await resposta.json();
    return lista.length > 0 ? lista[0] : null;
}

//PUT /pessoas/:id -> substitui o registro inteiro pelo objeto enviado
async function atualizarPessoa(id, pessoa) {
    const resposta = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pessoa)
    });

    if (!resposta.ok) {
        throw new Error(`Erro ao atualizar (status ${resposta.status}).`);
    }

    return resposta.json();
}


// ---------- Formulário ----------

//Iniciais do nome para o avatar (ex.: Maria Silva -> MS)
function iniciais(pessoa) {
    const primeira = (pessoa.nome || '?').charAt(0);
    const segunda = (pessoa.sobrenome || '').charAt(0);
    return (primeira + segunda).toUpperCase();
}

//Mostra o cabeçalho com avatar, nome, ID e CPF da pessoa que está sendo editada
function mostrarPerfil(pessoa) {
    perfilAvatar.textContent = iniciais(pessoa);
    perfilNome.textContent = `${pessoa.nome} ${pessoa.sobrenome}`;
    perfilDetalhe.textContent = `ID ${pessoa.id} · CPF ${pessoa.cpf}`;
}

//Coloca os dados da pessoa nos campos
function preencherFormulario(pessoa) {
    CAMPOS.forEach(function(campo) {
        formEdicao.elements[campo].value = pessoa[campo] ?? '';
    });
}

//Lê os campos e monta o objeto COMPLETO para o PUT
function lerFormulario() {
    const campos = formEdicao.elements;

    return {
        id: pessoaAtual.id,
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

//Esconde e limpa o formulário de edição
function fecharFormulario() {
    pessoaAtual = null;
    formEdicao.reset();
    formEdicao.hidden = true;
}

//Atualiza o ?cpf= da URL (assim um F5 recarrega a mesma pessoa)
function atualizarUrl(cpf) {
    const url = cpf ? `${location.pathname}?cpf=${encodeURIComponent(cpf)}` : location.pathname;
    history.replaceState(null, '', url);
}


// ---------- Ações ----------

//Busca a pessoa pelo CPF digitado e mostra o formulário preenchido
async function buscar() {
    const cpf = campoBusca.value.trim();
    esconderMensagem();
    fecharFormulario();
    botaoBuscar.disabled = true;

    try {
        const pessoa = await buscarPorCpf(cpf);

        if (!pessoa) {
            mostrarMensagem(`Nenhuma pessoa encontrada com o CPF ${cpf}.`, 'erro');
            return;
        }

        pessoaAtual = pessoa;
        mostrarPerfil(pessoa);
        preencherFormulario(pessoa);
        formEdicao.hidden = false;
        atualizarUrl(pessoa.cpf);
    } catch (erro) {
        mostrarMensagem(textoDoErro(erro), 'erro');
    } finally {
        botaoBuscar.disabled = false;
    }
}

//Envia o PUT com os dados do formulário
async function atualizar() {
    esconderMensagem();
    const dados = lerFormulario();
    botaoAtualizar.disabled = true;

    try {
        //Se o CPF foi alterado, ele não pode pertencer a outra pessoa
        if (dados.cpf !== pessoaAtual.cpf) {
            const outra = await buscarPorCpf(dados.cpf);
            if (outra && outra.id !== pessoaAtual.id) {
                mostrarMensagem(`O CPF ${dados.cpf} já pertence a outra pessoa.`, 'erro');
                return;
            }
        }

        const atualizada = await atualizarPessoa(pessoaAtual.id, dados);

        //Mantém a pessoa carregada com os dados novos
        pessoaAtual = atualizada;
        mostrarPerfil(atualizada);
        campoBusca.value = atualizada.cpf;
        atualizarUrl(atualizada.cpf);
        mostrarMensagem(
            `Dados de ${atualizada.nome} ${atualizada.sobrenome} atualizados com sucesso!`,
            'sucesso',
            { href: '/get/', texto: 'Ver lista' }
        );
    } catch (erro) {
        mostrarMensagem(textoDoErro(erro), 'erro');
    } finally {
        botaoAtualizar.disabled = false;
    }
}


// ---------- Eventos ----------

formBusca.addEventListener('submit', function(evento) {
    evento.preventDefault();
    buscar();
});

formEdicao.addEventListener('submit', function(evento) {
    evento.preventDefault();
    atualizar();
});

botaoCancelar.addEventListener('click', function() {
    fecharFormulario();
    esconderMensagem();
    campoBusca.value = '';
    atualizarUrl('');
    campoBusca.focus();
});

//Se a página abriu com ?cpf= na URL (vindo da Listar), busca automaticamente
const cpfDaUrl = new URLSearchParams(location.search).get('cpf');
if (cpfDaUrl) {
    campoBusca.value = mascaraCPF(cpfDaUrl);
    buscar();
}
