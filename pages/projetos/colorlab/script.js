
/* =========================================
   COLORLAB — SCRIPT PRINCIPAL
   Arquivo: script.js
   Sem bibliotecas externas.
   ========================================= */

"use strict";

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
    Array.from(raiz.querySelectorAll(seletor));

const CORES_INICIAIS = [
    "#7C5CFC",
    "#38BDF8",
    "#34D399",
    "#FBBF24",
    "#FB7185"
];

const NOMES_CORES = [
    "Roxo",
    "Azul",
    "Verde",
    "Amarelo",
    "Rosa",
    "Vermelho",
    "Laranja",
    "Ciano",
    "Magenta",
    "Cinza",
    "Personalizada"
];

let paleta = CORES_INICIAIS.map((hex, index) => ({
    hex,
    travada: false,
    nome: NOMES_CORES[index]
}));

let favoritas = [];
let indiceEditando = null;
let corOriginalEditor = null;
let ultimaCorValida = "#7C5CFC";
let toastTimeout = null;

/* ---------- Elementos ---------- */

const elementos = {
    palette: $("#palette-container"),
    generate: $("#generate-button"),
    random: $("#random-color-button"),
    copyPalette: $("#copy-palette-button"),
    favoritePalette: $("#favorite-palette-button"),

    favorites: $("#favorites-container"),
    favoritesEmpty: $("#favorites-empty"),
    favoritesCount: $("#favorites-count"),

    previewCard: $("#preview-card"),
    previewTitle: $("#preview-title"),
    previewDescription: $("#preview-description"),
    previewButton: $("#preview-button"),

    theme: $("#theme-toggle"),
    toast: $("#toast"),

    editor: $("#color-editor"),
    editorClose: $("#editor-close"),
    editorCancel: $("#editor-cancel"),
    editorApply: $("#editor-apply"),
    editorWheel: $("#editor-wheel"),
    editorR: $("#editor-r"),
    editorG: $("#editor-g"),
    editorB: $("#editor-b"),
    editorHex: $("#editor-hex"),
    editorPreview: $("#editor-preview"),
    editorPreviewHex: $("#editor-preview-hex"),
    editorError: $("#editor-error")
};

/* ---------- Utilitários de cor ---------- */

function normalizarHex(valor) {
    if (typeof valor !== "string") return null;

    let hex = valor.trim();

    if (!hex.startsWith("#")) {
        hex = "#" + hex;
    }

    if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
        hex = "#" + hex
            .slice(1)
            .split("")
            .map(letra => letra + letra)
            .join("");
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
        return null;
    }

    return hex.toUpperCase();
}

function hexParaRGB(hex) {
    const cor = normalizarHex(hex);

    if (!cor) return null;

    return {
        r: parseInt(cor.slice(1, 3), 16),
        g: parseInt(cor.slice(3, 5), 16),
        b: parseInt(cor.slice(5, 7), 16)
    };
}

function rgbParaHex(r, g, b) {
    const canais = [r, g, b].map(valor => {
        const numero = Math.max(0, Math.min(255, Math.round(Number(valor))));
        return numero.toString(16).padStart(2, "0");
    });

    return ("#" + canais.join("")).toUpperCase();
}

function limitarCanal(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return 0;

    return Math.max(0, Math.min(255, Math.round(numero)));
}

function corAleatoria() {
    const numero = Math.floor(Math.random() * 0x1000000);

    return "#" + numero.toString(16).padStart(6, "0").toUpperCase();
}

function escolherNome(hex) {
    const coresConhecidas = {
        "#7C5CFC": "Roxo",
        "#38BDF8": "Azul",
        "#34D399": "Verde",
        "#FBBF24": "Amarelo",
        "#FB7185": "Rosa",
        "#EF4444": "Vermelho",
        "#F97316": "Laranja",
        "#22D3EE": "Ciano",
        "#D946EF": "Magenta",
        "#9CA3AF": "Cinza",
        "#FFFFFF": "Branco",
        "#000000": "Preto"
    };

    return coresConhecidas[hex] || "Cor personalizada";
}

