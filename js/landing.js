document.addEventListener('DOMContentLoaded', function() {
    // Carousel functionality
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const nextButton = document.querySelector('.carousel-control.next');
    const prevButton = document.querySelector('.carousel-control.prev');
    
    let currentSlide = 0;
    const slidesToShow = window.innerWidth > 768 ? 3 : 1;
    const slideWidth = 100 / slidesToShow;
    
    // Set slide width
    slides.forEach(slide => {
        slide.style.minWidth = `${slideWidth}%`;
    });
    
    // Next/Prev button functionality
    nextButton.addEventListener('click', () => {
        if (currentSlide >= slides.length - slidesToShow) {
            // Loop back to start
            currentSlide = 0;
        } else {
            currentSlide++;
        }
        updateSlidePosition();
    });
    
    prevButton.addEventListener('click', () => {
        if (currentSlide <= 0) {
            // Loop to end
            currentSlide = slides.length - slidesToShow;
        } else {
            currentSlide--;
        }
        updateSlidePosition();
    });
    
    // Update slide position
    function updateSlidePosition() {
        track.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
    }
    
    // Auto-rotate carousel
    setInterval(() => {
        if (currentSlide >= slides.length - slidesToShow) {
            currentSlide = 0;
        } else {
            currentSlide++;
        }
        updateSlidePosition();
    }, 5000);
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Language dropdown toggle
    const languageToggle = document.getElementById('language-toggle');
    const languageDropdown = document.getElementById('language-dropdown');
    
    languageToggle.addEventListener('click', () => {
        languageDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageToggle.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.add('hidden');
        }
    });
    
    // Language selection
    const languageOptions = document.querySelectorAll('.language-option');
    const footerLanguageSelector = document.getElementById('footer-language-selector');
    
    languageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = option.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            loadLanguage(lang);
            languageDropdown.classList.add('hidden');
            
            // Update footer selector
            if (footerLanguageSelector) {
                footerLanguageSelector.value = lang;
            }
        });
    });
    
    // Footer language selector
    if (footerLanguageSelector) {
        footerLanguageSelector.addEventListener('change', function() {
            const lang = this.value;
            localStorage.setItem('language', lang);
            loadLanguage(lang);
        });
    }
    
    // Magic particles animation
    const particles = document.querySelector('.magic-particles');
    if (particles) {
        for (let i = 0; i < 50; i++) {
            createParticle(particles);
        }
    }
    
    function createParticle(container) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 5 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        particle.style.animation = `float ${duration}s ${delay}s infinite alternate`;
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        particle.style.backgroundColor = 'white';
        particle.style.borderRadius = '50%';
        particle.style.position = 'absolute';
        
        container.appendChild(particle);
    }
    
    // Add animation for countdown timers
    document.querySelectorAll('.step-number').forEach(number => {
        number.innerHTML = `<span class="number-inner">${number.textContent}</span>`;
    });
    
    // Initialize with current language
    const currentLang = localStorage.getItem('language') || 'en';
    if (footerLanguageSelector) {
        footerLanguageSelector.value = currentLang;
    }
    
    // CountUp animation for statistics
    const statElements = document.querySelectorAll('.count-up');
    const options = {
        threshold: 0.7
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseInt(target.getAttribute('data-end-value'));
                let currentValue = 0;
                const duration = 2000; // 2 seconds
                const increment = Math.ceil(endValue / (duration / 16)); // 60fps
                
                const counter = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= endValue) {
                        target.textContent = endValue.toLocaleString();
                        clearInterval(counter);
                    } else {
                        target.textContent = currentValue.toLocaleString();
                    }
                }, 16);
                
                observer.unobserve(target);
            }
        });
    }, options);
    
    statElements.forEach(stat => {
        observer.observe(stat);
    });
    
    // Responsive adjustments
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        const slidesToShowNew = isMobile ? 1 : 3;
        const slideWidthNew = 100 / slidesToShowNew;
        
        if (slidesToShow !== slidesToShowNew) {
            slides.forEach(slide => {
                slide.style.minWidth = `${slideWidthNew}%`;
            });
            currentSlide = 0;
            updateSlidePosition();
        }
    }
    
    window.addEventListener('resize', handleResize);
    
    // Add CSS animation class based on scroll position
    function animateOnScroll() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        const triggerBottom = window.innerHeight * 0.8;
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < triggerBottom) {
                element.classList.add('animated');
            }
        });
    }
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Initial check
});

// Add custom animation to key elements when they enter viewport
const animatedElements = document.querySelectorAll('.benefit-card, .step-card, .testimonial-card, .pricing-card');
const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            animationObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

animatedElements.forEach(element => {
    animationObserver.observe(element);
});