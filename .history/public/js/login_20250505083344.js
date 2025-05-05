// Only initialize Firebase if it's not already initialized
if (typeof firebase !== 'undefined' && !firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

// DOM Elements
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const resetPasswordModal = document.getElementById('reset-password-modal');
const resetPasswordForm = document.getElementById('reset-password-form');
const forgotPasswordLink = document.getElementById('forgot-password');
const modalCloseBtns = document.querySelectorAll('.modal-close');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');
const googleLoginBtn = document.getElementById('google-login');
const googleRegisterBtn = document.getElementById('google-register');
const loadingOverlay = document.getElementById('loading-overlay');
const alertContainer = document.querySelector('.alert-container');

// Get Firebase auth instance
const auth = firebase.auth();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User is already signed in:', user.email);
            // User is already signed in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    });

    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Reset password form
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handlePasswordReset);
    }

    // Forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', e => {
            e.preventDefault();
            openResetModal();
        });
    }

    // Close modal buttons
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            resetPasswordModal.classList.remove('active');
        });
    });

    // Toggle password visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });

    // Google login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            handleGoogleAuth('login');
        });
    }

    // Google register
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', () => {
            handleGoogleAuth('register');
        });
    }
});

// Switch between login and register tabs
function switchTab(tabId) {
    // Update active tab
    authTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update active form
    authForms.forEach(form => {
        if (form.id === `${tabId}-form`) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });

    // Clear error messages
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    // Clear form inputs
    document.getElementById(`${tabId}-form`).reset();
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    // Get form data
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    // Validate form
    if (!validateLoginForm(email, password)) {
        return;
    }

    try {
        showLoading('Logging in...');

        // Set persistence based on "Remember me" checkbox
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;

        await auth.setPersistence(persistence);
        await auth.signInWithEmailAndPassword(email, password);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        handleLoginError(error);
    } finally {
        hideLoading();
    }
}

// Validate login form
function validateLoginForm(email, password) {
    let isValid = true;
    
    const emailError = document.getElementById('login-email-error');
    const passwordError = document.getElementById('login-password-error');
    
    // Clear previous errors
    emailError.textContent = '';
    passwordError.textContent = '';
    
    // Validate email
    if (!email) {
        emailError.textContent = 'Email is required';
        isValid = false;
    } else if (!isValidEmail(email)) {
        emailError.textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        passwordError.textContent = 'Password is required';
        isValid = false;
    }
    
    return isValid;
}

// Handle login errors
function handleLoginError(error) {
    const emailError = document.getElementById('login-email-error');
    const passwordError = document.getElementById('login-password-error');
    
    switch (error.code) {
        case 'auth/user-not-found':
            emailError.textContent = 'No account found with this email';
            break;
        case 'auth/wrong-password':
            passwordError.textContent = 'Incorrect password';
            break;
        case 'auth/invalid-email':
            emailError.textContent = 'Email format is invalid';
            break;
        case 'auth/too-many-requests':
            passwordError.textContent = 'Too many failed attempts. Try again later';
            break;
        case 'auth/user-disabled':
            emailError.textContent = 'This account has been disabled';
            break;
        default:
            showAlert('Login failed. Please try again.', 'error');
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();

    // Get form data
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const termsAgreed = document.getElementById('terms-agreement').checked;

    // Validate form
    if (!validateRegisterForm(name, email, password, confirmPassword, termsAgreed)) {
        return;
    }

    try {
        showLoading('Creating your account...');

        // Create new user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update user profile with name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Show success message
        showAlert('Account created successfully! Redirecting to dashboard...', 'success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        console.error('Registration error:', error);
        handleRegisterError(error);
    } finally {
        hideLoading();
    }
}

// Validate register form
function validateRegisterForm(name, email, password, confirmPassword, termsAgreed) {
    let isValid = true;
    
    const nameError = document.getElementById('register-name-error');
    const emailError = document.getElementById('register-email-error');
    const passwordError = document.getElementById('register-password-error');
    const confirmPasswordError = document.getElementById('register-confirm-password-error');
    
    // Clear previous errors
    nameError.textContent = '';
    emailError.textContent = '';
    passwordError.textContent = '';
    confirmPasswordError.textContent = '';
    
    // Validate name
    if (!name) {
        nameError.textContent = 'Full name is required';
        isValid = false;
    } else if (name.length < 2) {
        nameError.textContent = 'Name must be at least 2 characters';
        isValid = false;
    }
    
    // Validate email
    if (!email) {
        emailError.textContent = 'Email is required';
        isValid = false;
    } else if (!isValidEmail(email)) {
        emailError.textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        passwordError.textContent = 'Password is required';
        isValid = false;
    } else if (password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        isValid = false;
    } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        isValid = false;
    }
    
    // Validate terms agreement
    if (!termsAgreed) {
        showAlert('You must agree to the Terms of Service and Privacy Policy', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Handle registration errors
function handleRegisterError(error) {
    const emailError = document.getElementById('register-email-error');
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            emailError.textContent = 'This email is already registered';
            break;
        case 'auth/invalid-email':
            emailError.textContent = 'Email format is invalid';
            break;
        case 'auth/weak-password':
            const passwordError = document.getElementById('register-password-error');
            passwordError.textContent = 'Password is too weak';
            break;
        default:
            showAlert('Registration failed. Please try again.', 'error');
    }
}

// Handle password reset
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const resetEmailError = document.getElementById('reset-email-error');
    
    // Clear previous error
    resetEmailError.textContent = '';
    
    if (!email) {
        resetEmailError.textContent = 'Email is required';
        return;
    }
    
    if (!isValidEmail(email)) {
        resetEmailError.textContent = 'Please enter a valid email';
        return;
    }
    
    try {
        showLoading('Sending password reset email...');
        
        // Send password reset email
        await auth.sendPasswordResetEmail(email);
        
        // Close modal
        resetPasswordModal.classList.remove('active');
        
        // Show success message
        showAlert('Password reset email sent. Check your inbox.', 'success');
    } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.code === 'auth/user-not-found') {
            resetEmailError.textContent = 'No account found with this email';
        } else {
            showAlert('Failed to send reset email. Please try again.', 'error');
        }
    } finally {
        hideLoading();
    }
}

