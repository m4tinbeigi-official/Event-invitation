document.getElementById('generate').addEventListener('click', function () {
    const image = document.getElementById('defaultImage');
    const maleNames = document.getElementById('maleNames').value.trim().split('\n');
    const femaleNames = document.getElementById('femaleNames').value.trim().split('\n');
    const fontColor = document.getElementById('fontColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value, 10);
    const fontFamily = document.getElementById('fontFamily').value;
    const startX = parseInt(document.getElementById('startX').value, 10);
    const startY = parseInt(document.getElementById('startY').value, 10);
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;

    const names = maleNames.concat(femaleNames);

    // Wait for the image to load
    image.onload = function () {
        names.forEach((name, index) => {
            // Create a new canvas for each name
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw the image
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // Set font styles
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = fontColor;
            ctx.textAlign = textAlign;

            // Add prefix if needed
            if (addPrefix === 'auto') {
                if (femaleNames.includes(name)) {
                    name = `سرکار خانم ${name}`;
                } else {
                    name = `جناب آقای ${name}`;
                }
            }

            // Draw the text
            ctx.fillText(name, startX, startY);

            // Save the canvas as an image
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `invitation_${index + 1}.png`;
            link.click();
        });
    };

    // Trigger the image load
    if (!image.complete) {
        image.src = image.src; // Reload the image
    } else {
        image.onload();
    }
});