/* ---------- Notificações ---------- */

function mostrarToast(mensagem) {
    if (!elementos.toast) return;

    elementos.toast.textContent = mensagem;
    elementos.toast.classList.add("visible");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        elementos.toast.classList.remove("visible");
    }, 2400);
}

/* ---------- Renderização da paleta ---------- */

function renderizarPaleta() {
    if (!elementos.palette) return;

    elementos.palette.innerHTML = "";

    paleta.forEach((cor, indice) => {
        const card = document.createElement("article");
        card.className = "color-card";
        card.dataset.colorIndex = String(indice);

        const swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.setProperty("--swatch-color", cor.hex);

        const botaoTrava = document.createElement("button");
        botaoTrava.type = "button";
        botaoTrava.className =
            "lock-button" + (cor.travada ? " locked" : "");
        botaoTrava.dataset.action = "lock";
        botaoTrava.dataset.index = String(indice);
        botaoTrava.textContent = cor.travada ? "◆" : "◇";
        botaoTrava.title = cor.travada
            ? "Desafixar esta cor"
            : "Fixar esta cor";
        botaoTrava.setAttribute(
            "aria-label",
            cor.travada ? "Desafixar cor" : "Fixar cor"
        );
        botaoTrava.setAttribute("aria-pressed", String(cor.travada));

        swatch.appendChild(botaoTrava);

        const info = document.createElement("div");
        info.className = "color-info";

        const nome = document.createElement("span");
        nome.className = "color-name";
        nome.textContent = cor.nome || escolherNome(cor.hex);

        const hex = document.createElement("button");
        hex.type = "button";
        hex.className = "hex-button";
        hex.dataset.action = "copy-color";
        hex.dataset.index = String(indice);
        hex.textContent = cor.hex;
        hex.title = "Clique para copiar; dê duplo clique para editar";
        hex.setAttribute(
            "aria-label",
            `Cor ${indice + 1}: ${cor.hex}. Duplo clique para editar.`
        );

        info.append(nome, hex);
        card.append(swatch, info);
        elementos.palette.appendChild(card);
    });

    atualizarPrevia();
    atualizarBotaoFavorita();
}

/* ---------- Prévia ---------- */

function atualizarPrevia() {
    if (paleta.length === 0) return;

    const primeira = paleta[0].hex;
    const segunda = paleta[1]?.hex || primeira;
    const terceira = paleta[2]?.hex || segunda;
    const quarta = paleta[3]?.hex || terceira;

    if (elementos.previewCard) {
        elementos.previewCard.style.borderColor = primeira;
    }

    if (elementos.previewTitle) {
        elementos.previewTitle.style.color = primeira;
    }

    if (elementos.previewButton) {
        elementos.previewButton.style.backgroundColor = primeira;
        elementos.previewButton.style.color =
            corDeTexto(primeira);
    }

    const circulo = $(".preview-circle");
    const quadrado = $(".preview-square");
    const circuloPequeno = $(".preview-small-circle");

    if (circulo) circulo.style.backgroundColor = primeira;
    if (quadrado) quadrado.style.backgroundColor = segunda;
    if (circuloPequeno) circuloPequeno.style.backgroundColor = quarta;

    document.documentElement.style.setProperty("--current-color", primeira);
    document.documentElement.style.setProperty("--palette-color-2", segunda);
    document.documentElement.style.setProperty("--palette-color-3", terceira);
}

