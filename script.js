document.getElementById('imageUpload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const defaultImage = document.getElementById('defaultImage');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            defaultImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        defaultImage.src = 'default-image-yektanet.jpg';
    }
});

function drawTextOnImage(imageSrc, name, settings, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.src = imageSrc;
    image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;

        // رسم تصویر
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // تنظیمات متن
        ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
        ctx.fillStyle = settings.fontColor;
        ctx.textAlign = settings.textAlign;
        ctx.textBaseline = 'middle';

        // افزودن پیشوند به نام
        if (settings.addPrefix === 'auto') {
            if (settings.femaleNames.includes(name)) {
                name = 'سرکار خانم ' + name;
            } else {
                name = 'جناب آقای ' + name;
            }
        }

        // رسم متن روی تصویر
        ctx.fillText(name, settings.startX, settings.startY);

        // بازگشت نتیجه
        callback(canvas, name);
    };
}

document.getElementById('preview').addEventListener('click', function () {
    const imageSrc = document.getElementById('defaultImage').src;
    const maleNames = document.getElementById('maleNames').value.split('\n').filter(Boolean);
    const femaleNames = document.getElementById('femaleNames').value.split('\n').filter(Boolean);
    const fontColor = document.getElementById('fontColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value, 10);
    const fontFamily = document.getElementById('fontFamily').value;
    const startX = parseInt(document.getElementById('startX').value, 10);
    const startY = parseInt(document.getElementById('startY').value, 10);
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;

    const settings = { fontColor, fontSize, fontFamily, startX, startY, textAlign, addPrefix, femaleNames };
    const names = maleNames.concat(femaleNames);

    // پاک کردن پیش‌نمایش‌های قبلی
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';

    // تولید پیش‌نمایش برای هر نام
    names.forEach((name) => {
        drawTextOnImage(imageSrc, name, settings, function (canvas) {
            const previewClone = document.createElement('img');
            previewClone.src = canvas.toDataURL('image/jpeg');
            previewContainer.appendChild(previewClone);
        });
    });
});

document.getElementById('generate').addEventListener('click', function () {
    const imageSrc = document.getElementById('defaultImage').src;
    const maleNames = document.getElementById('maleNames').value.split('\n').filter(Boolean);
    const femaleNames = document.getElementById('femaleNames').value.split('\n').filter(Boolean);
    const fontColor = document.getElementById('fontColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value, 10);
    const fontFamily = document.getElementById('fontFamily').value;
    const startX = parseInt(document.getElementById('startX').value, 10);
    const startY = parseInt(document.getElementById('startY').value, 10);
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;

    const settings = { fontColor, fontSize, fontFamily, startX, startY, textAlign, addPrefix, femaleNames };
    const names = maleNames.concat(femaleNames);

    names.forEach((name) => {
        drawTextOnImage(imageSrc, name, settings, function (canvas, name) {
            const dataUrl = canvas.toDataURL('image/jpeg');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${name}.jpg`;
            link.click();
        });
    });

    alert('تمام دعوت‌نامه‌ها دانلود شدند.');
});
