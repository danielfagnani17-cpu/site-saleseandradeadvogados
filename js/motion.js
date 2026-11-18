window.__motionOk = true;   // usado pelo <head> para saber que este arquivo carregou
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- mobile nav toggle ----
  // Trava de rolagem do menu. overflow:hidden no body nao segura: quem rola
  // esta pagina e o <html>, e o body ainda tem overflow-x:clip herdado da
  // correcao do menu lateral, o que impede a propagacao do overflow para a
  // viewport. Medido: com o menu aberto, um gesto real levava o fundo de 0 a
  // 1200px enquanto o painel seguia aberto. Script com scrollTo nao
  // reproduzia, so o gesto, e por isso passou despercebido.
  // position:fixed no body e o unico jeito que tambem funciona no Safari do
  // iPhone; guardamos a posicao para devolver na hora de fechar.
  var posicaoTravada = 0;

  function travarRolagem() {
    posicaoTravada = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = -posicaoTravada + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function destravarRolagem() {
    if (!document.body.style.position) return;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, posicaoTravada);
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("nav.main");
  var scrim = document.querySelector(".nav-scrim");

  function closeNav(restoreFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    nav.classList.remove("is-open");
    if (scrim) scrim.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    destravarRolagem();
    if (restoreFocus) toggle.focus();
  }

  function openNav() {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fechar menu");
    nav.classList.add("is-open");
    if (scrim) scrim.classList.add("is-open");
    document.body.classList.add("nav-open");
    travarRolagem();
    var firstLink = nav.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeNav(true);
      else openNav();
    });
    if (scrim) {
      scrim.addEventListener("click", function () {
        closeNav(true);
      });
    }
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        closeNav(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (e.key === "Escape") {
        closeNav(true);
        return;
      }
      if (e.key !== "Tab") return;
      var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
      if (!links.length) return;
      var first = links[0];
      var last = toggle;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100 && toggle.getAttribute("aria-expanded") === "true") {
        closeNav(false);
      }
    });
  }

  // ---- reveal on scroll ----
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  // ---- count-up nos números reais ----
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var pad = el.getAttribute("data-pad") === "2";
    var dur = 1100;
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      var txt = pad && val < 10 ? "0" + val : String(val);
      el.textContent = txt + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        var t = parseInt(el.getAttribute("data-count"), 10);
        var pad = el.getAttribute("data-pad") === "2";
        el.textContent = (pad && t < 10 ? "0" + t : t) + (el.getAttribute("data-suffix") || "");
      });
    } else {
      var cio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) {
        cio.observe(el);
      });
    }
  }

  // ---- FAQ accordion ----
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      item.classList.toggle("is-open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
})();
