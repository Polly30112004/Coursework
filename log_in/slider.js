import { getTranslations } from '/header_footer/language-switcher.js';

document.addEventListener('DOMContentLoaded', function () {
    const sliderWrapper = document.querySelector('.swiper-wrapper');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // Базовые данные для отзывов (изображения и звёзды)
    const testimonialBaseData = [
        { img: "/img/user1.jpg", stars: 5, name: "Emily" },
        { img: "/img/user4.jpg", stars: 5, name: "David" },
        { img: "/img/user3.jpg", stars: 5, name: "Jane" },
        { img: "/img/user2.jpg", stars: 5, name: "Sara" },
        { img: "/img/user6.jpg", stars: 4, name: "Michael" },
        { img: "/img/user5.jpg", stars: 5, name: "Alex" }
    ];

    function renderTestimonials(lang) {
        const translations = getTranslations(lang);
        const testimonials = translations.login_page.block2.testimonials;

        // Очищаем слайдер
        sliderWrapper.innerHTML = '';

        // Создаём слайды
        testimonials.forEach((testimonial, index) => {
            const slide = document.createElement('div');
            slide.className = 'testimonial';

            let starsHtml = '';
            for (let j = 0; j < 5; j++) {
                starsHtml += `<img src="${j < testimonial.stars ? '/img/star.svg' : '/img/nostar.svg'}" alt="star">`;
            }

            slide.innerHTML = `
                <p class="testimonial-text">"${testimonial.text}"</p>
                <div class="client-info">
                    <p class="client-name">${testimonial.name}</p>
                    <img src="${testimonialBaseData[index].img}" alt="${testimonial.name}">
                    <div class="stars">${starsHtml}</div>
                </div>
            `;

            sliderWrapper.appendChild(slide);
        });

        // Добавляем первый слайд для бесконечной прокрутки
        const firstSlide = sliderWrapper.firstElementChild.cloneNode(true);
        sliderWrapper.appendChild(firstSlide);
    }

    // Инициализация слайдера
    let currentIndex = 0;
    let isAnimating = false;
    let slideWidth = getSlideWidth();

    function getSlideWidth() {
        const slide = document.querySelector('.testimonial');
        return slide ? slide.offsetWidth + 20 : 0;
    }

    function updateSlidePosition(animate = true) {
        sliderWrapper.style.transition = animate ? 'transform 0.5s ease' : 'none';
        sliderWrapper.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
    }

    function nextSlide() {
        if (isAnimating) return;

        currentIndex++;
        isAnimating = true;

        if (currentIndex >= testimonialBaseData.length) {
            setTimeout(() => {
                currentIndex = 0;
                updateSlidePosition(false);
            }, 500);
        }

        updateSlidePosition();
    }

    function prevSlide() {
        if (isAnimating) return;

        currentIndex--;
        isAnimating = true;

        if (currentIndex < 0) {
            currentIndex = testimonialBaseData.length - 1;
            updateSlidePosition(false);
            setTimeout(() => {
                updateSlidePosition(true);
            }, 10);
        } else {
            updateSlidePosition();
        }
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    sliderWrapper.addEventListener('transitionend', () => {
        isAnimating = false;
    });

    window.addEventListener('resize', () => {
        slideWidth = getSlideWidth();
        updateSlidePosition(false);
    });

    // Инициализация с текущим языком
    const currentLang = localStorage.getItem('language') || 'en';
    renderTestimonials(currentLang);

    // Обновление при смене языка
    document.addEventListener('languageChanged', (e) => {
        renderTestimonials(e.detail.language);
        slideWidth = getSlideWidth();
        currentIndex = 0;
        updateSlidePosition(false);
    });
});