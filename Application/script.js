document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    const convertBtn = document.getElementById('convert-btn');
    const progressBar = document.querySelector('.progress-bar');
    const statusText = document.getElementById('status-text');
    const downloadContainer = document.getElementById('download-container');
    const downloadLink = document.getElementById('download-link');

    // File selection handler
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
            statusText.textContent = 'Ready to convert';
            downloadContainer.classList.add('hidden');
        } else {
            fileName.textContent = 'No file chosen';
        }
    });

    // Convert button handler (single event listener)
    convertBtn.addEventListener('click', async () => {
        if (!fileInput.files || fileInput.files.length === 0) {
            statusText.textContent = 'Please select a file first';
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('document', file);

        // Get customization options
        const audienceLevel = document.querySelector('input[name="audience"]:checked').value;
        const presentationLength = document.getElementById('length-select').value;
        const includeSummary = document.getElementById('include-summary').checked;
        const includeAppendix = document.getElementById('include-appendix').checked;

        // UI updates
        convertBtn.disabled = true;
        statusText.textContent = 'Uploading file...';
        progressBar.style.width = '20%';

        try {
            // First upload the file to the backend with customization options
            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Conversion complete!');
            }

            const { fileId } = await uploadResponse.json();
            statusText.textContent = 'Converting to PowerPoint...';
            progressBar.style.width = '50%';

            // Then trigger the conversion with customization parameters
            const convertResponse = await fetch(`http://localhost:5000/api/convert/${fileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audience: audienceLevel,
                    length: presentationLength,
                    summary: includeSummary,
                    appendix: includeAppendix
                })
            });

            if (!convertResponse.ok) {
                throw new Error('Conversion failed');
            }

            const { pptxUrl, filename } = await convertResponse.json();
            statusText.textContent = 'Conversion complete!';
            progressBar.style.width = '100%';

            // Show download link
            downloadLink.href = pptxUrl;
            downloadLink.textContent = `Download ${filename}`;
            downloadContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = `Error: ${error.message}`;
            progressBar.style.width = '0%';
        } finally {
            convertBtn.disabled = false;
        }
    });
});