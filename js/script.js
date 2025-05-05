document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initTestimonialSlider();
    initSmoothScrolling();
    initFormValidation();
    init3DCards();
    initScrollAnimations();
    initOrderPopup();
    initAboutInteraction();
    initCardSlider();
    initScrollIndicator();
    initVideoModal();
    initCustomCursor();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const menuOverlay = document.querySelector('.menu-overlay');
    
    if (hamburger && mobileNav && menuOverlay) {
        // Toggle mobile menu when hamburger is clicked
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileNav.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
        
        // Close menu when clicking the overlay
        menuOverlay.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
        
        // Close menu when clicking a menu link
        const mobileLinks = document.querySelectorAll('.mobile-nav-links a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
        
        // Check screen size on load and resize
        function checkScreenSize() {
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile-device');
            } else {
                document.body.classList.remove('mobile-device');
                // Reset mobile menu when switching to desktop
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        }
        
        // Initial check
        checkScreenSize();
        
        // Check on resize
        window.addEventListener('resize', checkScreenSize);
    }
}

/**
 * 3D Card Interactions
 */
function init3DCards() {
    const cardScene = document.querySelector('.card-3d-scene');
    const cards = document.querySelectorAll('.card-3d');
    
    if (!cardScene || cards.length === 0) return;
    
    // Add 3D effect on mouse move
    cardScene.addEventListener('mousemove', (e) => {
        const rect = cardScene.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        // Calculate rotation values based on mouse position
        const rotateY = mouseX * 0.02;
        const rotateX = -mouseY * 0.02;
        
        // Apply rotation to each card with different intensity
        cards.forEach((card, index) => {
            const intensity = 1 - (index * 0.2); // Decrease intensity for cards in the back
            card.style.transform = `
                translate(-50%, -50%) 
                rotateY(${rotateY * intensity}deg) 
                rotateX(${rotateX * intensity}deg) 
                translateZ(${-50 * index}px)
            `;
        });
    });
    
    // Reset cards position when mouse leaves
    cardScene.addEventListener('mouseleave', () => {
        cards.forEach((card, index) => {
            // Reset to original positions
            if (index === 0) {
                card.style.transform = 'translate(-50%, -50%) rotateY(-5deg) rotateX(5deg) translateZ(0)';
            } else if (index === 1) {
                card.style.transform = 'translate(-50%, -50%) rotateY(-15deg) rotateX(10deg) translateZ(-50px)';
            } else if (index === 2) {
                card.style.transform = 'translate(-50%, -50%) rotateY(-25deg) rotateX(15deg) translateZ(-100px)';
            } else {
                card.style.transform = 'translate(-50%, -50%) rotateY(-35deg) rotateX(20deg) translateZ(-150px)';
            }
        });
    });
    
    // Add floating animation
    const floatingAnimation = `
        @keyframes floating {
            0% { transform: translate(-50%, -50%) translateY(0) rotateY(-5deg) rotateX(5deg); }
            50% { transform: translate(-50%, -50%) translateY(-10px) rotateY(-5deg) rotateX(5deg); }
            100% { transform: translate(-50%, -50%) translateY(0) rotateY(-5deg) rotateX(5deg); }
        }
        
        @keyframes floating-secondary {
            0% { transform: translate(-50%, -50%) translateY(0) rotateY(-15deg) rotateX(10deg) translateZ(-50px); }
            50% { transform: translate(-50%, -50%) translateY(-5px) rotateY(-15deg) rotateX(10deg) translateZ(-50px); }
            100% { transform: translate(-50%, -50%) translateY(0) rotateY(-15deg) rotateX(10deg) translateZ(-50px); }
        }
        
        @keyframes floating-accent {
            0% { transform: translate(-50%, -50%) translateY(0) rotateY(-25deg) rotateX(15deg) translateZ(-100px); }
            50% { transform: translate(-50%, -50%) translateY(-3px) rotateY(-25deg) rotateX(15deg) translateZ(-100px); }
            100% { transform: translate(-50%, -50%) translateY(0) rotateY(-25deg) rotateX(15deg) translateZ(-100px); }
        }
        
        @keyframes floating-teal {
            0% { transform: translate(-50%, -50%) translateY(0) rotateY(-35deg) rotateX(20deg) translateZ(-150px); }
            50% { transform: translate(-50%, -50%) translateY(-2px) rotateY(-35deg) rotateX(20deg) translateZ(-150px); }
            100% { transform: translate(-50%, -50%) translateY(0) rotateY(-35deg) rotateX(20deg) translateZ(-150px); }
        }
        
        .card-primary {
            animation: floating 4s ease-in-out infinite;
        }
        
        .card-secondary {
            animation: floating-secondary 4s ease-in-out infinite 0.5s;
        }
        
        .card-accent {
            animation: floating-accent 4s ease-in-out infinite 1s;
        }
        
        .card-teal {
            animation: floating-teal 4s ease-in-out infinite 1.5s;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = floatingAnimation;
    document.head.appendChild(styleElement);
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animatedElements.length === 0) return;
    
    // Activate animations for elements in viewport on page load
    checkAnimations();
    
    // Check for animations when scrolling
    window.addEventListener('scroll', checkAnimations);
    
    function checkAnimations() {
        animatedElements.forEach(element => {
            // Get element position relative to viewport
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150; // Visibility threshold
            
            // If element is in viewport
            if (elementTop < window.innerHeight - elementVisible) {
                // Add active class with delay if specified
                const delay = element.dataset.delay || 0;
                setTimeout(() => {
                    element.classList.add('active');
                }, delay);
            }
        });
    }
    
    // Initialize first animations immediately
    document.querySelectorAll('.hero-text, .hero-visual').forEach(element => {
        setTimeout(() => {
            element.classList.add('active');
        }, 300);
    });
    
    // Initialize hero features with a delay
    setTimeout(() => {
        document.querySelector('.hero-features')?.classList.add('active');
    }, 800);
}

/**
 * Testimonial Slider Functionality
 */
function initTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial-slider .testimonial');
    const dots = document.querySelectorAll('.testimonial-slider .dot');
    const prevBtn = document.querySelector('.testimonial-slider .prev-btn');
    const nextBtn = document.querySelector('.testimonial-slider .next-btn');
    let currentTestimonial = 0;
    let testimonialInterval;
    
    if (testimonials.length === 0) return;
    
    // Function to show a specific testimonial
    function showTestimonial(index) {
        // Hide all testimonials
        testimonials.forEach(testimonial => {
            testimonial.classList.remove('active');
        });
        
        // Remove active class from all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show the current testimonial and activate the corresponding dot
        testimonials[index].classList.add('active');
        dots[index].classList.add('active');
        
        // Update current testimonial index
        currentTestimonial = index;
    }
    
    // Function to show the next testimonial
    function nextTestimonial() {
        let next = currentTestimonial + 1;
        if (next >= testimonials.length) {
            next = 0;
        }
        showTestimonial(next);
    }
    
    // Function to show the previous testimonial
    function prevTestimonial() {
        let prev = currentTestimonial - 1;
        if (prev < 0) {
            prev = testimonials.length - 1;
        }
        showTestimonial(prev);
    }
    
    // Set up event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showTestimonial(index);
            resetInterval();
        });
    });
    
    // Set up event listeners for prev/next buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevTestimonial();
            resetInterval();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextTestimonial();
            resetInterval();
        });
    }
    
    // Start automatic slideshow
    function startInterval() {
        testimonialInterval = setInterval(nextTestimonial, 6000);
    }
    
    // Reset interval when user interacts with slider
    function resetInterval() {
        clearInterval(testimonialInterval);
        startInterval();
    }
    
    // Initialize the slider
    showTestimonial(0);
    startInterval();
}

/**
 * Smooth Scrolling for Anchor Links
 */
function initSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Get the height of the fixed header
                const headerHeight = document.querySelector('header').offsetHeight;
                
                // Calculate the target position with offset for the header
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                // Smooth scroll to the target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL hash without scrolling
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Form Validation
 */
function initFormValidation() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form fields
            const nameField = document.getElementById('name');
            const emailField = document.getElementById('email');
            const subjectField = document.getElementById('subject');
            const messageField = document.getElementById('message');
            
            // Simple validation
            let isValid = true;
            
            if (nameField.value.trim() === '') {
                showError(nameField, 'Please enter your name');
                isValid = false;
            } else {
                removeError(nameField);
            }
            
            if (emailField.value.trim() === '') {
                showError(emailField, 'Please enter your email');
                isValid = false;
            } else if (!isValidEmail(emailField.value)) {
                showError(emailField, 'Please enter a valid email address');
                isValid = false;
            } else {
                removeError(emailField);
            }
            
            if (subjectField.value.trim() === '') {
                showError(subjectField, 'Please enter a subject');
                isValid = false;
            } else {
                removeError(subjectField);
            }
            
            if (messageField.value.trim() === '') {
                showError(messageField, 'Please enter your message');
                isValid = false;
            } else {
                removeError(messageField);
            }
            
            // If form is valid, show success message (in a real app, you would submit the form)
            if (isValid) {
                // Create success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Thank you for your message! We will get back to you soon.';
                
                // Insert success message after the form
                contactForm.parentNode.insertBefore(successMessage, contactForm.nextSibling);
                
                // Reset the form
                contactForm.reset();
                
                // Remove success message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            }
        });
        
        // Add styles for validation messages
        const style = document.createElement('style');
        style.textContent = `
            .error-message {
                color: #e53e3e;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            
            .success-message {
                background-color: #10B981;
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-top: 1rem;
                text-align: center;
            }
            
            .form-group input.error,
            .form-group textarea.error {
                border-color: #e53e3e;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Helper function to show error message
    function showError(field, message) {
        // Remove any existing error message
        removeError(field);
        
        // Add error class to the field
        field.classList.add('error');
        
        // Create error message element
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        // Insert error message after the field
        field.parentNode.insertBefore(errorMessage, field.nextSibling);
    }
    
    // Helper function to remove error message
    function removeError(field) {
        // Remove error class from the field
        field.classList.remove('error');
        
        // Remove any existing error message
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    // Helper function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

/**
 * Sticky Header on Scroll
 */
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    
    if (window.scrollY > 50) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }
});

// Add sticky header styles
const stickyStyles = document.createElement('style');
stickyStyles.textContent = `
    header.sticky {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        background-color: rgba(255, 255, 255, 0.98);
        transition: all 0.3s ease;
    }
    
    header.sticky .navbar {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }
`;
document.head.appendChild(stickyStyles);

/**
 * Order Popup Functionality
 */
function initOrderPopup() {
    const orderButtons = document.querySelectorAll('a[href="#order"]');
    const popup = document.getElementById('order-popup');
    const closeBtn = document.querySelector('.close-popup');
    const optionTabs = document.querySelectorAll('.option-tab');
    const optionDetails = document.querySelectorAll('.option-details');
    const orderForm = document.getElementById('orderForm');
    
    if (!popup) return;
    
    // Open popup when clicking order buttons
    orderButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            popup.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            
            // Get product type from button context if available
            const productSection = this.closest('.product-card');
            if (productSection) {
                const productTitle = productSection.querySelector('h3').textContent.toLowerCase();
                
                // Activate the corresponding tab
                optionTabs.forEach(tab => {
                    if (tab.dataset.option.includes(productTitle)) {
                        tab.click();
                    }
                });
            }
        });
    });
    
    // Close popup
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            popup.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
    
    // Close popup when clicking outside
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
    
    // Tab switching
    optionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            optionTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all option details
            optionDetails.forEach(details => {
                details.classList.remove('active');
            });
            
            // Show the corresponding option details
            const option = tab.dataset.option;
            document.getElementById(`${option}-details`).classList.add('active');
        });
    });
    
    // Handle form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get active product
            const activeTab = document.querySelector('.option-tab.active');
            const productType = activeTab ? activeTab.dataset.option : 'standard';
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h3>Order Submitted Successfully!</h3>
                <p>Thank you for ordering the ${productType} E-VOX card. We'll contact you shortly to confirm your order.</p>
            `;
            
            // Replace form with success message
            orderForm.innerHTML = '';
            orderForm.appendChild(successMessage);
            
            // Close popup after 3 seconds
            setTimeout(() => {
                popup.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
                
                // Reset form after popup is closed
                setTimeout(() => {
                    orderForm.innerHTML = ''; // Clear success message
                    // Recreate the form (in a real app, you'd restore the original form)
                }, 500);
            }, 3000);
        });
    }
    
    // Add styles for success message
    const style = document.createElement('style');
    style.textContent = `
        .success-message {
            text-align: center;
            padding: 30px;
        }
        
        .success-message i {
            font-size: 4rem;
            color: var(--secondary);
            margin-bottom: 20px;
        }
        
        .success-message h3 {
            margin-bottom: 15px;
            color: var(--dark);
        }
        
        .success-message p {
            color: var(--medium-gray);
        }
    `;
    document.head.appendChild(style);
}

/**
 * About Section 3D Interaction
 */
function initAboutInteraction() {
    const interactionScene = document.querySelector('.interaction-scene');
    const phoneMockup = document.querySelector('.phone-mockup');
    const cardMockup = document.querySelector('.card-mockup');
    const connectionAnimation = document.querySelector('.connection-animation');
    const profileItems = document.querySelectorAll('.profile-item');
    const demoButton = document.getElementById('playDemo');
    const steps = document.querySelectorAll('.interaction-step');
    
    if (!interactionScene || !phoneMockup || !cardMockup) return;
    
    // Function to reset all animations and states
    function resetInteraction() {
        // Reset steps
        steps.forEach(step => step.classList.remove('active'));
        
        // Reset card position and visibility
        cardMockup.style.opacity = '1';
        cardMockup.style.visibility = 'visible';
        
        if (window.innerWidth <= 768) {
            // Mobile layout - card fully visible
            cardMockup.style.transform = 'translate(-50%, -50%) rotateY(0) rotateX(0) translateZ(50px)';
            // Ensure card is positioned at the bottom for better visibility
            cardMockup.style.top = '70%';
            // Ensure phone is positioned higher
            phoneMockup.style.top = '40%';
        } else {
            // Desktop layout - show full card
            cardMockup.style.transform = 'translate(0, -50%) rotateY(20deg) rotateX(-5deg)';
        }
        
        cardMockup.classList.remove('tapping');
        
        // Reset phone
        const phoneScreen = document.querySelector('.phone-screen');
        phoneScreen.style.boxShadow = '';
        
        // Reset connection animation
        connectionAnimation.classList.remove('active');
        
        // Reset profile items
        profileItems.forEach(item => {
            item.classList.remove('active');
        });
    }
    
    // Function to play the full demonstration
    function playDemonstration() {
        // Reset everything first
        resetInteraction();
        
        // Step 1: Highlight first step and animate card moving toward phone
        setTimeout(() => {
            steps[0].classList.add('active');
            cardMockup.classList.add('tapping');
        }, 300);
        
        // Step 2: Show connection animation and highlight second step
        setTimeout(() => {
            steps[0].classList.remove('active');
            steps[1].classList.add('active');
            connectionAnimation.classList.add('active');
            
            // Start fading out the card
            cardMockup.style.opacity = '0.5';
        }, 1800);
        
        // Step 2.5: Completely hide the card before showing profile
        setTimeout(() => {
            // Hide the card completely
            cardMockup.style.opacity = '0';
            cardMockup.style.visibility = 'hidden';
            
            // Highlight phone screen to indicate it's ready
            const phoneScreen = document.querySelector('.phone-screen');
            phoneScreen.style.boxShadow = '0 0 20px rgba(79, 70, 229, 0.5)';
        }, 2800);
        
        // Step 3: Show profile on phone and highlight third step
        setTimeout(() => {
            steps[1].classList.remove('active');
            steps[2].classList.add('active');
            
            // Animate profile items appearing one by one
            profileItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('active');
                }, index * 300); // Increased delay between items for better visibility
            });
        }, 3300);
        
        // Reset after demonstration completes
        setTimeout(() => {
            resetInteraction();
        }, 7000); // Increased total time to account for slower item appearance
    }
    
    // Add click event to demo button
    if (demoButton) {
        demoButton.addEventListener('click', playDemonstration);
    }
    
    // Add hover interaction for desktop
    let isHovering = false;
    
    interactionScene.addEventListener('mouseenter', () => {
        isHovering = true;
        
        // Only start hover animation if no demo is playing
        if (!steps[0].classList.contains('active') && 
            !steps[1].classList.contains('active') && 
            !steps[2].classList.contains('active')) {
            
            // Subtle animation on hover
            if (window.innerWidth > 768) {
                cardMockup.style.transform = 'translate(10%, -50%) rotateY(15deg) rotateX(-3deg)';
                phoneMockup.style.transform = 'translate(-10%, -50%) rotateY(-15deg) rotateX(3deg)';
            }
        }
    });
    
    interactionScene.addEventListener('mouseleave', () => {
        isHovering = false;
        
        // Only reset if no demo is playing
        if (!steps[0].classList.contains('active') && 
            !steps[1].classList.contains('active') && 
            !steps[2].classList.contains('active')) {
            
            // Reset positions
            if (window.innerWidth > 768) {
                cardMockup.style.transform = 'translate(0, -50%) rotateY(20deg) rotateX(-5deg)';
                phoneMockup.style.transform = 'translate(0, -50%) rotateY(-20deg) rotateX(5deg)';
            }
        }
    });
    
    // Add mouse parallax effect
    interactionScene.addEventListener('mousemove', (e) => {
        // Only apply parallax if hovering and no demo is playing
        if (isHovering && 
            !steps[0].classList.contains('active') && 
            !steps[1].classList.contains('active') && 
            !steps[2].classList.contains('active') &&
            window.innerWidth > 768) {
            
            const rect = interactionScene.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = (e.clientX - centerX) / 30;
            const mouseY = (e.clientY - centerY) / 30;
            
            // Apply subtle rotation based on mouse position
            phoneMockup.style.transform = `translate(-10%, -50%) rotateY(${-15 - mouseX}deg) rotateX(${3 + mouseY}deg)`;
            cardMockup.style.transform = `translate(10%, -50%) rotateY(${15 + mouseX}deg) rotateX(${-3 - mouseY}deg)`;
        }
    });
    
    // Handle responsive layout changes
    function updateForMobile() {
        if (window.innerWidth <= 768) {
            // Mobile layout - card fully visible at bottom
            phoneMockup.style.transform = 'translate(-50%, -50%) rotateY(0) rotateX(0)';
            phoneMockup.style.top = '40%';
            
            cardMockup.style.transform = 'translate(-50%, -50%) rotateY(0) rotateX(0) translateZ(50px)';
            cardMockup.style.top = '70%';
            cardMockup.style.opacity = '1';
            cardMockup.style.visibility = 'visible';
        } else {
            // Desktop layout - show full card
            phoneMockup.style.transform = 'translate(0, -50%) rotateY(-20deg) rotateX(5deg)';
            phoneMockup.style.top = '50%';
            
            cardMockup.style.transform = 'translate(0, -50%) rotateY(20deg) rotateX(-5deg)';
            cardMockup.style.top = '50%';
            cardMockup.style.opacity = '1';
            cardMockup.style.visibility = 'visible';
        }
    }
    
    // Update on resize
    window.addEventListener('resize', updateForMobile);
    
    // Initial setup
    updateForMobile();
    
    // Auto-play the demonstration once when the section comes into view
    let hasPlayed = false;
    
    function checkVisibility() {
        if (!hasPlayed) {
            const rect = interactionScene.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
                playDemonstration();
                hasPlayed = true;
            }
        }
    }
    
    window.addEventListener('scroll', checkVisibility);
    
    // Check visibility on page load
    setTimeout(checkVisibility, 1000);
}

// Card Showcase Functionality
function initCardSlider() {
    const scene = document.querySelector('.card-3d-scene');
    const cards = document.querySelectorAll('.card-3d');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    
    if (!scene || cards.length === 0) return;

    let currentIndex = 0;
    let isAnimating = false;
    let autoPlayInterval;

    // Initialize first card as active
    updateCards(0);

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!isAnimating) {
                navigateCards('prev');
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!isAnimating) {
                navigateCards('next');
            }
        });
    }

    // Dots navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (!isAnimating && index !== currentIndex) {
                navigateToCard(index);
            }
        });
    });

    function navigateCards(direction) {
        const newIndex = direction === 'next' 
            ? (currentIndex + 1) % cards.length
            : (currentIndex - 1 + cards.length) % cards.length;
        
        navigateToCard(newIndex);
    }

    function navigateToCard(index) {
        if (isAnimating) return;
        isAnimating = true;

        // Update cards
        updateCards(index);
        
        // Update current index
        currentIndex = index;

        // Reset animation flag
        setTimeout(() => {
            isAnimating = false;
        }, 800);
    }

    function updateCards(activeIndex) {
        // Update cards
        cards.forEach((card, index) => {
            // Remove all classes first
            card.classList.remove('active', 'prev', 'next');
            
            if (index === activeIndex) {
                card.classList.add('active');
            } else if (index === getPrevIndex(activeIndex)) {
                card.classList.add('prev');
            } else if (index === getNextIndex(activeIndex)) {
                card.classList.add('next');
            }
        });

        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });

        // Update arrow buttons
        if (prevBtn) prevBtn.style.opacity = '1';
        if (nextBtn) nextBtn.style.opacity = '1';
    }

    function getPrevIndex(current) {
        return (current - 1 + cards.length) % cards.length;
    }

    function getNextIndex(current) {
        return (current + 1) % cards.length;
    }

    // Auto-play functionality
    function startAutoPlay() {
        stopAutoPlay(); // Clear any existing interval
        autoPlayInterval = setInterval(() => {
            if (!isAnimating) {
                navigateCards('next');
            }
        }, 4000);
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    }

    // Start auto-play and handle user interaction
    startAutoPlay();
    
    scene.addEventListener('mouseenter', stopAutoPlay);
    scene.addEventListener('mouseleave', startAutoPlay);
    scene.addEventListener('touchstart', stopAutoPlay);
    scene.addEventListener('touchend', startAutoPlay);

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateCards(currentIndex);
        }, 250);
    });
}

// Scroll Indicator Functionality
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const aboutSection = document.querySelector('.about-section');
    let isVisible = true;

    // Show scroll indicator after a short delay
    setTimeout(() => {
        scrollIndicator.classList.add('visible');
    }, 1000);

    window.addEventListener('scroll', () => {
        const aboutSectionTop = aboutSection.getBoundingClientRect().top;
        const scrollPosition = window.scrollY;

        // Hide scroll indicator when about section is in view or when scrolled
        if (aboutSectionTop <= window.innerHeight * 0.5 || scrollPosition > 100) {
            if (isVisible) {
                scrollIndicator.classList.remove('visible');
                isVisible = false;
            }
        } else {
            if (!isVisible) {
                scrollIndicator.classList.add('visible');
                isVisible = true;
            }
        }
    });
}

/**
 * Video Modal Functionality
 */
function initVideoModal() {
    const videoTriggers = document.querySelectorAll('.video-trigger');
    const videoModal = document.getElementById('video-modal');
    const closeBtn = document.querySelector('.close-video');
    const videoIframe = document.querySelector('.video-container iframe');
    
    if (!videoModal || videoTriggers.length === 0) return;
    
    // Open video modal when clicking trigger
    videoTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Load iframe src only when clicked (performance optimization)
            const videoSrc = videoIframe.getAttribute('data-src');
            videoIframe.setAttribute('src', videoSrc);
            
            // Show modal
            videoModal.classList.add('active');
            document.body.classList.add('no-scroll');
        });
    });
    
    // Close modal when clicking close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVideoModal);
    }
    
    // Close modal when clicking outside
    videoModal.addEventListener('click', function(e) {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    // Close modal when pressing ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
    // Function to close video modal
    function closeVideoModal() {
        videoModal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        
        // Clear iframe src to stop video
        setTimeout(() => {
            videoIframe.setAttribute('src', 'about:blank');
        }, 300);
    }
} 

function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    if (!cursor || !cursorFollower) return;
    
    document.addEventListener('mousemove', function(e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      
      setTimeout(function() {
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
      }, 100);
    });
    
  
  }