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
const storage = firebase.storage();
firebase.analytics();

// Immediate authentication check - redirect if not logged in
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        // No user is signed in, redirect immediately to login page
        window.location.href = 'login.html';
    }
});

// DOM Elements
const dashboardSidebar = document.querySelector('.dashboard-sidebar');
const dashboardMain = document.querySelector('.dashboard-main');
const menuToggleBtn = document.querySelector('.menu-toggle');
const closeSidebarBtn = document.querySelector('.close-sidebar');
const navLinks = document.querySelectorAll('.sidebar-nav a');
const profileForm = document.getElementById('profile-form');
const passwordForm = document.getElementById('password-form');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const logoutBtn = document.getElementById('logout-btn');
const viewProfileBtn = document.getElementById('view-profile-btn');
const saveStatusBar = document.getElementById('save-status');
const confirmationModal = document.getElementById('confirmation-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const loadingOverlay = document.getElementById('loading-overlay');
const previewBtn = document.getElementById('preview-btn');
const manualPhotoUpload = document.getElementById('manual-photo-upload');
const manualUploadBtn = document.getElementById('manual-upload-btn');

// User data and state
let currentUser = null;
let profileData = null;
let photoFile = null;
let photoURL = null;
let hasUnsavedChanges = false;
let isNewUser = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    auth.onAuthStateChanged(handleAuthStateChanged);

    // Mobile sidebar toggle
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', toggleSidebar);
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeSidebar);
    }

    // Navigation tabs
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            switchSection(targetSection);
        });
    });

    // Profile photo upload
    const photoPreview = document.querySelector('.photo-preview');
    const photoInput = document.getElementById('profile-photo-input');
    const uploadPhotoBtn = document.getElementById('upload-photo-btn');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    if (photoPreview) {
        photoPreview.addEventListener('click', () => photoInput.click());
    }

    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelect);
    }

    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', () => photoInput.click());
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', removeProfilePhoto);
    }

    // Handle manual photo upload
    if (manualUploadBtn) {
        manualUploadBtn.addEventListener('click', handleManualPhotoUpload);
    }

    // Form submissions
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfileData);
        
        // Set up form input change detection
        const formInputs = profileForm.querySelectorAll('input, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => {
                hasUnsavedChanges = true;
                updateSaveStatus('Changes not saved', 'saving');
            });
            
            input.addEventListener('input', debounce(() => {
                if (hasUnsavedChanges) {
                    updateSaveStatus('Changes not saved', 'saving');
                }
            }, 300));
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', updatePassword);
    }

    // Delete account
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', showDeleteAccountConfirmation);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // View Profile
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            viewProfile();
        });
    }

    // Preview button
    if (previewBtn) {
        previewBtn.addEventListener('click', previewProfile);
    }

    // Modal controls
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            closeModal();
        }
    });

    // Warn about unsaved changes before leaving page
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    // Initialize photo dropzone when page loads
    initializePhotoDropzone();
});

// Handle authentication state changes
function handleAuthStateChanged(user) {
    showLoading('Checking authentication...');
    
    if (user) {
        // User is signed in
        currentUser = user;
        
        // Update UI with user info
        updateUserInfo(user);
        
        // Fetch user profile data
        fetchProfileData(user.uid);
    } else {
        // No user signed in, redirect to login page
        window.location.href = 'login.html';
    }
    
    hideLoading();
}

// Update UI with user information
function updateUserInfo(user) {
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarEmail = document.getElementById('sidebar-email');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const topbarAvatar = document.getElementById('topbar-avatar');
    
    if (sidebarName) {
        sidebarName.textContent = user.displayName || 'User';
    }
    
    if (sidebarEmail) {
        sidebarEmail.textContent = user.email;
    }
    
    if (sidebarAvatar && user.photoURL) {
        sidebarAvatar.src = user.photoURL;
    }
    
    if (topbarAvatar && user.photoURL) {
        topbarAvatar.src = user.photoURL;
    }
}

