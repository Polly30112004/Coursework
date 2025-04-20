fetch('header_footer.html')
    .then(response => response.text())
    .then(data => {
        // Создаём временный контейнер для парсинга HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');

        // Извлекаем хедер
        const headerContent = doc.querySelector('#header');
        if (headerContent) {
            document.getElementById('header').innerHTML = headerContent.outerHTML;
        }

        // Извлекаем футер
        const footerContent = doc.querySelector('#footer');
        if (footerContent) {
            document.getElementById('footer').innerHTML = footerContent.outerHTML;
        }
    })
    .catch(error => console.error('Ошибка загрузки:', error));