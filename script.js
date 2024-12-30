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

function drawInvitations(names, ctx, canvas, options) {
    // تنظیمات بوم
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(options.image, 0, 0, canvas.width, canvas.height);

    // تنظیمات فونت
    ctx.font = `${options.fontSize}px ${options.fontFamily}`;
    ctx.fillStyle = options.fontColor;
    ctx.textAlign = options.textAlign;
    ctx.textBaseline = 'middle';

    // موقعیت اولیه
    let yPosition = options.startY;

    // رسم هر نام روی بوم
    names.forEach(name => {
        if (options.addPrefix === 'auto') {
            if (options.femaleNames.includes(name)) {
                name = 'سرکار خانم ' + name;
            } else {
                name = 'جناب آقای ' + name;
            }
        }
        ctx.fillText(name, options.startX, yPosition);
        yPosition += options.fontSize * 1.5; // فاصله بین اسامی
    });
}

document.getElementById('preview').addEventListener('click', function () {
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

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // منتظر لود شدن تصویر باشید
    image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;

        const names = maleNames.concat(femaleNames);

        drawInvitations(names, ctx, canvas, {
            image: image,
            fontColor: fontColor,
            fontSize: fontSize,
            fontFamily: fontFamily,
            startX: startX,
            startY: startY,
            textAlign: textAlign,
            addPrefix: addPrefix,
            femaleNames: femaleNames
        });

        // نمایش پیش‌نمایش
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = ''; // حذف پیش‌نمایش قبلی
        previewContainer.appendChild(canvas);
    };

    // اگر تصویر قبلاً لود شده
    if (image.complete) {
        image.onload();
    }
});

document.getElementById('generate').addEventListener('click', function () {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'invitation_image.png';
        link.click();
    } else {
        alert("لطفاً ابتدا پیش‌نمایش را مشاهده کنید.");
    }
});
