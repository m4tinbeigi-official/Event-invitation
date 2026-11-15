/* ============================================================
   دعوت‌نامه‌ساز | موتور رندر، قالب‌ها، خروجی و ویرایشگر
   بدون وابستگی بیرونی. همه پردازش تصویر در مرورگر کاربر انجام می‌شود.
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const t = (key, vars) => (window.I18N ? window.I18N.t(key, vars) : key);
  const num = (value) => {
    const text = String(value);
    if (!window.I18N || window.I18N.lang !== 'fa') return text;
    return text.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]).replace(/\./g, '٫');
  };

  const DEFAULT_IMAGE = 'default-image-yektanet.jpg';
  const MAX_FILE_BYTES = 15 * 1024 * 1024;
  const MAX_MEGAPIXELS = 80;
  const MAX_EXPORT_PX = 4200;
  const PREVIEW_PX = 1600;
  const TEMPLATE_W = 1080;
  const TEMPLATE_H = 1440;
  const STORE_KEY = 'invitation-studio-v2';
  const MAX_EXTRAS = 3;

  const FAMILIES = {
    Vazirmatn: '"Vazirmatn", sans-serif',
    Lalezar: '"Lalezar", "Vazirmatn", sans-serif',
    'Aref Ruqaa': '"Aref Ruqaa", "Vazirmatn", serif',
    'Markazi Text': '"Markazi Text", "Vazirmatn", serif',
    Tahoma: 'Tahoma, sans-serif',
    Arial: 'Arial, sans-serif',
    'Times New Roman': '"Times New Roman", serif',
  };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ------------------------- قالب‌های آماده ------------------------- */

  const TEMPLATES = [
    { id: 'emerald', swatch: 'linear-gradient(135deg,#07241c,#0e5c46 60%,#0a3d2e)' },
    { id: 'noir', swatch: 'linear-gradient(135deg,#141414,#1c1a16 60%,#0d0d0d)' },
    { id: 'kraft', swatch: 'linear-gradient(135deg,#e5d5b6,#d3bd95 60%,#c2a97c)' },
    { id: 'blush', swatch: 'linear-gradient(135deg,#fdeef1,#f6d6de 60%,#efc3ce)' },
    { id: 'ivory', swatch: 'linear-gradient(135deg,#fdfbf6,#f5efe3 60%,#ece3d2)' },
    { id: 'night', swatch: 'linear-gradient(135deg,#060a18,#101a3a 60%,#1b2751)' },
    { id: 'terra', swatch: 'linear-gradient(135deg,#b95f41,#98452c 60%,#7d3421)' },
    { id: 'mono', swatch: 'linear-gradient(135deg,#17191e,#23262c 60%,#2d3138)' },
  ];

  // شبه‌تصادفی با دانه ثابت تا قالب در هر رندر یکسان بماند
  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a += 0x6d2b79f5;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function frame(ctx, w, h, color, inset, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.restore();
  }

  function arabesque(ctx, w, h, color, step, radius) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.8, w / 900);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function vignette(ctx, w, h, strength) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.78);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  const TEMPLATE_PAINTERS = {
    emerald(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#07241c');
      g.addColorStop(0.55, '#0e5c46');
      g.addColorStop(1, '#093a2b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      arabesque(ctx, w, h, 'rgba(200,232,218,0.07)', w / 6, w / 26);
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.34, 0, w * 0.5, h * 0.34, w * 0.7);
      glow.addColorStop(0, 'rgba(255,255,255,0.12)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, 'rgba(196,166,94,0.85)', w * 0.045, Math.max(2, w / 360));
      frame(ctx, w, h, 'rgba(196,166,94,0.4)', w * 0.062, Math.max(1, w / 1080));
      vignette(ctx, w, h, 0.3);
    },

    noir(ctx, w, h) {
      ctx.fillStyle = '#0d0d0e';
      ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.8);
      glow.addColorStop(0, 'rgba(120,95,45,0.28)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(198,164,92,0.9)';
      ctx.lineWidth = Math.max(2, w / 430);
      ctx.strokeRect(w * 0.05, h * 0.04, w * 0.9, h * 0.92);
      ctx.lineWidth = Math.max(1, w / 1080);
      ctx.strokeStyle = 'rgba(198,164,92,0.45)';
      ctx.strokeRect(w * 0.072, h * 0.058, w * 0.856, h * 0.884);

      const corners = [
        [w * 0.05, h * 0.04, 1, 1],
        [w * 0.95, h * 0.04, -1, 1],
        [w * 0.05, h * 0.96, 1, -1],
        [w * 0.95, h * 0.96, -1, -1],
      ];
      ctx.strokeStyle = 'rgba(198,164,92,0.75)';
      ctx.lineWidth = Math.max(1.5, w / 540);
      for (const [cx, cy, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + sy * h * 0.075);
        ctx.quadraticCurveTo(cx, cy, cx + sx * w * 0.06, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + sx * w * 0.032, cy + sy * h * 0.028, w * 0.008, 0, Math.PI * 2);
        ctx.stroke();
      }
      vignette(ctx, w, h, 0.35);
    },

    kraft(ctx, w, h) {
      ctx.fillStyle = '#d8c4a0';
      ctx.fillRect(0, 0, w, h);
      const random = seeded(7);
      ctx.strokeStyle = 'rgba(120,95,60,0.16)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 220; i++) {
        const x = random() * w;
        const y = random() * h;
        const len = (6 + random() * 26) * (w / 1080);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + (random() - 0.5) * 4);
        ctx.stroke();
      }
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(90,70,45,${0.04 + random() * 0.1})`;
        const size = Math.max(1, w / 720);
        ctx.fillRect(random() * w, random() * h, size, size);
      }
      frame(ctx, w, h, 'rgba(90,70,45,0.5)', w * 0.055, Math.max(1.5, w / 540));
      vignette(ctx, w, h, 0.22);
    },

    blush(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fdeef2');
      g.addColorStop(1, '#f2ccd8');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const sun = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.42);
      sun.addColorStop(0, 'rgba(255,255,255,0.85)');
      sun.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(180,110,130,0.35)';
      ctx.lineWidth = Math.max(1.5, w / 540);
      ctx.strokeRect(w * 0.06, h * 0.05, w * 0.88, h * 0.9);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, w * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,110,130,0.22)';
      ctx.lineWidth = Math.max(1, w / 720);
      ctx.stroke();
    },

    ivory(ctx, w, h) {
      ctx.fillStyle = '#fbf8f1';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, 'rgba(228,218,198,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, 'rgba(60,55,45,0.55)', w * 0.06, Math.max(1.5, w / 540));
      frame(ctx, w, h, 'rgba(60,55,45,0.22)', w * 0.075, Math.max(1, w / 1080));
      ctx.fillStyle = 'rgba(60,55,45,0.5)';
      const dot = w * 0.006;
      for (const [x, y] of [[w * 0.06, h * 0.055], [w * 0.94, h * 0.055], [w * 0.06, h * 0.945], [w * 0.94, h * 0.945]]) {
        ctx.beginPath();
        ctx.arc(x, y, dot, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    night(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#050912');
      g.addColorStop(1, '#14203f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const random = seeded(21);
      for (let i = 0; i < 260; i++) {
        const r = (random() * 1.8 + 0.4) * (w / 1080);
        ctx.fillStyle = `rgba(255,255,255,${0.15 + random() * 0.7})`;
        ctx.beginPath();
        ctx.arc(random() * w, random() * h * 0.92, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.fillStyle = 'rgba(240,236,220,0.9)';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.16, w * 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(w * 0.755, h * 0.145, w * 0.068, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      frame(ctx, w, h, 'rgba(180,200,255,0.22)', w * 0.05, Math.max(1, w / 900));
    },

    terra(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#b95f41');
      g.addColorStop(1, '#7d3421');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(247,233,214,0.14)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(247,233,214,0.35)';
      ctx.lineWidth = Math.max(1.5, w / 540);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      const random = seeded(33);
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + random() * 0.06})`;
        const size = Math.max(1, w / 540);
        ctx.fillRect(random() * w, random() * h, size, size);
      }
      vignette(ctx, w, h, 0.3);
    },

    mono(ctx, w, h) {
      ctx.fillStyle = '#191b20';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.055)';
      ctx.lineWidth = Math.max(1, w / 1080);
      for (let y = h * 0.1; y < h * 0.9; y += h / 26) {
        ctx.beginPath();
        ctx.moveTo(w * 0.08, y);
        ctx.lineTo(w * 0.92, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(w * 0.08, h * 0.16, w * 0.18, Math.max(4, w / 180));
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(w * 0.08, h * 0.83, w * 0.3, Math.max(2, w / 540));
    },
  };

  function drawTemplate(ctx, w, h, id) {
    const painter = TEMPLATE_PAINTERS[id] || TEMPLATE_PAINTERS.emerald;
    painter(ctx, w, h);
  }

  /* ------------------------- وضعیت ------------------------- */

  const defaults = () => ({
    bgKind: 'template',
    bgTemplate: 'emerald',
    maleNames: 'آرش نیک‌نام\nسامان راد\nکیوان مهرابی',
    femaleNames: 'نازنین آذر\nمریم صبوری',
    prefixMode: 'auto',
    malePrefix: 'جناب آقای',
    femalePrefix: 'سرکار خانم',
    title: '',
    note: '',
    fontFamily: 'Vazirmatn',
    fontSize: 56,
    color: '#f7f1e3',
    outline: false,
    outlineWidth: 2,
    maxWidth: 78,
    lineHeight: 1.4,
    align: 'center',
    posX: 50,
    posY: 58,
    format: 'jpg',
    quality: 92,
    zip: true,
    extras: [],
    lang: 'fa',
  });

  let S = defaults();

  const state = {
    image: null,
    imageName: '',
    objectUrl: null,
    names: [],
    active: 0,
    hits: [],
    hover: null,
    drag: null,
    renderQueued: false,
    history: { stack: [], index: -1, timer: null },
  };

  const surfaceSize = () => {
    if (S.bgKind === 'image' && state.image) {
      return { w: state.image.naturalWidth, h: state.image.naturalHeight };
    }
    return { w: TEMPLATE_W, h: TEMPLATE_H };
  };

  function paintBackground(ctx, w, h) {
    if (S.bgKind === 'image' && state.image) {
      ctx.drawImage(state.image, 0, 0, w, h);
    } else {
      drawTemplate(ctx, w, h, S.bgTemplate);
    }
  }

  /* ------------------------- نام‌ها ------------------------- */

  function parseList(text) {
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function syncNames() {
    const males = parseList(S.maleNames).map((name) => ({ name, gender: 'm' }));
    const females = parseList(S.femaleNames).map((name) => ({ name, gender: 'f' }));
    state.names = [...males, ...females];
    state.active = clamp(state.active, 0, Math.max(0, state.names.length - 1));

    const chips = $('#chips');
    chips.innerHTML = '';
    if (!state.names.length) {
      const empty = document.createElement('span');
      empty.className = 'chips-empty';
      empty.textContent = t('name.none');
      chips.appendChild(empty);
    }
    state.names.forEach((item, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = item.name;
      chip.setAttribute('aria-pressed', String(index === state.active));
      chip.addEventListener('click', () => selectName(index));
      chips.appendChild(chip);
    });

    const count = state.names.length;
    $('#nameCount').textContent = count ? t('name.count', { n: num(count) }) : t('name.none');
    $('#downloadAll').textContent = t('btn.all', { n: num(count) });
    $('#prevName').disabled = state.active <= 0;
    $('#nextName').disabled = state.active >= count - 1;

    const activeChip = chips.children[state.active];
    if (activeChip && activeChip.scrollIntoView) activeChip.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function selectName(index) {
    state.active = clamp(index, 0, Math.max(0, state.names.length - 1));
    const chips = $$('.chip', $('#chips'));
    chips.forEach((chip, i) => chip.setAttribute('aria-pressed', String(i === state.active)));
    $('#prevName').disabled = state.active <= 0;
    $('#nextName').disabled = state.active >= state.names.length - 1;
    const activeChip = chips[state.active];
    if (activeChip && activeChip.scrollIntoView) activeChip.scrollIntoView({ block: 'nearest', inline: 'center' });
    render();
  }

  /* ------------------------- چیدمان متن ------------------------- */

  function mainRows(item) {
    const rows = [];
    const title = S.title.trim();
    const note = S.note.trim();
    if (title) rows.push({ text: title, size: S.fontSize * 0.62, weight: 700 });
    if (item) {
      const prefix = S.prefixMode === 'auto'
        ? (item.gender === 'f' ? S.femalePrefix : S.malePrefix).trim()
        : '';
      const text = prefix ? `${prefix} ${item.name}` : item.name;
      if (text.trim()) rows.push({ text, size: S.fontSize, weight: 700 });
    }
    if (note) rows.push({ text: note, size: S.fontSize * 0.5, weight: 400 });
    return rows;
  }

  function wrapText(ctx, text, maxWidth) {
    if (!text) return [];
    if (ctx.measureText(text).width <= maxWidth) return [text];
    const words = text.split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) current = candidate;
      else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    return lines;
  }

  function fitRows(ctx, rows, maxWidth, scale) {
    let factor = 1;
    let lines = [];
    for (let attempt = 0; attempt < 28; attempt++) {
      lines = [];
      let widest = 0;
      for (const row of rows) {
        const size = Math.max(6, row.size * scale * factor);
        ctx.font = `${row.weight} ${size}px ${FAMILIES[S.fontFamily]}`;
        for (const line of wrapText(ctx, row.text, maxWidth)) {
          widest = Math.max(widest, ctx.measureText(line).width);
          lines.push({ text: line, size, weight: row.weight });
        }
      }
      if (widest <= maxWidth + 0.5 || factor < 0.18) break;
      factor *= clamp(maxWidth / widest, 0.75, 0.98);
    }
    return lines;
  }

  function relativeLuminance(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  function drawRows(ctx, width, height, rows, anchorX, anchorY, scale) {
    if (!rows.length) return null;
    const maxWidth = (width * S.maxWidth) / 100;
    const lines = fitRows(ctx, rows, maxWidth, scale);
    if (!lines.length) return null;

    const lineHeights = lines.map((line) => line.size * S.lineHeight);
    const totalHeight = lineHeights.reduce((sum, h) => sum + h, 0);
    const top = anchorY - totalHeight / 2;
    const strokeColor = relativeLuminance(S.color) > 0.45 ? 'rgba(12,14,18,0.78)' : 'rgba(255,255,255,0.9)';

    ctx.save();
    ctx.textAlign = S.align;
    ctx.textBaseline = 'middle';
    ctx.direction = window.I18N && !window.I18N.isRtl() ? 'ltr' : 'rtl';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.fillStyle = S.color;

    let cursorY = top;
    let minX = Infinity;
    let maxX = -Infinity;

    lines.forEach((line, index) => {
      const centerY = cursorY + lineHeights[index] / 2;
      ctx.font = `${line.weight} ${line.size}px ${FAMILIES[S.fontFamily]}`;
      if (S.outline) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1, S.outlineWidth * (line.size / S.fontSize) * scale * 1.6);
        ctx.strokeText(line.text, anchorX, centerY);
      }
      ctx.fillText(line.text, anchorX, centerY);

      const w = ctx.measureText(line.text).width;
      let startX;
      if (S.align === 'center') startX = anchorX - w / 2;
      else if (S.align === 'right') startX = anchorX - w;
      else startX = anchorX;
      minX = Math.min(minX, startX);
      maxX = Math.max(maxX, startX + w);
      cursorY += lineHeights[index];
    });
    ctx.restore();

    const pad = Math.max(10, S.fontSize * 0.35);
    return { x0: minX - pad, y0: top - pad, x1: maxX + pad, y1: top + totalHeight + pad };
  }

  function extraRows(extra) {
    const text = (extra.text || '').trim();
    return text ? [{ text, size: Math.max(8, extra.size), weight: 400 }] : [];
  }

  /* ------------------------- رندر ------------------------- */

  function render() {
    // در تب پس‌زمینه requestAnimationFrame اجرا نمی‌شود؛ همان لحظه رسم می‌کنیم
    if (document.hidden) { paint(); return; }
    if (state.renderQueued) return;
    state.renderQueued = true;
    requestAnimationFrame(() => {
      state.renderQueued = false;
      paint();
    });
  }

  function paint() {
    const canvas = $('#canvas');
    const { w, h } = surfaceSize();
    const scale = Math.min(1, PREVIEW_PX / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    paintBackground(ctx, cw, ch);

    const hits = [];
    const item = state.names[state.active];
    const mainBox = drawRows(ctx, cw, ch, mainRows(item), (cw * S.posX) / 100, (ch * S.posY) / 100, scale);
    if (mainBox) hits.push({ kind: 'main', id: 'main', box: mainBox });

    for (const extra of S.extras) {
      const box = drawRows(ctx, cw, ch, extraRows(extra), (cw * extra.x) / 100, (ch * extra.y) / 100, scale);
      if (box) hits.push({ kind: 'extra', id: extra.id, box });
    }
    state.hits = hits;

    const hovered = state.hover && hits.find((hit) => hit.kind === state.hover.kind && hit.id === state.hover.id);
    if (hovered) {
      const b = hovered.box;
      ctx.save();
      ctx.setLineDash([scale * 10, scale * 8]);
      ctx.lineWidth = Math.max(1, 1.5 * scale * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.strokeStyle = 'rgba(14,92,70,0.9)';
      ctx.setLineDash([scale * 6, scale * 10]);
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.restore();
    }

    canvas.setAttribute('aria-label', item ? `${t('a11y.canvas')} ${item.name}` : t('a11y.canvas'));
    const badge = $('#stageBadge');
    badge.hidden = false;
    badge.textContent = `${w} × ${h}`;
    $('#stageTip').hidden = !mainBox;
    $('#undo').disabled = state.history.index <= 0;
    $('#redo').disabled = state.history.index >= state.history.stack.length - 1;
  }

  /* ------------------------- جای‌گذاری هوشمند ------------------------- */

  function quietArea() {
    const { w, h } = surfaceSize();
    const sw = 108;
    const sh = Math.max(1, Math.round((sw * h) / w));
    const probe = document.createElement('canvas');
    probe.width = sw;
    probe.height = sh;
    const ctx = probe.getContext('2d');
    paintBackground(ctx, sw, sh);
    const data = ctx.getImageData(0, 0, sw, sh).data;

    const cols = 6;
    const rows = 8;
    let best = null;

    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const x0 = Math.floor((rx * sw) / cols);
        const x1 = Math.floor(((rx + 1) * sw) / cols);
        const y0 = Math.floor((ry * sh) / rows);
        const y1 = Math.floor(((ry + 1) * sh) / rows);

        let sum = 0;
        let sumSq = 0;
        let count = 0;
        for (let y = y0; y < y1; y += 2) {
          for (let x = x0; x < x1; x += 2) {
            const i = (y * sw + x) * 4;
            const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
            sum += lum;
            sumSq += lum * lum;
            count++;
          }
        }
        if (!count) continue;
        const mean = sum / count;
        const variance = Math.max(0, sumSq / count - mean * mean);
        const cx = (x0 + x1) / 2 / sw;
        const cy = (y0 + y1) / 2 / sh;
        const edgePenalty = Math.max(0, 0.22 - Math.min(cx, 1 - cx)) * 4
          + Math.max(0, 0.16 - Math.min(cy, 1 - cy)) * 4;
        const centreBias = Math.hypot(cx - 0.5, cy - 0.42) * 0.18;
        const score = variance * 26 + edgePenalty + centreBias;
        if (!best || score < best.score) best = { score, cx, cy, mean, variance };
      }
    }
    return best;
  }

  function smartPlace() {
    const spot = quietArea();
    if (!spot) return;
    S.posX = Math.round(clamp(spot.cx * 100, 12, 88) * 2) / 2;
    S.posY = Math.round(clamp(spot.cy * 100, 10, 90) * 2) / 2;
    const textIsLight = relativeLuminance(S.color) > 0.45;
    const backgroundIsLight = spot.mean > 0.5;
    if (textIsLight === backgroundIsLight) {
      S.color = backgroundIsLight ? '#14161b' : '#f7f1e3';
    }
    S.outline = spot.variance > 0.02;
    applyUI();
    render();
    persist();
    commit();
    toast(t('toast.smart'));
  }

  /* ------------------------- خروجی ------------------------- */

  function slugify(text) {
    return text.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'invitation';
  }

  function fileName(item, index) {
    const base = item ? slugify(item.name) : 'invitation';
    return `invitation-${String(index + 1).padStart(2, '0')}-${base}.${S.format}`;
  }

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const list = ['Vazirmatn', 'Lalezar', 'Aref Ruqaa', 'Markazi Text']
      .flatMap((family) => [`400 40px "${family}"`, `700 40px "${family}"`]);
    try {
      await Promise.all(list.map((font) => document.fonts.load(font)));
    } catch (error) {
      console.warn('font load issue', error);
    }
  }

  function drawCard(ctx, w, h, item, scale) {
    paintBackground(ctx, w, h);
    const mainBox = drawRows(ctx, w, h, mainRows(item), (w * S.posX) / 100, (h * S.posY) / 100, scale);
    for (const extra of S.extras) {
      drawRows(ctx, w, h, extraRows(extra), (w * extra.x) / 100, (h * extra.y) / 100, scale);
    }
    return mainBox;
  }

  async function renderCard(item, index, format = S.format) {
    await ensureFonts();
    const { w, h } = surfaceSize();
    const scale = Math.min(1, MAX_EXPORT_PX / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    drawCard(ctx, canvas.width, canvas.height, item, scale);

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('toBlob failed'))), mime, format === 'png' ? undefined : S.quality / 100);
    });
    return { blob, name: fileName(item, index) };
  }

  /* ---------- ZIP ---------- */

  let crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crcTable[i] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeZip(files) {
    const encoder = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    for (const file of files) {
      const nameBytes = encoder.encode(file.name);
      const crc = crc32(file.data);
      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, file.data.length, true);
      lv.setUint32(22, file.data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30);
      parts.push(local, file.data);

      const entry = new Uint8Array(46 + nameBytes.length);
      const ev = new DataView(entry.buffer);
      ev.setUint32(0, 0x02014b50, true);
      ev.setUint16(4, 20, true);
      ev.setUint16(6, 20, true);
      ev.setUint16(8, 0x0800, true);
      ev.setUint32(16, crc, true);
      ev.setUint32(20, file.data.length, true);
      ev.setUint32(24, file.data.length, true);
      ev.setUint16(28, nameBytes.length, true);
      ev.setUint32(42, offset, true);
      entry.set(nameBytes, 46);
      central.push(entry);
      offset += local.length + file.data.length;
    }
    const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }

  /* ---------- PDF ---------- */

  function buildPdf(pageW, pageH, jpeg, imgW, imgH, content) {
    const encoder = new TextEncoder();
    const chunks = [];
    let length = 0;
    const offsets = [];
    const push = (data) => {
      const bytes = typeof data === 'string' ? encoder.encode(data) : data;
      chunks.push(bytes);
      length += bytes.length;
    };

    push('%PDF-1.4\n');
    offsets[1] = length;
    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offsets[2] = length;
    push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    offsets[3] = length;
    push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    offsets[4] = length;
    push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg);
    push('\nendstream\nendobj\n');
    offsets[5] = length;
    const stream = encoder.encode(content);
    push(`5 0 obj\n<< /Length ${stream.length} >>\nstream\n`);
    push(stream);
    push('\nendstream\nendobj\n');

    const xrefStart = length;
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    push(xref);
    push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  async function cardJpeg(item, index) {
    const card = await renderCard(item, index, 'jpg');
    const bytes = new Uint8Array(await card.blob.arrayBuffer());
    const { w, h } = surfaceSize();
    return { bytes, w, h };
  }

  async function exportPdfSheet() {
    const item = state.names[state.active];
    const button = $('#pdfSheet');
    button.disabled = true;
    try {
      showProgress(0.3, t('pdf.sheet'));
      const { bytes, w, h } = await cardJpeg(item, state.active);
      const pageW = 595.28;
      const pageH = 841.89;
      const margin = 20;
      const gap = 14;
      const cellW = (pageW - margin * 2 - gap) / 2;
      const cellH = (pageH - margin * 2 - gap) / 2;
      const aspect = w / h;
      const cardW = Math.min(cellW - 12, (cellH - 12) * aspect);
      const cardH = cardW / aspect;
      const ops = [];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const cellX = margin + col * (cellW + gap);
          const cellY = pageH - margin - (row + 1) * cellH - row * gap;
          const x = cellX + (cellW - cardW) / 2;
          const y = cellY + (cellH - cardH) / 2;
          ops.push(`q ${cardW.toFixed(2)} 0 0 ${cardH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`);
          const mark = 6;
          const left = x - 3;
          const right = x + cardW + 3;
          const bottom = y - 3;
          const top = y + cardH + 3;
          ops.push('0.4 w 0.45 0.45 0.45 RG');
          ops.push(`${(left - mark).toFixed(2)} ${bottom.toFixed(2)} m ${left.toFixed(2)} ${bottom.toFixed(2)} l S`);
          ops.push(`${left.toFixed(2)} ${(bottom - mark).toFixed(2)} m ${left.toFixed(2)} ${bottom.toFixed(2)} l S`);
          ops.push(`${(right + mark).toFixed(2)} ${bottom.toFixed(2)} m ${right.toFixed(2)} ${bottom.toFixed(2)} l S`);
          ops.push(`${right.toFixed(2)} ${(bottom - mark).toFixed(2)} m ${right.toFixed(2)} ${bottom.toFixed(2)} l S`);
          ops.push(`${(left - mark).toFixed(2)} ${top.toFixed(2)} m ${left.toFixed(2)} ${top.toFixed(2)} l S`);
          ops.push(`${left.toFixed(2)} ${(top + mark).toFixed(2)} m ${left.toFixed(2)} ${top.toFixed(2)} l S`);
          ops.push(`${(right + mark).toFixed(2)} ${top.toFixed(2)} m ${right.toFixed(2)} ${top.toFixed(2)} l S`);
          ops.push(`${right.toFixed(2)} ${(top + mark).toFixed(2)} m ${right.toFixed(2)} ${top.toFixed(2)} l S`);
        }
      }
      const pdf = buildPdf(pageW, pageH, bytes, w, h, ops.join('\n'));
      downloadBlob(pdf, `invitation-a4-${slugify(item ? item.name : 'sheet')}.pdf`);
      showProgress(1, t('toast.pdfDone'));
      toast(t('toast.pdfDone'));
      setTimeout(hideProgress, 900);
    } catch (error) {
      console.error(error);
      hideProgress();
      toast(t('toast.error', { msg: error.message }), 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function exportPdfSingle() {
    const item = state.names[state.active];
    const button = $('#pdfSingle');
    button.disabled = true;
    try {
      showProgress(0.3, t('pdf.single'));
      const { bytes, w, h } = await cardJpeg(item, state.active);
      const pageW = (w / 300) * 72;
      const pageH = (h / 300) * 72;
      const content = `q ${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm /Im0 Do Q`;
      const pdf = buildPdf(pageW, pageH, bytes, w, h, content);
      downloadBlob(pdf, `invitation-${slugify(item ? item.name : 'card')}.pdf`);
      showProgress(1, t('toast.pdfDone'));
      toast(t('toast.pdfDone'));
      setTimeout(hideProgress, 900);
    } catch (error) {
      console.error(error);
      hideProgress();
      toast(t('toast.error', { msg: error.message }), 'error');
    } finally {
      button.disabled = false;
    }
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }

  async function exportAll() {
    if (!state.names.length) {
      toast(t('toast.noNames'), 'error');
      return;
    }
    const button = $('#downloadAll');
    button.disabled = true;
    const items = state.names;
    // مرورگر دانلودهای پشت‌سرهم را بلاک می‌کند؛ برای بیش از سه کارت همیشه یک ZIP می‌سازیم
    const asZip = items.length > 1 && (S.zip || items.length > 3);
    const files = [];
    const { w, h } = surfaceSize();
    const longEdge = Math.max(w, h);

    try {
      if (!S.zip && asZip) toast(t('toast.zipAuto'));
      else if (longEdge > MAX_EXPORT_PX) toast(t('toast.downscaled', { px: num(longEdge), max: num(MAX_EXPORT_PX) }));

      showProgress(0, `${num(0)} / ${num(items.length)}`);
      for (let i = 0; i < items.length; i++) {
        const card = await renderCard(items[i], i);
        if (asZip) files.push({ name: card.name, data: new Uint8Array(await card.blob.arrayBuffer()) });
        else downloadBlob(card.blob, card.name);
        showProgress((i + 1) / items.length, `${num(i + 1)} / ${num(items.length)}`);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (asZip) {
        downloadBlob(makeZip(files), `invitations-${items.length}.zip`);
        toast(t('toast.zipDone', { n: num(items.length) }));
      } else if (items.length > 1) {
        toast(t('toast.multi', { n: num(items.length) }));
      } else {
        toast(t('toast.ready'));
      }
    } catch (error) {
      console.error(error);
      toast(t('toast.error', { msg: error.message }), 'error');
    } finally {
      button.disabled = false;
      hideProgress();
    }
  }

  async function exportCurrent() {
    const button = $('#downloadCurrent');
    button.disabled = true;
    try {
      showProgress(0.4, t('btn.current'));
      const card = await renderCard(state.names[state.active], state.active);
      downloadBlob(card.blob, card.name);
      showProgress(1, t('toast.ready'));
      toast(t('toast.ready'));
      setTimeout(hideProgress, 900);
    } catch (error) {
      console.error(error);
      hideProgress();
      toast(t('toast.error', { msg: error.message }), 'error');
    } finally {
      button.disabled = false;
    }
  }

  /* ------------------------- لینک اشتراک ------------------------- */

  function toBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(text) {
    const padded = text.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function shareLink() {
    const item = state.names[state.active];
    const payload = { v: 2, n: item ? item.name : '', g: item ? item.gender : 'm', s: { ...S, maleNames: '', femaleNames: '' } };
    const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const url = `${location.origin}${location.pathname}#card=${encoded}`;
    history.replaceState(null, '', `#card=${encoded}`);
    const done = () => toast(t('toast.linkCopied'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => toast(t('toast.linkFail'), 'error'));
    } else {
      toast(t('toast.linkFail'), 'error');
    }
  }

  function readSharedLink() {
    const hash = location.hash || '';
    if (!hash.startsWith('#card=')) return false;
    try {
      const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(hash.slice(6))));
      if (payload && payload.s) {
        const source = { ...payload.s };
        delete source.maleNames;
        delete source.femaleNames;
        S = { ...defaults(), ...source };
      }
      if (payload && payload.v === 2) {
        S.maleNames = payload.g === 'f' ? '' : payload.n || '';
        S.femaleNames = payload.g === 'f' ? payload.n || '' : '';
        state.active = 0;
      }
      return true;
    } catch (error) {
      console.warn('bad share payload', error);
      return false;
    }
  }

  /* ------------------------- پیام و پیشرفت ------------------------- */

  let toastTimer = null;
  function toast(message, kind = 'info') {
    const el = $('#toast');
    el.textContent = message;
    el.classList.toggle('is-error', kind === 'error');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, kind === 'error' ? 5200 : 3200);
  }

  function showProgress(ratio, label) {
    $('#progress').hidden = false;
    $('#progressFill').style.width = `${Math.round(ratio * 100)}%`;
    $('#progressText').textContent = label;
  }

  function hideProgress() {
    $('#progress').hidden = true;
    $('#progressFill').style.width = '0%';
    $('#progressText').textContent = '';
  }

  /* ------------------------- تاریخچه ------------------------- */

  function applyCommit() {
    state.history.pending = false;
    clearTimeout(state.history.timer);
    const snap = JSON.stringify(S);
    if (state.history.stack[state.history.index] === snap) return;
    state.history.stack = state.history.stack.slice(0, state.history.index + 1);
    state.history.stack.push(snap);
    if (state.history.stack.length > 60) state.history.stack.shift();
    state.history.index = state.history.stack.length - 1;
    $('#undo').disabled = state.history.index <= 0;
    $('#redo').disabled = true;
  }

  function commit(immediate = false) {
    clearTimeout(state.history.timer);
    state.history.pending = true;
    if (immediate) {
      applyCommit();
      return;
    }
    state.history.timer = setTimeout(applyCommit, 350);
  }

  function restoreSnapshot(snap) {
    try {
      S = JSON.parse(snap);
    } catch {
      return;
    }
    applyUI();
    syncNames();
    render();
    persist();
  }

  function undo() {
    if (state.history.pending) applyCommit();
    if (state.history.index <= 0) return;
    state.history.index--;
    restoreSnapshot(state.history.stack[state.history.index]);
    $('#undo').disabled = state.history.index <= 0;
    $('#redo').disabled = state.history.index >= state.history.stack.length - 1;
  }

  function redo() {
    if (state.history.pending) applyCommit();
    if (state.history.index >= state.history.stack.length - 1) return;
    state.history.index++;
    restoreSnapshot(state.history.stack[state.history.index]);
    $('#undo').disabled = state.history.index <= 0;
    $('#redo').disabled = state.history.index >= state.history.stack.length - 1;
  }

  /* ------------------------- بلوک‌های اضافی ------------------------- */

  function renderExtras() {
    const list = $('#extraList');
    list.innerHTML = '';
    if (!S.extras.length) {
      const empty = document.createElement('p');
      empty.className = 'muted small';
      empty.textContent = t('extra.empty');
      list.appendChild(empty);
      return;
    }
    S.extras.forEach((extra, index) => {
      const row = document.createElement('div');
      row.className = 'extra-row';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = extra.text;
      input.placeholder = t('extra.placeholder');
      input.setAttribute('aria-label', t('extra.placeholder'));
      input.addEventListener('input', () => {
        extra.text = input.value;
        render();
        persist();
        commit();
      });

      const size = document.createElement('input');
      size.type = 'range';
      size.min = '10';
      size.max = '140';
      size.step = '1';
      size.value = String(extra.size);
      size.setAttribute('aria-label', t('extra.size'));
      size.addEventListener('input', () => {
        extra.size = Number(size.value);
        render();
        persist();
        commit();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-btn';
      remove.setAttribute('aria-label', t('extra.remove'));
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>';
      remove.addEventListener('click', () => {
        S.extras.splice(index, 1);
        renderExtras();
        render();
        persist();
        commit();
      });

      row.append(input, size, remove);
      list.appendChild(row);
    });
  }

  function addExtra() {
    if (S.extras.length >= MAX_EXTRAS) {
      toast(t('toast.extraLimit'), 'error');
      return;
    }
    S.extras.push({
      id: `x${Date.now().toString(36)}`,
      text: '',
      size: Math.round(S.fontSize * 0.55),
      x: 50,
      y: Math.min(92, S.posY + 26),
    });
    renderExtras();
    render();
    persist();
    commit();
    toast(t('toast.extraAdded'));
  }

  /* ------------------------- قالب و تصویر ------------------------- */

  function renderTemplates() {
    const grid = $('#tplGrid');
    grid.innerHTML = '';
    TEMPLATES.forEach((tpl) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tpl';
      button.dataset.tpl = tpl.id;
      button.style.setProperty('--tpl', tpl.swatch);
      button.setAttribute('aria-pressed', String(S.bgKind === 'template' && S.bgTemplate === tpl.id));
      button.innerHTML = `<span class="tpl-swatch" aria-hidden="true"></span><span class="tpl-name">${t('tpl.' + tpl.id)}</span>`;
      button.addEventListener('click', () => selectTemplate(tpl.id));
      grid.appendChild(button);
    });
  }

  function selectTemplate(id) {
    const before = surfaceSize();
    S.bgKind = 'template';
    S.bgTemplate = id;
    const ratio = TEMPLATE_W / before.w;
    S.fontSize = Math.round(clamp(S.fontSize * ratio, 14, 120));
    S.extras.forEach((extra) => { extra.size = Math.round(clamp(extra.size * ratio, 10, 140)); });
    $('#imgMeta').hidden = true;
    renderTemplates();
    applyUI();
    render();
    persist();
    commit();
    toast(t('toast.template', { name: t('tpl.' + id) }));
  }

  function loadImageSource(src, { name, isDefault }) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        const megapixels = (image.naturalWidth * image.naturalHeight) / 1e6;
        if (!image.naturalWidth || megapixels > MAX_MEGAPIXELS) {
          reject(new Error(t('toast.bigDims')));
          return;
        }
        if (state.objectUrl) {
          URL.revokeObjectURL(state.objectUrl);
          state.objectUrl = null;
        }
        if (src.startsWith('blob:')) state.objectUrl = src;

        const before = surfaceSize();
        const ratio = image.naturalWidth / before.w;
        state.image = image;
        state.imageName = name;
        S.bgKind = 'image';
        S.fontSize = Math.round(clamp(S.fontSize * ratio, 14, 120));
        S.extras.forEach((extra) => { extra.size = Math.round(clamp(extra.size * ratio, 10, 140)); });

        $('#imgMeta').hidden = false;
        $('#imgName').textContent = name;
        $('#imgDims').textContent = `${num(image.naturalWidth)} × ${num(image.naturalHeight)} px`;
        applyUI();
        render();
        persist();
        commit();
        resolve();
      };
      image.onerror = () => reject(new Error(t('toast.noImage')));
      image.src = src;
      void isDefault;
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast(t('toast.badFile'), 'error');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast(t('toast.bigFile'), 'error');
      return;
    }
    try {
      await loadImageSource(URL.createObjectURL(file), { name: file.name, isDefault: false });
      toast(t('toast.uploaded'));
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  /* ------------------------- تعامل بوم ------------------------- */

  function canvasPoint(event) {
    const canvas = $('#canvas');
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      rect,
    };
  }

  function hitAt(point) {
    for (let i = state.hits.length - 1; i >= 0; i--) {
      const hit = state.hits[i];
      const b = hit.box;
      if (point.x >= b.x0 && point.x <= b.x1 && point.y >= b.y0 && point.y <= b.y1) return hit;
    }
    return null;
  }

  function bindStage() {
    const stage = $('#stage');

    stage.addEventListener('pointerdown', (event) => {
      const point = canvasPoint(event);
      const hit = hitAt(point);
      if (!hit) return;
      let origin = null;
      if (hit.kind === 'main') origin = { x: S.posX, y: S.posY };
      else {
        const extra = S.extras.find((entry) => entry.id === hit.id);
        if (extra) origin = { x: extra.x, y: extra.y };
      }
      if (!origin) return;

      state.drag = {
        pointerId: event.pointerId,
        kind: hit.kind,
        id: hit.id,
        startX: event.clientX,
        startY: event.clientY,
        originX: origin.x,
        originY: origin.y,
        rect: point.rect,
      };
      try {
        stage.setPointerCapture(event.pointerId);
      } catch {
        // شناسه اشاره‌گر مصنوعی؛ نادیده بگیر
      }
      stage.classList.add('dragging');
      event.preventDefault();
    });

    stage.addEventListener('pointermove', (event) => {
      const point = canvasPoint(event);
      if (!state.drag) {
        const hit = hitAt(point);
        stage.classList.toggle('can-drag', Boolean(hit));
        const next = hit ? { kind: hit.kind, id: hit.id } : null;
        const changed = JSON.stringify(next) !== JSON.stringify(state.hover);
        state.hover = next;
        if (changed) render();
        return;
      }
      const { rect } = state.drag;
      const dx = ((event.clientX - state.drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - state.drag.startY) / rect.height) * 100;
      const x = clamp(state.drag.originX + dx, 0, 100);
      const y = clamp(state.drag.originY + dy, 0, 100);
      if (state.drag.kind === 'main') {
        S.posX = x;
        S.posY = y;
        syncPositionUI();
      } else {
        const extra = S.extras.find((entry) => entry.id === state.drag.id);
        if (extra) { extra.x = x; extra.y = y; }
      }
      render();
    });

    const endDrag = () => {
      if (!state.drag) return;
      state.drag = null;
      stage.classList.remove('dragging');
      $('#stageTip').hidden = true;
      persist();
      commit();
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave', () => {
      if (!state.hover) return;
      state.hover = null;
      render();
    });

    stage.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 5 : 1;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      S.posX = clamp(S.posX + move[0], 0, 100);
      S.posY = clamp(S.posY + move[1], 0, 100);
      syncPositionUI();
      render();
      persist();
      commit();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) render();
    });
  }

  /* ------------------------- کنترل‌ها ------------------------- */

  function syncOutputs() {
    const pct = window.I18N && window.I18N.lang === 'fa' ? '٪' : '%';
    $('#fontSizeOut').textContent = num(S.fontSize);
    $('#outlineWidthOut').textContent = num(S.outlineWidth);
    $('#maxWidthOut').textContent = `${num(S.maxWidth)}${pct}`;
    $('#lineHeightOut').textContent = num(S.lineHeight.toFixed(1));
    $('#qualityOut').textContent = `${num(S.quality)}${pct}`;
    syncPositionUI();
  }

  function syncPositionUI() {
    const pct = window.I18N && window.I18N.lang === 'fa' ? '٪' : '%';
    $('#posXOut').textContent = `${num(Math.round(S.posX))}${pct}`;
    $('#posYOut').textContent = `${num(Math.round(S.posY))}${pct}`;
    $('#posX').value = String(S.posX);
    $('#posY').value = String(S.posY);
  }

  function syncSwatches() {
    $$('.swatch[data-color]').forEach((swatch) => {
      swatch.setAttribute('aria-pressed', String(swatch.dataset.color.toLowerCase() === S.color.toLowerCase()));
    });
  }

  function applyUI() {
    $('#maleNames').value = S.maleNames;
    $('#femaleNames').value = S.femaleNames;
    $('#title').value = S.title;
    $('#note').value = S.note;
    $('#malePrefix').value = S.malePrefix;
    $('#femalePrefix').value = S.femalePrefix;
    $('#fontFamily').value = S.fontFamily;
    $('#fontSize').value = String(S.fontSize);
    $('#fontColor').value = S.color;
    $('#outline').checked = S.outline;
    $('#outlineWidth').value = String(S.outlineWidth);
    $('#outlineWidthField').hidden = !S.outline;
    $('#maxWidth').value = String(S.maxWidth);
    $('#lineHeight').value = String(S.lineHeight);
    $('#quality').value = String(S.quality);
    $('#qualityField').hidden = S.format === 'png';
    $('#zip').checked = S.zip;

    const prefixRadio = $(`input[name="prefixMode"][value="${S.prefixMode}"]`);
    if (prefixRadio) prefixRadio.checked = true;
    const alignRadio = $(`input[name="align"][value="${S.align}"]`);
    if (alignRadio) alignRadio.checked = true;
    const formatRadio = $(`input[name="format"][value="${S.format}"]`);
    if (formatRadio) formatRadio.checked = true;

    $('#prefixFields').style.opacity = S.prefixMode === 'auto' ? '1' : '.45';
    $$('#prefixFields input').forEach((input) => { input.disabled = S.prefixMode !== 'auto'; });

    $$('.tpl').forEach((el) => {
      el.setAttribute('aria-pressed', String(S.bgKind === 'template' && el.dataset.tpl === S.bgTemplate));
    });

    syncOutputs();
    syncSwatches();
    renderExtras();
  }

  function persist() {
    clearTimeout(persist.timer);
    persist.timer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(S));
      } catch (error) {
        console.warn('persist failed', error);
      }
    }, 400);
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('invitation-studio-v1');
      if (!raw) return false;
      S = { ...defaults(), ...JSON.parse(raw) };
      return true;
    } catch {
      return false;
    }
  }

  function bindControls() {
    const on = (selector, event, handler) => {
      const el = $(selector);
      if (el) el.addEventListener(event, handler);
    };

    on('#maleNames', 'input', (e) => { S.maleNames = e.target.value; syncNames(); render(); persist(); commit(); });
    on('#femaleNames', 'input', (e) => { S.femaleNames = e.target.value; syncNames(); render(); persist(); commit(); });
    on('#clearNames', 'click', () => {
      S.maleNames = '';
      S.femaleNames = '';
      $('#maleNames').value = '';
      $('#femaleNames').value = '';
      state.active = 0;
      syncNames();
      render();
      persist();
      commit();
      toast(t('toast.cleared'));
    });

    on('#title', 'input', (e) => { S.title = e.target.value; render(); persist(); commit(); });
    on('#note', 'input', (e) => { S.note = e.target.value; render(); persist(); commit(); });
    on('#malePrefix', 'input', (e) => { S.malePrefix = e.target.value; render(); persist(); commit(); });
    on('#femalePrefix', 'input', (e) => { S.femalePrefix = e.target.value; render(); persist(); commit(); });

    $$('input[name="prefixMode"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        S.prefixMode = radio.value;
        $('#prefixFields').style.opacity = S.prefixMode === 'auto' ? '1' : '.45';
        $$('#prefixFields input').forEach((input) => { input.disabled = S.prefixMode !== 'auto'; });
        render();
        persist();
        commit();
      });
    });

    on('#fontFamily', 'change', (e) => {
      S.fontFamily = e.target.value;
      ensureFonts().then(render);
      persist();
      commit();
    });
    on('#fontSize', 'input', (e) => { S.fontSize = Number(e.target.value); syncOutputs(); render(); persist(); commit(); });
    on('#fontColor', 'input', (e) => { S.color = e.target.value; syncSwatches(); render(); persist(); commit(); });
    $$('.swatch[data-color]').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        S.color = swatch.dataset.color;
        $('#fontColor').value = S.color;
        syncSwatches();
        render();
        persist();
        commit();
      });
    });
    on('#outline', 'change', (e) => {
      S.outline = e.target.checked;
      $('#outlineWidthField').hidden = !S.outline;
      render();
      persist();
      commit();
    });
    on('#outlineWidth', 'input', (e) => { S.outlineWidth = Number(e.target.value); syncOutputs(); render(); persist(); commit(); });
    on('#maxWidth', 'input', (e) => { S.maxWidth = Number(e.target.value); syncOutputs(); render(); persist(); commit(); });
    on('#lineHeight', 'input', (e) => { S.lineHeight = Number(e.target.value); syncOutputs(); render(); persist(); commit(); });

    $$('input[name="align"]').forEach((radio) => {
      radio.addEventListener('change', () => { S.align = radio.value; render(); persist(); commit(); });
    });
    on('#posX', 'input', (e) => { S.posX = Number(e.target.value); syncOutputs(); render(); persist(); commit(); });
    on('#posY', 'input', (e) => { S.posY = Number(e.target.value); syncOutputs(); render(); persist(); commit(); });
    on('#centerText', 'click', () => {
      S.posX = 50;
      S.posY = 58;
      S.align = 'center';
      const radio = $('input[name="align"][value="center"]');
      if (radio) radio.checked = true;
      syncOutputs();
      render();
      persist();
      commit();
    });
    on('#smartPlace', 'click', smartPlace);

    $$('input[name="format"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        S.format = radio.value;
        $('#qualityField').hidden = S.format === 'png';
        persist();
        commit();
      });
    });
    on('#quality', 'input', (e) => { S.quality = Number(e.target.value); syncOutputs(); persist(); commit(); });
    on('#zip', 'change', (e) => { S.zip = e.target.checked; persist(); commit(); });

    on('#addExtra', 'click', addExtra);
    on('#undo', 'click', undo);
    on('#redo', 'click', redo);
    on('#resetAll', 'click', () => {
      S = defaults();
      state.active = 0;
      applyUI();
      syncNames();
      render();
      persist();
      commit(true);
      toast(t('toast.reset'));
    });

    on('#prevName', 'click', () => selectName(state.active - 1));
    on('#nextName', 'click', () => selectName(state.active + 1));
    on('#downloadAll', 'click', exportAll);
    on('#downloadCurrent', 'click', exportCurrent);
    on('#pdfSheet', 'click', exportPdfSheet);
    on('#pdfSingle', 'click', exportPdfSingle);
    on('#shareLink', 'click', shareLink);

    const drop = $('#drop');
    const fileInput = $('#imageUpload');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });
    fileInput.addEventListener('change', (event) => {
      handleFile(event.target.files[0]);
      event.target.value = '';
    });
    ['dragenter', 'dragover'].forEach((type) => {
      drop.addEventListener(type, (event) => {
        event.preventDefault();
        drop.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach((type) => {
      drop.addEventListener(type, (event) => {
        event.preventDefault();
        drop.classList.remove('dragover');
      });
    });
    drop.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    });

    on('#useDefault', 'click', async () => {
      try {
        await loadImageSource(DEFAULT_IMAGE, { name: t('img.default'), isDefault: true });
        toast(t('toast.defaultImage'));
      } catch (error) {
        toast(error.message, 'error');
      }
    });

    $$('.lang-btn').forEach((button) => {
      button.addEventListener('click', () => setLang(button.dataset.lang));
    });

    document.addEventListener('keydown', (event) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key === 'Enter') {
        event.preventDefault();
        exportAll();
      } else if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (meta && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    });
  }

  function refreshDynamicText() {
    syncNames();
    renderTemplates();
    renderExtras();
    syncOutputs();
    if (state.image && S.bgKind === 'image') {
      $('#imgName').textContent = state.imageName;
      $('#imgDims').textContent = `${num(state.image.naturalWidth)} × ${num(state.image.naturalHeight)} px`;
    }
  }

  function setLang(lang) {
    S.lang = lang;
    window.I18N.setLang(lang);
    refreshDynamicText();
    render();
    persist();
  }

  /* ------------------------- خودآزمون ------------------------- */

  function selfTest() {
    const results = [];
    const check = (label, condition) => results.push({ label, ok: Boolean(condition) });

    const zip = makeZip([{ name: 'تست.txt', data: new TextEncoder().encode('hello') }]);
    zip.arrayBuffer().then((buffer) => {
      const view = new Uint8Array(buffer);
      check('zip header', view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04);
      check('crc32 hello', crc32(new TextEncoder().encode('hello')) === 0x3610a686);
      check('zip EOCD', String.fromCharCode(...view.slice(-22, -18)) === 'PK\u0005\u0006');
    });

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `700 40px ${FAMILIES.Vazirmatn}`;
    const lines = fitRows(ctx, [{ text: 'جناب آقای مانوئل اوهانجانیانس', size: 40, weight: 700 }], 200, 1);
    check('autofit max width', lines.every((line) => ctx.measureText(line.text).width <= 200.5));

    const a = document.createElement('canvas');
    const b = document.createElement('canvas');
    a.width = b.width = 80;
    a.height = b.height = 120;
    drawTemplate(a.getContext('2d'), 80, 120, 'emerald');
    drawTemplate(b.getContext('2d'), 80, 120, 'emerald');
    check('template deterministic', a.toDataURL() === b.toDataURL());

    const pdf = buildPdf(100, 100, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 10, 10, 'q Q');
    check('pdf blob type', pdf.type === 'application/pdf');

    const packed = toBase64Url(new TextEncoder().encode(JSON.stringify({ n: 'تست', v: 2 })));
    const back = JSON.parse(new TextDecoder().decode(fromBase64Url(packed)));
    check('share roundtrip', back.n === 'تست' && back.v === 2);

    return results;
  }

  /* ------------------------- راه‌اندازی ------------------------- */

  async function init() {
    const restored = restore();
    const shared = readSharedLink();
    window.I18N.setLang(S.lang || 'fa');
    applyUI();
    syncNames();
    renderTemplates();
    bindControls();
    bindStage();

    await ensureFonts();
    if (S.bgKind === 'image' && !state.image) {
      // تصویر آپلودی بین نشست‌ها ذخیره نمی‌شود؛ به قالب برمی‌گردیم
      S.bgKind = 'template';
      applyUI();
    }
    commit(true);
    render();
    if (shared) toast(t('toast.shareLoaded'));

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    window.__studio = {
      state,
      get settings() { return S; },
      render,
      paint,
      exportAll,
      exportPdfSingle,
      exportPdfSheet,
      selfTest,
      makeZip,
      crc32,
      buildPdf,
      smartPlace,
      quietArea,
      undo,
      redo,
      setLang,
      shareLink,
      readSharedLink,
      TEMPLATES,
      drawTemplate,
      restored,
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
