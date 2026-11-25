/* Del Viale · movimento e interazioni */
(function(){
  'use strict';
  var doc = document, root = doc.documentElement;
  var ANIM = root.classList.contains('anim');
  var $ = function(s, c){ return (c || doc).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };

  /* ---------- testo diviso in parole / lettere ---------- */
  function split(el){
    var chars = el.getAttribute('data-split') === 'c', i = 0;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if (n.nodeType === 3){
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if (!part) return;
            if (/^\s+$/.test(part)){ frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            var wi = doc.createElement('span'); wi.className = 'wi';
            if (chars){
              Array.prototype.forEach.call(part, function(ch){
                var c = doc.createElement('span'); c.className = 'c'; c.textContent = ch;
                c.style.setProperty('--i', i++); wi.appendChild(c);
              });
            } else { wi.textContent = part; wi.style.setProperty('--i', i++); }
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR'){ walk(n); }
      });
    })(el);
  }
  $$('[data-split]').forEach(split);

  /* ---------- contatori (1938) ---------- */
  function conta(el){
    if (!ANIM || el._fatto) return; el._fatto = true;
    var a = +el.getAttribute('data-da'), b = +el.getAttribute('data-conta'), t0 = null, dur = 1900;
    function passo(t){
      if (!t0) t0 = t;
      var p = clamp((t - t0) / dur, 0, 1), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(a + (b - a) * e);
      if (p < 1) requestAnimationFrame(passo);
    }
    el.textContent = a; requestAnimationFrame(passo);
  }

  /* ---------- comparse allo scorrimento ---------- */
  var sel = '[data-r],[data-split],[data-svela],[data-io],[data-conta]';
  if ('IntersectionObserver' in window){
    /* un elemento ritagliato con clip-path non "interseca" mai: si osserva il contenitore */
    var mappa = new Map();
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        (mappa.get(e.target) || []).forEach(function(el){
          el.classList.add('in');
          if (el.hasAttribute('data-conta')) conta(el);
        });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$(sel).forEach(function(el){
      if (el.closest('.soglia')) return;
      var t = el.hasAttribute('data-svela') ? el.parentElement : el;
      if (!mappa.has(t)){ mappa.set(t, []); io.observe(t); }
      mappa.get(t).push(el);
    });
  } else { $$(sel).forEach(function(el){ el.classList.add('in'); }); }

  /* soglia: parte quando i caratteri sono pronti */
  function avviaSoglia(){
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      $('.soglia').classList.add('in');
      $$('.soglia [data-r], .soglia [data-split], .gettone').forEach(function(el){ el.classList.add('in'); });
    }); });
  }
  var avviata = false, avvia = function(){ if (!avviata){ avviata = true; avviaSoglia(); } };
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(avvia);
  setTimeout(avvia, 900);

  /* ---------- vetrina dei dintorni: carica le foto prima di arrivarci ---------- */
  var vimg = $$('.vetrina img[data-src]');
  function caricaVetrina(){ vimg.forEach(function(i){ i.srcset = i.getAttribute('data-srcset'); i.src = i.getAttribute('data-src'); i.removeAttribute('data-src'); }); vimg = []; }
  if (vimg.length){
    if ('IntersectionObserver' in window && getComputedStyle($('.vetrina')).display !== 'none'){
      var ioV = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ caricaVetrina(); ioV.disconnect(); } }, { rootMargin: '150% 0px' });
      ioV.observe($('#dintorni'));
    } else if (getComputedStyle($('.vetrina')).display !== 'none'){ caricaVetrina(); }
  }

  /* ---------- mese corrente nelle tariffe ---------- */
  var mese = new Date().getMonth();
  $$('.biglietto .riga[data-mesi]').forEach(function(r){
    if (r.getAttribute('data-mesi').split(',').indexOf(String(mese)) > -1) r.classList.add('ora');
  });

  /* ---------- menu mobile ---------- */
  var bMenu = $('.b-menu'), menu = $('#menu');
  $$('a', menu).forEach(function(a, i){ var s = $('span', a); if (s) s.style.transitionDelay = (180 + i * 55) + 'ms'; });
  function apriMenu(si){
    menu.classList.toggle('aperto', si);
    bMenu.setAttribute('aria-expanded', si ? 'true' : 'false');
    bMenu.textContent = si ? 'Chiudi' : 'Menu';
    root.style.overflow = si ? 'hidden' : '';
    testata.classList.add('solida'); testata.classList.remove('via');
  }
  bMenu.addEventListener('click', function(){ apriMenu(!menu.classList.contains('aperto')); });
  $$('a', menu).forEach(function(a){ a.addEventListener('click', function(){ apriMenu(false); }); });
  doc.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('aperto')) apriMenu(false); });

  /* ---------- voce di menu attiva ---------- */
  var voci = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in window){
    var ioNav = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        voci.forEach(function(a){ a.classList.toggle('att', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function(s){ ioNav.observe(s); });
  }

  /* ---------- lightbox camere ---------- */
  var lb = $('#lb'), lbImg = $('#lb-img'), lbTit = $('#lb-titolo'), lbConta = $('#lb-conta'), lista = [], k = 0;
  function mostra(){
    lbImg.src = 'img/' + lista[k] + '.jpg';
    lbImg.alt = lbTit.textContent + ', foto ' + (k + 1);
    lbConta.textContent = (k + 1) + ' / ' + lista.length;
    $('.prec', lb).hidden = $('.succ', lb).hidden = lista.length < 2;
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  }
  $$('.vedi').forEach(function(b){
    b.addEventListener('click', function(){
      lista = b.getAttribute('data-foto').split(','); k = 0;
      lbTit.textContent = 'Camera ' + b.getAttribute('data-nome');
      mostra();
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
  });
  function vai(d){ if (lista.length < 2) return; k = (k + d + lista.length) % lista.length; mostra(); }
  $('.prec', lb).addEventListener('click', function(){ vai(-1); });
  $('.succ', lb).addEventListener('click', function(){ vai(1); });
  $('[data-chiudi]', lb).addEventListener('click', function(){ lb.close(); });
  lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('scena')) lb.close(); });
  lb.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft') vai(-1); if (e.key === 'ArrowRight') vai(1); });
  var x0 = null;
  lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function(e){
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) vai(dx < 0 ? 1 : -1);
  });

  /* ---------- motore dello scorrimento ---------- */
  var testata = $('#testata'), barra = $('.avanza'), barraM = $('#barra-m');
  var nastro = $$('.nastro span');
  var par = $$('[data-par]');
  var apertura = $('.apertura'), cornice = apertura && $('.cornice', apertura), fissoAp = apertura && $('.fisso', apertura);
  var camere = $('.camere'), esterna = $('.pista-esterna'), pista = $('.pista'), nPista = $('#n-pista');
  var fermateBox = $('.fermate'), fermate = $$('.fermata'), binario = $('.binario i');
  var vetrina = $$('.vetrina figure'), targa = $('#targa');
  var varco = $('.varco'), scritta = $('.varco .scritta');
  var vh = innerHeight, vw = innerWidth, lastY = scrollY, inCorsa = false, pin = false, corsa = 0, attiva = -1, skewT;

  function misura(){
    vh = innerHeight; vw = innerWidth;
    if (vimg.length && vw > 960 && $('#dintorni').getBoundingClientRect().top < vh * 2.5) caricaVetrina();
    pin = ANIM && vw >= 1061;
    camere.classList.toggle('pin', pin);
    if (pin){
      corsa = Math.max(0, pista.scrollWidth - vw);
      esterna.style.setProperty('--h', (corsa + vh) + 'px');
    } else {
      esterna.style.removeProperty('--h'); pista.style.transform = '';
    }
    aggiorna();
  }

  function aggiorna(){
    inCorsa = false;
    var y = scrollY, alto = root.scrollHeight - vh;
    barra.style.transform = 'scaleX(' + (alto > 0 ? y / alto : 0) + ')';

    /* testata */
    var menuAperto = menu.classList.contains('aperto');
    testata.classList.toggle('solida', y > 40 || menuAperto);
    if (!menuAperto) testata.classList.toggle('via', y > lastY && y > vh * 0.9);
    if (barraM) barraM.classList.toggle('su', y > vh * 0.7);

    /* nastro: si inclina con la velocità */
    if (ANIM){
      var v = clamp((y - lastY) * 0.25, -10, 10);
      nastro.forEach(function(s){ s.style.transform = 'skewX(' + (-v) + 'deg)'; });
      clearTimeout(skewT);
      skewT = setTimeout(function(){ nastro.forEach(function(s){ s.style.transform = ''; }); }, 140);
    }
    lastY = y;
    if (!ANIM) { lampade(); return; }

    /* parallasse */
    par.forEach(function(el){
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var f = +el.getAttribute('data-par');
      el.style.translate = '0 ' + ((r.top + r.height / 2 - vh / 2) * -f).toFixed(1) + 'px';
    });

    /* giardino: la finestra si apre */
    if (apertura){
      var ra = apertura.getBoundingClientRect();
      if (ra.bottom > 0 && ra.top < vh){
        var p = clamp(-ra.top / (ra.height - vh), 0, 1), e = 1 - Math.pow(1 - p, 2);
        var lat = vw < 760 ? 7 : 22;
        cornice.style.setProperty('--i', (14 * (1 - e)).toFixed(2) + '%');
        cornice.style.setProperty('--j', (lat * (1 - e)).toFixed(2) + '%');
        cornice.style.setProperty('--z', (1.18 - 0.18 * e).toFixed(3));
        fissoAp.style.setProperty('--o', clamp((p - 0.4) / 0.35, 0, 1).toFixed(3));
      }
    }

    /* camere: pista orizzontale */
    if (pin){
      var re = esterna.getBoundingClientRect();
      var pp = clamp(-re.top / (re.height - vh), 0, 1);
      pista.style.transform = 'translate3d(' + (-pp * corsa).toFixed(1) + 'px,0,0)';
      if (nPista) nPista.textContent = '0' + (1 + Math.round(pp * 4));
    }

    /* varco: la scritta scorre */
    if (varco){
      var rv = varco.getBoundingClientRect();
      if (rv.bottom > 0 && rv.top < vh){
        var pv = (vh - rv.top) / (vh + rv.height);
        scritta.style.setProperty('--x', (4 - pv * 42).toFixed(2) + '%');
      }
    }
    lampade();
  }

  /* dintorni: le lampade si accendono */
  function lampade(){
    if (!fermateBox) return;
    var rf = fermateBox.getBoundingClientRect(), linea = vh * 0.55;
    if (binario) binario.style.setProperty('--p', clamp((linea - rf.top) / rf.height, 0, 1).toFixed(4));
    var idx = 0;
    fermate.forEach(function(f, i){ var t = f.getBoundingClientRect().top; if (t < linea) idx = i; f.classList.toggle('accesa', t < linea); });
    if (rf.top > linea) idx = 0;
    if (idx !== attiva){
      attiva = idx;
      vetrina.forEach(function(fig, i){
        fig.classList.toggle('vista', i === idx);
        fig.classList.toggle('uscita', i < idx);
        fig.style.zIndex = i === idx ? 2 : 1;
      });
      if (targa){
        var h = $('h3', fermate[idx]).textContent.split(' · ')[0];
        targa.textContent = '0' + (idx + 1) + ' · ' + h;
      }
    }
  }

  addEventListener('scroll', function(){ if (!inCorsa){ inCorsa = true; requestAnimationFrame(aggiorna); } }, { passive: true });
  var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(misura, 120); });
  addEventListener('load', misura);
  misura();

  /* link alle camere quando la pista è orizzontale */
  $$('a[href^="#camera-"]').forEach(function(a){
    a.addEventListener('click', function(e){
      if (!pin) return;
      var card = doc.getElementById(a.getAttribute('href').slice(1).replace(/^#/, ''));
      if (!card) return;
      e.preventDefault();
      var base = esterna.getBoundingClientRect().top + scrollY;
      var off = clamp(card.offsetLeft - (vw - card.offsetWidth) / 2, 0, corsa);
      scrollTo({ top: base + (corsa ? off / corsa : 0) * (esterna.offsetHeight - vh), behavior: 'smooth' });
    });
  });
})();
