# 📱 Unsplash Image Downloader

> 🎨 **Download stunning mobile wallpapers with just one click!**  
> A modern, fast, and intuitive web application for bulk downloading high-quality images from Unsplash.

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/alperkah/unsplash-wallpaper-downloader?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/alperkah/unsplash-wallpaper-downloader?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/alperkah/unsplash-wallpaper-downloader?style=for-the-badge)
![GitHub license](https://img.shields.io/github/license/alperkah/unsplash-wallpaper-downloader?style=for-the-badge)

![Unsplash Image Downloader](https://img.shields.io/badge/Unsplash-API-black?style=for-the-badge&logo=unsplash)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

[🚀 **Try Live Demo**](https://alperkah.github.io/unsplash-wallpaper-downloader/) | [📖 **Documentation**](#-how-to-use) | [🐛 **Report Bug**](https://github.com/alperkah/unsplash-wallpaper-downloader/issues)

</div>

---

## 🌟 Why This Tool?

- **🚀 Lightning Fast**: No server required - runs entirely in your browser
- **📦 Bulk Download**: Download multiple wallpapers as organized ZIP files  
- **🎯 Smart Filtering**: Find exactly what you need with advanced search options
- **📱 Mobile Optimized**: Perfect wallpapers for any device orientation
- **🎨 Auto Thumbnails**: Get 400x600 previews automatically generated
- **📄 Proper Attribution**: Automatic credit files for all photographers
- **🔒 Privacy First**: Your API key stays local, no data collection

## ✨ Features

- 🔍 **Advanced Search**: Search photos by keywords with smart filtering
- 📱 **Mobile-Focused**: Portrait, landscape, and square orientation filters
- 📦 **Bulk Download**: Download multiple photos as organized ZIP files
- 🖼️ **Auto Thumbnails**: Generates 400x600 thumbnails automatically
- 📄 **Attribution Files**: Creates proper credit files for photographers
- 🎲 **Random Discovery**: Explore random high-quality wallpapers
- 🎨 **Modern UI**: Responsive design with smooth animations
- ⚡ **Client-Side**: No server required, runs entirely in browser

## 🚀 Quick Start

### 1. Get Your Unsplash API Key

1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Create a free account or sign in
3. Click "New Application"
4. Fill out the application form:
   - **Application name**: Choose any name (e.g., "My Wallpaper App")
   - **Description**: Brief description of your use
   - Accept the terms and guidelines
5. Copy your **Access Key** from the application dashboard

### 2. Configure the Application

1. Clone or download this repository
2. Create a `config.js` file in the project root
3. Add your API key to the config file:

```javascript
// config.js
const CONFIG = {
    UNSPLASH_ACCESS_KEY: 'your-actual-access-key-here',
    UNSPLASH_API_BASE: 'https://api.unsplash.com'
};
```

**⚠️ Important**: Never commit your actual API key to version control. The `config.js` file is excluded from git tracking.

### 3. Run the Application

1. Open `index.html` in a modern web browser
2. Start searching and downloading wallpapers!

## 📁 Project Structure

```
unsplash-image-downloader/
├── index.html          # Main application interface
├── styles.css          # Application styling
├── script.js           # Core functionality
├── config.js           # API configuration (create this file)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🎯 How to Use

### Search for Photos
1. Enter keywords in the search box (e.g., "nature", "abstract", "minimal")
2. Select orientation (Portrait recommended for mobile wallpapers)
3. Choose photo count and quality
4. Click "🔍 Search"

### Download Single Photo
- Click "⬇️ Download" on any photo card
- Three files will be downloaded:
  - `photo_id.jpg` - Original high-quality image
  - `photo_id.jpg` - 400x600 thumbnail version  
  - `photo_id.txt` - Attribution and credit information

### Bulk Download
1. Click "✓ Select" on multiple photos
2. Click "📦 Download Selected"
3. A ZIP file will be downloaded with organized folders:
   ```
   unsplash-wallpapers.zip
   ├── images/          # Original photos
   ├── thumbnails/      # 400x600 thumbnails
   └── credits/         # Attribution files
   ```

### Get Random Photos
- Click "🎲 Get Random" for curated random wallpapers
- Filters still apply (orientation, count, quality)

## 🔧 Configuration Options

### Orientation Filters
- **Portrait**: Perfect for mobile phones (9:16 ratio)
- **Landscape**: Great for desktop wallpapers
- **Square**: Ideal for profile pictures or square displays

### Quality Settings
- **Regular**: ~1080px width, smaller file sizes
- **High**: ~2000px width, recommended for most uses
- **Raw**: Original resolution, largest file sizes

### Photo Counts
- Choose between 10, 20, 30, or 50 photos per search
- Higher counts may take longer to load

## 📄 Attribution System

Every downloaded photo includes a detailed attribution file with:
- Photographer name and profile link
- Photo ID and Unsplash link
- Proper attribution format
- Download timestamp
- Unsplash license information

Example attribution format:
```
Photo by John Doe on Unsplash
Source: https://unsplash.com/@johndoe
```

## 🌐 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

**Requirements**: Modern browser with ES6+ support, Canvas API, and Fetch API.

## 📊 API Limits

- **Demo Mode**: 50 requests per hour
- **Production**: 5,000 requests per hour (requires app review)

To increase limits, submit your application for production review on the Unsplash Developer Dashboard.

## 🛠️ Development

This project uses vanilla JavaScript with no build process required. Key technologies:

- **ES6+ Classes**: Modern JavaScript architecture
- **Fetch API**: HTTP requests to Unsplash
- **Canvas API**: Client-side thumbnail generation
- **JSZip**: ZIP file creation for bulk downloads
- **CSS Grid/Flexbox**: Responsive layout

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

Downloaded photos are subject to the [Unsplash License](https://unsplash.com/license).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Issues

Found a bug or have a feature request? Please open an issue on GitHub.

## 📊 Stats & Analytics

<div align="center">

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/alperkah/unsplash-wallpaper-downloader?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/alperkah/unsplash-wallpaper-downloader?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/alperkah/unsplash-wallpaper-downloader?style=flat-square)

</div>

## 🌟 Show Your Support

If this project helped you, please consider:

- ⭐ **Star this repository** to show your support
- 🍴 **Fork it** to contribute or customize
- 📢 **Share it** with others who might find it useful
- 🐛 **Report issues** to help improve the project

## 🙏 Acknowledgments

- [Unsplash](https://unsplash.com) for providing the amazing photo API
- [JSZip](https://stuk.github.io/jszip/) for client-side ZIP generation
- All the talented photographers on Unsplash

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the developer community**

[⬆ Back to Top](#-unsplash-image-downloader)

</div>

---

**Note**: This application is not affiliated with Unsplash. Please respect the Unsplash community guidelines and photographer rights when using downloaded images.