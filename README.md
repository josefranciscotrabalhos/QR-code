# Gerador de QR Code

Site simples para gerar QR Code de qualquer link, com cópia da imagem e download em **.PNG**, **.JPEG** ou **.PDF**.

## Como usar
Abra o `index.html` no navegador (ou publique a pasta no GitHub Pages, Netlify, etc.).
Não precisa de instalação: tudo roda no navegador.

## Estrutura
- `index.html`: estrutura da página
- `style.css`: visual (preto, vermelho e verde, fonte Creato Display, responsivo)
- `script.js`: geração do QR Code, cópia, avisos e downloads
- `libs/`: bibliotecas locais ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) e [jsPDF](https://github.com/parallax/jsPDF), licença MIT)

## Fonte
A fonte Creato Display é carregada de `fonts.cdnfonts.com`. Se quiser hospedá-la junto ao site,
crie a pasta `fonts/` com `CreatoDisplay-Regular.otf` e `CreatoDisplay-Bold.otf`.
