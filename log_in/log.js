document.addEventListener('DOMContentLoaded', () => {
    initCommentsSwiper();
});


document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const passwordInput = document.getElementById('password');
    let errorMessage = document.getElementById('error-message');

    nameInput.style.borderColor = '';
    passwordInput.style.borderColor = '';
    if (errorMessage) {
        errorMessage.textContent = '';
    }

    const name = nameInput.value.trim();
    const password = passwordInput.value;

    try {
        const response = await fetch(`http://localhost:3000/users?name=${name}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const users = await response.json();

        if (users.length > 0 && users[0].password === password) {
            localStorage.setItem('currentUser', JSON.stringify({
                userName: users[0].name,
                bestScore: users[0].bestScore
            }));

            window.location.href = '/catalog/catalog.html';
        } else {
            nameInput.style.borderColor = 'red';
            passwordInput.style.borderColor = 'red';

            if (!errorMessage) {
                errorMessage = document.createElement('div');
                errorMessage.id = 'error-message';
                errorMessage.style.color = 'red';
                errorMessage.style.marginTop = '10px';
                document.getElementById('loginForm').appendChild(errorMessage);
            }
            errorMessage.textContent = 'Invalid username or password';
        }
    } catch (error) {
        console.error('Error during login:', error.message, error.stack);

        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'error-message';
            errorMessage.style.color = 'red';
            errorMessage.style.marginTop = '10px';
            document.getElementById('loginForm').appendChild(errorMessage);
        }
        errorMessage.textContent = 'An error occurred. Please try again.';
    }
});

function createSamplePDF() {
    const pdfContent = `
        %PDF-1.3
        1 0 obj
        << /Type /Catalog /Pages 2 0 R >>
        endobj
        2 0 obj
        << /Type /Pages /Kids [3 0 R] /Count 1 >>
        endobj
        3 0 obj
        << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
        endobj
        4 0 obj
        << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
        endobj
        5 0 obj
        << /Length 73 >>
        stream
        BT
        /F1 24 Tf
        100 700 Td
        (Live Life at the Full Potential) Tj
        ET
        endstream
        endobj
        xref
        0 6
        0000000000 65535 f 
        0000000009 00000 n 
        0000000058 00000 n 
        0000000111 00000 n 
        0000000223 00000 n 
        0000000278 00000 n 
        trailer
        << /Size 6 /Root 1 0 R >>
        startxref
        364
        %%EOF
    `;
    
    return new Blob([pdfContent], { type: 'application/pdf' });
}

   
    // Кнопка "Download my free guide" - скачивание файла
    const downloadGuideBtn = document.querySelector('.block3 .btn');
    if (downloadGuideBtn) {
        downloadGuideBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Создаем и скачиваем файл сразу без подтверждения
            const pdfBlob = createSamplePDF();
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Live-Life-at-the-Full-Potential.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    