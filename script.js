const STORAGE_KEY = 'lumen_unsplash_access_key';
const API_BASE = 'https://api.unsplash.com';
const PLACEHOLDER_KEYS = ['YOUR_UNSPLASH_ACCESS_KEY_HERE', 'DEMO_MODE_PLACEHOLDER', ''];

/* Unsplash caps both /search (per_page) and /photos/random (count) at 30 per request. */
const MAX_PER_REQUEST = 30;

class UnsplashWallpaperDownloader {
    constructor() {
        this.baseUrl = (typeof CONFIG !== 'undefined' && CONFIG.UNSPLASH_API_BASE) || API_BASE;
        this.accessKey = this.resolveAccessKey();
        this.photos = [];
        this.photoIds = new Set();
        this.selectedPhotos = new Set();
        this.busy = false;

        // Pagination / discovery state
        this.mode = null;            // 'search' | 'random'
        this.query = '';
        this.searchPage = 1;
        this.searchTotalPages = 1;

        // Lightbox state
        this.lightboxIndex = -1;
        this._lastFocus = null;

        this.initializeElements();
        this.bindEvents();
        this.renderInitialState();
    }

    /* Resolve key from localStorage first, then optional config.js — never crash. */
    resolveAccessKey() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && !PLACEHOLDER_KEYS.includes(stored)) return stored;

        if (typeof CONFIG !== 'undefined' && CONFIG.UNSPLASH_ACCESS_KEY &&
            !PLACEHOLDER_KEYS.includes(CONFIG.UNSPLASH_ACCESS_KEY)) {
            return CONFIG.UNSPLASH_ACCESS_KEY;
        }
        return null;
    }

    hasKey() { return Boolean(this.accessKey); }

    initializeElements() {
        const $ = (id) => document.getElementById(id);
        this.searchInput = $('searchInput');
        this.searchBtn = $('searchBtn');
        this.randomBtn = $('randomBtn');
        this.suggestions = $('suggestions');
        this.selectAllBtn = $('selectAllBtn');
        this.downloadAllBtn = $('downloadAllBtn');
        this.clearBtn = $('clearBtn');
        this.settingsBtn = $('settingsBtn');
        this.settingsLabel = this.settingsBtn?.querySelector('.ghost-btn__label');
        this.gallery = $('gallery');
        this.status = $('status');
        this.orientationSelect = $('orientation');
        this.countSelect = $('count');
        this.qualitySelect = $('quality');

        this.loadMoreWrap = $('loadMoreWrap');
        this.loadMoreBtn = $('loadMoreBtn');

        this.selectionBar = $('selectionBar');
        this.selectionCount = $('selectionCount');
        this.barDownloadBtn = $('barDownloadBtn');
        this.barDeselectBtn = $('barDeselectBtn');

        this.lightbox = $('lightbox');
        this.lbBackdrop = this.lightbox.querySelector('.lightbox__backdrop');
        this.lbClose = $('lbClose');
        this.lbPrev = $('lbPrev');
        this.lbNext = $('lbNext');
        this.lbImg = $('lbImg');
        this.lbSpinner = $('lbSpinner');
        this.lbAuthor = $('lbAuthor');
        this.lbDesc = $('lbDesc');
        this.lbUnsplash = $('lbUnsplash');
        this.lbDownload = $('lbDownload');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchPhotos());
        this.randomBtn.addEventListener('click', () => this.getRandomPhotos());
        this.selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        this.downloadAllBtn.addEventListener('click', () => this.downloadSelected());
        this.clearBtn.addEventListener('click', () => this.clearGallery());
        this.settingsBtn.addEventListener('click', () => this.renderOnboarding(true));
        this.loadMoreBtn.addEventListener('click', () => this.loadMore());
        this.barDownloadBtn.addEventListener('click', () => this.downloadSelected());
        this.barDeselectBtn.addEventListener('click', () => this.deselectAll());

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.searchPhotos();
        });

        // Suggestion chips (event delegation)
        this.suggestions.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            this.searchInput.value = chip.dataset.q;
            this.searchPhotos();
        });

        // Lightbox controls
        this.lbClose.addEventListener('click', () => this.closeLightbox());
        this.lbBackdrop.addEventListener('click', () => this.closeLightbox());
        this.lbPrev.addEventListener('click', () => this.lightboxNav(-1));
        this.lbNext.addEventListener('click', () => this.lightboxNav(1));
        this.lbDownload.addEventListener('click', () => this.downloadFromLightbox());
        this.lbImg.addEventListener('load', () => this.lightbox.classList.remove('is-loading'));

        document.addEventListener('keydown', (e) => this.onGlobalKey(e));
    }

    onGlobalKey(e) {
        if (this.lightbox.hidden) return;
        if (e.key === 'Escape') this.closeLightbox();
        else if (e.key === 'ArrowLeft') this.lightboxNav(-1);
        else if (e.key === 'ArrowRight') this.lightboxNav(1);
        else if (e.key === 'Tab') this.trapFocus(e);
    }

    renderInitialState() {
        this.updateKeyIndicator();
        if (!this.hasKey()) this.renderOnboarding();
        else this.renderEmptyState();
    }

    updateKeyIndicator() {
        if (!this.settingsBtn) return;
        const ok = this.hasKey();
        this.settingsBtn.classList.toggle('is-ok', ok);
        if (this.settingsLabel) this.settingsLabel.textContent = ok ? 'API Key set' : 'API Key';
    }

    /* ---------------- API key onboarding ---------------- */
    renderOnboarding(force = false) {
        if (!force && this.hasKey()) return;
        this.updateLoadMore();

        this.gallery.innerHTML = `
            <div class="onboard">
                <h2>One key to begin</h2>
                <p>Lumen pulls photos straight from Unsplash. Paste a free
                   <strong>Access Key</strong> to unlock search, random discovery and downloads.
                   It is stored only in your browser.</p>
                <form class="onboard-form" id="keyForm">
                    <input type="text" id="keyInput" placeholder="Unsplash Access Key"
                           value="${this.escapeAttr(this.accessKey || '')}" autocomplete="off" spellcheck="false">
                    <button type="submit" class="btn btn--primary">Save key</button>
                </form>
                <p class="onboard-steps">
                    No key yet? Create a free app at
                    <a href="https://unsplash.com/oauth/applications" target="_blank" rel="noopener">unsplash.com/developers</a>
                    and copy the <em>Access Key</em>.
                </p>
            </div>
        `;

        const form = document.getElementById('keyForm');
        const input = document.getElementById('keyInput');
        input.focus();
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveKey(input.value.trim());
        });
    }

    saveKey(key) {
        if (!key || PLACEHOLDER_KEYS.includes(key)) {
            this.showStatus('Please paste a valid Unsplash Access Key.', 'error');
            return;
        }
        localStorage.setItem(STORAGE_KEY, key);
        this.accessKey = key;
        this.updateKeyIndicator();
        this.renderEmptyState();
        this.showStatus('Key saved — search away or hit “Surprise me”.', 'success');
    }

    showStatus(message, type = 'loading') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        if (this._statusTimer) clearTimeout(this._statusTimer);
        if (type === 'success' || type === 'error') {
            this._statusTimer = setTimeout(() => { this.status.className = 'status'; }, 4000);
        }
    }

    /* Disable triggers during a fetch so we never fire overlapping requests. */
    setBusy(busy) {
        this.busy = busy;
        [this.searchBtn, this.randomBtn].forEach(b => { b.disabled = busy; });
        this.searchBtn.classList.toggle('is-loading', busy);
        this.randomBtn.classList.toggle('is-loading', busy);
    }

    async makeRequest(endpoint, params = {}) {
        if (!this.hasKey()) {
            this.renderOnboarding(true);
            throw new Error('Add your Unsplash Access Key to continue.');
        }

        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url, {
            headers: { 'Authorization': `Client-ID ${this.accessKey}` }
        });

        if (response.status === 401) {
            this.renderOnboarding(true);
            throw new Error('Key rejected (401). Double-check your Access Key.');
        }
        if (response.status === 403) {
            throw new Error('Rate limit reached (403). Try again in a little while.');
        }
        if (!response.ok) throw new Error(`Unsplash API error: ${response.status}`);
        return response.json();
    }

    /* ---------------- Fetching ---------------- */
    searchPhotos() { return this.runSearch(false); }

    async runSearch(append = false) {
        if (this.busy) return;

        if (!append) {
            const query = this.searchInput.value.trim();
            if (!query) { this.showStatus('Type something to search for.', 'error'); return; }
            this.query = query;
            this.searchPage = 1;
            this.searchTotalPages = 1;
            this.resetPhotos();
        }
        this.mode = 'search';

        const want = Number(this.countSelect.value);
        const perPage = Math.min(want, MAX_PER_REQUEST);
        this.setBusy(true);
        if (append) this.loadMoreBtn.classList.add('is-loading');
        else this.renderSkeletons(want);
        this.showStatus(append ? 'Loading more…' : 'Searching Unsplash…');

        try {
            const startLen = this.photos.length;
            let added = 0;

            while (added < want && this.searchPage <= this.searchTotalPages) {
                const data = await this.makeRequest('/search/photos', {
                    query: this.query, orientation: this.orientationSelect.value,
                    per_page: perPage, page: this.searchPage, content_filter: 'low'
                });
                this.searchTotalPages = data.total_pages || 1;
                const batch = data.results || [];
                added += this.addPhotos(batch);
                this.searchPage++;
                if (batch.length < perPage) break; // exhausted
            }

            this.displayPhotos(append);
            const total = this.photos.length;
            if (total === 0) {
                this.showStatus(`No results for “${this.query}”. Try another term.`, 'error');
            } else if (append) {
                this.showStatus(`Loaded ${total - startLen} more — ${total} total.`, 'success');
            } else {
                this.showStatus(`${total} photos for “${this.query}”.`, 'success');
            }
        } catch (error) {
            this.showError(error);
        } finally {
            this.setBusy(false);
            this.loadMoreBtn.classList.remove('is-loading');
            this.updateLoadMore();
        }
    }

    getRandomPhotos() { return this.runRandom(false); }

    async runRandom(append = false) {
        if (this.busy) return;
        this.mode = 'random';
        if (!append) this.resetPhotos();

        const want = Number(this.countSelect.value);
        this.setBusy(true);
        if (append) this.loadMoreBtn.classList.add('is-loading');
        else this.renderSkeletons(want);
        this.showStatus(append ? 'Loading more…' : 'Gathering a fresh set…');

        try {
            const startLen = this.photos.length;
            let added = 0;
            let guard = 0;

            // /photos/random returns at most 30 and may repeat — loop + dedupe up to the target.
            while (added < want && guard < 6) {
                const count = Math.min(want - added, MAX_PER_REQUEST);
                const data = await this.makeRequest('/photos/random', {
                    orientation: this.orientationSelect.value, count, content_filter: 'low'
                });
                const batch = Array.isArray(data) ? data : [data];
                if (batch.length === 0) break;
                added += this.addPhotos(batch);
                guard++;
            }

            this.displayPhotos(append);
            const total = this.photos.length;
            this.showStatus(append
                ? `Loaded ${total - startLen} more — ${total} total.`
                : `${total} fresh photos loaded.`, 'success');
        } catch (error) {
            this.showError(error);
        } finally {
            this.setBusy(false);
            this.loadMoreBtn.classList.remove('is-loading');
            this.updateLoadMore();
        }
    }

    loadMore() {
        if (this.mode === 'search') this.runSearch(true);
        else if (this.mode === 'random') this.runRandom(true);
    }

    resetPhotos() {
        this.photos = [];
        this.photoIds.clear();
        this.selectedPhotos.clear();
    }

    /* Append unique photos; returns how many were actually added. */
    addPhotos(batch) {
        let n = 0;
        for (const photo of batch) {
            if (photo && photo.id && !this.photoIds.has(photo.id)) {
                this.photoIds.add(photo.id);
                this.photos.push(photo);
                n++;
            }
        }
        return n;
    }

    updateLoadMore() {
        const hasMore = this.photos.length > 0 &&
            (this.mode === 'random' || (this.mode === 'search' && this.searchPage <= this.searchTotalPages));
        this.loadMoreWrap.hidden = !hasMore || !this.hasKey();
    }

    showError(error) {
        // Roll back skeletons so a failure doesn't leave shimmer blocks behind.
        if (this.photos.length) this.displayPhotos();
        else { this.gallery.innerHTML = ''; this.renderEmptyState(); }
        this.showStatus(error.message, 'error');
    }

    /* ---------------- Rendering ---------------- */
    renderSkeletons(count) {
        const n = Math.min(count, 12);
        const heights = [320, 240, 380, 280, 340, 220, 300, 360, 260, 400, 290, 330];
        this.gallery.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const sk = document.createElement('div');
            sk.className = 'skeleton';
            sk.style.height = `${heights[i % heights.length]}px`;
            this.gallery.appendChild(sk);
        }
    }

    renderEmptyState() {
        if (!this.hasKey()) return;
        this.gallery.innerHTML = `
            <div class="empty-state">
                <span class="empty-state__mark" aria-hidden="true">◍</span>
                <p>Search for anything or hit <strong>“Surprise me”</strong> to fill your gallery.</p>
            </div>`;
        this.updateLoadMore();
    }

    displayPhotos(append = false) {
        if (!append) this.gallery.innerHTML = '';

        if (!this.photos.length) { this.updateSelectionUI(); this.renderEmptyState(); return; }

        const start = append ? this.gallery.querySelectorAll('.photo-card').length : 0;
        const frag = document.createDocumentFragment();
        for (let i = start; i < this.photos.length; i++) {
            const card = this.createPhotoCard(this.photos[i], i);
            card.style.animationDelay = `${Math.min((i - start) * 45, 600)}ms`;
            frag.appendChild(card);
        }
        this.gallery.appendChild(frag);
        this.updateSelectionUI();
    }

    createPhotoCard(photo, index) {
        const card = document.createElement('article');
        card.className = 'photo-card';
        card.dataset.id = photo.id;
        if (this.selectedPhotos.has(photo.id)) card.classList.add('is-selected');

        const author = this.escape(photo.user?.name || 'Unknown');
        const desc = this.escape(photo.alt_description || photo.description || 'Untitled');
        const color = (typeof photo.color === 'string' && photo.color) || '#1b1712';
        const selected = this.selectedPhotos.has(photo.id);

        card.innerHTML = `
            <div class="photo-badge" aria-hidden="true">✓</div>
            <div class="photo-media" style="background:${this.escapeAttr(color)}">
                <img src="${this.escapeAttr(photo.urls.small)}" alt="${desc}" loading="lazy" decoding="async">
                <button class="photo-zoom" type="button" data-action="zoom" aria-label="Preview photo">⤢</button>
                <div class="photo-overlay">
                    <div class="photo-author">${author}</div>
                    <div class="photo-description">${desc}</div>
                    <div class="photo-actions">
                        <button class="download-btn" type="button" data-action="download">Download</button>
                        <button class="select-btn" type="button" data-action="select" aria-pressed="${selected}">${selected ? 'Selected' : 'Select'}</button>
                    </div>
                </div>
            </div>
        `;

        const img = card.querySelector('img');
        img.addEventListener('error', () => card.classList.add('img-error'));

        card.querySelector('[data-action="zoom"]')
            .addEventListener('click', () => this.openLightbox(this.indexOf(photo.id)));
        card.querySelector('img')
            .addEventListener('click', () => this.openLightbox(this.indexOf(photo.id)));
        card.querySelector('[data-action="download"]')
            .addEventListener('click', () => this.downloadSingle(photo.id));
        card.querySelector('[data-action="select"]')
            .addEventListener('click', (e) => this.toggleSelect(photo.id, e.currentTarget, card));

        return card;
    }

    indexOf(photoId) { return this.photos.findIndex(p => p.id === photoId); }

    /* ---------------- Selection ---------------- */
    toggleSelect(photoId, button, card) {
        const selected = !this.selectedPhotos.has(photoId);
        if (selected) this.selectedPhotos.add(photoId);
        else this.selectedPhotos.delete(photoId);
        this.paintSelection(card, button, selected);
        this.updateSelectionUI();
    }

    paintSelection(card, button, on) {
        if (card) card.classList.toggle('is-selected', on);
        if (button) {
            button.classList.toggle('selected', on);
            button.setAttribute('aria-pressed', String(on));
            button.textContent = on ? 'Selected' : 'Select';
        }
    }

    toggleSelectAll() {
        const allSelected = this.photos.length > 0 && this.selectedPhotos.size === this.photos.length;
        if (allSelected) this.deselectAll();
        else {
            this.photos.forEach(p => this.selectedPhotos.add(p.id));
            this.repaintAll();
            this.updateSelectionUI();
        }
    }

    deselectAll() {
        this.selectedPhotos.clear();
        this.repaintAll();
        this.updateSelectionUI();
    }

    repaintAll() {
        this.gallery.querySelectorAll('.photo-card').forEach(card => {
            const on = this.selectedPhotos.has(card.dataset.id);
            this.paintSelection(card, card.querySelector('.select-btn'), on);
        });
    }

    updateSelectionUI() {
        const n = this.selectedPhotos.size;
        const total = this.photos.length;
        this.downloadAllBtn.disabled = n === 0;
        this.downloadAllBtn.textContent = n ? `Download selected (${n})` : 'Download selected';
        this.selectAllBtn.disabled = total === 0;
        this.selectAllBtn.textContent = (total > 0 && n === total) ? 'Clear selection' : 'Select all';

        this.selectionCount.textContent = String(n);
        this.selectionBar.hidden = n === 0;
        this.selectionBar.classList.toggle('is-visible', n > 0);
    }

    /* ---------------- Lightbox ---------------- */
    openLightbox(index) {
        if (index < 0 || index >= this.photos.length) return;
        this.lightboxIndex = index;
        this._lastFocus = document.activeElement;
        this.lightbox.hidden = false;
        document.body.classList.add('lb-open');
        this.updateLightbox();
        this.lbClose.focus();
    }

    closeLightbox() {
        this.lightbox.hidden = true;
        document.body.classList.remove('lb-open');
        this.lbImg.removeAttribute('src');
        if (this._lastFocus && typeof this._lastFocus.focus === 'function') this._lastFocus.focus();
    }

    lightboxNav(delta) {
        const next = this.lightboxIndex + delta;
        if (next < 0 || next >= this.photos.length) return;
        this.lightboxIndex = next;
        this.updateLightbox();
    }

    updateLightbox() {
        const photo = this.photos[this.lightboxIndex];
        if (!photo) return;
        this.lightbox.classList.add('is-loading');
        this.lbImg.alt = photo.alt_description || photo.description || 'Unsplash photo';
        this.lbImg.src = photo.urls.regular || photo.urls.small;
        this.lbAuthor.textContent = photo.user?.name || 'Unknown';
        this.lbDesc.textContent = photo.alt_description || photo.description || '';
        this.lbUnsplash.href = photo.links?.html || 'https://unsplash.com';
        this.lbPrev.disabled = this.lightboxIndex === 0;
        this.lbNext.disabled = this.lightboxIndex === this.photos.length - 1;
    }

    async downloadFromLightbox() {
        const photo = this.photos[this.lightboxIndex];
        if (photo) await this.downloadSingle(photo.id);
    }

    trapFocus(e) {
        const focusables = this.lightbox.querySelectorAll(
            'button:not([disabled]), a[href]'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ---------------- Downloading ---------------- */
    async downloadSingle(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;
        this.showStatus('Preparing your download…');
        try {
            await this.downloadPhoto(photo);
            this.showStatus('Saved — image, thumbnail and credits.', 'success');
        } catch (error) {
            this.showStatus(`Download failed: ${error.message}`, 'error');
        }
    }

    async downloadSelected() {
        if (this.selectedPhotos.size === 0) return;
        try {
            const zip = new JSZip();
            const selected = this.photos.filter(p => this.selectedPhotos.has(p.id));

            for (let i = 0; i < selected.length; i++) {
                this.showStatus(`Packaging ${i + 1} / ${selected.length}…`);
                const files = await this.preparePhotoFiles(selected[i]);
                zip.folder('images').file(files.imageName, files.imageBlob);
                zip.folder('thumbnails').file(files.thumbName, files.thumbBlob);
                zip.folder('credits').file(files.creditName, files.creditContent);
            }

            this.showStatus('Compressing archive…');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(zipBlob, 'lumen-wallpapers.zip');
            this.showStatus(`Downloaded ${selected.length} wallpapers.`, 'success');
        } catch (error) {
            this.showStatus(`Bulk download failed: ${error.message}`, 'error');
        }
    }

    async downloadPhoto(photo) {
        const files = await this.preparePhotoFiles(photo);
        this.downloadBlob(files.imageBlob, files.imageName);
        this.downloadBlob(files.thumbBlob, files.thumbName);
        this.downloadBlob(new Blob([files.creditContent], { type: 'text/plain' }), files.creditName);
    }

    async preparePhotoFiles(photo) {
        this.trackDownload(photo); // Unsplash API guideline: ping the download endpoint.
        const imageUrl = photo.urls[this.qualitySelect.value] || photo.urls.full;
        const imageBlob = await this.fetchBlob(imageUrl);
        const thumbBlob = await this.createThumbnail(imageBlob, 400, 600);
        const base = this.sanitizeFileName(`${photo.id}_${photo.user?.username || 'unsplash'}`);
        return {
            imageBlob, thumbBlob,
            creditContent: this.createCreditContent(photo),
            imageName: `${base}.jpg`,
            thumbName: `${base}_thumb.jpg`,
            creditName: `${base}.txt`
        };
    }

    /* Fire-and-forget download tracking required by the Unsplash API guidelines. */
    trackDownload(photo) {
        const loc = photo.links?.download_location;
        if (!loc || !this.hasKey()) return;
        fetch(loc, { headers: { 'Authorization': `Client-ID ${this.accessKey}` } }).catch(() => {});
    }

    async fetchBlob(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('image fetch failed');
        return response.blob();
    }

    createThumbnail(imageBlob, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(imageBlob);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
                canvas.width = Math.round(img.width * ratio);
                canvas.height = Math.round(img.height * ratio);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(objectUrl);
                canvas.toBlob(b => b ? resolve(b) : reject(new Error('thumbnail failed')), 'image/jpeg', 0.82);
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('thumbnail failed')); };
            img.src = objectUrl;
        });
    }

    createCreditContent(photo) {
        const now = new Date();
        return `Photo Information
==================

Photographer: ${photo.user?.name || 'Unknown'}
Username: @${photo.user?.username || 'unknown'}
Profile: ${photo.user?.links?.html || 'n/a'}

Photo ID: ${photo.id}
Unsplash Link: ${photo.links?.html || 'n/a'}

Description: ${photo.alt_description || photo.description || 'No description available'}

Attribution
===========
Photo by ${photo.user?.name || 'Unknown'} on Unsplash

Unsplash License
================
This photo is available under the Unsplash License.
Details: https://unsplash.com/license

Downloaded: ${now.toLocaleDateString('en-US')} ${now.toLocaleTimeString('en-US')}`;
    }

    sanitizeFileName(name) {
        return name.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    clearGallery() {
        this.resetPhotos();
        this.mode = null;
        this.query = '';
        this.searchInput.value = '';
        this.status.className = 'status';
        this.updateSelectionUI();
        if (this.hasKey()) this.renderEmptyState();
        else this.renderOnboarding();
        this.updateLoadMore();
    }

    escape(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    /* Safe interpolation inside double-quoted HTML attributes. */
    escapeAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.wallpaperApp = new UnsplashWallpaperDownloader();
});