function corDeTexto(hex) {
    const rgb = hexParaRGB(hex);

    if (!rgb) return "#FFFFFF";

    const luminosidade =
        (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

    return luminosidade >= 150 ? "#171322" : "#FFFFFF";
}

/* ---------- Gerador de paleta ---------- */

function gerarPaleta() {
    paleta = paleta.map(cor => {
        if (cor.travada) return cor;

        const hex = corAleatoria();

        return {
            ...cor,
            hex,
            nome: escolherNome(hex)
        };
    });

    renderizarPaleta();
    atualizarBotaoFavorita();
    mostrarToast("Nova paleta gerada!");
}

function gerarCorAleatoria() {
    let indice = paleta.findIndex(cor => !cor.travada);

    if (indice === -1) {
        mostrarToast("Todas as cores estão fixadas. Desafixe uma para alterar.");
        return;
    }

    const hex = corAleatoria();

    paleta[indice] = {
        ...paleta[indice],
        hex,
        nome: escolherNome(hex)
    };

    renderizarPaleta();
    mostrarToast(`Cor ${indice + 1} alterada para ${hex}`);
}

function alternarTrava(indice) {
    if (!paleta[indice]) return;

    paleta[indice].travada = !paleta[indice].travada;

    renderizarPaleta();

    mostrarToast(
        paleta[indice].travada
            ? "Cor fixada para as próximas gerações."
            : "Cor desafixada."
    );
}

/* =========================================
   EDITOR DE CORES
   ========================================= */

/*
 * Abre o editor para uma posição específica da paleta.
 * A cor original é guardada para que Cancelar não altere a paleta.
 */

function abrirEditor(indice) {
    if (!paleta[indice] || !elementos.editor) return;

    indiceEditando = indice;
    corOriginalEditor = paleta[indice].hex;
    ultimaCorValida = corOriginalEditor;

    preencherEditor(corOriginalEditor);

    elementos.editor.hidden = false;
    document.body.style.overflow = "hidden";

    if (elementos.editorHex) {
        elementos.editorHex.focus();
        elementos.editorHex.select();
    }
}

function fecharEditor() {
    if (!elementos.editor) return;

    elementos.editor.hidden = true;
    document.body.style.overflow = "";

    indiceEditando = null;
    corOriginalEditor = null;
    ultimaCorValida = "#7C5CFC";

    if (elementos.editorError) {
        elementos.editorError.textContent = "";
    }
}

/*
 * Atualiza todos os controles a partir de um HEX válido.
 */

function preencherEditor(hex) {
    const cor = normalizarHex(hex);
    if (!cor) return;

    const rgb = hexParaRGB(cor);
    ultimaCorValida = cor;

    if (elementos.editorWheel) {
        elementos.editorWheel.value = cor;
    }

    if (elementos.editorR) {
        elementos.editorR.value = String(rgb.r);
    }

    if (elementos.editorG) {
        elementos.editorG.value = String(rgb.g);
    }

    if (elementos.editorB) {
        elementos.editorB.value = String(rgb.b);
    }

    if (elementos.editorHex) {
        elementos.editorHex.value = cor;
    }

    atualizarPreviaEditor(cor);

    if (elementos.editorError) {
        elementos.editorError.textContent = "";
    }
}

/*
 * Atualiza a prévia dentro do editor.
 * Não altera a paleta até clicar em Aplicar.
 */

function atualizarPreviaEditor(hex) {
    const cor = normalizarHex(hex);
    if (!cor) return;

    if (elementos.editorPreview) {
        elementos.editorPreview.style.backgroundColor = cor;
    }

    if (elementos.editorPreviewHex) {
        elementos.editorPreviewHex.textContent = cor;
    }

    if (elementos.editorWheel && elementos.editorWheel.value !== cor) {
        elementos.editorWheel.value = cor;
    }
}

/* ---------- Eventos do editor ---------- */

/*
 * Seletor visual de cor.
 */

if (elementos.editorWheel) {
    elementos.editorWheel.addEventListener("input", evento => {
        preencherEditor(evento.target.value);
    });
}

/*
 * Campo HEX.
 * Durante a digitação, só atualiza a prévia quando o valor for válido.
 */

if (elementos.editorHex) {
    elementos.editorHex.addEventListener("input", evento => {
        const digitado = evento.target.value.trim();
        const cor = normalizarHex(digitado);

        if (!cor) {
            if (elementos.editorError) {
                elementos.editorError.textContent =
                    "Digite uma cor válida, por exemplo #7C5CFC.";
            }
            return;
        }

        preencherEditor(cor);
    });

    elementos.editorHex.addEventListener("blur", () => {
        const cor = normalizarHex(elementos.editorHex.value);

        if (cor) {
            preencherEditor(cor);
        } else {
            elementos.editorHex.value = ultimaCorValida;

            if (elementos.editorError) {
                elementos.editorError.textContent =
                    "HEX inválido. O valor anterior foi restaurado.";
            }
        }
    });

    elementos.editorHex.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            aplicarCorEditor();
        }
    });
}

