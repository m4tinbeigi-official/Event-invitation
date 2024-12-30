document.getElementById('generateAll').addEventListener('click', function () {
    const image = document.getElementById('defaultImage');
    const maleNames = document.getElementById('maleNames').value.split('\n').map(name => name.trim());
    const femaleNames = document.getElementById('femaleNames').value.split('\n').map(name => name.trim());
    const fontColor = document.getElementById('fontColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value, 10);
    const fontFamily = document.getElementById('fontFamily').value;
    const startX = parseInt(document.getElementById('startX').value, 10);
    const startY = parseInt(document.getElementById('startY').value, 10);
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;

    const names = maleNames.concat(femaleNames);

    image.onload = function () {
        names.forEach((name, index) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;

            // رسم تصویر پس‌زمینه
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // اضافه کردن پیشوند (در صورت انتخاب)
            if (addPrefix === 'auto') {
                if (femaleNames.includes(name)) {
                    name = 'سرکار خانم ' + name;
                } else {
                    name = 'جناب آقای ' + name;
                }
            }

            // تنظیمات متن
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = fontColor;
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'middle';

            // رسم متن روی بوم
            ctx.fillText(name, startX, startY);

            // ذخیره تصویر به‌صورت لینک دانلود
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `invitation_${index + 1}.png`;
            link.textContent = `دانلود تصویر ${index + 1}`;
            link.style.display = 'block';

            document.getElementById('previewContainer').appendChild(link);
        });
    };

    // اگر تصویر قبلاً لود شده
    if (image.complete) {
        image.onload();
    }
});
