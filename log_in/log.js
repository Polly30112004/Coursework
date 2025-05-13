document.addEventListener('DOMContentLoaded', function() {
    if (!document.querySelector('.carousel')) return;
    
    const carousel = document.querySelector('.carousel');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const testimonials = document.querySelectorAll('.testimonial');
    const gap = 20; 
    
    let currentIndex = 0;
    let itemWidth;
    
    function updateItemWidth() {
        itemWidth = testimonials[0].offsetWidth + gap;
    }
    
    function moveCarousel() {
        carousel.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % testimonials.length;
        moveCarousel();
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
        moveCarousel();
    }
    
    updateItemWidth();
    moveCarousel();
    
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
    window.addEventListener('resize', function() {
        updateItemWidth();
        moveCarousel();
    });

    let autoSlide = setInterval(nextSlide, 5000);
    carousel.addEventListener('mouseenter', () => clearInterval(autoSlide));
    carousel.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 5000);
    });
});