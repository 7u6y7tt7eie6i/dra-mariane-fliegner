/* ══════════════════════════════════════════════════════════
   DRA. MARIANE FLIEGNER · INTERAÇÕES
   Efeitos adaptados da vitrine "36 animações em JavaScript"
   do canal Não Codei: 16, 17, 14, 06 e 12.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var FX = {};
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toque = window.matchMedia('(hover: none)').matches;

  /* ── ferramentas ─────────────────────────────────────── */
  var limitar = function (v, min, max) { return Math.max(min, Math.min(max, v)); };

  /* progresso de 0 a 1 de um elemento atravessando a área visível */
  function progressoNaTela(el) {
    var r = el.getBoundingClientRect();
    var alt = window.innerHeight || 800;
    return limitar((alt - r.top) / (alt + r.height), 0, 1);
  }

  /* laço de animação que só roda enquanto o elemento está visível */
  function laco(el, passo) {
    var id = null, vivo = false, respondeu = false;
    function rodar() { passo(); id = requestAnimationFrame(rodar); }
    function ligar() { if (!vivo) { vivo = true; rodar(); } }
    function desligar() { if (vivo) { vivo = false; cancelAnimationFrame(id); } }
    var obs = new IntersectionObserver(function (e) {
      respondeu = true;
      e[0].isIntersecting ? ligar() : desligar();
    }, { threshold: 0 });
    obs.observe(el);
    var espera = setTimeout(function () { if (!respondeu) ligar(); }, 1500);
    return function () { clearTimeout(espera); desligar(); obs.disconnect(); };
  }

  /* chama "passo(progresso)" a cada rolagem enquanto visível */
  function aoRolar(el, passo) {
    var pedido = false;
    function atualizar() { pedido = false; passo(progressoNaTela(el)); }
    function agendar() { if (!pedido) { pedido = true; requestAnimationFrame(atualizar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    atualizar();
    return function () {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
    };
  }

  /* ══════════════════════════════════════════════════════
     16 · REVELAR PALAVRA POR PALAVRA (título do hero)
     Mantém <em> e <br> do HTML original.
     ══════════════════════════════════════════════════════ */
  FX.j16 = function (raiz) {
    raiz.querySelectorAll('.js-split').forEach(function (el) {
      if (!el.dataset.pronto) {
        var embrulhar = function (txt) {
          return txt.split(/(\s+)/).map(function (p) {
            return /^\s+$/.test(p) || p === '' ? p : '<span class="palavra">' + p + '</span>';
          }).join('');
        };
        var html = '';
        el.childNodes.forEach(function (n) {
          if (n.nodeType === 3) html += embrulhar(n.textContent);
          else if (n.nodeName === 'BR') html += '<br>';
          else html += '<' + n.nodeName.toLowerCase() + '>' + embrulhar(n.textContent) + '</' + n.nodeName.toLowerCase() + '>';
        });
        el.setAttribute('aria-label', el.textContent.trim());
        el.innerHTML = html;
        el.dataset.pronto = '1';
      }
      var palavras = el.querySelectorAll('.palavra');
      if (semMovimento) { palavras.forEach(function (p) { p.classList.add('dentro'); }); return; }
      palavras.forEach(function (p, i) {
        setTimeout(function () { p.classList.add('dentro'); }, 250 + i * 90);
      });
    });
  };

  /* ══════════════════════════════════════════════════════
     17 · PALAVRAS QUE SE ALTERNAM (subtítulo do hero)
     ══════════════════════════════════════════════════════ */
  FX.j17 = function (raiz) {
    raiz.querySelectorAll('.js-troca .janela').forEach(function (janela) {
      var fita = janela.querySelector('.fita');
      var itens = fita.children.length;
      var i = 0;
      if (semMovimento) return;
      setInterval(function () {
        i++;
        fita.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        fita.style.transform = 'translateY(' + (-i * 100 / itens) + '%)';
        if (i === itens - 1) { /* volta invisível ao início */
          setTimeout(function () {
            fita.style.transition = 'none';
            fita.style.transform = 'translateY(0)';
            i = 0;
          }, 620);
        }
      }, 2000);
    });
  };

  /* ══════════════════════════════════════════════════════
     14 · BOTÃO ELÁSTICO (CTAs principais)
     Mola com velocidade e amortecimento.
     ══════════════════════════════════════════════════════ */
  FX.j14 = function (raiz) {
    /* sem mouse não há o que animar: poupa o celular de um laço por botão */
    if (semMovimento || toque) return;
    raiz.querySelectorAll('.js-elastico').forEach(function (btn) {
      var escala = 1, vel = 0, alvo = 1;
      btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') alvo = 1.08; });
      btn.addEventListener('pointerleave', function () { alvo = 1; });
      btn.addEventListener('pointerdown', function () { alvo = .92; });
      btn.addEventListener('pointerup', function (e) { alvo = e.pointerType === 'mouse' ? 1.08 : 1; });
      btn.addEventListener('pointercancel', function () { alvo = 1; });
      laco(btn, function () {
        var forca = (alvo - escala) * .22;   /* rigidez da mola */
        vel = (vel + forca) * .72;           /* amortecimento    */
        escala += vel;
        if (Math.abs(vel) < 0.0005 && Math.abs(alvo - escala) < 0.0005) escala = alvo;
        btn.style.transform = 'scale(' + escala.toFixed(4) + ')';
      });
    });
  };

  /* ══════════════════════════════════════════════════════
     06 · FAIXAS QUE SE MONTAM (foto do "Quem somos")
     A foto chega dividida em tiras que deslizam em direções
     alternadas conforme a rolagem, até se encaixarem.
     ══════════════════════════════════════════════════════ */
  FX.j06 = function (raiz) {
    raiz.querySelectorAll('.js-faixas').forEach(function (caixa) {
      var n = parseInt(caixa.dataset.tiras, 10) || 8;
      var img = caixa.dataset.img;
      var tiras = [];
      for (var i = 0; i < n; i++) {
        var t = document.createElement('div');
        t.className = 'tira';
        t.style.backgroundImage = 'url("' + img + '")';
        t.style.backgroundSize = (n * 100) + '% 100%';
        t.style.backgroundPosition = (i / (n - 1) * 100) + '% 0';
        caixa.appendChild(t);
        tiras.push(t);
      }
      /* caminho absoluto: url() em variável CSS seria resolvido a partir da pasta do style.css */
      caixa.style.setProperty('--img', 'url("' + new URL(img, document.baseURI).href + '")');
      if (semMovimento) { caixa.classList.add('montada'); return; }
      aoRolar(caixa, function (p) {
        /* monta por completo quando a foto chega perto do meio da tela */
        var progresso = limitar(p * 2.5, 0, 1);
        caixa.classList.toggle('montada', progresso >= 1);
        tiras.forEach(function (t, i) {
          var atraso = i * 0.06;
          var f = limitar((progresso - atraso) / (1 - atraso), 0, 1);
          var suave = 1 - Math.pow(1 - f, 3);
          var sentido = i % 2 ? 1 : -1;
          t.style.transform = 'translateY(' + (sentido * (1 - suave) * 110).toFixed(2) + '%)';
          t.style.opacity = (.25 + suave * .75).toFixed(3);
        });
      });
    });
  };

  /* ══════════════════════════════════════════════════════
     12 · LUZ QUE SEGUE O MOUSE (cards e depoimentos)
     ══════════════════════════════════════════════════════ */
  FX.j12 = function (raiz) {
    if (toque) return;
    raiz.querySelectorAll('.js-luz').forEach(function (el) {
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--x', (ev.clientX - r.left) + 'px');
        el.style.setProperty('--y', (ev.clientY - r.top) + 'px');
      });
    });
  };

  /* ── esteira de números: laço infinito + contagem ────── */
  function esteira() {
    var trilho = document.querySelector('.esteira__trilho');
    if (!trilho) return;
    var grupo = trilho.querySelector('.esteira__grupo');

    /* cópia idêntica do grupo: a animação anda -50% e recomeça sem emenda */
    var copia = grupo.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    trilho.appendChild(copia);

    var alvos = trilho.querySelectorAll('[data-contar]');
    function escrever(el, v) {
      var casas = parseInt(el.dataset.casas || '0', 10);
      el.textContent = (el.dataset.prefixo || '') +
        v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) +
        (el.dataset.sufixo || '');
    }
    function contar() {
      var inicio = null, duracao = 1800;
      function passo(t) {
        if (!inicio) inicio = t;
        var f = Math.min((t - inicio) / duracao, 1);
        var suave = 1 - Math.pow(1 - f, 3);
        alvos.forEach(function (el) { escrever(el, parseFloat(el.dataset.contar) * suave); });
        if (f < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    }
    if (semMovimento || !('IntersectionObserver' in window)) return;
    alvos.forEach(function (el) { escrever(el, 0); });
    var obs = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { contar(); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(trilho.parentElement);
  }

  /* ── vitrine de tratamentos: abas + troca automática ── */
  function vitrine() {
    var raiz = document.querySelector('.vitrine');
    if (!raiz) return;
    var abas = [].slice.call(raiz.querySelectorAll('[role="tab"]'));
    var intervalo = parseInt(raiz.dataset.intervalo, 10) || 7000;
    var atual = 0, timer = null, visivel = false, parouDeVez = false;
    raiz.style.setProperty('--intervalo', intervalo + 'ms');

    function mostrar(i, focar) {
      atual = (i + abas.length) % abas.length;
      abas.forEach(function (aba, j) {
        var sel = j === atual;
        var painel = document.getElementById(aba.getAttribute('aria-controls'));
        aba.setAttribute('aria-selected', sel);
        aba.tabIndex = sel ? 0 : -1;
        painel.hidden = !sel;
        painel.classList.toggle('ativo', sel);
      });
      if (focar) abas[atual].focus();
      /* no celular, mantém a pílula ativa à vista */
      var lista = abas[atual].parentElement;
      if (lista.scrollWidth > lista.clientWidth) {
        lista.scrollTo({ left: abas[atual].getBoundingClientRect().left - lista.getBoundingClientRect().left + lista.scrollLeft - 18, behavior: semMovimento ? 'auto' : 'smooth' });
      }
      agendar();
    }

    function agendar() {
      clearTimeout(timer);
      raiz.classList.remove('rodando');
      if (parouDeVez || semMovimento || !visivel) return;
      void raiz.offsetWidth; /* reinicia a animação da barra */
      raiz.classList.add('rodando');
      timer = setTimeout(function () {
        if (raiz.classList.contains('pausada')) { agendar(); return; }
        mostrar(atual + 1);
      }, intervalo);
    }

    abas.forEach(function (aba, i) {
      aba.addEventListener('click', function () { parouDeVez = true; mostrar(i); });
      aba.addEventListener('keydown', function (e) {
        var mapa = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (e.key in mapa) { e.preventDefault(); parouDeVez = true; mostrar(atual + mapa[e.key], true); }
        else if (e.key === 'Home') { e.preventDefault(); parouDeVez = true; mostrar(0, true); }
        else if (e.key === 'End') { e.preventDefault(); parouDeVez = true; mostrar(abas.length - 1, true); }
      });
    });

    /* pausa enquanto o mouse está sobre a vitrine */
    raiz.addEventListener('mouseenter', function () { raiz.classList.add('pausada'); });
    raiz.addEventListener('mouseleave', function () { raiz.classList.remove('pausada'); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visivel = e[0].isIntersecting;
        agendar();
      }, { threshold: 0.35 }).observe(raiz);
    }
  }

  /* ── esteira de avaliações: repete os cartões até cobrir a tela e duplica
        tudo, para a animação de -50% recomeçar sem emenda ───────────── */
  function avaliacoes() {
    var trilho = document.querySelector('.depos');
    if (!trilho) return;
    var originais = [].slice.call(trilho.children);
    var largura = function () { return trilho.scrollWidth; };
    var voltas = 0;
    while (largura() < window.innerWidth && voltas++ < 10) {
      originais.forEach(function (c) { trilho.appendChild(c.cloneNode(true)); });
    }
    [].slice.call(trilho.children).forEach(function (c) {
      var copia = c.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      trilho.appendChild(copia);
    });
    /* velocidade constante, qualquer que seja a quantidade de cartões */
    trilho.style.setProperty('--duracao', (trilho.children.length / 2) * 7 + 's');
  }

  /* ── pausa as animações contínuas que estão fora da tela ── */
  function pausarForaDaTela() {
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { it.target.classList.toggle('fora-da-tela', !it.isIntersecting); });
    }, { rootMargin: '100px 0px' });
    document.querySelectorAll('.esteira, .depos-esteira').forEach(function (el) { obs.observe(el); });
  }

  /* ── galeria de antes e depois: ver mais e foto ampliada ── */
  function galeria() {
    var raiz = document.querySelector('.galeria');
    if (!raiz) return;
    var itens = [].slice.call(raiz.querySelectorAll('.galeria__grade li'));
    var mais = raiz.querySelector('.galeria__mais');
    var limite = parseInt(raiz.dataset.mostrar, 10) || 10;
    var tudo = false;

    function visiveis() { return itens.filter(function (li) { return !li.hidden; }); }

    function aplicar() {
      itens.forEach(function (li, i) { li.hidden = !tudo && i >= limite; });
      mais.hidden = tudo || itens.length <= limite;
    }

    mais.querySelector('button').addEventListener('click', function () { tudo = true; aplicar(); });
    aplicar();

    var lupa = document.querySelector('.lupa');
    if (!lupa || typeof lupa.showModal !== 'function') return;
    var foto = lupa.querySelector('.lupa__img');
    var atual = 0;
    function abrir(i) {
      var lista = visiveis();
      atual = (i + lista.length) % lista.length;
      var img = lista[atual].querySelector('img');
      /* a grade usa miniaturas; a versão grande só carrega ao ampliar */
      foto.src = img.dataset.full || img.src; foto.alt = img.alt;
      if (!lupa.open) lupa.showModal();
    }
    itens.forEach(function (li) {
      li.querySelector('button').addEventListener('click', function () { abrir(visiveis().indexOf(li)); });
    });
    lupa.querySelector('.lupa__fechar').addEventListener('click', function () { lupa.close(); });
    lupa.querySelector('.lupa__nav--ant').addEventListener('click', function () { abrir(atual - 1); });
    lupa.querySelector('.lupa__nav--prox').addEventListener('click', function () { abrir(atual + 1); });
    lupa.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') abrir(atual - 1);
      else if (e.key === 'ArrowRight') abrir(atual + 1);
    });
    /* clique fora da foto fecha */
    lupa.addEventListener('click', function (e) { if (e.target === lupa) lupa.close(); });
  }

  /* ══════════════════════════════════════════════════════
     21 · CORTINA QUE REVELA (palavras de destaque)
     Uma faixa dourada passa e descobre o texto, uma vez,
     quando ele aparece na tela.
     ══════════════════════════════════════════════════════ */
  FX.j21 = function (raiz) {
    var alvos = raiz.querySelectorAll('.js-cortina');
    alvos.forEach(function (el) { el.innerHTML = '<span class="js-cortina__txt">' + el.innerHTML + '</span>'; });
    if (semMovimento || !('IntersectionObserver' in window)) {
      alvos.forEach(function (el) { el.classList.add('run'); });
      return;
    }
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (!it.isIntersecting) return;
        it.target.classList.add('run');
        obs.unobserve(it.target);
      });
    }, { threshold: 0.6 });
    alvos.forEach(function (el) { obs.observe(el); });
  };

  /* ── revelar seções ao rolar ─────────────────────────── */
  function revelar() {
    var itens = document.querySelectorAll('.revelar');
    if (semMovimento || !('IntersectionObserver' in window)) {
      itens.forEach(function (el) { el.classList.add('visivel'); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        /* pequeno escalonamento entre irmãos que entram juntos */
        var irmaos = [].slice.call(e.target.parentElement.children).filter(function (c) { return c.classList.contains('revelar'); });
        e.target.style.transitionDelay = Math.min(irmaos.indexOf(e.target), 5) * 80 + 'ms';
        e.target.classList.add('visivel');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    itens.forEach(function (el) { obs.observe(el); });
  }

  /* ── cabeçalho e menu mobile ─────────────────────────── */
  function cabecalho() {
    var topo = document.getElementById('topo');
    var botao = document.getElementById('hamburguer');
    var menu = document.getElementById('menu');

    /* sublinha no menu a seção que está na tela */
    var marcadores = [].slice.call(menu.querySelectorAll('a[href^="#"]:not(.botao)'))
      .map(function (a) { return { link: a, secao: document.getElementById(a.getAttribute('href').slice(1)) }; })
      .filter(function (m) { return m.secao; });
    function marcarSecao() {
      var linha = topo.offsetHeight + 40, atual = null;
      marcadores.forEach(function (m) { if (m.secao.getBoundingClientRect().top <= linha) atual = atual && atual.secao.offsetTop > m.secao.offsetTop ? atual : m; });
      /* chegou ao fim da página: marca a última seção do menu */
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        atual = marcadores.reduce(function (a, m) { return !a || m.secao.offsetTop > a.secao.offsetTop ? m : a; }, null);
      }
      marcadores.forEach(function (m) {
        var sel = m === atual;
        m.link.classList.toggle('ativo', sel);
        if (sel) m.link.setAttribute('aria-current', 'true'); else m.link.removeAttribute('aria-current');
      });
    }

    function aoRolarTopo() { topo.classList.toggle('rolou', window.scrollY > 40); marcarSecao(); }
    window.addEventListener('scroll', aoRolarTopo, { passive: true });
    aoRolarTopo();

    function alternar(abrir) {
      document.body.classList.toggle('menu-aberto', abrir);
      botao.setAttribute('aria-expanded', abrir);
      botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    }
    botao.addEventListener('click', function () { alternar(!document.body.classList.contains('menu-aberto')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { alternar(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') alternar(false); });
  }

  /* ── ligar tudo ──────────────────────────────────────── */
  cabecalho();
  FX.j16(document);
  FX.j17(document);
  FX.j14(document);
  FX.j06(document);
  FX.j12(document);
  FX.j21(document);
  esteira();
  vitrine();
  avaliacoes();
  pausarForaDaTela();
  galeria();
  FX.j12(document.querySelector('.depos') || document);
  revelar();

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
