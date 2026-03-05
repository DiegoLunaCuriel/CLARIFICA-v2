// === CUSTOM CURSOR ===
const cursor = document.getElementById('cursor-glow');

// Only init custom cursor on non-touch devices
if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    const interactiveElements = document.querySelectorAll('a, button, .service-card-flip, .proof-item');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover-active');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover-active');
        });
    });
}

// === NAVBAR SCROLL EFFECT ===
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// === MOBILE MENU ===
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileDropdown = document.getElementById('mobile-dropdown');
const mobileLinks = document.querySelectorAll('.mobile-link');

mobileMenuBtn.addEventListener('click', () => {
    mobileDropdown.classList.toggle('active');
    
    // Animar icono de hamburguesa a X (simulación básica de CSS logic)
    if (mobileDropdown.classList.contains('active')) {
        mobileMenuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    } else {
        mobileMenuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
    }
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileDropdown.classList.remove('active');
        // Reset icon
        mobileMenuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
    });
});

// === ANIMACIONES REVEAL ON SCROLL ===
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            
            // Animacion extra: si es un card 3D, añadir efecto de "entrada"
            if (entry.target.classList.contains('service-card-flip')) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
            
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
});

// === CONTADORES ANIMADOS ===
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target.querySelector('.counter');
            if (counter && !counter.classList.contains('counted')) {
                animateCounter(counter);
                counter.classList.add('counted');
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-card').forEach(el => {
    counterObserver.observe(el);
});

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16); // 60fps aprox
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// === PARTÍCULAS BACKGROUND (Debido a Performance, limitadas) ===
const initParticles = () => {
    const container = document.getElementById('particles-container');
    // Chequear isMobile para no saturar
    const particleCount = window.innerWidth < 768 ? 20 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random pos
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        
        // Random movement vector
        const tx = (Math.random() - 0.5) * 500 + 'px';
        const ty = (Math.random() - 1) * 800 + 'px'; // Move mainly up
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        
        particle.style.setProperty('--translateX', tx);
        particle.style.setProperty('--translateY', ty);
        
        particle.style.animationDelay = (Math.random() * 20) + 's';
        particle.style.animationDuration = (15 + Math.random() * 15) + 's';
        
        container.appendChild(particle);
    }
};

// Cargar particulas un poco después para priorizar carga inicial
setTimeout(initParticles, 1000);

// === FLIP CARDS MOBILE FIX ===
// En dispositivos móviles, el hover no funciona bien, usamos tap
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

if (isTouchDevice) {
    document.querySelectorAll('.service-card-flip').forEach(card => {
        card.addEventListener('click', function() {
            // Eliminar clase de las demas
            document.querySelectorAll('.service-card-flip').forEach(otherCard => {
                if(otherCard !== this) otherCard.classList.remove('is-flipped');
            });
            // Togglear en la actual
            this.classList.toggle('is-flipped');
        });
    });
}

// Parallax simple para el bg gradient del hero
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroBg = document.querySelector('.hero-bg-gradient');
    if (heroBg && scrolled < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrolled * 0.4}px)`;
    }
});
