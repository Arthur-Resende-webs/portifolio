
/* =========================================================
   ARTHUR RESENDE WEBS
   Arquivo: js/navigation.js

   Controla a navegação principal e o menu mobile.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("main-navigation");

    // Sem estes elementos, não há menu para controlar.
    if (!menuToggle || !navigation) {
        return;
    }

    const navLinks = navigation.querySelectorAll('a[href^="#"]');

    /**
     * Abre ou fecha o menu mobile.
     * @param {boolean} open - Estado desejado do menu.
     */
    function setMenuOpen(open) {
        navigation.classList.toggle("is-open", open);
        menuToggle.classList.toggle("is-active", open);

        menuToggle.setAttribute("aria-expanded", String(open));

        if (open) {
            menuToggle.setAttribute("aria-label", "Fechar menu");
        } else {
            menuToggle.setAttribute("aria-label", "Abrir menu");
        }
    }

    // Estado inicial.
    setMenuOpen(false);

    // Alterna o menu ao clicar no botão.
    menuToggle.addEventListener("click", () => {
        const isOpen = navigation.classList.contains("is-open");
        setMenuOpen(!isOpen);
    });

    // Fecha o menu quando uma seção é selecionada.
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            setMenuOpen(false);
        });
    });

    // Fecha o menu com a tecla Escape.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenuOpen(false);
        }
    });

    // Fecha o menu se o usuário tocar fora dele.
    document.addEventListener("click", (event) => {
        const clickedInsideMenu = navigation.contains(event.target);
        const clickedToggle = menuToggle.contains(event.target);

        if (!clickedInsideMenu && !clickedToggle) {
            setMenuOpen(false);
        }
    });

    // Se a tela voltar ao tamanho de computador,
    // remove o estado aberto do menu mobile.
    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            setMenuOpen(false);
        }
    });
});
