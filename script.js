document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const defaultImage = document.getElementById('defaultImage');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            defaultImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        defaultImage.src = 'IMG_20241229_141017_321~2.jpg';
    }
});

document.getElementById('preview').addEventListener('click', function() {
    const image = document.getElementById('defaultImage');
    const maleNames = document.getElementById('maleNames').value.split('\n');
    const femaleNames = document.getElementById('femaleNames').value.split('\n');
    const fontColor = document.getElementById('fontColor').value;
    const fontSize = document.getElementById('fontSize').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const startX = document.getElementById('startX').value;
    const startY = document.getElementById('startY').value;
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    const names = maleNames.concat(femaleNames);
    let yPosition = startY;

    names.forEach(name => {
        if (addPrefix === 'auto') {
            if (femaleNames.includes(name)) {
                name = 'سرکار خانم ' + name;
            } else {
                name = 'جناب آقای ' + name;
            }
        }
        ctx.fillText(name, startX, yPosition);
        yPosition += 40; // Space between names
    });

    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
});

document.getElementById('generate').addEventListener('click', function() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg');
    link.download = 'invitation.jpg';
    link.click();
});
