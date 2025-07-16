class UnsplashWallpaperDownloader {
    constructor() {
        // Get API key from config.js
        this.accessKey = CONFIG.UNSPLASH_ACCESS_KEY;
        this.baseUrl = CONFIG.UNSPLASH_API_BASE;
        this.photos = [];
        this.selectedPhotos = new Set();
        
        this.initializeElements();
        this.bindEvents();
        this.showApiKeyWarning();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.randomBtn = document.getElementById('randomBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.gallery = document.getElementById('gallery');
        this.status = document.getElementById('status');
        this.orientationSelect = document.getElementById('orientation');
        this.countSelect = document.getElementById('count');
        this.qualitySelect = document.getElementById('quality');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchPhotos());
        this.randomBtn.addEventListener('click', () => this.getRandomPhotos());
        this.downloadAllBtn.addEventListener('click', () => this.downloadSelected());
        this.clearBtn.addEventListener('click', () => this.clearGallery());
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchPhotos();
        });
    }

    showApiKeyWarning() {
        if (this.accessKey === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') {
            this.showStatus('⚠️ Unsplash API key required! Please update the API key in config.js file.', 'error');
        }
    }

    showStatus(message, type = 'loading') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                this.status.style.display = 'none';
            }, 3000);
        }
    }

    async makeRequest(endpoint, params = {}) {
        if (this.accessKey === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') {
            throw new Error('API key not configured');
        }

        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key]) url.searchParams.append(key, params[key]);
        });

        const response = await fetch(url, {
            headers: {
                'Authorization': `Client-ID ${this.accessKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    async searchPhotos() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showStatus('Please enter a search term', 'error');
            return;
        }

        this.showStatus('Searching for photos...');

        try {
            const params = {
                query: query,
                orientation: this.orientationSelect.value,
                per_page: this.countSelect.value,
                content_filter: 'low'
            };

            const data = await this.makeRequest('/search/photos', params);
            this.photos = data.results;
            this.displayPhotos();
            this.showStatus(`${this.photos.length} photos found`, 'success');
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
        }
    }

    async getRandomPhotos() {
        this.showStatus('Getting random photos...');

        try {
            const params = {
                orientation: this.orientationSelect.value,
                count: this.countSelect.value,
                content_filter: 'low'
            };

            const data = await this.makeRequest('/photos/random', params);
            this.photos = Array.isArray(data) ? data : [data];
            this.displayPhotos();
            this.showStatus(`${this.photos.length} random photos loaded`, 'success');
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
        }
    }

    displayPhotos() {
        this.gallery.innerHTML = '';
        this.selectedPhotos.clear();
        this.updateDownloadButton();

        this.photos.forEach(photo => {
            const photoCard = this.createPhotoCard(photo);
            this.gallery.appendChild(photoCard);
        });
    }

    createPhotoCard(photo) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `
            <img src="${photo.urls.small}" alt="${photo.alt_description || 'Unsplash photo'}" loading="lazy">
            <div class="photo-info">
                <div class="photo-author">📸 ${photo.user.name}</div>
                <div class="photo-description">${photo.alt_description || 'No description'}</div>
                <div class="photo-actions">
                    <button class="download-btn" onclick="wallpaperApp.downloadSingle('${photo.id}')">
                        ⬇️ Download
                    </button>
                    <button class="select-btn" onclick="wallpaperApp.toggleSelect('${photo.id}', this)">
                        ✓ Select
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    toggleSelect(photoId, button) {
        if (this.selectedPhotos.has(photoId)) {
            this.selectedPhotos.delete(photoId);
            button.classList.remove('selected');
            button.textContent = '✓ Select';
        } else {
            this.selectedPhotos.add(photoId);
            button.classList.add('selected');
            button.textContent = '✓ Selected';
        }
        this.updateDownloadButton();
    }

    updateDownloadButton() {
        this.downloadAllBtn.disabled = this.selectedPhotos.size === 0;
        this.downloadAllBtn.textContent = `📦 Download Selected (${this.selectedPhotos.size})`;
    }

    async downloadSingle(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        this.showStatus('Downloading photo...');
        
        try {
            await this.downloadPhoto(photo);
            this.showStatus('Photo downloaded successfully!', 'success');
        } catch (error) {
            this.showStatus(`Download error: ${error.message}`, 'error');
        }
    }

    async downloadSelected() {
        if (this.selectedPhotos.size === 0) return;

        this.showStatus('Downloading selected photos...');

        try {
            const zip = new JSZip();
            const selectedPhotoObjects = this.photos.filter(p => this.selectedPhotos.has(p.id));

            for (let i = 0; i < selectedPhotoObjects.length; i++) {
                const photo = selectedPhotoObjects[i];
                this.showStatus(`Downloading: ${i + 1}/${selectedPhotoObjects.length}`);
                
                const files = await this.preparePhotoFiles(photo);
                
                // Add to zip file
                zip.folder('images').file(files.imageName, files.imageBlob);
                zip.folder('thumbnails').file(files.thumbName, files.thumbBlob);
                zip.folder('credits').file(files.creditName, files.creditContent);
            }

            // Download zip file
            const zipBlob = await zip.generateAsync({type: 'blob'});
            this.downloadBlob(zipBlob, 'unsplash-wallpapers.zip');
            
            this.showStatus('All photos downloaded successfully!', 'success');
        } catch (error) {
            this.showStatus(`Bulk download error: ${error.message}`, 'error');
        }
    }

    async downloadPhoto(photo) {
        const files = await this.preparePhotoFiles(photo);
        
        // Download separately
        this.downloadBlob(files.imageBlob, files.imageName);
        this.downloadBlob(files.thumbBlob, files.thumbName);
        this.downloadBlob(new Blob([files.creditContent], {type: 'text/plain'}), files.creditName);
    }

    async preparePhotoFiles(photo) {
        // Get original image
        const imageUrl = photo.urls[this.qualitySelect.value] || photo.urls.full;
        const imageBlob = await this.fetchBlob(imageUrl);
        
        // Create thumbnail (400x600)
        const thumbBlob = await this.createThumbnail(imageBlob, 400, 600);
        
        // Create file name
        const fileName = this.sanitizeFileName(`${photo.id}_${photo.user.username}`);
        
        // Create credit content
        const creditContent = this.createCreditContent(photo);
        
        return {
            imageBlob,
            thumbBlob,
            creditContent,
            imageName: `${fileName}.jpg`,
            thumbName: `${fileName}.jpg`,
            creditName: `${fileName}.txt`
        };
    }

    async fetchBlob(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download image');
        return await response.blob();
    }

    async createThumbnail(imageBlob, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // Proportional resizing
                const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            
            img.src = URL.createObjectURL(imageBlob);
        });
    }

    createCreditContent(photo) {
        return `Photo Information
==================

Photographer: ${photo.user.name}
Username: @${photo.user.username}
Profile: ${photo.user.links.html}

Photo ID: ${photo.id}
Unsplash Link: ${photo.links.html}

Description: ${photo.alt_description || 'No description available'}

Attribution
===========
Photo by ${photo.user.name} on Unsplash
Source: https://unsplash.com/@${photo.user.username}

Unsplash License
===============
This photo is available under the Unsplash License.
Details: https://unsplash.com/license

Download Date: ${new Date().toLocaleDateString('en-US')}
Download Time: ${new Date().toLocaleTimeString('en-US')}`;
    }

    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearGallery() {
        this.gallery.innerHTML = '';
        this.photos = [];
        this.selectedPhotos.clear();
        this.updateDownloadButton();
        this.status.style.display = 'none';
    }
}

// Initialize the application
const wallpaperApp = new UnsplashWallpaperDownloader();