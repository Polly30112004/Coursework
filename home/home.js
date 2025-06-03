// Создаем простой PDF файл для скачивания
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

// Обработчики событий для кнопок
document.addEventListener('DOMContentLoaded', function() {
    // Кнопка "Read more books" - открывает каталог с фильтрацией по книгам
    const readMoreBooksBtn = document.querySelector('.block4 .btn');
    if (readMoreBooksBtn) {
        readMoreBooksBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Сохраняем фильтр по книгам в localStorage
            localStorage.setItem('catalogFilters', JSON.stringify({
                typeFilter: 'book',
                currentPage: 1
            }));
            window.location.href = '/catalog/catalog.html';
        });
    }
    
    // Кнопка "Download my free guide" - скачивание файла
    const downloadGuideBtn = document.querySelector('.block5 .btn');
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
    
    // Кнопка "Book now" - открывает каталог с фильтрацией по индивидуальному коучингу
    const bookNowBtn = document.querySelector('.block6 .btn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Сохраняем фильтр по индивидуальному коучингу в localStorage
            // Исправлено написание на "individual coaching" (было опечатка)
            localStorage.setItem('catalogFilters', JSON.stringify({
                typeFilter: 'individual coaching',
                currentPage: 1
            }));
            window.location.href = '/catalog/catalog.html';
        });
    }
});


    const shopButton = document.querySelector('.block1 .btn');
         if (shopButton) {
        shopButton.addEventListener('click', () => {
            window.location.href = '/catalog/catalog.html';
            hamMenu.classList.remove('active');
            header.classList.remove('active');
        });
    }