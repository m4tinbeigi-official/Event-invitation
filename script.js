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

        callback(canvas, name); // Pass canvas and name to callback
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

    const names = maleNames.concat(femaleNames);

    // Clear previous previews
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = ''; // Clear previous previews

    // For each name, create a preview
    names.forEach((name) => {
        drawTextOnImage(image, name, settings, function (canvas, name) {
            // Create a new image element for the preview
            const previewClone = document.createElement('img');
            previewClone.src = canvas.toDataURL('image/jpeg'); // Create the image preview
            previewClone.setAttribute('data-name', name); // Set a custom attribute to track the name
            previewContainer.appendChild(previewClone); // Add the preview image to the container
        });
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

    // Create an array to store canvas data
    const canvases = [];

    // Generate the canvases for each name
    names.forEach((name) => {
        drawTextOnImage(image, name, settings, function (canvas, name) {
            canvases.push({ canvas, name });
        });
    });

    // Download all images once all are ready
    Promise.all(canvases.map((item) => new Promise((resolve) => {
        const canvas = item.canvas;
        const dataUrl = canvas.toDataURL('image/jpeg'); // Change to 'image/jpeg' for jpg format
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${item.name}.jpg`; // Use name as the filename for the image
        link.click();
        resolve(); // Resolve each promise after the download is triggered
    }))).then(() => {
        alert('All invitations have been downloaded.');
    });
});
