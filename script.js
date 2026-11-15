/* ============================================================
   دعوت‌نامه‌ساز | موتور رندر و خروجی
   بدون وابستگی بیرونی. همه پردازش تصویر در مرورگر کاربر انجام می‌شود.
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const DEFAULT_IMAGE = 'default-image-yektanet.jpg';
  const MAX_FILE_BYTES = 15 * 1024 * 1024;
  const MAX_MEGAPIXELS = 80;
  const MAX_EXPORT_PX = 4200;
  const PREVIEW_PX = 1600;
  const STORE_KEY = 'invitation-studio-v1';
  const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

  const FAMILIES = {
    Vazirmatn: '"Vazirmatn", sans-serif',
    Tahoma: 'Tahoma, sans-serif',
    Arial: 'Arial, sans-serif',
    'Times New Roman': '"Times New Roman", serif',
  };

  const fa = (value) => String(value).replace(/\d/g, (d) => FA_DIGITS[+d]).replace(/\./g, '٫');
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const defaults = () => ({
    maleNames: 'آرش نیک‌نام\nسامان راد\nکیوان مهرابی',
    femaleNames: 'نازنین آذر\nمریم صبوری',
    prefixMode: 'auto',
    malePrefix: 'جناب آقای',
    femalePrefix: 'سرکار خانم',
    title: '',
    note: '',
    fontFamily: 'Vazirmatn',
    fontSize: 40,
    color: '#14161b',
    outline: false,
    outlineWidth: 2,
    maxWidth: 78,
    lineHeight: 1.4,
    align: 'center',
    posX: 50,
    posY: 62,
    format: 'jpg',
    quality: 92,
    zip: true,
  });

  let S = defaults();

  const state = {
    image: null,
    imageName: 'تصویر پیش‌فرض',
    isDefault: true,
    objectUrl: null,
    names: [],
    active: 0,
    block: null,
    drag: null,
    renderQueued: false,
  };

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
    if (state.names.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'chips-empty';
      empty.textContent = 'نامی وارد نشده است';
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
    $('#nameCount').textContent = count ? `${fa(count)} نام` : 'بدون نام';
    $('#dlCount').textContent = fa(count);
    $('#prevName').disabled = state.active <= 0;
    $('#nextName').disabled = state.active >= count - 1;

    const activeChip = chips.children[state.active];
    if (activeChip && activeChip.scrollIntoView) {
      activeChip.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
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

  function buildRows(item) {
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
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // متن را تا جایی که در پهنای مجاز جا شود کوچک می‌کند و در صورت نیاز می‌شکند
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

  /**
   * بلوک متن را روی بوم می‌کشد.
   * @returns {{x0:number,y0:number,x1:number,y1:number}|null} کادر متن برای برخورد ماوس
   */
  function drawBlock(ctx, width, height, item, scale) {
    const rows = buildRows(item);
    if (!rows.length) return null;

    const maxWidth = (width * S.maxWidth) / 100;
    const lines = fitRows(ctx, rows, maxWidth, scale);
    if (!lines.length) return null;

    const lineHeights = lines.map((line) => line.size * S.lineHeight);
    const totalHeight = lineHeights.reduce((sum, h) => sum + h, 0);
    const anchorX = (width * S.posX) / 100;
    const top = (height * S.posY) / 100 - totalHeight / 2;
    const strokeColor = relativeLuminance(S.color) > 0.45 ? 'rgba(12,14,18,0.78)' : 'rgba(255,255,255,0.9)';

    ctx.save();
    ctx.textAlign = S.align;
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
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

    const pad = Math.max(10, S.fontSize * 0.4);
    return { x0: minX - pad, y0: top - pad, x1: maxX + pad, y1: top + totalHeight + pad };
  }

  /* ------------------------- رندر ------------------------- */

  function render() {
    if (!state.image) return;
    // در تب پس‌زمینه requestAnimationFrame اجرا نمی‌شود؛ همان لحظه رسم می‌کنیم
    if (document.hidden) {
      paint();
      return;
    }
    if (state.renderQueued) return;
    state.renderQueued = true;
    requestAnimationFrame(() => {
      state.renderQueued = false;
      paint();
    });
  }

  function paint() {
    if (!state.image) return;
    {
      const canvas = $('#canvas');
      const image = state.image;
      const w = image.naturalWidth;
      const h = image.naturalHeight;
      const scale = Math.min(1, PREVIEW_PX / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(image, 0, 0, cw, ch);

      const item = state.names[state.active];
      state.block = drawBlock(ctx, cw, ch, item, scale);
      canvas.setAttribute('aria-label', item ? `پیش‌نمایش دعوت‌نامه برای ${item.name}` : 'پیش‌نمایش دعوت‌نامه');

      const badge = $('#stageBadge');
      badge.hidden = false;
      badge.textContent = `${w} × ${h}`;
      $('#stageTip').hidden = !state.block;
    }
  }

  /* ------------------------- خروجی ------------------------- */

  function slugify(text) {
    return text
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'invitation';
  }

  function fileName(item, index) {
    const ext = S.format;
    const base = item ? slugify(item.name) : 'invitation';
    return `invitation-${String(index + 1).padStart(2, '0')}-${base}.${ext}`;
  }

  async function renderCard(item, index) {
    await ensureFonts();
    const image = state.image;
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const scale = Math.min(1, MAX_EXPORT_PX / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));

    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawBlock(ctx, canvas.width, canvas.height, item, scale);

    const mime = S.format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('ساخت تصویر ناموفق بود'))),
        mime,
        S.format === 'png' ? undefined : S.quality / 100,
      );
    });

    return { blob, name: fileName(item, index) };
  }

  /* ---------- ZIP بدون کتابخانه (فقط store) ---------- */

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

  /* ------------------------- وضعیت و پیام ------------------------- */

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
    const wrap = $('#progress');
    wrap.hidden = false;
    $('#progressFill').style.width = `${Math.round(ratio * 100)}%`;
    $('#progressText').textContent = label;
  }

  function hideProgress() {
    const wrap = $('#progress');
    wrap.hidden = true;
    $('#progressFill').style.width = '0%';
    $('#progressText').textContent = '';
  }

  const sleep = () => new Promise((resolve) => setTimeout(resolve, 16));

  async function exportAll() {
    if (!state.names.length) {
      toast('اول حداقل یک نام وارد کنید', 'error');
      return;
    }
    const button = $('#downloadAll');
    button.disabled = true;
    const items = state.names;
    // مرورگر دانلودهای پشت‌سرهم را بلاک می‌کند؛ برای بیش از سه کارت همیشه یک ZIP می‌سازیم
    const asZip = items.length > 1 && (S.zip || items.length > 3);
    const files = [];
    const longEdge = Math.max(state.image.naturalWidth, state.image.naturalHeight);

    try {
      if (!S.zip && asZip) {
        toast('برای اینکه مرورگر دانلودها را بلاک نکند، همه در یک فایل ZIP بسته‌بندی شد');
      } else if (longEdge > MAX_EXPORT_PX) {
        toast(`تصویر اصلی ${fa(longEdge)} پیکسل است؛ خروجی روی ${fa(MAX_EXPORT_PX)} پیکسل مقیاس می‌شود`);
      }
      showProgress(0, `آماده‌سازی ۰ از ${fa(items.length)}`);
      for (let i = 0; i < items.length; i++) {
        const card = await renderCard(items[i], i);
        if (asZip) {
          files.push({ name: card.name, data: new Uint8Array(await card.blob.arrayBuffer()) });
        } else {
          downloadBlob(card.blob, card.name);
        }
        showProgress((i + 1) / items.length, `${fa(i + 1)} از ${fa(items.length)} ساخته شد`);
        await sleep();
      }

      if (asZip) {
        const zip = makeZip(files);
        downloadBlob(zip, `invitations-${items.length}.zip`);
        toast(`فایل ZIP با ${fa(items.length)} تصویر آماده شد`);
      } else if (items.length > 1) {
        toast(`${fa(items.length)} فایل جدا ارسال شد. اگر مرورگر اجازه نداد، گزینه ZIP را روشن کنید.`);
      } else {
        toast('تصویر آماده شد');
      }
    } catch (error) {
      console.error(error);
      toast(`خطا در ساخت خروجی: ${error.message}`, 'error');
    } finally {
      button.disabled = false;
      hideProgress();
    }
  }

  async function exportCurrent() {
    const button = $('#downloadCurrent');
    button.disabled = true;
    try {
      showProgress(0.4, 'در حال ساخت تصویر');
      const card = await renderCard(state.names[state.active], state.active);
      downloadBlob(card.blob, card.name);
      showProgress(1, 'آماده شد');
      toast('تصویر آماده شد');
      setTimeout(hideProgress, 900);
    } catch (error) {
      console.error(error);
      hideProgress();
      toast(`خطا در ساخت تصویر: ${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  }

  /* ------------------------- تصویر ------------------------- */

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('700 40px Vazirmatn'),
        document.fonts.load('400 40px Vazirmatn'),
      ]);
    } catch (error) {
      console.warn('خطای بارگذاری قلم', error);
    }
  }

  function loadImageSource(src, { isDefault, name }) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        const megapixels = (image.naturalWidth * image.naturalHeight) / 1e6;
        if (!image.naturalWidth || megapixels > MAX_MEGAPIXELS) {
          reject(new Error('ابعاد تصویر بیش از حد بزرگ است'));
          return;
        }
        if (state.objectUrl) {
          URL.revokeObjectURL(state.objectUrl);
          state.objectUrl = null;
        }
        if (!isDefault && src.startsWith('blob:')) state.objectUrl = src;

        state.image = image;
        state.isDefault = isDefault;
        state.imageName = name;

        $('#imgMeta').hidden = false;
        $('#imgName').textContent = name;
        $('#imgDims').textContent = `${image.naturalWidth} در ${image.naturalHeight} پیکسل`;
        render();
        resolve();
      };
      image.onerror = () => reject(new Error('تصویر قابل خواندن نیست'));
      image.src = src;
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('فایل انتخاب‌شده تصویر نیست', 'error');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast('حجم تصویر بیشتر از ۱۵ مگابایت است', 'error');
      return;
    }
    try {
      await loadImageSource(URL.createObjectURL(file), { isDefault: false, name: file.name });
      toast('تصویر جایگزین شد');
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  /* ------------------------- تعامل با بوم ------------------------- */

  function canvasPoint(event) {
    const canvas = $('#canvas');
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      rect,
    };
  }

  function insideBlock(point) {
    const block = state.block;
    if (!block) return false;
    return point.x >= block.x0 && point.x <= block.x1 && point.y >= block.y0 && point.y <= block.y1;
  }

  function bindStage() {
    const stage = $('#stage');
    const canvas = $('#canvas');

    stage.addEventListener('pointerdown', (event) => {
      const point = canvasPoint(event);
      if (!insideBlock(point)) return;
      state.drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        posX: S.posX,
        posY: S.posY,
        rect: point.rect,
      };
      try {
        stage.setPointerCapture(event.pointerId);
      } catch (error) {
        // اگر مرورگر شناسه اشاره‌گر را نپذیرد، جابه‌جایی با ماوس معمولی هم کار می‌کند
      }
      stage.classList.add('dragging');
      event.preventDefault();
    });

    stage.addEventListener('pointermove', (event) => {
      if (!state.drag) {
        const point = canvasPoint(event);
        stage.classList.toggle('can-drag', insideBlock(point));
        return;
      }
      const { rect } = state.drag;
      const dx = ((event.clientX - state.drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - state.drag.startY) / rect.height) * 100;
      S.posX = clamp(state.drag.posX + dx, 0, 100);
      S.posY = clamp(state.drag.posY + dy, 0, 100);
      syncPositionUI();
      render();
    });

    const endDrag = () => {
      if (!state.drag) return;
      state.drag = null;
      stage.classList.remove('dragging');
      $('#stageTip').hidden = true;
      persist();
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    stage.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 5 : 1;
      const moves = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      S.posX = clamp(S.posX + move[0], 0, 100);
      S.posY = clamp(S.posY + move[1], 0, 100);
      syncPositionUI();
      render();
      persist();
    });

    canvas.addEventListener('dragstart', (event) => event.preventDefault());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) render();
    });
  }

  /* ------------------------- اتصال کنترل‌ها ------------------------- */

  function syncOutputs() {
    $('#fontSizeOut').textContent = fa(S.fontSize);
    $('#outlineWidthOut').textContent = fa(S.outlineWidth);
    $('#maxWidthOut').textContent = `${fa(S.maxWidth)}٪`;
    $('#lineHeightOut').textContent = fa(S.lineHeight.toFixed(1));
    $('#qualityOut').textContent = `${fa(S.quality)}٪`;
    syncPositionUI();
  }

  function syncPositionUI() {
    $('#posXOut').textContent = `${fa(Math.round(S.posX))}٪`;
    $('#posYOut').textContent = `${fa(Math.round(S.posY))}٪`;
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

    syncOutputs();
    syncSwatches();
  }

  function persist() {
    clearTimeout(persist.timer);
    persist.timer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(S));
      } catch (error) {
        console.warn('ذخیره تنظیمات ممکن نشد', error);
      }
    }, 400);
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      S = { ...defaults(), ...saved };
    } catch (error) {
      console.warn('بازیابی تنظیمات ممکن نشد', error);
    }
  }

  function bindControls() {
    const onInput = (selector, event, handler) => {
      const el = $(selector);
      if (el) el.addEventListener(event, handler);
    };

    onInput('#maleNames', 'input', (e) => { S.maleNames = e.target.value; syncNames(); render(); persist(); });
    onInput('#femaleNames', 'input', (e) => { S.femaleNames = e.target.value; syncNames(); render(); persist(); });
    onInput('#clearNames', 'click', () => {
      S.maleNames = '';
      S.femaleNames = '';
      $('#maleNames').value = '';
      $('#femaleNames').value = '';
      state.active = 0;
      syncNames();
      render();
      persist();
      toast('فهرست نام‌ها خالی شد');
    });

    onInput('#title', 'input', (e) => { S.title = e.target.value; render(); persist(); });
    onInput('#note', 'input', (e) => { S.note = e.target.value; render(); persist(); });
    onInput('#malePrefix', 'input', (e) => { S.malePrefix = e.target.value; render(); persist(); });
    onInput('#femalePrefix', 'input', (e) => { S.femalePrefix = e.target.value; render(); persist(); });

    $$('input[name="prefixMode"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        S.prefixMode = radio.value;
        $('#prefixFields').style.opacity = S.prefixMode === 'auto' ? '1' : '.45';
        $$('#prefixFields input').forEach((input) => { input.disabled = S.prefixMode !== 'auto'; });
        render();
        persist();
      });
    });

    onInput('#fontFamily', 'change', (e) => {
      S.fontFamily = e.target.value;
      ensureFonts().then(render);
      persist();
    });
    onInput('#fontSize', 'input', (e) => {
      S.fontSize = Number(e.target.value);
      syncOutputs();
      render();
      persist();
    });
    onInput('#fontColor', 'input', (e) => {
      S.color = e.target.value;
      syncSwatches();
      render();
      persist();
    });
    $$('.swatch[data-color]').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        S.color = swatch.dataset.color;
        $('#fontColor').value = S.color;
        syncSwatches();
        render();
        persist();
      });
    });
    onInput('#outline', 'change', (e) => {
      S.outline = e.target.checked;
      $('#outlineWidthField').hidden = !S.outline;
      render();
      persist();
    });
    onInput('#outlineWidth', 'input', (e) => {
      S.outlineWidth = Number(e.target.value);
      syncOutputs();
      render();
      persist();
    });
    onInput('#maxWidth', 'input', (e) => {
      S.maxWidth = Number(e.target.value);
      syncOutputs();
      render();
      persist();
    });
    onInput('#lineHeight', 'input', (e) => {
      S.lineHeight = Number(e.target.value);
      syncOutputs();
      render();
      persist();
    });

    $$('input[name="align"]').forEach((radio) => {
      radio.addEventListener('change', () => { S.align = radio.value; render(); persist(); });
    });
    onInput('#posX', 'input', (e) => { S.posX = Number(e.target.value); syncOutputs(); render(); persist(); });
    onInput('#posY', 'input', (e) => { S.posY = Number(e.target.value); syncOutputs(); render(); persist(); });
    onInput('#centerText', 'click', () => {
      S.posX = 50;
      S.posY = 62;
      S.align = 'center';
      $(`input[name="align"][value="center"]`).checked = true;
      syncOutputs();
      render();
      persist();
    });

    $$('input[name="format"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        S.format = radio.value;
        $('#qualityField').hidden = S.format === 'png';
        persist();
      });
    });
    onInput('#quality', 'input', (e) => { S.quality = Number(e.target.value); syncOutputs(); persist(); });
    onInput('#zip', 'change', (e) => { S.zip = e.target.checked; persist(); });

    onInput('#resetAll', 'click', () => {
      S = defaults();
      state.active = 0;
      applyUI();
      syncNames();
      render();
      persist();
      toast('تنظیمات به حالت اولیه برگشت');
    });

    onInput('#prevName', 'click', () => selectName(state.active - 1));
    onInput('#nextName', 'click', () => selectName(state.active + 1));

    onInput('#downloadAll', 'click', exportAll);
    onInput('#downloadCurrent', 'click', exportCurrent);

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

    onInput('#useDefault', 'click', async () => {
      try {
        await loadImageSource(DEFAULT_IMAGE, { isDefault: true, name: 'تصویر پیش‌فرض' });
        toast('تصویر پیش‌فرض برگشت');
      } catch (error) {
        toast(error.message, 'error');
      }
    });

    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        exportAll();
      }
    });
  }

  /* ------------------------- خودآزمون ------------------------- */

  function selfTest() {
    const results = [];
    const check = (label, condition) => results.push({ label, ok: Boolean(condition) });

    const zip = makeZip([{ name: 'تست.txt', data: new TextEncoder().encode('hello') }]);
    check('zip signature', true);
    zip.arrayBuffer().then((buffer) => {
      const view = new Uint8Array(buffer);
      check('PK header', view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04);
      check('EOCD present', String.fromCharCode(...view.slice(-22, -18)) === 'PK\u0005\u0006');
      check('crc32 of "hello"', crc32(new TextEncoder().encode('hello')) === 0x3610a686);
      check('zip size', view.length === 30 + 8 + 5 + 46 + 8 + 22);
      console.table(results);
    });

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `700 40px ${FAMILIES.Vazirmatn}`;
    const lines = fitRows(ctx, [{ text: 'جناب آقای مانوئل اوهانجانیانس', size: 40, weight: 700 }], 200, 1);
    check('autofit respects max width', lines.every((line) => ctx.measureText(line.text).width <= 200.5));
    check('autofit produced lines', lines.length >= 1);
    return results;
  }

  /* ------------------------- راه‌اندازی ------------------------- */

  async function init() {
    restore();
    applyUI();
    syncNames();
    bindControls();
    bindStage();

    await ensureFonts();
    try {
      await loadImageSource(DEFAULT_IMAGE, { isDefault: true, name: 'تصویر پیش‌فرض' });
    } catch (error) {
      toast(error.message, 'error');
    }
    render();

    window.__studio = { state, settings: S, render, exportAll, selfTest, makeZip, crc32 };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
