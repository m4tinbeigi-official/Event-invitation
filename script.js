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
        defaultImage.src = 'default-image-yektanet.jpg';
    }
});

document.getElementById('preview').addEventListener('click', function() {
    const image = document.getElementById('defaultImage');
    const maleNames = document.getElementById('maleNames').value.split('\n');
    const femaleNames = document.getElementById('femaleNames').value.split('\n');
    const fontColor = document.getElementById('fontColor').value;
    const fontSize = document.getElementById('fontSize').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const startX = parseInt(document.getElementById('startX').value);
    const startY = parseInt(document.getElementById('startY').value);
    const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
    const addPrefix = document.querySelector('input[name="addPrefix"]:checked').value;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Wait for the image to load before drawing on canvas
    image.onload = function() {
        // Set canvas size to match the image size
        canvas.width = image.width;
        canvas.height = image.height;

        // Draw the image onto the canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Set font styles
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';

        // Combine the male and female names into a single array
        const names = maleNames.concat(femaleNames);
        let yPosition = startY;

        // Loop through the names and draw them on the image
        names.forEach(name => {
            if (addPrefix === 'auto') {
                if (femaleNames.includes(name)) {
                    name = 'سرکار خانم ' + name;
                } else {
                    name = 'جناب آقای ' + name;
                }
            }
            ctx.fillText(name, startX, yPosition);
            yPosition += fontSize * 1.5; // Add some space between names
        });

        // Display the canvas as a preview
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = ''; // Clear previous previews
        previewContainer.appendChild(canvas);
    };
});

document.getElementById('generate').addEventListener('click', function() {
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