/*
 * Campos RGB.
 */

function tratarCampoRGB() {
    if (
        !elementos.editorR ||
        !elementos.editorG ||
        !elementos.editorB
    ) {
        return;
    }

    const rTexto = elementos.editorR.value.trim();
    const gTexto = elementos.editorG.value.trim();
    const bTexto = elementos.editorB.value.trim();

    if (rTexto === "" || gTexto === "" || bTexto === "") {
        if (elementos.editorError) {
            elementos.editorError.textContent =
                "Preencha os três canais RGB com valores entre 0 e 255.";
        }
        return;
    }

    const r = Number(rTexto);
    const g = Number(gTexto);
    const b = Number(bTexto);

    const valoresValidos = [r, g, b].every(valor =>
        Number.isInteger(valor) && valor >= 0 && valor <= 255
    );

    if (!valoresValidos) {
        if (elementos.editorError) {
            elementos.editorError.textContent =
                "Cada canal RGB deve ser um número inteiro entre 0 e 255.";
        }
        return;
    }

    const hex = rgbParaHex(r, g, b);

    ultimaCorValida = hex;

    if (elementos.editorHex) {
        elementos.editorHex.value = hex;
    }

    atualizarPreviaEditor(hex);

    if (elementos.editorError) {
        elementos.editorError.textContent = "";
    }
}

[
    elementos.editorR,
    elementos.editorG,
    elementos.editorB
].forEach(campo => {
    if (!campo) return;

    campo.addEventListener("input", tratarCampoRGB);

    campo.addEventListener("blur", () => {
        const valor = Number(campo.value);

        if (
            campo.value.trim() === "" ||
            !Number.isInteger(valor) ||
            valor < 0 ||
            valor > 255
        ) {
            const rgb = hexParaRGB(ultimaCorValida);
            const canal = campo.id === "editor-r"
                ? rgb.r
                : campo.id === "editor-g"
                    ? rgb.g
                    : rgb.b;

            campo.value = String(canal);
        }
    });
});

/* ---------- Aplicar ou cancelar ---------- */

function aplicarCorEditor() {
    if (indiceEditando === null || !paleta[indiceEditando]) {
        fecharEditor();
        return;
    }

    const hex = normalizarHex(
        elementos.editorHex ? elementos.editorHex.value : ""
    );

    if (!hex) {
        if (elementos.editorError) {
            elementos.editorError.textContent =
                "Insira um código HEX válido antes de aplicar.";
        }
        return;
    }

    const rgb = hexParaRGB(hex);

    if (!rgb) return;

    /*
     * Alteramos somente o item que está sendo editado.
     * A propriedade travada é preservada.
     */

    paleta[indiceEditando] = {
        ...paleta[indiceEditando],
        hex,
        nome: escolherNome(hex)
    };

    renderizarPaleta();
    atualizarBotaoFavorita();

    fecharEditor();

    mostrarToast(`Cor atualizada para ${hex}`);
}

if (elementos.editorApply) {
    elementos.editorApply.addEventListener("click", aplicarCorEditor);
}

if (elementos.editorCancel) {
    elementos.editorCancel.addEventListener("click", fecharEditor);
}

if (elementos.editorClose) {
    elementos.editorClose.addEventListener("click", fecharEditor);
}

/* Clicar no fundo escuro fecha o editor sem aplicar. */

if (elementos.editor) {
    elementos.editor.addEventListener("click", evento => {
        if (evento.target === elementos.editor) {
            fecharEditor();
        }
    });
}

/* =========================================
   INTERAÇÕES COM OS CARTÕES
   ========================================= */

