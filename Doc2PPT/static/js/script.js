document.addEventListener('DOMContentLoaded', () => {
    // Debugging: Log when DOM is loaded
    console.log('DOM fully loaded and parsed');

    // Get DOM elements
    const form = document.getElementById('converter-form');
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    const convertBtn = document.getElementById('convert-btn');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const downloadContainer = document.getElementById('download-container');
    const downloadLink = document.getElementById('download-link');
    const errorMessage = document.getElementById('error-message');

    // Verify all elements exist
    if (!form || !fileInput || !fileName || !convertBtn || !progressBar ||
        !statusText || !downloadContainer || !downloadLink || !errorMessage) {
        console.error('Missing required elements:', {
            form, fileInput, fileName, convertBtn,
            progressBar, statusText, downloadContainer,
            downloadLink, errorMessage
        });
        return;
    }

    // Debugging: Log form submission event
    form.addEventListener('submit', function(event) {
        console.log('Form submit event triggered');
        event.preventDefault();
        console.log('Default prevented, calling handleConversion');
        handleConversion().catch(error => {
            console.error('Conversion error:', error);
            showError(error.message || 'An error occurred during conversion');
        });
    });

    // Alternative approach: Use button click instead of form submit
    convertBtn.addEventListener('click', async function(event) {
        console.log('Convert button clicked');
        event.preventDefault();
        try {
            await handleConversion();
        } catch (error) {
            console.error('Conversion error:', error);
            showError(error.message || 'An error occurred during conversion');
        }
    });

    // File selection handler
    fileInput.addEventListener('change', () => {
        console.log('File input changed');
        resetUI();
        fileName.textContent = fileInput.files.length > 0
            ? fileInput.files[0].name
            : 'No file chosen';
    });

    // Main conversion function
    async function handleConversion() {
        console.log('Starting conversion process');
        resetUI();

        // Validate file
        if (!fileInput.files || fileInput.files.length === 0) {
            throw new Error('Please select a file first');
        }

        const file = fileInput.files[0];
        console.log('Selected file:', file.name, file.size, file.type);

        if (!validateFileType(file)) {
            throw new Error('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size too large. Maximum 10MB allowed.');
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('document', file);

        // Get options
        const options = {
            audience: document.querySelector('input[name="audience"]:checked').value,
            length: document.getElementById('length-select').value,
            summary: document.getElementById('include-summary').checked,
            appendix: document.getElementById('include-appendix').checked
        };

        console.log('Conversion options:', options);

        // UI updates
        setLoadingState(true);
        updateProgress(20, 'Uploading file...');

        try {
            // Upload file
            console.log('Uploading file to server...');
            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'File upload failed');
            }

            const uploadData = await uploadResponse.json();
            console.log('Upload response:', uploadData);

            if (!uploadData.success) {
                throw new Error(uploadData.message || 'File upload failed');
            }

            // Convert file
            updateProgress(50, 'Converting to PowerPoint...');
            console.log('Starting conversion process...');

            const convertResponse = await fetch(
                `http://localhost:5000/api/convert/${uploadData.fileId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(options),
                    credentials: 'same-origin'
                }
            );

            if (!convertResponse.ok) {
                const errorData = await convertResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Conversion failed');
            }

            const convertData = await convertResponse.json();
            console.log('Conversion response:', convertData);

            if (!convertData.success) {
                throw new Error(convertData.message || 'Conversion failed');
            }

            // Success
            updateProgress(100, 'Conversion complete!');
            showDownloadLink(convertData.downloadUrl, convertData.filename);
            console.log('Conversion successful!');

        } catch (error) {
            console.error('Error during conversion:', error);
            throw error; // Re-throw to be caught by the caller
        } finally {
            setLoadingState(false);
        }
    }

    // Helper functions
    function validateFileType(file) {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        return validTypes.includes(file.type) ||
               file.name.endsWith('.pdf') ||
               file.name.endsWith('.docx') ||
               file.name.endsWith('.txt');
    }

    function resetUI() {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
        downloadContainer.classList.add('hidden');
    }

    function showError(message) {
        console.error('Showing error:', message);
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        statusText.textContent = 'Ready to try again';
        progressBar.style.width = '0%';
    }

    function setLoadingState(isLoading) {
        console.log('Setting loading state:', isLoading);
        convertBtn.disabled = isLoading;
        if (isLoading) {
            convertBtn.innerHTML = '<span class="spinner"></span> Processing...';
        } else {
            convertBtn.textContent = 'Convert Now';
        }
    }

    function updateProgress(percent, message) {
        console.log(`Progress: ${percent}% - ${message}`);
        progressBar.style.width = `${percent}%`;
        statusText.textContent = message;
    }

    function showDownloadLink(url, filename) {
        console.log('Showing download link:', url, filename);
        downloadLink.href = url;
        downloadLink.textContent = `Download ${filename}`;
        downloadLink.setAttribute('download', filename);
        downloadContainer.classList.remove('hidden');
    }
});