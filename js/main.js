
/* =========================================================
   ARTHUR RESENDE WEBS
   Arquivo: js/main.js

   Funcionalidades gerais da página inicial.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // 1. Atualizar automaticamente o ano do rodapé
    // -----------------------------------------------------

    const copyright = document.querySelector("[data-current-year]");

    if (copyright) {
        copyright.textContent = new Date().getFullYear();
    }


    // -----------------------------------------------------
    // 2. Animação suave das seções ao aparecerem na tela
    // -----------------------------------------------------

    const animatedElements = document.querySelectorAll(
        ".project-card, .feature-card, .service-card, " +
        ".process-steps, .contact-panel"
    );

    // Respeita a preferência do visitante por movimento reduzido.
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        currentObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -30px 0px"
            }
        );

        animatedElements.forEach((element) => {
            element.classList.add("reveal-on-scroll");
            observer.observe(element);
        });
    } else {
        // Se não houver suporte ou animações estiverem desativadas,
        // mantém todo o conteúdo visível.
        animatedElements.forEach((element) => {
            element.classList.add("is-visible");
        });
    }


    // -----------------------------------------------------
    // 3. Destacar a seção atual no menu
    // -----------------------------------------------------

    const navigation = document.getElementById("main-navigation");

    if (navigation && "IntersectionObserver" in window) {
        const sectionLinks = navigation.querySelectorAll(
            'a[href^="#"]'
        );

        const sections = Array.from(sectionLinks)
            .map((link) => {
                const targetId = link.getAttribute("href");

                if (!targetId || targetId === "#") {
                    return null;
                }

                return document.querySelector(targetId);
            })
            .filter(Boolean);

        if (sections.length > 0) {
            const sectionObserver = new IntersectionObserver(
                (entries) => {
                    // Considera a seção visível mais próxima do topo.
                    const visibleSections = entries
                        .filter((entry) => entry.isIntersecting)
                        .sort(
                            (a, b) =>
                                a.boundingClientRect.top -
                                b.boundingClientRect.top
                        );

                    if (visibleSections.length === 0) {
                        return;
                    }

                    const currentId = visibleSections[0].target.id;

                    sectionLinks.forEach((link) => {
                        const isCurrent =
                            link.getAttribute("href") === `#${currentId}`;

                        if (isCurrent) {
                            link.classList.add("active");
                            link.setAttribute("aria-current", "location");
                        } else {
                            link.classList.remove("active");
                            link.removeAttribute("aria-current");
                        }
                    });
                },
                {
                    rootMargin: "-20% 0px -60% 0px",
                    threshold: 0
                }
            );

            sections.forEach((section) => {
                sectionObserver.observe(section);
            });
        }
    }
});
