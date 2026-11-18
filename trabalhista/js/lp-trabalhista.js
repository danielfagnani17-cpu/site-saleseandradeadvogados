(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));

  if (revealItems.length) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      document.documentElement.classList.add("motion-ready");

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, {
        // Medido: com threshold .14 um bloco alto como .evidence-copy (718px)
        // precisava de 101px visiveis para disparar, e a linha de gatilho
        // caia a 755px do topo. Num flick de celular o elemento atravessa a
        // tela em 270ms e a transicao precisa de 650ms: a pessoa passava por
        // cima de secoes em opacidade parcial. Agora revela antes de entrar.
        threshold: 0,
        rootMargin: "0px 0px 15% 0px",
      });

      revealItems.forEach((item) => observer.observe(item));
    }
  }

  const compact = window.matchMedia("(max-width: 600px)");
  const disclosures = Array.from(document.querySelectorAll(".mobile-disclosure"));

  if (disclosures.length) {
    // Quem abriu tres cards, girou o celular para ler melhor e girou de
    // volta, perdia tudo: o sync reaplicava o estado inicial em todos.
    // Agora so o primeiro ajuste fecha; depois disso manda o leitor.
    let jaAjustou = false;

    const syncDisclosures = (isCompact) => {
      disclosures.forEach((item) => {
        if (jaAjustou && item.dataset.tocado === "sim") return;
        // Nasce fechado no celular: cliente pediu que nenhum card
        // abra sozinho, o leitor decide o que ver.
        item.open = !isCompact;
      });
      jaAjustou = true;
    };

    disclosures.forEach((item) => {
      item.addEventListener("toggle", () => {
        item.dataset.tocado = "sim";

        // Medido: abrir um card revela 343px, mas o summary fica no rodape
        // do card, onde o polegar encosta. Nessa posicao 214px caiam abaixo
        // da barra fixa e a pessoa lia 38% do que abriu; mais embaixo, nada.
        if (!item.open || !compact.matches) return;

        const caixa = item.getBoundingClientRect();
        const limite = window.innerHeight - 110;

        if (caixa.bottom > limite) {
          window.scrollTo({
            top: window.scrollY + caixa.top - window.innerHeight * 0.32,
            behavior: reducedMotion ? "auto" : "smooth",
          });
        }
      });
    });

    syncDisclosures(compact.matches);
    compact.addEventListener("change", (event) => syncDisclosures(event.matches));
  }

  const bar = document.getElementById("action-bar");
  const hero = document.querySelector(".lp-hero");
  const fim = document.querySelector(".contact-section");

  if (bar && hero && fim && "IntersectionObserver" in window) {
    bar.hidden = false;

    let passouDoHero = false;
    let chegouAoFim = false;
    let ctaDoFluxoNaTela = false;
    const sync = () =>
      bar.toggleAttribute(
        "data-on",
        passouDoHero && !chegouAoFim && !ctaDoFluxoNaTela,
      );

    new IntersectionObserver(([e]) => {
      passouDoHero = !e.isIntersecting;
      sync();
    }, { threshold: 0 }).observe(hero);

    new IntersectionObserver(([e]) => {
      chegouAoFim = e.isIntersecting;
      sync();
    }, { rootMargin: "0px 0px -30% 0px" }).observe(fim);

    // Dois CTAs identicos encostados um no outro ficam feios e confundem:
    // enquanto um botao do proprio fluxo esta na tela, a barra recolhe.
    const ctasEmFluxo = Array.from(
      document.querySelectorAll("main .button-primary, main .button-dark"),
    );

    if (ctasEmFluxo.length) {
      const visiveis = new Set();
      const observadorDeFluxo = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) visiveis.add(entrada.target);
          else visiveis.delete(entrada.target);
        });
        ctaDoFluxoNaTela = visiveis.size > 0;
        sync();
        // A barra mede 73px mais env(safe-area-inset-bottom), que chega a
        // 34px num iPhone com notch. Com -84 ela encostava num CTA do fluxo
        // antes de recolher.
      }, { rootMargin: "0px 0px -110px 0px" });

      ctasEmFluxo.forEach((cta) => observadorDeFluxo.observe(cta));
    }
  }

  // A faixa de setores rodava 44s em loop permanente com will-change,
  // inclusive nas dez telas em que esta fora de vista: camada de composicao
  // viva o tempo todo, gastando GPU e bateria num Android barato dentro do
  // webview. Fora da tela, ela para.
  const faixa = document.querySelector(".sector-marquee");
  const trilho = document.querySelector(".sector-track");

  if (faixa && trilho && "IntersectionObserver" in window) {
    new IntersectionObserver(([entrada]) => {
      trilho.style.animationPlayState = entrada.isIntersecting
        ? "running"
        : "paused";
    }).observe(faixa);
  }

  // animation-timeline: scroll() so existe no Safari 26+. Sem este fallback
  // a barra de progresso fica invisivel na maior parte dos iPhones.
  const progresso = document.querySelector(".scroll-progress");
  const temScrollTimeline =
    typeof CSS !== "undefined" &&
    CSS.supports &&
    CSS.supports("animation-timeline", "scroll(root)");

  if (progresso && !temScrollTimeline && !reducedMotion) {
    let agendado = false;
    const pinta = () => {
      agendado = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progresso.style.transform = "scaleX(" + pct + ")";
    };
    const atualizaProgresso = () => {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(pinta);
    };

    pinta();
    window.addEventListener("scroll", atualizaProgresso, { passive: true });
    window.addEventListener("resize", atualizaProgresso, { passive: true });
  }

  // Meta Pixel: marca o clique em qualquer CTA de WhatsApp como contato.
  // Abre em nova aba (target=_blank), entao nao ha corrida com a navegacao.
  if (typeof fbq === "function") {
    document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
      link.addEventListener("click", () => {
        fbq("track", "Contact");
      });
    });
  }
})();
