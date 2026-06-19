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
            <div style="background: linear-gradient(160deg, #e6a85e 0%, #c9794a 100%); color: #1a1207; padding: 14px 18px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 9999; font-family: 'Hanken Grotesk', system-ui, sans-serif; font-weight: 600;">
                ✦ <strong>DEMO MODE</strong> — to run Lumen with your own API key,
                <a href="https://github.com/alperkah/unsplash-wallpaper-downloader" style="color: #1a1207; text-decoration: underline;">clone the repository</a>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: #1a1207; font-size: 18px; cursor: pointer; line-height: 1;">×</button>
            </div>
        `;
        document.body.insertBefore(demoNotice, document.body.firstChild);
        document.body.style.paddingTop = '60px';
    });
}