document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const testimonials = document.querySelectorAll('.testimonial');
    
    let currentScrollPosition = 0;
    let scrollAmount = 0;
    
    function calculateScrollAmount() {
        const testimonialWidth = testimonials[0].offsetWidth + 20; // включая gap
        if (window.innerWidth < 768) {
            return testimonialWidth;
        } else if (window.innerWidth < 992) {
            return testimonialWidth * 2;
        } else {
            return testimonialWidth * 3;
        }
    }
    
    function scrollCarousel(direction) {
        scrollAmount = calculateScrollAmount();
        currentScrollPosition += direction * scrollAmount;
        
        // Ограничиваем прокрутку
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        currentScrollPosition = Math.max(0, Math.min(currentScrollPosition, maxScroll));
        
        carousel.scrollTo({
            left: currentScrollPosition,
            behavior: 'smooth'
        });
    }
    
    prevBtn.addEventListener('click', () => scrollCarousel(-1));
    nextBtn.addEventListener('click', () => scrollCarousel(1));
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        scrollAmount = calculateScrollAmount();
    });
    
    // Инициализация
    scrollAmount = calculateScrollAmount();
    
    // Добавляем обработчики для свайпа на мобильных устройствах
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            scrollCarousel(1); // Свайп влево
        }
        if (touchEndX > touchStartX + 50) {
            scrollCarousel(-1); // Свайп вправо
        }
    }
});