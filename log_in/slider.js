document.addEventListener('DOMContentLoaded', function() {
    const testimonials = [
        {
            text: "The transformation in my communication skills has been remarkable. I've received compliments at work about my new confidence.",
            name: "Emily",
            stars: 5,
            img: "/img/user1.jpg"
        },
        {
            text: "These techniques helped me negotiate a better salary and improve my relationships with colleagues. Worth every penny!",
            name: "David",
            stars: 5,
            img: "/img/user4.jpg"
        },
        {
            text: "Working with this professional completely transformed my approach to networking. I gained so confidence in my ability to connect with people.",
            name: "Jane",
            stars: 5,
            img: "/img/user3.jpg"
        },
        {
            text: "I never realized how much my self-doubt was holding me back until these coaching sessions. The tools I learned have been invaluable.",
            name: "Sara",
            stars: 5,
            img: "/img/user2.jpg"
        },
        {
            text: "From the first session, I felt understood and supported. My social anxiety decreased significantly after just a few meetings.",
            name: "Michael",
            stars: 4,
            img: "/img/user6.jpg"
        },
        {
            text: "The guidance I received helped me break through my communication barriers. Now I approach every conversation with clarity and purpose.",
            name: "Alex",
            stars: 5,
            img: "/img/user5.jpg"
        }
    ];



    const sliderWrapper = document.querySelector('.swiper-wrapper');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    // Создаем слайды
    testimonials.forEach(testimonial => {
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
                <img src="${testimonial.img}" alt="${testimonial.name}">
                <div class="stars">${starsHtml}</div>
            </div>
        `;
        
        sliderWrapper.appendChild(slide);
    });

    // Для бесконечной прокрутки
    const firstSlide = sliderWrapper.firstElementChild.cloneNode(true);
    sliderWrapper.appendChild(firstSlide);

    let currentIndex = 0;
    let isAnimating = false;
    let slideWidth = getSlideWidth();

    function getSlideWidth() {
        const slide = document.querySelector('.testimonial');
        return slide.offsetWidth + 20;
    }

    function updateSlidePosition(animate = true) {
        sliderWrapper.style.transition = animate ? 'transform 0.5s ease' : 'none';
        sliderWrapper.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
    }

    function nextSlide() {
        if (isAnimating) return;
        
        currentIndex++;
        isAnimating = true;
        
        if (currentIndex >= testimonials.length) {
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
            currentIndex = testimonials.length - 1;
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
});

