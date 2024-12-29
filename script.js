document.getElementById('preview').addEventListener('click', async () => {
    const files = document.getElementById('imageUpload').files;
    const maleNames = document.getElementById('maleNames').value.split('\n').map(name => name.trim());
    const femaleNames = document.getElementById('femaleNames').value.split('\n').map(name => name.trim());
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const fontColor = document.getElementById('fontColor').value;
    const fontSizeMax = parseInt(document.getElementById('fontSize').value);
    const startX = parseInt(document.getElementById('startX').value);
    const startY = parseInt(document.getElementById('startY').value);
    const fontFamily = document.getElementById('fontFamily').value;

    if (!files.length) return alert('لطفاً تصویر دعوت‌نامه را آپلود کنید!');
    if (!maleNames.length && !femaleNames.length) return alert('لطفاً حداقل یک اسم وارد کنید!');

    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';

    for (const file of files) {
        const image = await loadImage(file);

        const names = [...maleNames.map(name => addPrefix === 'auto' ? `جناب آقای ${name}` : name),
                       ...femaleNames.map(name => addPrefix === 'auto' ? `سرکار خانم ${name}` : name)];

        for (const name of names) {
            const previewImage = generateInvite(image, name, fontColor, fontSizeMax, textAlign, fontFamily, startX, startY);
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${previewImage}" alt="${name}">
                <span>${name}</span>
            `;
            previewContainer.appendChild(previewItem);
        }

        break;
    }
});

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function generateInvite(image, name, fontColor, fontSizeMax, textAlign, fontFamily, startX, startY) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    ctx.font = `${fontSizeMax}px ${fontFamily}`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = textAlign;
    ctx.fillText(name, startX, startY);

    return canvas.toDataURL('image/jpeg');
}
