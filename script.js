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

function drawTextOnImage(image, name, settings, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Wait for the image to load
    image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;

        // Draw the image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Set text styles
        ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
        ctx.fillStyle = settings.fontColor;
        ctx.textAlign = settings.textAlign;
        ctx.textBaseline = 'middle';

        // Prepare the name (add prefix if needed)
        if (settings.addPrefix === 'auto') {
            if (settings.femaleNames.includes(name)) {
                name = 'سرکار خانم ' + name;
            } else {
                name = 'جناب آقای ' + name;
            }
        }

        // Draw the name
        const yPosition = settings.startY;
        ctx.fillText(name, settings.startX, yPosition);

        callback(canvas, name);
    };
}

document.getElementById('preview').addEventListener('click', function () {
    const image = new Image();
    image.src = document.getElementById('defaultImage').src;

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

    drawTextOnImage(image, maleNames.concat(femaleNames), settings, function (canvas) {
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = ''; // Clear previous previews
        previewContainer.appendChild(canvas);
    });
});

document.getElementById('generate').addEventListener('click', function () {
    const image = new Image();
    image.src = document.getElementById('defaultImage').src;

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

    names.forEach((name, index) => {
        drawTextOnImage(image, name, settings, function (canvas, name) {
            // Convert the canvas to a jpg image
            const dataUrl = canvas.toDataURL('image/jpeg');  // Change to 'image/jpeg' for jpg format
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${name}.jpg`; // Set the filename to the name on the image
            link.click();
        });
    });
});
