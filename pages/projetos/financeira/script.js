

/* =========================================================

   FINORA — ORGANIZADOR FINANCEIRO PESSOAL

   ARQUIVO: script.js



   Demonstração com dados fictícios.

   Não utiliza banco de dados, localStorage ou sessionStorage.

   Os dados são reiniciados ao recarregar a página.

   ========================================================= */



"use strict";



/* =========================================================

   1. CONFIGURAÇÕES E FUNÇÕES AUXILIARES

   ========================================================= */



const Finora = (() => {

    const $ = (seletor, contexto = document) =>

        contexto.querySelector(seletor);



    const $$ = (seletor, contexto = document) =>

        [...contexto.querySelectorAll(seletor)];



    const moeda = new Intl.NumberFormat("pt-BR", {

        style: "currency",

        currency: "BRL"

    });



    const numero = new Intl.NumberFormat("pt-BR", {

        maximumFractionDigits: 1

    });



    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {

        day: "2-digit",

        month: "short",

        year: "numeric"

    });



    const mesFormatado = new Intl.DateTimeFormat("pt-BR", {

        month: "short"

    });



    const hoje = new Date();



    const inicioMes = new Date(

        hoje.getFullYear(),

        hoje.getMonth(),

        1

    );



    const dataRelativa = (dias) => {

        const data = new Date(hoje);

        data.setDate(data.getDate() - dias);

        return data;

    };



    const formatarMoeda = (valor) => moeda.format(valor);



    const formatarData = (data) => dataFormatada.format(data);



    const formatarMes = (data) => {

        return mesFormatado

            .format(data)

            .replace(".", "")

            .replace(/^./, (letra) => letra.toUpperCase());

    };



    const escaparHTML = (valor) => {

        return String(valor).replace(/[&<>"']/g, (caractere) => {

            const entidades = {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            };



            return entidades[caractere];

        });

    };



    const somar = (itens, seletor) => {

        return itens.reduce((total, item) => {

            return total + seletor(item);

        }, 0);

    };



    const limitar = (valor, minimo, maximo) => {

        return Math.min(maximo, Math.max(minimo, valor));

    };



    const dataMesmoMes = (data, ano, mes) => {

        return (

            data.getFullYear() === ano &&

            data.getMonth() === mes

        );

    };



    /* =====================================================

       2. CATEGORIAS FICTÍCIAS

       ===================================================== */



    const categorias = [

        {

            id: "salario",

            nome: "Salário",

            tipo: "entrada",

            icone: "fa-briefcase",

            cor: "#39d6a1",

            descricao: "Renda mensal"

        },

        {

            id: "freelance",

            nome: "Freelance",

            tipo: "entrada",

            icone: "fa-laptop-code",

            cor: "#4f8cff",

            descricao: "Serviços e projetos"

        },

        {

            id: "alimentacao",

            nome: "Alimentação",

            tipo: "saida",

            icone: "fa-utensils",

            cor: "#f6c86c",

            descricao: "Mercado e refeições"

        },

        {

            id: "moradia",

            nome: "Moradia",

            tipo: "saida",

            icone: "fa-house",

            cor: "#9565ff",

            descricao: "Casa e contas"

        },

        {

            id: "transporte",

            nome: "Transporte",

            tipo: "saida",

            icone: "fa-car",

            cor: "#4f8cff",

            descricao: "Deslocamentos"

        },

        {

            id: "lazer",

            nome: "Lazer",

            tipo: "saida",

            icone: "fa-gamepad",

            cor: "#ff7185",

            descricao: "Entretenimento"

        },

        {

            id: "estudos",

            nome: "Estudos",

            tipo: "saida",

            icone: "fa-book",

            cor: "#b69aff",

            descricao: "Cursos e materiais"

        },

        {

            id: "saude",

            nome: "Saúde",

            tipo: "saida",

            icone: "fa-heart-pulse",

            cor: "#39d6a1",

            descricao: "Cuidados pessoais"

        },

        {

            id: "outros",

            nome: "Outros",

            tipo: "saida",

            icone: "fa-ellipsis",

            cor: "#a0a7bd",

            descricao: "Outros gastos"

        }

    ];



    const categoriaPorId = (id) => {

        return categorias.find((categoria) => categoria.id === id) || {

            id: "outros",

            nome: "Outros",

            tipo: "saida",

            icone: "fa-ellipsis",

            cor: "#a0a7bd",

            descricao: "Outros gastos"

        };

    };



    /* =====================================================

       3. ORÇAMENTOS FICTÍCIOS

       ===================================================== */



    const orcamentos = [

        {

            categoriaId: "alimentacao",

            limite: 1200

        },

        {

            categoriaId: "moradia",

            limite: 1800

        },

        {

            categoriaId: "transporte",

            limite: 500

        },

        {

            categoriaId: "lazer",

            limite: 350

        },

        {

            categoriaId: "estudos",

            limite: 300

        },

        {

            categoriaId: "saude",

            limite: 250

        },

        {

            categoriaId: "outros",

            limite: 200

        }

    ];



    /* =====================================================

       4. MOVIMENTAÇÕES FICTÍCIAS

       ===================================================== */





const transacoes = [

    // SALÁRIO

    { id: 1, descricao: "Salário mensal", categoriaId: "salario", tipo: "entrada", valor: 4200, data: dataRelativa(1) },

    { id: 2, descricao: "Ajuste de folha", categoriaId: "salario", tipo: "saida", valor: 120, data: dataRelativa(8) },

    { id: 3, descricao: "Salário do mês anterior", categoriaId: "salario", tipo: "entrada", valor: 4200, data: dataRelativa(35) },

    { id: 4, descricao: "Desconto de benefício", categoriaId: "salario", tipo: "saida", valor: 85, data: dataRelativa(38) },



    // FREELANCE

    { id: 5, descricao: "Projeto de website", categoriaId: "freelance", tipo: "entrada", valor: 650, data: dataRelativa(4) },

    { id: 6, descricao: "Ferramentas para projeto", categoriaId: "freelance", tipo: "saida", valor: 79.90, data: dataRelativa(6) },

    { id: 7, descricao: "Freelance de programação", categoriaId: "freelance", tipo: "entrada", valor: 380, data: dataRelativa(15) },

    { id: 8, descricao: "Domínio para cliente", categoriaId: "freelance", tipo: "saida", valor: 45, data: dataRelativa(18) },



    // ALIMENTAÇÃO

    { id: 9, descricao: "Compras do mercado", categoriaId: "alimentacao", tipo: "saida", valor: 245.80, data: dataRelativa(2) },

    { id: 10, descricao: "Reembolso de refeição", categoriaId: "alimentacao", tipo: "entrada", valor: 32, data: dataRelativa(3) },

    { id: 11, descricao: "Restaurante", categoriaId: "alimentacao", tipo: "saida", valor: 76.50, data: dataRelativa(9) },

    { id: 12, descricao: "Devolução de compra", categoriaId: "alimentacao", tipo: "entrada", valor: 24.90, data: dataRelativa(12) },



    // MORADIA

    { id: 13, descricao: "Conta de internet", categoriaId: "moradia", tipo: "saida", valor: 109.90, data: dataRelativa(3) },

    { id: 14, descricao: "Reembolso de conta", categoriaId: "moradia", tipo: "entrada", valor: 50, data: dataRelativa(5) },

    { id: 15, descricao: "Conta de energia", categoriaId: "moradia", tipo: "saida", valor: 175.40, data: dataRelativa(12) },

    { id: 16, descricao: "Divisão de despesas recebida", categoriaId: "moradia", tipo: "entrada", valor: 200, data: dataRelativa(16) },

    { id: 17, descricao: "Aluguel", categoriaId: "moradia", tipo: "saida", valor: 1500, data: dataRelativa(40) },



    // TRANSPORTE

    { id: 18, descricao: "Corridas de aplicativo", categoriaId: "transporte", tipo: "saida", valor: 85.50, data: dataRelativa(5) },

    { id: 19, descricao: "Reembolso de transporte", categoriaId: "transporte", tipo: "entrada", valor: 28, data: dataRelativa(7) },

    { id: 20, descricao: "Combustível", categoriaId: "transporte", tipo: "saida", valor: 130, data: dataRelativa(10) },

    { id: 21, descricao: "Valor dividido de viagem", categoriaId: "transporte", tipo: "entrada", valor: 65, data: dataRelativa(14) },



    // LAZER

    { id: 22, descricao: "Cinema e jogos", categoriaId: "lazer", tipo: "saida", valor: 120, data: dataRelativa(6) },

    { id: 23, descricao: "Estorno de ingresso", categoriaId: "lazer", tipo: "entrada", valor: 45, data: dataRelativa(8) },

    { id: 24, descricao: "Passeio de fim de semana", categoriaId: "lazer", tipo: "saida", valor: 90, data: dataRelativa(11) },

    { id: 25, descricao: "Venda de ingresso", categoriaId: "lazer", tipo: "entrada", valor: 60, data: dataRelativa(17) },



    // ESTUDOS

    { id: 26, descricao: "Material de estudo", categoriaId: "estudos", tipo: "saida", valor: 89.90, data: dataRelativa(8) },

    { id: 27, descricao: "Bolsa de estudos", categoriaId: "estudos", tipo: "entrada", valor: 300, data: dataRelativa(10) },

    { id: 28, descricao: "Livro técnico", categoriaId: "estudos", tipo: "saida", valor: 65, data: dataRelativa(13) },

    { id: 29, descricao: "Auxílio educacional", categoriaId: "estudos", tipo: "entrada", valor: 150, data: dataRelativa(20) },



    // SAÚDE

    { id: 30, descricao: "Consulta", categoriaId: "saude", tipo: "saida", valor: 140, data: dataRelativa(10) },

    { id: 31, descricao: "Reembolso de consulta", categoriaId: "saude", tipo: "entrada", valor: 70, data: dataRelativa(12) },

    { id: 32, descricao: "Medicamentos", categoriaId: "saude", tipo: "saida", valor: 48.90, data: dataRelativa(16) },

    { id: 33, descricao: "Reembolso de medicamento", categoriaId: "saude", tipo: "entrada", valor: 25, data: dataRelativa(21) },



    // OUTROS

    { id: 34, descricao: "Assinatura de software", categoriaId: "outros", tipo: "saida", valor: 49.90, data: dataRelativa(19) },

    { id: 35, descricao: "Venda de item usado", categoriaId: "outros", tipo: "entrada", valor: 110, data: dataRelativa(4) },

    { id: 36, descricao: "Compra de acessórios", categoriaId: "outros", tipo: "saida", valor: 35, data: dataRelativa(9) },

    { id: 37, descricao: "Valor recebido de volta", categoriaId: "outros", tipo: "entrada", valor: 25, data: dataRelativa(15) }

];





    /* =====================================================

       5. CÁLCULOS FINANCEIROS

       ===================================================== */



    const transacoesDoMes = (ano, mes) => {

        return transacoes.filter((transacao) => {

            return dataMesmoMes(transacao.data, ano, mes);

        });

    };



    const calcularResumo = (lista) => {

        const entradas = somar(

            lista.filter((item) => item.tipo === "entrada"),

            (item) => item.valor

        );



        const saidas = somar(

            lista.filter((item) => item.tipo === "saida"),

            (item) => item.valor

        );



        return {

            entradas,

            saidas,

            saldo: entradas - saidas,

            economia: entradas > 0

                ? ((entradas - saidas) / entradas) * 100

                : 0

        };

    };





    const gastosPorCategoria = (lista) => {

        return categorias

            .map((categoria) => {

                const total = somar(

                    lista.filter((item) => {

                        return (

                            item.tipo === "saida" &&

                            item.categoriaId === categoria.id

                        );

                    }),

                    (item) => item.valor

                );



                return {

                    ...categoria,

                    total

                };

            })

            .filter((categoria) => categoria.total > 0)

            .sort((a, b) => b.total - a.total);

    };

    const gastosDoOrcamento = (categoriaId) => {

        const lista = transacoesDoMes(

            hoje.getFullYear(),

            hoje.getMonth()

        );



        return somar(

            lista.filter((item) => {

                return (

                    item.tipo === "saida" &&

                    item.categoriaId === categoriaId

                );

            }),

            (item) => item.valor

        );

    };



    /* =====================================================

       6. NAVEGAÇÃO ENTRE AS TELAS

       ===================================================== */



    const titulos = {

        inicio: "Visão geral",

        transacoes: "Transações",

        orcamentos: "Orçamentos",

        relatorios: "Relatórios",

        categorias: "Categorias"

    };



    function abrirSecao(id) {

        const secao = document.getElementById(id);



        if (!secao || !secao.classList.contains("content-section")) {

            return;

        }



        $$(".content-section").forEach((elemento) => {

            elemento.classList.toggle("active", elemento.id === id);

        });



        $$(".nav-link").forEach((link) => {

            const ativo = link.dataset.section === id;



            link.classList.toggle("active", ativo);



            if (ativo) {

                link.setAttribute("aria-current", "page");

            } else {

                link.removeAttribute("aria-current");

            }

        });



        const titulo = $("#page-title");



        if (titulo) {

            titulo.textContent = titulos[id] || "Finora";

        }



        fecharMenu();



        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }



    function abrirMenu() {

        $("#sidebar")?.classList.add("is-open");

        $("#sidebar-overlay")?.classList.add("is-visible");



        $("#sidebar-overlay")?.setAttribute("aria-hidden", "false");

        $("#menu-toggle")?.setAttribute("aria-expanded", "true");

    }



    function fecharMenu() {

        $("#sidebar")?.classList.remove("is-open");

        $("#sidebar-overlay")?.classList.remove("is-visible");



        $("#sidebar-overlay")?.setAttribute("aria-hidden", "true");

        $("#menu-toggle")?.setAttribute("aria-expanded", "false");

    }



    function configurarNavegacao() {

        $$(".nav-link").forEach((link) => {

            link.addEventListener("click", () => {

                abrirSecao(link.dataset.section);

            });

        });



        $("#menu-toggle")?.addEventListener("click", () => {

            const aberto = $("#sidebar")?.classList.contains("is-open");



            if (aberto) {

                fecharMenu();

            } else {

                abrirMenu();

            }

        });



        $("#sidebar-overlay")?.addEventListener("click", fecharMenu);



        document.addEventListener("keydown", (evento) => {

            if (evento.key === "Escape") {

                fecharMenu();

                fecharDialogo();

            }

        });

    }



    /* =====================================================

       7. JANELA DE INFORMAÇÕES

       ===================================================== */



    function abrirDialogo() {

        const dialogo = $("#info-dialog");



        if (!dialogo) {

            return;

        }



        dialogo.classList.add("is-open");

        dialogo.setAttribute("aria-hidden", "false");



        $("#dialog-ok")?.focus();

    }



    function fecharDialogo() {

        const dialogo = $("#info-dialog");



        if (!dialogo) {

            return;

        }



        dialogo.classList.remove("is-open");

        dialogo.setAttribute("aria-hidden", "true");

    }



    function configurarDialogo() {

        $("#help-button")?.addEventListener("click", abrirDialogo);

        $("#close-dialog")?.addEventListener("click", fecharDialogo);

        $("#dialog-ok")?.addEventListener("click", fecharDialogo);



        $("#info-dialog")?.addEventListener("click", (evento) => {

            if (evento.target.id === "info-dialog") {

                fecharDialogo();

            }

        });

    }



    /* =====================================================

       8. CABEÇALHO E DATAS

       ===================================================== */



    function configurarDatas() {

        const dataAtual = $("#current-date");



        if (dataAtual) {

            dataAtual.textContent = new Intl.DateTimeFormat("pt-BR", {

                day: "2-digit",

                month: "long",

                year: "numeric"

            }).format(hoje);

        }



        const anoRodape = $("#footer-year");



        if (anoRodape) {

            anoRodape.textContent = String(hoje.getFullYear());

        }

    }



    /* =====================================================

       9. CARTÕES DO PAINEL PRINCIPAL

       ===================================================== */



    function renderizarResumo() {

        const resumo = calcularResumo(

            transacoesDoMes(hoje.getFullYear(), hoje.getMonth())

        );



        const elementos = {

            "balance-value": resumo.saldo,

            "income-value": resumo.entradas,

            "expense-value": resumo.saidas

        };



        Object.entries(elementos).forEach(([id, valor]) => {

            const elemento = document.getElementById(id);



            if (elemento) {

                elemento.textContent = formatarMoeda(valor);

            }

        });



        const economia = $("#savings-value");



        if (economia) {

            economia.textContent = `${numero.format(resumo.economia)}%`;

        }



        const saldo = $("#balance-value");



        if (saldo) {

            saldo.classList.toggle("text-red", resumo.saldo < 0);

            saldo.classList.toggle("text-green", resumo.saldo >= 0);

        }

    }



    /* =====================================================

       10. GRÁFICO DO PAINEL

       ===================================================== */



    function renderizarGraficoPrincipal() {

        const recipiente = $("#cashflow-chart");



        if (!recipiente) {

            return;

        }



        const meses = [];



        for (let deslocamento = 5; deslocamento >= 0; deslocamento--) {

            const data = new Date(

                hoje.getFullYear(),

                hoje.getMonth() - deslocamento,

                1

            );



            const resumo = calcularResumo(

                transacoesDoMes(

                    data.getFullYear(),

                    data.getMonth()

                )

            );



            meses.push({

                data,

                entradas: resumo.entradas,

                saidas: resumo.saidas

            });

        }



        const periodo = $("#chart-period")?.value || "6";

        const quantidade = Number(periodo) || 6;

        const dados = meses.slice(-quantidade);



        const maiorValor = Math.max(

            1,

            ...dados.flatMap((mes) => [mes.entradas, mes.saidas])

        );



        recipiente.innerHTML = dados.map((mes) => {

            const alturaEntrada = mes.entradas > 0

                ? Math.max(3, (mes.entradas / maiorValor) * 100)

                : 0;



            const alturaSaida = mes.saidas > 0

                ? Math.max(3, (mes.saidas / maiorValor) * 100)

                : 0;



            return `

                <div class="chart-month">

                    <div class="chart-month-values">

                        <span title="${formatarMoeda(mes.entradas)}">

                            ${escaparHTML(formatarMoedaCompacta(mes.entradas))}

                        </span>

                        <span title="${formatarMoeda(mes.saidas)}">

                            ${escaparHTML(formatarMoedaCompacta(mes.saidas))}

                        </span>

                    </div>



                    <div class="chart-bars">

                        <div

                            class="chart-bar income-bar"

                            style="height: ${alturaEntrada}%"

                            title="Entradas: ${formatarMoeda(mes.entradas)}"

                        ></div>



                        <div

                            class="chart-bar expense-bar"

                            style="height: ${alturaSaida}%"

                            title="Saídas: ${formatarMoeda(mes.saidas)}"

                        ></div>

                    </div>



                    <span class="chart-month-label">

                        ${escaparHTML(formatarMes(mes.data))}

                    </span>

                </div>

            `;

        }).join("");

    }



    function formatarMoedaCompacta(valor) {

        if (valor >= 1000) {

            return `R$ ${(valor / 1000).toLocaleString("pt-BR", {

                maximumFractionDigits: 1

            })} mil`;

        }



        return `R$ ${Math.round(valor)}`;

    }



    /* =====================================================

       11. ORÇAMENTO RESUMIDO NO PAINEL

       ===================================================== */



    function renderizarResumoOrcamentos() {

        const gastos = somar(

            orcamentos,

            (orcamento) => gastosDoOrcamento(orcamento.categoriaId)

        );



        const limites = somar(

            orcamentos,

            (orcamento) => orcamento.limite

        );



        const percentual = limites > 0 ? (gastos / limites) * 100 : 0;



        if ($("#budget-used")) {

            $("#budget-used").textContent = formatarMoeda(gastos);

        }



        if ($("#budget-percentage")) {

            $("#budget-percentage").textContent =

                `${numero.format(percentual)}%`;

        }



        if ($("#budget-progress")) {

            $("#budget-progress").style.width =

                `${limitar(percentual, 0, 100)}%`;



            $("#budget-progress").classList.toggle(

                "warning",

                percentual >= 70 && percentual < 100

            );



            $("#budget-progress").classList.toggle(

                "danger",

                percentual >= 100

            );

        }



        if ($("#budget-caption")) {

            const restante = limites - gastos;



            $("#budget-caption").textContent = restante >= 0

                ? `${formatarMoeda(restante)} disponíveis nos orçamentos demonstrativos.`

                : `Os gastos ultrapassaram os limites em ${formatarMoeda(Math.abs(restante))}.`;

        }



        const lista = $("#mini-budget-list");



        if (!lista) {

            return;

        }



        lista.innerHTML = orcamentos.slice(0, 4).map((orcamento) => {

            const categoria = categoriaPorId(orcamento.categoriaId);

            const gasto = gastosDoOrcamento(orcamento.categoriaId);

            const porcentagem = orcamento.limite > 0

                ? (gasto / orcamento.limite) * 100

                : 0;



            return `

                <div class="mini-budget-item">

                    <div class="mini-budget-top">

                        <div class="mini-budget-name">

                            <span

                                class="budget-color-dot"

                                style="background:${categoria.cor}"

                            ></span>

                            <span>${escaparHTML(categoria.nome)}</span>

                        </div>



                        <span class="mini-budget-amount">

                            ${formatarMoeda(gasto)}

                        </span>

                    </div>



                    <div class="progress-track">

                        <div

                            class="progress-fill ${

                                porcentagem >= 100

                                    ? "danger"

                                    : porcentagem >= 70

                                        ? "warning"

                                        : ""

                            }"

                            style="width:${limitar(porcentagem, 0, 100)}%; background:${porcentagem < 70 ? categoria.cor : ""}"

                        ></div>

                    </div>

                </div>

            `;

        }).join("");

    }



    /* =====================================================

       12. TABELA DE TRANSAÇÕES RECENTES

       ===================================================== */



    function criarLinhaTransacao(transacao) {

        const categoria = categoriaPorId(transacao.categoriaId);

        const entrada = transacao.tipo === "entrada";



        return `

            <tr>

                <td>

                    <div class="transaction-description">

                        <div class="transaction-icon ${entrada ? "income" : "expense"}">

                            <i class="fa-solid ${categoria.icone}"></i>

                        </div>



                        <div class="transaction-description-text">

                            <strong>${escaparHTML(transacao.descricao)}</strong>

                            <span>${escaparHTML(formatarData(transacao.data))}</span>

                        </div>

                    </div>

                </td>



                <td>

                    <span class="category-pill">

                        <i class="fa-solid ${categoria.icone}"></i>

                        ${escaparHTML(categoria.nome)}

                    </span>

                </td>



                <td>

                    <span class="transaction-amount ${entrada ? "income" : "expense"}">

                        ${entrada ? "+" : "−"} ${formatarMoeda(transacao.valor)}

                    </span>

                </td>

            </tr>

        `;

    }



    function renderizarTransacoesRecentes() {

        const recipiente = $("#recent-transactions");



        if (!recipiente) {

            return;

        }



        const recentes = [...transacoes]

            .sort((a, b) => b.data - a.data)

            .slice(0, 5);



        recipiente.innerHTML = recentes.map(criarLinhaTransacao).join("");

    }



    /* =====================================================

       13. PÁGINA DE TRANSAÇÕES

       ===================================================== */



    function configurarFiltrosTransacoes() {

        const filtroCategoria = $("#transaction-category-filter");



        if (filtroCategoria) {

            const opcoes = categorias.map((categoria) => {

                return `

                    <option value="${escaparHTML(categoria.id)}">

                        ${escaparHTML(categoria.nome)}

                    </option>

                `;

            }).join("");



            filtroCategoria.insertAdjacentHTML("beforeend", opcoes);

        }



        $("#transaction-search")?.addEventListener(

            "input",

            renderizarTabelaTransacoes

        );



        $("#transaction-type-filter")?.addEventListener(

            "change",

            renderizarTabelaTransacoes

        );



        $("#transaction-category-filter")?.addEventListener(

            "change",

            renderizarTabelaTransacoes

        );

    }



    function renderizarTabelaTransacoes() {

        const recipiente = $("#all-transactions");



        if (!recipiente) {

            return;

        }



        const busca = ($("#transaction-search")?.value || "")

            .trim()

            .toLocaleLowerCase("pt-BR");



        const tipoSelecionado = $("#transaction-type-filter")?.value || "all";

        const tipo = tipoSelecionado === "income" ? "entrada" :
            tipoSelecionado === "expense" ? "saida" : "todos";

        const categoria = $("#transaction-category-filter")?.value || "all";



        const filtradas = [...transacoes]

            .filter((transacao) => {

                const categoriaAtual = categoriaPorId(transacao.categoriaId);



                const correspondeBusca = (

                    transacao.descricao.toLocaleLowerCase("pt-BR").includes(busca) ||

                    categoriaAtual.nome.toLocaleLowerCase("pt-BR").includes(busca)

                );



                const correspondeTipo =

                    tipo === "todos" || transacao.tipo === tipo;



                const correspondeCategoria =

                    categoria === "all" ||

                    transacao.categoriaId === categoria;



                return (

                    correspondeBusca &&

                    correspondeTipo &&

                    correspondeCategoria

                );

            })

            .sort((a, b) => b.data - a.data);



        const resumoEntradas = somar(

            filtradas.filter((item) => item.tipo === "entrada"),

            (item) => item.valor

        );



        const resumoSaidas = somar(

            filtradas.filter((item) => item.tipo === "saida"),

            (item) => item.valor

        );



        if ($("#transaction-income")) {

            $("#transaction-income").textContent =

                formatarMoeda(resumoEntradas);

        }



        if ($("#transaction-expenses")) {

            $("#transaction-expenses").textContent =

                formatarMoeda(resumoSaidas);

        }



        if ($("#transaction-count")) {

            $("#transaction-count").textContent = String(filtradas.length);

        }



        if ($("#transaction-results")) {

            $("#transaction-results").textContent =

                `${filtradas.length} movimentação(ões) encontrada(s)`;

        }



        if (filtradas.length === 0) {

            recipiente.innerHTML = `

                <tr>

                    <td colspan="5">

                        <div class="empty-state">

                            <i class="fa-solid fa-magnifying-glass"></i>

                            <strong>Nenhuma movimentação encontrada</strong>

                            <p>Tente alterar a pesquisa ou os filtros.</p>

                        </div>

                    </td>

                </tr>

            `;



            return;

        }



        recipiente.innerHTML = filtradas.map(criarLinhaTransacao).join("");

    }



    /* =====================================================

       14. PÁGINA DE ORÇAMENTOS

       ===================================================== */



    function renderizarOrcamentos() {

        const recipiente = $("#budget-cards");



        if (!recipiente) {

            return;

        }



        const totalLimites = somar(

            orcamentos,

            (orcamento) => orcamento.limite

        );



        const totalGastos = somar(

            orcamentos,

            (orcamento) => gastosDoOrcamento(orcamento.categoriaId)

        );



        const totalRestante = totalLimites - totalGastos;



        if ($("#total-budget-value")) {

            $("#total-budget-value").textContent =

                formatarMoeda(totalLimites);

        }



        if ($("#total-spent-value")) {

            $("#total-spent-value").textContent =

                formatarMoeda(totalGastos);

        }



        if ($("#total-remaining-value")) {

            $("#total-remaining-value").textContent =

                formatarMoeda(totalRestante);

        }



        recipiente.innerHTML = orcamentos.map((orcamento) => {

            const categoria = categoriaPorId(orcamento.categoriaId);

            const gasto = gastosDoOrcamento(orcamento.categoriaId);

            const restante = orcamento.limite - gasto;



            const percentual = orcamento.limite > 0

                ? (gasto / orcamento.limite) * 100

                : 0;



            const status = percentual >= 100

                ? "danger"

                : percentual >= 70

                    ? "warning"

                    : "";



            const statusTexto = percentual >= 100

                ? "Limite atingido"

                : percentual >= 70

                    ? "Atenção"

                    : "Dentro do limite";



            return `

                <article class="budget-card">

                    <div class="budget-card-top">

                        <div class="budget-card-category">

                            <div

                                class="budget-card-icon"

                                style="color:${categoria.cor}; background:${categoria.cor}18"

                            >

                                <i class="fa-solid ${categoria.icone}"></i>

                            </div>



                            <div class="budget-card-category-text">

                                <strong>${escaparHTML(categoria.nome)}</strong>

                                <span>Orçamento mensal demonstrativo</span>

                            </div>

                        </div>



                        <span class="budget-card-status ${status}">

                            ${statusTexto}

                        </span>

                    </div>



                    <div class="budget-card-values">

                        <div class="budget-card-spent">

                            <strong>${formatarMoeda(gasto)}</strong>

                            <span>Valor utilizado</span>

                        </div>



                        <div class="budget-card-limit">

                            <strong>${formatarMoeda(orcamento.limite)}</strong>

                            <span>Limite mensal</span>

                        </div>

                    </div>



                    <div class="progress-track">

                        <div

                            class="progress-fill ${status}"

                            style="width:${limitar(percentual, 0, 100)}%"

                        ></div>

                    </div>



                    <div class="budget-card-bottom">

                        <span>${numero.format(percentual)}% utilizado</span>

                        <strong>

                            ${restante >= 0

                                ? `${formatarMoeda(restante)} restantes`

                                : `${formatarMoeda(Math.abs(restante))} acima`}

                        </strong>

                    </div>

                </article>

            `;

        }).join("");

    }



    /* =====================================================

       15. PÁGINA DE RELATÓRIOS

       ===================================================== */



    function obterPeriodoRelatorio() {

        const valor = $("#report-period")?.value || "mes";



        if (valor === "todos") {

            return [...transacoes];

        }



        const meses = valor === "3" ? 3 : valor === "6" ? 6 : 1;



        const dataLimite = new Date(

            hoje.getFullYear(),

            hoje.getMonth() - meses + 1,

            1

        );



        return transacoes.filter((transacao) => {

            return transacao.data >= dataLimite && transacao.data <= hoje;

        });

    }



    function renderizarGraficoCategorias(lista) {

        const recipiente = $("#category-chart");



        if (!recipiente) {

            return;

        }



        const dados = gastosPorCategoria(lista);

        const total = somar(dados, (item) => item.total);



        if (dados.length === 0) {

            recipiente.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-chart-pie"></i>

                    <strong>Sem despesas no período</strong>

                    <p>Não existem gastos fictícios para mostrar nesse intervalo.</p>

                </div>

            `;



            return;

        }



        const maior = Math.max(...dados.map((item) => item.total), 1);



        recipiente.innerHTML = dados.map((item) => {

            const percentualTotal = total > 0

                ? (item.total / total) * 100

                : 0;



            const largura = (item.total / maior) * 100;



            return `

                <div class="category-chart-item">

                    <div class="category-chart-top">

                        <div class="category-chart-name">

                            <span

                                class="budget-color-dot"

                                style="background:${item.cor}"

                            ></span>



                            <span>${escaparHTML(item.nome)}</span>

                        </div>



                        <span class="category-chart-value">

                            ${formatarMoeda(item.total)}

                        </span>

                    </div>



                    <div class="category-chart-track">

                        <div

                            class="category-chart-fill"

                            style="width:${largura}%; background:${item.cor}"

                        ></div>

                    </div>



                    <div class="category-chart-foot">

                        <span>${numero.format(percentualTotal)}% das despesas</span>

                        <span>${formatarMoeda(item.total)}</span>

                    </div>

                </div>

            `;

        }).join("");

    }



    function renderizarComparacao(lista) {

        const recipiente = $("#report-comparison");



        if (!recipiente) {

            return;

        }



        const resumo = calcularResumo(lista);

        const maior = Math.max(resumo.entradas, resumo.saidas, 1);



        const itens = [

            {

                nome: "Entradas",

                valor: resumo.entradas,

                classe: "income-bar"

            },

            {

                nome: "Despesas",

                valor: resumo.saidas,

                classe: "expense-bar"

            }

        ];



        recipiente.innerHTML = itens.map((item) => {

            const largura = (item.valor / maior) * 100;



            return `

                <div class="comparison-row">

                    <span class="comparison-label">

                        ${item.nome}

                    </span>



                    <div class="comparison-bars">

                        <div class="comparison-bar-track">

                            <div

                                class="comparison-bar-fill ${item.classe}"

                                style="width:${largura}%"

                            ></div>

                        </div>

                    </div>



                    <span class="comparison-value">

                        ${formatarMoeda(item.valor)}

                    </span>

                </div>

            `;

        }).join("");

    }



    function renderizarGraficoMensal() {

        const recipiente = $("#report-monthly-chart");



        if (!recipiente) {

            return;

        }



        const meses = [];



        for (let deslocamento = 5; deslocamento >= 0; deslocamento--) {

            const data = new Date(

                hoje.getFullYear(),

                hoje.getMonth() - deslocamento,

                1

            );



            const lista = transacoesDoMes(

                data.getFullYear(),

                data.getMonth()

            );



            const resumo = calcularResumo(lista);



            meses.push({

                data,

                entradas: resumo.entradas,

                saidas: resumo.saidas

            });

        }



        const maior = Math.max(

            1,

            ...meses.flatMap((mes) => [mes.entradas, mes.saidas])

        );



        recipiente.innerHTML = meses.map((mes) => {

            const alturaEntrada = mes.entradas > 0

                ? Math.max(3, (mes.entradas / maior) * 100)

                : 0;



            const alturaSaida = mes.saidas > 0

                ? Math.max(3, (mes.saidas / maior) * 100)

                : 0;



            return `

                <div class="report-month-column">

                    <span class="report-month-value">

                        ${escaparHTML(formatarMoedaCompacta(mes.entradas))}

                    </span>



                    <div class="report-month-bars">

                        <div

                            class="chart-bar income-bar"

                            style="height:${alturaEntrada}%"

                            title="Entradas: ${formatarMoeda(mes.entradas)}"

                        ></div>



                        <div

                            class="chart-bar expense-bar"

                            style="height:${alturaSaida}%"

                            title="Despesas: ${formatarMoeda(mes.saidas)}"

                        ></div>

                    </div>



                    <span class="report-month-label">

                        ${escaparHTML(formatarMes(mes.data))}

                    </span>

                </div>

            `;

        }).join("");

    }



    function renderizarRelatorios() {

        const lista = obterPeriodoRelatorio();

        const resumo = calcularResumo(lista);



        if ($("#report-income")) {

            $("#report-income").textContent =

                formatarMoeda(resumo.entradas);

        }



        if ($("#report-expenses")) {

            $("#report-expenses").textContent =

                formatarMoeda(resumo.saidas);

        }



        if ($("#report-balance")) {

            $("#report-balance").textContent =

                formatarMoeda(resumo.saldo);

        }



        if ($("#report-savings-rate")) {

            $("#report-savings-rate").textContent =

                `${numero.format(resumo.economia)}%`;

        }



        renderizarGraficoCategorias(lista);

        renderizarComparacao(lista);

        renderizarGraficoMensal();

    }



    /* =====================================================

       16. PÁGINA DE CATEGORIAS

       ===================================================== */



    function renderizarCategorias() {

        const recipiente = $("#category-cards");



        if (!recipiente) {

            return;

        }



        recipiente.innerHTML = categorias.map((categoria) => {

            const lista = transacoesDoMes(

                hoje.getFullYear(),

                hoje.getMonth()

            );



            const total = somar(

                lista.filter((transacao) => {

                    return transacao.categoriaId === categoria.id;

                }),

                (transacao) => transacao.valor

            );



            const quantidade = lista.filter((transacao) => {

                return transacao.categoriaId === categoria.id;

            }).length;



            return `

                <article class="category-card">

                    <div

                        class="category-card-icon"

                        style="color:${categoria.cor}; background:${categoria.cor}18"

                    >

                        <i class="fa-solid ${categoria.icone}"></i>

                    </div>



                    <div class="category-card-content">

                        <h3>${escaparHTML(categoria.nome)}</h3>



                        <p>${escaparHTML(categoria.descricao)}</p>



                        <div class="category-card-amount">

                            ${formatarMoeda(total)}



                            <span>

                                ${quantidade} movimentação(ões) neste mês

                            </span>

                        </div>

                    </div>

                </article>

            `;

        }).join("");

    }



    /* =====================================================

       17. SELETORES DE PERÍODO

       ===================================================== */



    function configurarPeriodos() {

        $("#chart-period")?.addEventListener("change", () => {

            renderizarGraficoPrincipal();

        });



        $("#report-period")?.addEventListener("change", () => {

            renderizarRelatorios();

        });

    }



    /* =====================================================

       18. INICIALIZAÇÃO

       ===================================================== */



    function iniciar() {

        configurarDatas();

        configurarNavegacao();

        configurarDialogo();

        configurarFiltrosTransacoes();

        configurarPeriodos();



        renderizarResumo();

        renderizarGraficoPrincipal();

        renderizarResumoOrcamentos();

        renderizarTransacoesRecentes();

        renderizarTabelaTransacoes();

        renderizarOrcamentos();

        renderizarRelatorios();

        renderizarCategorias();



        console.info(

            "Finora iniciado em modo de demonstração. Nenhum dado é salvo."

        );

    }



    return {

        iniciar,

        abrirSecao,

        formatarMoeda

    };

})();



/* =========================================================

   19. EXECUTAR QUANDO O HTML ESTIVER PRONTO

   ========================================================= */



if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", Finora.iniciar);

} else {

    Finora.iniciar();

}
