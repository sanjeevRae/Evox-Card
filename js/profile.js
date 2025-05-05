/**
 * E-VOX - Profile Page JavaScript
 * Handles displaying user profiles and interaction
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBs2e6VUELX4S_D7CIobxBkCuOB217LovU",
    authDomain: "evox-card.firebaseapp.com",
    projectId: "evox-card",
    storageBucket: "evox-card.firebasestorage.app",
    messagingSenderId: "566960653523",
    appId: "1:566960653523:web:b6074aceb1ba7dffcc8026",
    measurementId: "G-J1GSZSN3MY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
firebase.analytics();

// DOM Elements
const profileCard = document.querySelector('.profile-card');
const loginBtn = document.getElementById('login-btn');
const editProfileBtn = document.getElementById('edit-profile-btn');
const flipBtns = document.querySelectorAll('.flip-btn, .flip-btn-back');
const saveContactBtn = document.getElementById('save-contact');
const shareBtn = document.getElementById('share-btn');
const downloadBtn = document.getElementById('download-btn');
const shareModal = document.getElementById('share-modal');
const downloadModal = document.getElementById('download-modal');
const copyLinkBtn = document.getElementById('copy-link-btn');
const modalCloseBtns = document.querySelectorAll('.modal-close');
const alertContainer = document.querySelector('.alert-container');
const loadingOverlay = document.getElementById('loading-overlay');

// State variables
let currentUser = null;
let profileData = null;
let profileOwner = false;
let profileId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if a profile ID is in the URL
    const urlParams = new URLSearchParams(window.location.search);
    profileId = urlParams.get('id');
    
    if (!profileId) {
        showAlert('No profile specified. Redirecting to homepage...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Check authentication state
    auth.onAuthStateChanged(handleAuthStateChanged);
    
    // Card flip functionality
    flipBtns.forEach(btn => {
        btn.addEventListener('click', flipCard);
    });
    
    // Modal close buttons
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', openShareModal);
    }
    
    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', openDownloadModal);
    }
    
    // Copy link button
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyProfileLink);
    }
    
    // Save contact button
    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', saveContact);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Login button
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    
    // Edit profile button
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', goToDashboard);
    }
    
    // Initialize custom cursor
    initCustomCursor();
});

// Handle authentication state changes
function handleAuthStateChanged(user) {
    currentUser = user;
    
    // Update login/edit buttons visibility
    updateAuthButtons();
    
    // Load profile data
    loadProfileData();
}

// Update auth-related buttons
function updateAuthButtons() {
    if (!loginBtn || !editProfileBtn) return;
    
    if (currentUser) {
        loginBtn.classList.add('hidden');
        
        // Check if the current user is the profile owner
        if (currentUser.uid === profileId) {
            editProfileBtn.classList.remove('hidden');
            profileOwner = true;
        } else {
            editProfileBtn.classList.add('hidden');
            profileOwner = false;
        }
    } else {
        loginBtn.classList.remove('hidden');
        editProfileBtn.classList.add('hidden');
        profileOwner = false;
    }
}

// Load profile data from Firestore
async function loadProfileData() {
    try {
        showLoading();
        
        const docRef = db.collection('profiles').doc(profileId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            profileData = doc.data();
            
            // Populate profile card with data
            populateProfileCard(profileData);
            
            // Record profile view
            if (!profileOwner) {
                recordProfileView();
            }
            
            // Generate QR code
            generateQRCode();
        } else {
            // Profile doesn't exist
            showAlert('Profile not found. Redirecting to homepage...', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile data.', 'error');
    } finally {
        hideLoading();
    }
}

// Populate the profile card with user data
function populateProfileCard(data) {
    // Set the page title
    document.title = `${data.fullName} | E-VOX`;
    
    // Profile photo
    const profilePhoto = document.querySelector('.profile-photo img');
    if (profilePhoto) {
        if (data.photoURL) {
            profilePhoto.src = data.photoURL;
        } else {
            profilePhoto.src = 'images/default-avatar.jpg';
        }
        profilePhoto.alt = data.fullName;
    }
    
    // Name and headline
    document.getElementById('profile-name').textContent = data.fullName || '';
    document.getElementById('profile-job-title').textContent = data.jobTitle || '';
    document.getElementById('profile-company').textContent = data.companyName || '';
    
    // Contact info
    document.getElementById('profile-email').textContent = data.email || '';
    document.getElementById('profile-email-link').href = `mailto:${data.email}`;
    
    document.getElementById('profile-phone').textContent = data.phone || '';
    document.getElementById('profile-phone-link').href = `tel:${data.phone}`;
    
    // Only show address if provided
    const addressContainer = document.getElementById('address-container');
    if (data.address && addressContainer) {
        const addressText = document.getElementById('profile-address');
        let addressValue = data.address;
        
        if (data.city) {
            addressValue += `, ${data.city}`;
        }
        
        if (data.country) {
            addressValue += `, ${data.country}`;
        }
        
        addressText.textContent = addressValue;
        addressContainer.classList.remove('hidden');
    }
    
    // Only show website if provided
    const websiteContainer = document.getElementById('website-container');
    if (data.website && websiteContainer) {
        const websiteText = document.getElementById('profile-website');
        const websiteLink = document.getElementById('profile-website-link');
        
        websiteText.textContent = formatURL(data.website);
        websiteLink.href = ensureHttpPrefix(data.website);
        websiteContainer.classList.remove('hidden');
    }
    
    // Social media links
    setupSocialLink('linkedin', data.linkedin);
    setupSocialLink('facebook', data.facebook);
    setupSocialLink('instagram', data.instagram);
    setupSocialLink('twitter', data.twitter);
    setupSocialLink('youtube', data.youtube);
    
    // Bio and company info (back of card)
    const bioText = document.getElementById('bio-text');
    if (bioText) {
        if (data.bio) {
            bioText.textContent = data.bio;
            document.getElementById('bio-section').classList.remove('hidden');
        } else {
            document.getElementById('bio-section').classList.add('hidden');
        }
    }
    
    const companyInfo = document.getElementById('company-info');
    if (companyInfo) {
        if (data.companyName || data.companyDescription) {
            if (data.companyName) {
                document.getElementById('company-name').textContent = data.companyName;
            }
            
            if (data.companyDescription) {
                document.getElementById('company-description').textContent = data.companyDescription;
                document.getElementById('company-info').classList.remove('hidden');
            } else {
                document.getElementById('company-info').classList.add('hidden');
            }
        }
    }
}

// Setup social media links
function setupSocialLink(platform, url) {
    const linkElement = document.getElementById(`${platform}-link`);
    
    if (!linkElement) return;
    
    if (url) {
        linkElement.href = ensureHttpPrefix(url);
        linkElement.classList.remove('hidden-social');
    } else {
        linkElement.classList.add('hidden-social');
    }
}

// Record profile view in analytics
async function recordProfileView() {
    try {
        const analyticsRef = db.collection('analytics').doc(profileId);
        const doc = await analyticsRef.get();
        
        if (doc.exists) {
            // Increment view count
            await analyticsRef.update({
                profileViews: firebase.firestore.FieldValue.increment(1),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Create new analytics document
            await analyticsRef.set({
                profileViews: 1,
                contactDownloads: 0,
                profileShares: 0,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error recording profile view:', error);
    }
}

// Record profile share in analytics
async function recordProfileShare() {
    try {
        const analyticsRef = db.collection('analytics').doc(profileId);
        
        // Increment share count
        await analyticsRef.update({
            profileShares: firebase.firestore.FieldValue.increment(1),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error recording profile share:', error);
    }
}

// Record contact download in analytics
async function recordContactDownload() {
    try {
        const analyticsRef = db.collection('analytics').doc(profileId);
        
        // Increment download count
        await analyticsRef.update({
            contactDownloads: firebase.firestore.FieldValue.increment(1),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error recording contact download:', error);
    }
}

// Generate QR code for profile
function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    
    if (!qrContainer) return;
    
    const profileUrl = window.location.href;
    
    // Clear previous QR code
    qrContainer.innerHTML = '';
    
    // Generate new QR code
    new QRCode(qrContainer, {
        text: profileUrl,
        width: 128,
        height: 128,
        colorDark: '#111827',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Save contact information (vCard)
function saveContact() {
    if (!profileData) return;
    
    // Create vCard text
    const vCard = generateVCard();
    
    // Create download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vCard));
    element.setAttribute('download', `${profileData.fullName}.vcf`);
    element.style.display = 'none';
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Record download
    recordContactDownload();
    
    // Show success message
    showAlert('Contact saved successfully!', 'success');
}

// Generate vCard string
function generateVCard() {
    const data = profileData;
    let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    // Name
    vCard += `FN:${data.fullName}\n`;
    vCard += `N:${data.fullName};;;;\n`;
    
    // Company and title
    if (data.companyName) vCard += `ORG:${data.companyName}\n`;
    if (data.jobTitle) vCard += `TITLE:${data.jobTitle}\n`;
    
    // Contact info
    if (data.email) vCard += `EMAIL;TYPE=INTERNET:${data.email}\n`;
    if (data.phone) vCard += `TEL;TYPE=CELL:${data.phone}\n`;
    
    // Address
    if (data.address || data.city || data.country) {
        vCard += 'ADR;TYPE=WORK:;;';
        vCard += data.address ? data.address : '';
        vCard += ';';
        vCard += data.city ? data.city : '';
        vCard += ';;';
        vCard += data.country ? data.country : '';
        vCard += '\n';
    }
    
    // Website
    if (data.website) vCard += `URL:${ensureHttpPrefix(data.website)}\n`;
    
    // Social media as URLs
    if (data.linkedin) vCard += `URL;TYPE=Linkedin:${ensureHttpPrefix(data.linkedin)}\n`;
    if (data.facebook) vCard += `URL;TYPE=Facebook:${ensureHttpPrefix(data.facebook)}\n`;
    if (data.instagram) vCard += `URL;TYPE=Instagram:${ensureHttpPrefix(data.instagram)}\n`;
    if (data.twitter) vCard += `URL;TYPE=Twitter:${ensureHttpPrefix(data.twitter)}\n`;
    
    // Photo
    if (data.photoURL) {
        // Note: For proper vCard with embedded photo, 
        // you'd need to convert the image to base64
        // For simplicity, we're just including the URL
        vCard += `PHOTO;VALUE=URI:${data.photoURL}\n`;
    }
    
    // Note with bio
    if (data.bio) vCard += `NOTE:${data.bio}\n`;
    
    vCard += 'END:VCARD';
    
    return vCard;
}

// Flip the card
function flipCard() {
    if (profileCard) {
        profileCard.classList.toggle('card-flipped');
    }
}

// Go to dashboard page
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// Open share modal
function openShareModal() {
    if (shareModal) {
        // Set up share link
        document.getElementById('share-link-input').value = window.location.href;
        
        // Set up WhatsApp share link
        const whatsappLink = document.getElementById('whatsapp-share');
        if (whatsappLink) {
            const text = `Check out ${profileData.fullName}'s digital business card: `;
            whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(text + window.location.href)}`;
        }
        
        // Record share
        recordProfileShare();
        
        // Show modal
        shareModal.classList.add('active');
    }
}

// Open download modal
function openDownloadModal() {
    if (downloadModal) {
        downloadModal.classList.add('active');
    }
}

// Close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}

// Copy profile link to clipboard
function copyProfileLink() {
    const linkInput = document.getElementById('share-link-input');
    
    if (!linkInput) return;
    
    try {
        linkInput.select();
        document.execCommand('copy');
        showAlert('Link copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy:', err);
        showAlert('Failed to copy link.', 'error');
    }
}

// Show loading overlay
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

// Hide loading overlay
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    if (!alertContainer) return;
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    // Add content
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
    
    // Add close functionality
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        closeAlert(alert);
    });
    
    // Show container
    alertContainer.style.display = 'block';
    
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

// Format URL for display (remove http/https and trailing slash)
function formatURL(url) {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Ensure URL has http/https prefix
function ensureHttpPrefix(url) {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) {
        return 'https://' + url;
    }
    return url;
}

// Initialize custom cursor effect
function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    if (!cursor || !cursorFollower) return;
    
    document.addEventListener('mousemove', e => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        
        setTimeout(() => {
            cursorFollower.style.left = `${e.clientX}px`;
            cursorFollower.style.top = `${e.clientY}px`;
        }, 100);
    });
    
    document.addEventListener('mousedown', () => {
        cursor.classList.add('cursor-active');
        cursorFollower.classList.add('cursor-active');
    });
    
    document.addEventListener('mouseup', () => {
        cursor.classList.remove('cursor-active');
        cursorFollower.classList.remove('cursor-active');
    });
    
    // Add hover effect for links and buttons
    const links = document.querySelectorAll('a, button, .btn, input[type="submit"]');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-active');
            cursorFollower.classList.add('cursor-active');
        });
        
        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-active');
            cursorFollower.classList.remove('cursor-active');
        });
    });
};

// Profile Card Enhancement Script
document.addEventListener('DOMContentLoaded', function() {
    // Card Flip Animation
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });
    
    // Membership Tier Styling
    const membershipBadge = document.querySelector('.membership-badge');
    if (membershipBadge) {
        const membershipType = membershipBadge.getAttribute('data-membership-type');
        if (membershipType) {
            membershipBadge.classList.add(`membership-${membershipType.toLowerCase()}`);
            
            // Add appropriate icon based on membership
            const iconElement = document.createElement('img');
            iconElement.className = 'membership-icon';
            
            switch (membershipType.toLowerCase()) {
                case 'standard':
                    iconElement.src = '../images/standard.svg';
                    break;
                case 'premium':
                    iconElement.src = '../images/premium.svg';
                    break;
                case 'executive':
                    iconElement.src = '../images/executive.svg';
                    break;
                default:
                    iconElement.src = '../images/standard.svg';
            }
            
            membershipBadge.appendChild(iconElement);
        }
    }
    
    // Add 3D tilt effect for cards
    const profileCards = document.querySelectorAll('.profile-card');
    profileCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            // Only apply effect if the card is not flipped
            if (!this.classList.contains('flipped')) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const angleX = (y - centerY) / 20;
                const angleY = (centerX - x) / 20;
                
                this.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            }
        });
        
        card.addEventListener('mouseleave', function() {
            // Reset the transform when mouse leaves
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
    
    // Contact Button Animation
    const contactButtons = document.querySelectorAll('.contact-btn');
    contactButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card flipping when clicking contact button
            
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // QR Code Animation
    const qrCodes = document.querySelectorAll('.qr-code');
    qrCodes.forEach(qr => {
        qr.addEventListener('mouseenter', function() {
            this.classList.add('qr-highlight');
        });
        
        qr.addEventListener('mouseleave', function() {
            this.classList.remove('qr-highlight');
        });
    });
    
    // Social Media Icons Animation
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
        icon.style.animationDelay = `${index * 0.1}s`;
        
        icon.addEventListener('mouseenter', function() {
            this.classList.add('social-hover');
        });
        
        icon.addEventListener('mouseleave', function() {
            this.classList.remove('social-hover');
        });
    });
    
    // Mobile Touch Support for Card Flip
    if ('ontouchstart' in window) {
        const flipButtons = document.querySelectorAll('.flip-button');
        flipButtons.forEach(button => {
            button.style.display = 'block';
            
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const card = this.closest('.card');
                if (card) {
                    card.classList.toggle('flipped');
                }
            });
        });
        
        // Disable the 3D tilt effect on mobile
        profileCards.forEach(card => {
            card.style.transform = 'none';
        });
    }
    
    // Add share functionality
    const shareButtons = document.querySelectorAll('.share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const name = document.querySelector('.card-name').textContent;
            const title = document.querySelector('.card-title').textContent;
            const profileUrl = window.location.href;
            
            if (navigator.share) {
                navigator.share({
                    title: `${name} - ${title}`,
                    text: `Check out ${name}'s business card`,
                    url: profileUrl
                })
                .catch(err => {
                    console.error('Share failed:', err);
                });
            } else {
                // Fallback for browsers that don't support Web Share API
                const tempInput = document.createElement('input');
                document.body.appendChild(tempInput);
                tempInput.value = profileUrl;
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                const tooltip = document.createElement('div');
                tooltip.className = 'share-tooltip';
                tooltip.textContent = 'Link copied to clipboard!';
                this.appendChild(tooltip);
                
                setTimeout(() => {
                    tooltip.classList.add('tooltip-visible');
                }, 10);
                
                setTimeout(() => {
                    tooltip.classList.remove('tooltip-visible');
                    setTimeout(() => {
                        tooltip.remove();
                    }, 300);
                }, 2000);
            }
        });
    });
});