if (elementos.palette) {
    elementos.palette.addEventListener("click", evento => {
        const botao = evento.target.closest("button[data-action]");
        if (!botao) return;

        const indice = Number(botao.dataset.index);
        if (!Number.isInteger(indice) || !paleta[indice]) return;

        if (botao.dataset.action === "lock") {
            alternarTrava(indice);
        }

        if (botao.dataset.action === "copy-color") {
            /*
             * O duplo clique é reservado para abrir o editor.
             * O clique simples copia o HEX.
             */
            copiarTexto(paleta[indice].hex).then(sucesso => {
                if (sucesso) {
                    mostrarToast(`${paleta[indice].hex} copiado!`);
                } else {
                    mostrarToast("Não foi possível copiar automaticamente.");
                }
            });
        }
    });

    elementos.palette.addEventListener("dblclick", evento => {
        const botao = evento.target.closest(
            'button[data-action="copy-color"]'
        );

        if (!botao) return;

        evento.preventDefault();

        const indice = Number(botao.dataset.index);
        abrirEditor(indice);
    });
}

/* ---------- Copiar ---------- */

async function copiarTexto(texto) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            return true;
        }
    } catch (erro) {
        // Tenta o método alternativo abaixo.
    }

    try {
        const area = document.createElement("textarea");

        area.value = texto;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        area.style.pointerEvents = "none";

        document.body.appendChild(area);
        area.select();

        const sucesso = document.execCommand("copy");

        area.remove();

        return sucesso;
    } catch (erro) {
        return false;
    }
}

if (elementos.copyPalette) {
    elementos.copyPalette.addEventListener("click", async () => {
        const texto = paleta.map(cor => cor.hex).join("\n");
        const sucesso = await copiarTexto(texto);

        mostrarToast(
            sucesso
                ? "Paleta copiada!"
                : "Não foi possível copiar a paleta."
        );
    });
}

/* =========================================
   PALETAS FAVORITAS
   ========================================= */

function assinaturaPaleta(lista = paleta) {
    return lista.map(cor => cor.hex).join(",");
}

function atualizarBotaoFavorita() {
    if (!elementos.favoritePalette) return;

    const assinatura = assinaturaPaleta();

    const jaFavorita = favoritas.some(
        favorita => favorita.assinatura === assinatura
    );

    elementos.favoritePalette.textContent = jaFavorita
        ? "♥ Favoritada"
        : "♡ Favoritar";
}

function favoritarPaleta() {
    const assinatura = assinaturaPaleta();

    const existente = favoritas.findIndex(
        favorita => favorita.assinatura === assinatura
    );

    if (existente !== -1) {
        favoritas.splice(existente, 1);
        renderizarFavoritas();
        atualizarBotaoFavorita();
        mostrarToast("Paleta removida das favoritas.");
        return;
    }

    favoritas.unshift({
        id: criarIdFavorita(),
        nome: `Paleta ${favoritas.length + 1}`,
        assinatura,
        cores: paleta.map(cor => ({
            hex: cor.hex,
            nome: cor.nome
        })),
        criadaEm: new Date().toLocaleDateString("pt-BR")
    });

    renderizarFavoritas();
    atualizarBotaoFavorita();
    mostrarToast("Paleta adicionada às favoritas!");
}

