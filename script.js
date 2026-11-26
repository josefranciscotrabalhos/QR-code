(function () {
  'use strict';

  const form = document.getElementById('form-qr');
  const campo = document.getElementById('campo-link');
  const erro = document.getElementById('erro-link');
  const btnColar = document.getElementById('btn-colar');
  const resultado = document.getElementById('resultado');
  const resultadoLink = document.getElementById('resultado-link');
  const canvas = document.getElementById('canvas-qr');
  const btnCopiar = document.getElementById('btn-copiar');
  const btnBaixar = document.getElementById('btn-baixar');
  const modal = document.getElementById('modal-baixar');
  const avisos = document.getElementById('avisos');

  const TAMANHO_EXPORT = 1024; // px da imagem exportada
  let linkAtual = '';
  let ultimoFoco = null;

  document.getElementById('ano').textContent = new Date().getFullYear();

  /* ---------- Avisos (toast) ---------- */
  const ICONE_OK = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
  const ICONE_ERRO = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';

  function aviso(mensagem, tipo = 'ok') {
    const el = document.createElement('div');
    el.className = 'aviso' + (tipo === 'erro' ? ' aviso--erro' : '');
    el.innerHTML = (tipo === 'erro' ? ICONE_ERRO : ICONE_OK) + '<span></span>';
    el.querySelector('span').textContent = mensagem;
    avisos.appendChild(el);
    setTimeout(() => {
      el.classList.add('saindo');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 2600);
  }

  /* ---------- Validação do link ---------- */
  function normalizarLink(valor) {
    let texto = valor.trim();
    if (!texto) return { erro: 'Cole ou digite um link.' };
    if (!/^[a-z][a-z0-9+.-]*:/i.test(texto)) texto = 'https://' + texto;
    try {
      const url = new URL(texto);
      if (/^https?:$/.test(url.protocol) && !url.hostname.includes('.') && url.hostname !== 'localhost') {
        return { erro: 'Esse link não parece válido. Ex.: https://exemplo.com' };
      }
      return { link: texto };
    } catch (e) {
      return { erro: 'Esse link não parece válido. Ex.: https://exemplo.com' };
    }
  }

  function mostrarErro(msg) {
    erro.textContent = msg;
    campo.classList.toggle('erro', !!msg);
  }

  campo.addEventListener('input', () => mostrarErro(''));

  /* ---------- Colar ---------- */
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    btnColar.hidden = true;
  }
  btnColar.addEventListener('click', async () => {
    try {
      const texto = await navigator.clipboard.readText();
      campo.value = texto.trim();
      mostrarErro('');
      campo.focus();
    } catch (e) {
      aviso('Não foi possível colar. Use Ctrl+V.', 'erro');
    }
  });

  /* ---------- Desenho do QR ---------- */
  function desenharQR(alvo, texto, tamanho, margemModulos = 2) {
    const qr = qrcode(0, 'M');
    qr.addData(unescape(encodeURIComponent(texto)));
    qr.make();
    const modulos = qr.getModuleCount();
    const total = modulos + margemModulos * 2;
    const escala = Math.floor(tamanho / total) || 1;
    const lado = escala * total;

    alvo.width = lado;
    alvo.height = lado;
    const ctx = alvo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = '#000000';
    for (let l = 0; l < modulos; l++) {
      for (let c = 0; c < modulos; c++) {
        if (qr.isDark(l, c)) {
          ctx.fillRect((c + margemModulos) * escala, (l + margemModulos) * escala, escala, escala);
        }
      }
    }
    return alvo;
  }

  function canvasExport() {
    return desenharQR(document.createElement('canvas'), linkAtual, TAMANHO_EXPORT, 4);
  }

  /* ---------- Gerar ---------- */
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const { link, erro: msg } = normalizarLink(campo.value);
    if (msg) {
      mostrarErro(msg);
      campo.focus();
      return;
    }
    if (typeof qrcode === 'undefined') {
      aviso('Erro ao carregar o gerador. Verifique sua conexão.', 'erro');
      return;
    }
    try {
      desenharQR(canvas, link, 480, 0);
    } catch (e) {
      aviso('Link muito longo para gerar um QR Code.', 'erro');
      return;
    }
    linkAtual = link;
    resultadoLink.textContent = link;
    resultado.hidden = false;
    aviso('QR Code criado');
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ---------- Copiar ---------- */
  btnCopiar.addEventListener('click', async () => {
    if (!linkAtual) return;
    try {
      if (!window.ClipboardItem || !navigator.clipboard || !navigator.clipboard.write) throw new Error('sem suporte');
      const blob = await new Promise((res) => canvasExport().toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      aviso('QR Code copiado');
    } catch (e) {
      try {
        await navigator.clipboard.writeText(linkAtual);
        aviso('Seu navegador não copia imagens. Link copiado.');
      } catch (e2) {
        aviso('Não foi possível copiar.', 'erro');
      }
    }
  });

  /* ---------- Modal ---------- */
  function abrirModal() {
    ultimoFoco = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.opcao').focus();
  }
  function fecharModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }

  btnBaixar.addEventListener('click', abrirModal);
  modal.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-fechar]')) fecharModal();
  });
  document.addEventListener('keydown', (ev) => {
    if (modal.hidden) return;
    if (ev.key === 'Escape') fecharModal();
    if (ev.key === 'Tab') {
      const focaveis = modal.querySelectorAll('button');
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    }
  });

  /* ---------- Download ---------- */
  function nomeArquivo() {
    let base = 'qrcode';
    try { base += '-' + new URL(linkAtual).hostname.replace(/^www\./, '').replace(/[^a-z0-9.-]/gi, ''); } catch (e) {}
    return base;
  }

  function baixarURL(url, nome) {
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function baixar(formato) {
    const c = canvasExport();
    const nome = nomeArquivo();
    if (formato === 'png') {
      baixarURL(c.toDataURL('image/png'), nome + '.png');
    } else if (formato === 'jpeg') {
      baixarURL(c.toDataURL('image/jpeg', 0.95), nome + '.jpeg');
    } else if (formato === 'pdf') {
      if (!window.jspdf) throw new Error('jsPDF indisponível');
      const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      const largura = doc.internal.pageSize.getWidth();
      const lado = 120;
      const x = (largura - lado) / 2;
      doc.addImage(c.toDataURL('image/png'), 'PNG', x, 40, lado, lado);
      doc.setFontSize(10);
      const linhas = doc.splitTextToSize(linkAtual, largura - 40);
      doc.text(linhas, largura / 2, 40 + lado + 12, { align: 'center' });
      doc.save(nome + '.pdf');
    }
  }

  modal.querySelectorAll('[data-formato]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const formato = btn.dataset.formato;
      try {
        baixar(formato);
        fecharModal();
        aviso('Download em .' + formato.toUpperCase() + ' iniciado');
      } catch (e) {
        aviso('Não foi possível baixar. Tente novamente.', 'erro');
      }
    });
  });
})();
