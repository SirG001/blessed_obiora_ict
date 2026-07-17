/* ==========================================================================
   Blessed Obiora ICT Limited - Interactive Logic & UI Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sticky Header Scroll Effect ---
    const header = document.getElementById('navbar');
    const handleScrollHeader = () => {
        if (window.scrollY > 50) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
    };
    window.addEventListener('scroll', handleScrollHeader);
    handleScrollHeader(); // Trigger initially in case page loaded scrolled

    // --- Mobile Menu Toggle ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');

    const toggleMobileMenu = () => {
        const isActive = hamburgerBtn.classList.toggle('active');
        mobileOverlay.classList.toggle('active', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    };

    hamburgerBtn.addEventListener('click', toggleMobileMenu);
    
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburgerBtn.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    // --- Active Nav Link Highlighter ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    const highlightNavLink = () => {
        let scrollPosition = window.scrollY + 120; // offset for sticky header

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    window.addEventListener('scroll', highlightNavLink);

    // --- Intersection Observer for Scroll Entrance Animations ---
    const revealItems = document.querySelectorAll('.reveal-item');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Stop observing after animation triggers
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealItems.forEach(item => {
        revealObserver.observe(item);
    });

    // --- Stats Counter Animation ---
    const statsSection = document.querySelector('.stats-section');
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    const runCounters = () => {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            const duration = 2000; // 2 seconds
            const stepTime = Math.max(Math.floor(duration / target), 15);
            let current = 0;
            
            const timer = setInterval(() => {
                current += Math.ceil(target / (duration / stepTime));
                if (current >= target) {
                    stat.textContent = target;
                    clearInterval(timer);
                } else {
                    stat.textContent = current;
                }
            }, stepTime);
        });
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersStarted) {
                countersStarted = true;
                runCounters();
            }
        });
    }, { threshold: 0.5 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // --- Portfolio Filtering ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from other buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    item.classList.remove('hide');
                    // Trigger a tiny animation refresh
                    item.style.animation = 'none';
                    item.offsetHeight; // Trigger reflow
                    item.style.animation = null;
                } else {
                    item.classList.add('hide');
                }
            });
        });
    });

    // --- Testimonial Slider ---
    const sliderTrack = document.getElementById('testimonials-track');
    const dots = document.querySelectorAll('#slider-dots .dot');
    let currentIndex = 0;
    let autoSlideInterval;

    const updateSlider = (index) => {
        currentIndex = index;
        const offset = -index * 100;
        sliderTrack.style.transform = `translateX(${offset}%)`;
        
        // Update Dots
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
    };

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(autoSlideInterval);
            const index = parseInt(dot.getAttribute('data-index'), 10);
            updateSlider(index);
            startAutoSlide(); // Restart auto-sliding
        });
    });

    const startAutoSlide = () => {
        autoSlideInterval = setInterval(() => {
            let nextIndex = (currentIndex + 1) % dots.length;
            updateSlider(nextIndex);
        }, 6000); // Rotate every 6 seconds
    };
    startAutoSlide();

    // --- Interactive Contact Form Submission ---
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const successModal = document.getElementById('success-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent standard page navigation

            // Show Loading state
            submitBtn.classList.add('loading');
            submitBtn.setAttribute('disabled', 'true');

            // Simulate server network latency (1.5 seconds)
            setTimeout(() => {
                // Reset submit state
                submitBtn.classList.remove('loading');
                submitBtn.removeAttribute('disabled');

                // Trigger Modal show
                successModal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Clear input fields
                contactForm.reset();
            }, 1500);
        });
    }

    // Modal Close action
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal if user clicks background overlay
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // --- Newsletter Form Submission ---
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input');
            alert(`Thank you for subscribing! A confirmation link has been sent to: ${emailInput.value}`);
            newsletterForm.reset();
        });
    }
});