function criarIdFavorita() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function renderizarFavoritas() {
    if (!elementos.favorites) return;

    elementos.favorites.innerHTML = "";

    if (favoritas.length === 0) {
        if (elementos.favoritesEmpty) {
            elementos.favorites.appendChild(elementos.favoritesEmpty);
        } else {
            const vazio = document.createElement("div");
            vazio.className = "empty-state";
            vazio.innerHTML = `
                <div class="empty-icon" aria-hidden="true">♡</div>
                <h3>Nenhuma paleta salva</h3>
                <p>Clique em “Favoritar” para guardar suas combinações.</p>
            `;
            elementos.favorites.appendChild(vazio);
        }

        atualizarContagemFavoritas();
        return;
    }

    favoritas.forEach(favorita => {
        const card = document.createElement("article");
        card.className = "favorite-card";

        const faixa = document.createElement("div");
        faixa.className = "favorite-colors";

        favorita.cores.forEach(cor => {
            const amostra = document.createElement("div");
            amostra.className = "favorite-color";
            amostra.style.backgroundColor = cor.hex;
            amostra.title = cor.hex;
            faixa.appendChild(amostra);
        });

        const detalhes = document.createElement("div");
        detalhes.className = "favorite-details";

        const descricao = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = favorita.nome;

        const data = document.createElement("p");
        data.textContent =
            `${favorita.cores.map(cor => cor.hex).join(" · ")}`;

        descricao.append(titulo, data);

        const acoes = document.createElement("div");
        acoes.className = "favorite-actions";

        const restaurar = document.createElement("button");
        restaurar.type = "button";
        restaurar.textContent = "Usar paleta";
        restaurar.addEventListener("click", () => {
            paleta = favorita.cores.map((cor, indice) => ({
                hex: cor.hex,
                nome: cor.nome || escolherNome(cor.hex),
                travada: paleta[indice]?.travada || false
            }));

            renderizarPaleta();
            atualizarBotaoFavorita();

            mostrarToast("Paleta favorita carregada.");
            window.location.hash = "gerador";
        });

        const remover = document.createElement("button");
        remover.type = "button";
        remover.textContent = "Remover";
        remover.addEventListener("click", () => {
            favoritas = favoritas.filter(item => item.id !== favorita.id);
            renderizarFavoritas();
            atualizarBotaoFavorita();
            mostrarToast("Paleta removida.");
        });

        acoes.append(restaurar, remover);
        detalhes.append(descricao, acoes);
        card.append(faixa, detalhes);

        elementos.favorites.appendChild(card);
    });

    atualizarContagemFavoritas();
}

function atualizarContagemFavoritas() {
    if (!elementos.favoritesCount) return;

    const quantidade = favoritas.length;

    elementos.favoritesCount.textContent =
        `${quantidade} ${quantidade === 1 ? "paleta" : "paletas"}`;
}

if (elementos.favoritePalette) {
    elementos.favoritePalette.addEventListener("click", favoritarPaleta);
}

/* =========================================
   TEMA
   ========================================= */

function alternarTema() {
    document.body.classList.toggle("light-theme");

    const claro = document.body.classList.contains("light-theme");

    if (elementos.theme) {
        elementos.theme.textContent = claro ? "☾" : "☼";
        elementos.theme.title = claro
            ? "Ativar tema escuro"
            : "Ativar tema claro";
        elementos.theme.setAttribute(
            "aria-label",
            elementos.theme.title
        );
    }
}

if (elementos.theme) {
    elementos.theme.addEventListener("click", alternarTema);
}

/* =========================================
   EVENTOS PRINCIPAIS
   ========================================= */

if (elementos.generate) {
    elementos.generate.addEventListener("click", gerarPaleta);
}

if (elementos.random) {
    elementos.random.addEventListener("click", gerarCorAleatoria);
}

/*
 * Escape fecha o editor sem aplicar.
 * Espaço gera uma nova paleta quando o usuário não está
 * digitando em um campo e o editor está fechado.
 */

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && elementos.editor &&
        !elementos.editor.hidden) {
        fecharEditor();
        return;
    }

    if (evento.code !== "Space") return;
    if (elementos.editor && !elementos.editor.hidden) return;

    const alvo = evento.target;
    const tag = alvo && alvo.tagName
        ? alvo.tagName.toLowerCase()
        : "";

    const digitando =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        alvo?.isContentEditable;

    if (digitando) return;

    evento.preventDefault();
    gerarPaleta();
});

/* =========================================
   INICIALIZAÇÃO
   ========================================= */

function iniciarColorLab() {
    renderizarPaleta();
    renderizarFavoritas();
    atualizarBotaoFavorita();

    if (elementos.editor) {
        elementos.editor.hidden = true;
    }
}

iniciarColorLab();
