// ============================================================
// Página LISTAR (GET)
// Mostra todas as pessoas numa tabela e filtra por CPF.
// Cada linha tem links para /put/?cpf=... e /delete/?cpf=...
// (é assim que as páginas se comunicam)
// ============================================================

//Endereço da API. Caminho ABSOLUTO porque esta página fica em /get/
const API = '/pessoas';

//Número de colunas da tabela (usado na linha de "nenhum registro")
const TOTAL_COLUNAS = 6;

//Ícones dos botões Editar e Excluir (SVG fixo, sem dados do usuário)
const ICONE_EDITAR = '<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
const ICONE_EXCLUIR = '<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';

//Elementos da página
const formBusca = document.getElementById('form-busca');
const campoBusca = document.getElementById('busca-cpf');
const botaoLimpar = document.getElementById('btn-limpar');
const infoLista = document.getElementById('info-lista');
const tabela = document.getElementById('tabela-corpo');
const mensagem = document.getElementById('mensagem');


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
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
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

//Cria um <span> com classe e texto
//Usa textContent (e não innerHTML) para o conteúdo nunca ser interpretado como HTML
function criarTexto(classe, texto) {
    const span = document.createElement('span');
    span.className = classe;
    span.textContent = texto ?? '';
    return span;
}

//Iniciais do nome para o avatar (ex.: Maria Silva -> MS)
function iniciais(pessoa) {
    const primeira = (pessoa.nome || '?').charAt(0);
    const segunda = (pessoa.sobrenome || '').charAt(0);
    return (primeira + segunda).toUpperCase();
}

//Cria um link com aparência de botão (Editar / Excluir)
function criarBotao(texto, href, classe, icone) {
    const a = document.createElement('a');
    a.href = href;
    a.className = `btn btn-sm ${classe}`;
    a.innerHTML = icone;
    a.append(texto);
    return a;
}

//Cria uma célula com uma linha principal e uma linha secundária (texto menor)
function celulaDupla(linha, principal, secundario) {
    const celula = linha.insertCell();
    celula.append(criarTexto('principal', principal), criarTexto('secundario', secundario));
    return celula;
}


// ---------- Tabela ----------

//Monta as linhas da tabela (todos os campos aparecem, agrupados por assunto)
function renderizarTabela(pessoas) {
    tabela.replaceChildren();

    if (pessoas.length === 0) {
        const celula = tabela.insertRow().insertCell();
        celula.colSpan = TOTAL_COLUNAS;
        celula.className = 'empty-cell';
        celula.textContent = 'Nenhuma pessoa encontrada.';
        return;
    }

    pessoas.forEach(function(pessoa) {
        const linha = tabela.insertRow();

        //ID
        const celulaId = linha.insertCell();
        celulaId.className = 'col-id';
        celulaId.textContent = pessoa.id;

        //Pessoa: avatar + nome completo + idade
        const blocoPessoa = document.createElement('div');
        blocoPessoa.className = 'celula-pessoa';
        const textos = document.createElement('div');
        textos.append(
            criarTexto('principal', `${pessoa.nome} ${pessoa.sobrenome}`),
            criarTexto('secundario', `${pessoa.idade} anos`)
        );
        blocoPessoa.append(criarTexto('avatar', iniciais(pessoa)), textos);
        linha.insertCell().append(blocoPessoa);

        //Documentos: CPF + RG
        celulaDupla(linha, pessoa.cpf, `RG ${pessoa.rg}`);

        //Contato: e-mail + telefone
        celulaDupla(linha, pessoa.email, pessoa.telefone);

        //Endereço: rua + bairro, cidade e estado
        const endereco = celulaDupla(linha, pessoa.rua, `${pessoa.bairro} · ${pessoa.cidade}`);
        endereco.lastChild.append(criarTexto('badge tone-neutral', pessoa.estado));

        //Ações: leva o CPF pela URL para a página de edição/exclusão
        const cpf = encodeURIComponent(pessoa.cpf);
        const acoes = linha.insertCell();
        acoes.className = 'col-acoes';
        acoes.append(
            criarBotao('Editar', `/put/?cpf=${cpf}`, 'btn-editar', ICONE_EDITAR),
            criarBotao('Excluir', `/delete/?cpf=${cpf}`, 'btn-excluir', ICONE_EXCLUIR)
        );
    });
}

//GET /pessoas (todas) ou GET /pessoas?cpf=... (filtrado)
async function carregarPessoas(cpf) {
    esconderMensagem();
    infoLista.textContent = 'Carregando...';

    const url = cpf ? `${API}?cpf=${encodeURIComponent(cpf)}` : API;

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar os dados (status ${resposta.status}).`);
        }

        const pessoas = await resposta.json();
        renderizarTabela(pessoas);

        //Texto acima da tabela
        if (cpf) {
            infoLista.textContent = pessoas.length > 0
                ? `Resultado da busca pelo CPF ${cpf}`
                : `Nenhuma pessoa com o CPF ${cpf}`;
        } else {
            infoLista.textContent = `${pessoas.length} pessoa(s) cadastrada(s)`;
        }
    } catch (erro) {
        renderizarTabela([]);
        infoLista.textContent = '';
        mostrarMensagem(textoDoErro(erro), 'erro');
    }
}


// ---------- Eventos ----------

//Buscar por CPF
formBusca.addEventListener('submit', function(evento) {
    evento.preventDefault();
    carregarPessoas(campoBusca.value.trim());
});

//Limpar o filtro e voltar a mostrar todos
botaoLimpar.addEventListener('click', function() {
    campoBusca.value = '';
    carregarPessoas();
});

//Ao abrir a página, carrega todos os registros
carregarPessoas();