// Handle Google authentication
async function handleGoogleAuth(mode) {
    try {
        showLoading(mode === 'login' ? 'Logging in with Google...' : 'Signing up with Google...');
        
        // Create Google provider
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Add additional scopes if needed
        provider.addScope('email');
        
        // Log authentication attempt for debugging
        console.log('Attempting Google authentication...');
        
        try {
            // Try sign in with popup first
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            console.log('Google authentication successful!', user.email);
            showAlert('Successfully signed in with Google!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (popupError) {
            console.error('Popup sign-in error:', popupError);
            
            // Specific error handling
            if (popupError.code === 'auth/popup-blocked') {
                showAlert('Popup was blocked. Please allow popups for this site.', 'warning');
                // Try redirect method as fallback
                await auth.signInWithRedirect(provider);
                return;
            } else if (popupError.code === 'auth/unauthorized-domain') {
                showAlert('This domain is not authorized for authentication. Contact administrator.', 'error');
                return;
            }
            
            throw popupError; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error('Google auth error details:', error);
        
        // More detailed error messages
        if (error.code === 'auth/network-request-failed') {
            showAlert('Network error. Check your internet connection.', 'error');
        } else if (error.code === 'auth/user-disabled') {
            showAlert('This user account has been disabled.', 'error');
        } else if (error.code === 'auth/web-storage-unsupported') {
            showAlert('Web storage is not supported or is disabled.', 'error');
        } else {
            showAlert(`Google authentication failed: ${error.message}`, 'error');
        }
    } finally {
        hideLoading();
    }
}

// Toggle password visibility
function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const passwordInput = button.previousElementSibling;
    const icon = button.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Open reset password modal
function openResetModal() {
    resetPasswordModal.classList.add('active');
    document.getElementById('reset-email').value = '';
    document.getElementById('reset-email-error').textContent = '';
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show loading overlay
function showLoading(message = 'Loading...') {
    if (!loadingOverlay) return;
    
    loadingOverlay.querySelector('p').textContent = message;
    loadingOverlay.classList.add('active');
}

// Hide loading overlay
function hideLoading() {
    if (!loadingOverlay) return;
    
    loadingOverlay.classList.remove('active');
}

// Show alert message
function showAlert(message, type = 'info') {
    if (!alertContainer) return;
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    // Alert content
    alert.innerHTML = `
        <div class="alert-icon">
            <i class="fas ${getAlertIcon(type)}"></i>
        </div>
        <div class="alert-content">
            <p class="alert-text">${message}</p>
        </div>
        <button class="alert-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    alertContainer.appendChild(alert);
    
    // Show container
    alertContainer.style.display = 'block';
    
    // Add close functionality
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        closeAlert(alert);
    });
    
    // Animate in
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto close after 5 seconds
    setTimeout(() => {
        closeAlert(alert);
    }, 5000);
}

// Close alert
function closeAlert(alert) {
    alert.style.opacity = '0';
    alert.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
        
        // Hide container if no alerts left
        if (alertContainer.children.length === 0) {
            alertContainer.style.display = 'none';
        }
    }, 300);
}

// Get the appropriate icon for alert type
function getAlertIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        default:
            return 'fa-info-circle';
    }
}