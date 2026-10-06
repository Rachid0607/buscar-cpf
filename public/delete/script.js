// ============================================================
// Página EXCLUIR (DELETE)
// 1) Busca a pessoa pelo CPF (GET /pessoas?cpf=...) e mostra os dados
// 2) Depois do confirm(), exclui com DELETE /pessoas/:id
// Também aceita ?cpf= na URL (vindo da página Listar) e busca sozinha
// ============================================================

//Endereço da API. Caminho ABSOLUTO porque esta página fica em /delete/
const API = '/pessoas';

//Campos exibidos e seus rótulos
const ROTULOS = {
    id: 'ID',
    cpf: 'CPF',
    rg: 'RG',
    nome: 'Nome',
    sobrenome: 'Sobrenome',
    email: 'E-mail',
    telefone: 'Telefone',
    idade: 'Idade',
    rua: 'Rua',
    bairro: 'Bairro',
    cidade: 'Cidade',
    estado: 'Estado'
};

//Elementos da página
const formBusca = document.getElementById('form-busca');
const campoBusca = document.getElementById('busca-cpf');
const botaoBuscar = document.getElementById('btn-buscar');
const areaDados = document.getElementById('area-dados');
const perfilAvatar = document.getElementById('perfil-avatar');
const perfilNome = document.getElementById('perfil-nome');
const perfilDetalhe = document.getElementById('perfil-detalhe');
const listaDados = document.getElementById('dados-pessoa');
const botaoExcluir = document.getElementById('btn-excluir');
const botaoCancelar = document.getElementById('btn-cancelar');
const mensagem = document.getElementById('mensagem');

//Pessoa encontrada pela busca
let pessoaAtual = null;


// ---------- Utilitários ----------

//Formata o CPF enquanto o usuário digita: 000.000.000-00
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

campoBusca.addEventListener('input', function() {
    campoBusca.value = mascaraCPF(campoBusca.value);
});

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

//Atualiza o ?cpf= da URL
function atualizarUrl(cpf) {
    const url = cpf ? `${location.pathname}?cpf=${encodeURIComponent(cpf)}` : location.pathname;
    history.replaceState(null, '', url);
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

//DELETE /pessoas/:id
async function excluirPessoa(id) {
    const resposta = await fetch(`${API}/${id}`, {
        method: 'DELETE'
    });

    if (!resposta.ok) {
        throw new Error(`Erro ao excluir (status ${resposta.status}).`);
    }
}


// ---------- Exibição ----------

//Iniciais do nome para o avatar (ex.: Maria Silva -> MS)
function iniciais(pessoa) {
    const primeira = (pessoa.nome || '?').charAt(0);
    const segunda = (pessoa.sobrenome || '').charAt(0);
    return (primeira + segunda).toUpperCase();
}

//Mostra os dados da pessoa: cabeçalho com avatar + lista (rótulo + valor)
//Usa textContent para o conteúdo nunca ser interpretado como HTML
function mostrarDados(pessoa) {
    perfilAvatar.textContent = iniciais(pessoa);
    perfilNome.textContent = `${pessoa.nome} ${pessoa.sobrenome}`;
    perfilDetalhe.textContent = `ID ${pessoa.id} · CPF ${pessoa.cpf}`;

    listaDados.replaceChildren();

    Object.keys(ROTULOS).forEach(function(campo) {
        const item = document.createElement('div');
        const rotulo = document.createElement('dt');
        const valor = document.createElement('dd');

        rotulo.textContent = ROTULOS[campo];
        valor.textContent = pessoa[campo] ?? '-';

        item.append(rotulo, valor);
        listaDados.append(item);
    });

    areaDados.hidden = false;
}

//Esconde os dados da pessoa
function esconderDados() {
    pessoaAtual = null;
    listaDados.replaceChildren();
    areaDados.hidden = true;
}


// ---------- Ações ----------

//Busca a pessoa pelo CPF digitado
async function buscar() {
    const cpf = campoBusca.value.trim();
    esconderMensagem();
    esconderDados();
    botaoBuscar.disabled = true;

    try {
        const pessoa = await buscarPorCpf(cpf);

        if (!pessoa) {
            mostrarMensagem(`Nenhuma pessoa encontrada com o CPF ${cpf}.`, 'erro');
            return;
        }

        pessoaAtual = pessoa;
        mostrarDados(pessoa);
        atualizarUrl(pessoa.cpf);
    } catch (erro) {
        mostrarMensagem(textoDoErro(erro), 'erro');
    } finally {
        botaoBuscar.disabled = false;
    }
}

//Pede confirmação e exclui a pessoa encontrada
async function excluir() {
    const nomeCompleto = `${pessoaAtual.nome} ${pessoaAtual.sobrenome}`;

    if (!confirm(`Deseja realmente excluir ${nomeCompleto} (CPF ${pessoaAtual.cpf})?`)) {
        return;
    }

    esconderMensagem();
    botaoExcluir.disabled = true;

    try {
        await excluirPessoa(pessoaAtual.id);

        esconderDados();
        campoBusca.value = '';
        atualizarUrl('');
        mostrarMensagem(`${nomeCompleto} foi excluído(a) com sucesso!`, 'sucesso', { href: '/get/', texto: 'Ver lista' });
    } catch (erro) {
        mostrarMensagem(textoDoErro(erro), 'erro');
    } finally {
        botaoExcluir.disabled = false;
    }
}


// ---------- Eventos ----------

formBusca.addEventListener('submit', function(evento) {
    evento.preventDefault();
    buscar();
});

botaoExcluir.addEventListener('click', excluir);

botaoCancelar.addEventListener('click', function() {
    esconderDados();
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
