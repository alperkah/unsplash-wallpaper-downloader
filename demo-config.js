// Demo Configuration for GitHub Pages
// This is a demo version with limited functionality

const CONFIG = {
    // Demo API key with limited access
    UNSPLASH_ACCESS_KEY: 'DEMO_MODE_PLACEHOLDER',
    UNSPLASH_API_BASE: 'https://api.unsplash.com'
};

// Demo mode notification
if (CONFIG.UNSPLASH_ACCESS_KEY === 'DEMO_MODE_PLACEHOLDER') {
    document.addEventListener('DOMContentLoaded', function() {
        const demoNotice = document.createElement('div');
        demoNotice.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 9999; font-family: Arial, sans-serif;">
                🚀 <strong>DEMO MODE</strong> - To use this app with your own API key, 
                <a href="https://github.com/alperkah/unsplash-wallpaper-downloader" style="color: #FFD700; text-decoration: underline;">clone the repository</a>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
            </div>
        `;
        document.body.insertBefore(demoNotice, document.body.firstChild);
        document.body.style.paddingTop = '60px';
    });
}