// Fetch user profile data
async function fetchProfileData(userId) {
    try {
        showLoading('Loading profile data...');
        
        const docRef = db.collection('profiles').doc(userId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            // Profile exists
            profileData = doc.data();
            populateProfileForm(profileData);
            fetchAnalytics(userId);
            isNewUser = false;
        } else {
            // New user, create empty profile
            isNewUser = true;
            profileData = {
                userId: userId,
                fullName: currentUser.displayName || '',
                email: currentUser.email || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Pre-fill email in the form
            if (document.getElementById('email')) {
                document.getElementById('email').value = currentUser.email || '';
            }
            
            if (document.getElementById('fullName')) {
                document.getElementById('fullName').value = currentUser.displayName || '';
            }
            
            // Show a welcome message for new users
            showAlert('Welcome to E-VOX! Please complete your profile to create your digital business card.', 'info');
        }
        
    } catch (error) {
        console.error('Error fetching profile data:', error);
        showAlert('Error loading profile data. Please try refreshing the page.', 'error');
    } finally {
        hideLoading();
    }
}

// Populate the form with profile data
function populateProfileForm(data) {
    if (!profileForm) return;
    
    // Personal information
    if (data.fullName) document.getElementById('fullName').value = data.fullName;
    if (data.jobTitle) document.getElementById('jobTitle').value = data.jobTitle;
    if (data.bio) document.getElementById('bio').value = data.bio;
    
    // Contact information
    if (data.email) document.getElementById('email').value = data.email;
    if (data.phone) document.getElementById('phone').value = data.phone;
    if (data.address) document.getElementById('address').value = data.address;
    if (data.city) document.getElementById('city').value = data.city;
    if (data.country) document.getElementById('country').value = data.country;
    
    // Company information
    if (data.companyName) document.getElementById('companyName').value = data.companyName;
    if (data.companyDescription) document.getElementById('companyDescription').value = data.companyDescription;
    if (data.website) document.getElementById('website').value = data.website;
    
    // Social media
    if (data.linkedin) document.getElementById('linkedin').value = data.linkedin;
    if (data.facebook) document.getElementById('facebook').value = data.facebook;
    if (data.instagram) document.getElementById('instagram').value = data.instagram;
    if (data.twitter) document.getElementById('twitter').value = data.twitter;
    if (data.youtube) document.getElementById('youtube').value = data.youtube;
    
    // Profile photo
    if (data.photoURL) {
        photoURL = data.photoURL;
        const photoPreview = document.getElementById('profile-photo-preview');
        if (photoPreview) photoPreview.src = photoURL;
        
        // Also update avatar in sidebar and topbar
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const topbarAvatar = document.getElementById('topbar-avatar');
        
        if (sidebarAvatar) sidebarAvatar.src = photoURL;
        if (topbarAvatar) topbarAvatar.src = photoURL;
    }
    
    updateSaveStatus('All changes saved');
    hasUnsavedChanges = false;
}

// Save profile data to Firestore
async function saveProfileData(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAlert('You must be logged in to save changes.', 'error');
        return;
    }
    
    try {
        showLoading('Saving your profile...');
        updateSaveStatus('Saving changes...', 'saving');
        
        // Get form data
        const formData = {
            userId: currentUser.uid,
            fullName: document.getElementById('fullName').value,
            jobTitle: document.getElementById('jobTitle').value,
            bio: document.getElementById('bio').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            country: document.getElementById('country').value,
            companyName: document.getElementById('companyName').value,
            companyDescription: document.getElementById('companyDescription').value,
            website: document.getElementById('website').value,
            linkedin: document.getElementById('linkedin').value,
            facebook: document.getElementById('facebook').value,
            instagram: document.getElementById('instagram').value,
            twitter: document.getElementById('twitter').value,
            youtube: document.getElementById('youtube').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add photoURL if it exists
        if (photoURL) {
            formData.photoURL = photoURL;
        }
        
        // If it's a new user, add creation timestamp
        if (isNewUser) {
            formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Upload photo if a new one was selected
        if (photoFile) {
            const photoURL = await uploadProfilePhoto(photoFile);
            formData.photoURL = photoURL;
            
            // Update user profile photo in Firebase Auth
            await currentUser.updateProfile({
                photoURL: photoURL
            });
        }
        
        // Save to Firestore
        await db.collection('profiles').doc(currentUser.uid).set(formData, { merge: true });
        
        // Update user display name in Firebase Auth
        await currentUser.updateProfile({
            displayName: formData.fullName
        });
        
        // Update local data
        profileData = formData;
        isNewUser = false;
        hasUnsavedChanges = false;
        
        updateSaveStatus('All changes saved');
        showAlert('Profile saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving profile data:', error);
        updateSaveStatus('Error saving changes', 'error');
        showAlert('Error saving profile. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Handle profile photo selection
function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
        showAlert('Please select a valid image file (JPEG, PNG, or GIF).', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showAlert('Image file is too large. Please select a file smaller than 5MB.', 'error');
        return;
    }
    
    // Store file for later upload
    photoFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const photoPreview = document.getElementById('profile-photo-preview');
        if (photoPreview) {
            photoPreview.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
    
    hasUnsavedChanges = true;
    updateSaveStatus('Changes not saved', 'saving');
}

// Upload profile photo to Firebase Storage
async function uploadProfilePhoto(file) {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${currentUser.uid}_${Date.now()}.${fileExtension}`;
    const storageRef = storage.ref(`profile_photos/${fileName}`);
    
    try {
        // Upload file
        const snapshot = await storageRef.put(file);
        
        // Get download URL
        const url = await snapshot.ref.getDownloadURL();
        photoURL = url;
        photoFile = null; // Clear the file after successful upload
        
        return url;
    } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
    }
}

// Remove profile photo
async function removeProfilePhoto() {
    if (!photoURL && !photoFile) return;
    
    try {
        showLoading('Removing photo...');
        
        photoFile = null; // Clear selected file
        
        // If there was a previous photo URL, remove it
        if (photoURL) {
            // If this is an existing photo in storage, you might want to delete it
            // For simplicity, we're just removing the reference

            // Update profile with null photo URL
            await db.collection('profiles').doc(currentUser.uid).update({
                photoURL: firebase.firestore.FieldValue.delete()
            });
            
            // Update user profile in Firebase Auth
            await currentUser.updateProfile({
                photoURL: null
            });
            
            // Reset photo preview
            const photoPreview = document.getElementById('profile-photo-preview');
            if (photoPreview) {
                photoPreview.src = 'images/default-avatar.jpg';
            }
            
            // Reset avatars
            const sidebarAvatar = document.getElementById('sidebar-avatar');
            const topbarAvatar = document.getElementById('topbar-avatar');
            
            if (sidebarAvatar) sidebarAvatar.src = 'images/default-avatar.jpg';
            if (topbarAvatar) topbarAvatar.src = 'images/default-avatar.jpg';
            
            photoURL = null;
            
            showAlert('Profile photo removed successfully.', 'success');
            hasUnsavedChanges = true;
            updateSaveStatus('Changes not saved', 'saving');
        }
    } catch (error) {
        console.error('Error removing profile photo:', error);
        showAlert('Error removing photo. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Handle manual photo upload
let cropperInstance = null;
let uploadedImage = null;

// Initialize drag and drop functionality for the profile photo dropzone
function initializePhotoDropzone() {
    const dropzone = document.getElementById('profile-photo-dropzone');
    const controls = document.getElementById('profile-photo-controls');
    const previewElement = document.getElementById('profile-photo-preview');
    
    if (!dropzone) return;
    
    // Handle drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Handle drop zone styling
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropzone.classList.add('highlight');
    }
    
    function unhighlight() {
        dropzone.classList.remove('highlight');
    }
    
    // Handle file drop
    dropzone.addEventListener('drop', handleDrop, false);
    dropzone.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFiles(e.target.files);
            }
        };
        fileInput.click();
    });
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFiles(files) {
        if (files.length === 0) return;
        
        // Only process image files
        const file = files[0];
        if (!file.type.match('image.*')) {
            showAlert('Please select an image file (JPEG, PNG, etc.)', 'error');
            return;
        }
        
        uploadedImage = file;
        
        // Display the image for cropping
        const reader = new FileReader();
        reader.onload = (e) => {
            // Show the cropper UI
            dropzone.classList.add('hidden');
            controls.classList.remove('hidden');
            
            // Initialize the cropper
            if (previewElement) {
                previewElement.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.id = 'crop-image';
                img.style.maxWidth = '100%';
                previewElement.appendChild(img);
                
                // Initialize cropper with the loaded image
                initializeCropper();
            }
        };
        
        reader.readAsDataURL(file);
    }
}

// Initialize cropper for the uploaded image
function initializeCropper() {
    const image = document.getElementById('crop-image');
    
    if (!image) return;
    
    // Import Cropper.js if not already loaded
    if (typeof Cropper === 'undefined') {
        const cropperCSS = document.createElement('link');
        cropperCSS.rel = 'stylesheet';
        cropperCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
        document.head.appendChild(cropperCSS);
        
        const cropperScript = document.createElement('script');
        cropperScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
        cropperScript.onload = () => {
            initCropper(image);
        };
        document.body.appendChild(cropperScript);
    } else {
        initCropper(image);
    }
}

// Initialize the actual cropper instance
function initCropper(image) {
    cropperInstance = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        guides: true,
        autoCropArea: 0.8,
        responsive: true
    });
    
    // Set up control buttons
    const rotateLeft = document.getElementById('rotate-left');
    const rotateRight = document.getElementById('rotate-right');
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const cancelCrop = document.getElementById('cancel-crop');
    const applyCrop = document.getElementById('apply-crop');
    
    if (rotateLeft) {
        rotateLeft.addEventListener('click', () => {
            cropperInstance.rotate(-90);
        });
    }
    
    if (rotateRight) {
        rotateRight.addEventListener('click', () => {
            cropperInstance.rotate(90);
        });
    }
    
    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            cropperInstance.zoom(0.1);
        });
    }
    
    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            cropperInstance.zoom(-0.1);
        });
    }
    
    if (cancelCrop) {
        cancelCrop.addEventListener('click', resetPhotoUpload);
    }
    
    if (applyCrop) {
        applyCrop.addEventListener('click', applyCropChanges);
    }
}

// Reset the photo upload process
function resetPhotoUpload() {
    const dropzone = document.getElementById('profile-photo-dropzone');
    const controls = document.getElementById('profile-photo-controls');
    
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    
    if (dropzone) dropzone.classList.remove('hidden');
    if (controls) controls.classList.add('hidden');
    
    uploadedImage = null;
}

// Apply crop changes and prepare for upload
function applyCropChanges() {
    if (!cropperInstance) return;
    
    // Get the cropped canvas
    const canvas = cropperInstance.getCroppedCanvas({
        width: 300,
        height: 300,
        fillColor: '#fff'
    });
    
    if (!canvas) {
        showAlert('Error cropping image', 'error');
        return;
    }
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
        // Create a new file from the blob
        const croppedFile = new File([blob], uploadedImage.name, { 
            type: uploadedImage.type,
            lastModified: new Date().getTime()
        });
        
        // Update the photoFile variable to use in the upload process
        photoFile = croppedFile;
        
        // Update preview images
        const photoPreview = document.getElementById('profile-photo-preview');
        const avatarPreview = document.getElementById('avatar-preview');
        
        if (avatarPreview) {
            avatarPreview.src = canvas.toDataURL();
        }
        
        // Reset the upload UI
        resetPhotoUpload();
        
        // Indicate that changes need to be saved
        hasUnsavedChanges = true;
        updateSaveStatus('Changes not saved', 'saving');
        
        // Show success message
        showAlert('Image cropped successfully! Don\'t forget to save your changes.', 'success');
    }, uploadedImage.type);
}

// Function to handle manual photo upload through the manual upload button
function handleManualPhotoUpload() {
    // Simulate a click on the drag-drop area
    const dropzone = document.getElementById('profile-photo-dropzone');
    if (dropzone) {
        dropzone.click();
    }
}

// Check if string is a valid URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Update password
async function updatePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Please fill in all password fields.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('New password must be at least 6 characters long.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match.', 'error');
        return;
    }
    
    try {
        showLoading('Updating password...');
        
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await currentUser.updatePassword(newPassword);
        
        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showAlert('Password updated successfully.', 'success');
    } catch (error) {
        console.error('Error updating password:', error);
        
        if (error.code === 'auth/wrong-password') {
            showAlert('Current password is incorrect.', 'error');
        } else {
            showAlert('Error updating password. Please try again.', 'error');
        }
    } finally {
        hideLoading();
    }
}

// Show delete account confirmation
function showDeleteAccountConfirmation() {
    modalTitle.textContent = 'Delete Account';
    modalMessage.textContent = 'Are you sure you want to delete your account? This will permanently remove all your data and cannot be undone.';
    
    // Set the confirm button action
    modalConfirm.onclick = deleteAccount;
    modalConfirm.textContent = 'Delete Account';
    
    openModal();
}

// Delete account
async function deleteAccount() {
    closeModal();
    
    try {
        showLoading('Deleting account...');
        
        // Delete user data from Firestore
        await db.collection('profiles').doc(currentUser.uid).delete();
        
        // Delete user from Firebase Authentication
        await currentUser.delete();
        
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            showAlert('For security, please log out and log back in before deleting your account.', 'error');
        } else {
            showAlert('Error deleting account. Please try again.', 'error');
        }
        
        hideLoading();
    }
}

// Fetch analytics data
async function fetchAnalytics(userId) {
    try {
        const analyticsRef = db.collection('analytics').doc(userId);
        const doc = await analyticsRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            
            // Update stats display
            document.getElementById('profile-views').textContent = data.profileViews || 0;
            document.getElementById('contact-downloads').textContent = data.contactDownloads || 0;
            document.getElementById('profile-shares').textContent = data.profileShares || 0;
        } else {
            // Create empty analytics document
            await analyticsRef.set({
                profileViews: 0,
                contactDownloads: 0,
                profileShares: 0,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
    }
}

// Preview profile
function previewProfile() {
    if (hasUnsavedChanges) {
        // Show confirmation dialog
        modalTitle.textContent = 'Unsaved Changes';
        modalMessage.textContent = 'You have unsaved changes. Do you want to save before previewing?';
        
        // Set up the confirm button action
        modalConfirm.onclick = () => {
            closeModal();
            
            // Submit the form and then preview
            profileForm.dispatchEvent(new Event('submit'));
            setTimeout(() => {
                viewProfile();
            }, 1500);
        };
        modalConfirm.textContent = 'Save & Preview';
        
        // Set up the cancel button action
        modalCancel.textContent = 'Preview Without Saving';
        modalCancel.onclick = () => {
            closeModal();
            viewProfile();
        };
        
        openModal();
    } else {
        viewProfile();
    }
}

// View profile page
function viewProfile() {
    if (currentUser) {
        window.open(`profile.html?id=${currentUser.uid}`, '_blank');
    }
}

// Logout user
function logout() {
    if (hasUnsavedChanges) {
        // Show confirmation dialog
        modalTitle.textContent = 'Unsaved Changes';
        modalMessage.textContent = 'You have unsaved changes that will be lost. Are you sure you want to log out?';
        
        // Set up the confirm button action
        modalConfirm.onclick = () => {
            closeModal();
            performLogout();
        };
        modalConfirm.textContent = 'Log Out';
        
        openModal();
    } else {
        performLogout();
    }
}

// Perform the actual logout
async function performLogout() {
    try {
        showLoading('Logging out...');
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        showAlert('Error logging out. Please try again.', 'error');
        hideLoading();
    }
}

// UI Functions

// Toggle sidebar on mobile
function toggleSidebar() {
    if (!dashboardSidebar) return;
    
    dashboardSidebar.classList.toggle('active');
    
    // Add overlay for better mobile experience
    let overlay = document.querySelector('.sidebar-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        
        // Close sidebar when clicking overlay
        overlay.addEventListener('click', closeSidebar);
    }
    
    if (dashboardSidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    } else {
        closeSidebar();
    }
}

// Close sidebar
function closeSidebar() {
    if (!dashboardSidebar) return;
    
    dashboardSidebar.classList.remove('active');
    
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        
        // Wait for transition to complete before removing
        setTimeout(() => {
            document.body.style.overflow = ''; // Restore scrolling
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

// Switch between sections
function switchSection(sectionId) {
    // Update active tab
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show active section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Close sidebar on mobile after selecting a tab
    if (window.innerWidth < 992) {
        closeSidebar();
    }
}

// Open confirmation modal
function openModal() {
    confirmationModal.classList.add('active');
}

// Close confirmation modal
function closeModal() {
    confirmationModal.classList.remove('active');
    
    // Reset modal buttons
    modalCancel.textContent = 'Cancel';
    modalCancel.onclick = closeModal;
}

// Update save status bar
function updateSaveStatus(message, status = 'saved') {
    if (!saveStatusBar) return;
    
    saveStatusBar.className = 'save-status';
    saveStatusBar.classList.add(status);
    
    const statusIcon = saveStatusBar.querySelector('.status-icon i');
    const statusText = saveStatusBar.querySelector('.status-text');
    
    if (status === 'saved') {
        statusIcon.className = 'fas fa-check-circle';
    } else if (status === 'saving') {
        statusIcon.className = 'fas fa-clock';
    } else if (status === 'error') {
        statusIcon.className = 'fas fa-exclamation-circle';
    }
    
    statusText.textContent = message;
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
    // Create alert element if it doesn't exist
    let alertContainer = document.querySelector('.alert-container');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert
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
    
    // Animate in
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateX(0)';
    }, 10);
    
    // Close button
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        closeAlert(alert);
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        closeAlert(alert);
    }, 5000);
}

// Close alert
function closeAlert(alert) {
    alert.style.opacity = '0';
    alert.style.transform = 'translateX(50px)';
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
        
        // Hide container if no alerts left
        const alertContainer = document.querySelector('.alert-container');
        if (alertContainer && alertContainer.children.length === 0) {
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

// Utility Functions

// Debounce function for input events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Dashboard Enhancement Script
document.addEventListener('DOMContentLoaded', function() {
    // Menu Toggle Animation
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('sidebar-collapsed');
            document.body.classList.toggle('sidebar-open');
            
            // Add subtle animation to menu items
            const menuItems = sidebar.querySelectorAll('.nav-item');
            menuItems.forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.05}s`;
                item.classList.toggle('animated');
            });
        });
    }
    
    // Card Animation
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });
    
    // Form Feedback Animation
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        // Add focus animation
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
            if (this.value.trim() !== '') {
                this.parentElement.classList.add('input-filled');
            } else {
                this.parentElement.classList.remove('input-filled');
            }
        });
        
        // Check initial state
        if (input.value.trim() !== '') {
            input.parentElement.classList.add('input-filled');
        }
    });
    
    // Submit Button Animation
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.classList.contains('loading')) {
                // Only add animation if form is valid (you may need to add form validation)
                const form = this.closest('form');
                if (!form || form.checkValidity()) {
                    this.classList.add('loading');
                    
                    // Simulate form submission (remove this in production)
                    setTimeout(() => {
                        this.classList.remove('loading');
                        this.classList.add('success');
                        
                        setTimeout(() => {
                            this.classList.remove('success');
                        }, 2000);
                    }, 1500);
                }
            }
        });
    });
    
    // Tab Navigation Enhancement
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current button and content
            this.classList.add('active');
            document.getElementById(target).classList.add('active');
            
            // Add entrance animation to tab content
            document.getElementById(target).classList.add('tab-enter');
            setTimeout(() => {
                document.getElementById(target).classList.remove('tab-enter');
            }, 500);
        });
    });
    
    // Notification Badge Animation
    const notificationBadges = document.querySelectorAll('.notification-badge');
    notificationBadges.forEach(badge => {
        if (parseInt(badge.textContent) > 0) {
            badge.classList.add('pulse');
        }
    });
    
    // Chart Animation (if charts are present)
    if (typeof Chart !== 'undefined') {
        const chartElements = document.querySelectorAll('.dashboard-chart');
        chartElements.forEach(element => {
            // You can add custom animation settings for your charts here
            // This is just a placeholder for chart animation settings
            const ctx = element.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    // Your chart configuration here
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                });
            }
        });
    }
    
    // Skeleton loading animation
    const skeletonItems = document.querySelectorAll('.skeleton-loader');
    setTimeout(() => {
        skeletonItems.forEach(item => {
            item.classList.add('loaded');
        });
    }, 1500);
    
    // Initialize any tooltips
    initTooltips();
});

// Tooltip initialization function
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            if (!tooltipText) return;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10 + window.scrollY}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + window.scrollX}px`;
            
            setTimeout(() => {
                tooltip.classList.add('tooltip-visible');
            }, 10);
            
            this.addEventListener('mouseleave', function tooltipRemove() {
                tooltip.classList.remove('tooltip-visible');
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 300);
                this.removeEventListener('mouseleave', tooltipRemove);
            });
        });
    });
}