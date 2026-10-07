const fs = require('fs');
const path = require('path');

const buildDir = './build';

// Create folders
const folders = ['js', 'css', 'img', 'fonts'];
folders.forEach(folder => {
  const folderPath = path.join(buildDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

// Move files and track what was moved
const movedFiles = { js: [], css: [], img: [], fonts: [] };

fs.readdirSync(buildDir).forEach(file => {
  const filePath = path.join(buildDir, file);
  if (!fs.statSync(filePath).isFile()) return;
  
  const ext = path.extname(file).toLowerCase();
  
if (ext === '.js') {
  fs.renameSync(filePath, path.join(buildDir, 'js', file));
} else if (ext === '.css') {
  // Don't move CSS - keep in root
  console.log(`📄 Keeping CSS in root: ${file}`);
} else if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
  fs.renameSync(filePath, path.join(buildDir, 'img', file));
}
});

// Fix paths INSIDE CSS files
movedFiles.css.forEach(cssFile => {
  const cssPath = path.join(buildDir, 'css', cssFile);
  let content = fs.readFileSync(cssPath, 'utf8');
  
  // Update font paths: url('./fonts/...') -> url('../fonts/...')
  content = content.replace(/url\(['"]?\.\/fonts\//g, 'url(\'../fonts/');
  content = content.replace(/url\(['"]?\.\/img\//g, 'url(\'../img/');
  content = content.replace(/url\(['"]?\.\/assets\//g, 'url(\'../assets/');
  
  // Also handle paths without ./ prefix
  content = content.replace(/url\(['"]?fonts\//g, 'url(\'../fonts/');
  content = content.replace(/url\(['"]?img\//g, 'url(\'../img/');
  
  fs.writeFileSync(cssPath, content);
  console.log(`✏️  Fixed paths in CSS: ${cssFile}`);
});

// Update HTML references
const htmlFiles = fs.readdirSync(buildDir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(htmlFile => {
  const htmlPath = path.join(buildDir, htmlFile);
  let content = fs.readFileSync(htmlPath, 'utf8');
  
  // Update script tags
  content = content.replace(/<script([^>]*)src="([^"]+\.js)"/g, (match, attrs, src) => {
    const filename = path.basename(src);
    return `<script${attrs}src="./js/${filename}"`;
  });
  
  // Update CSS links
  content = content.replace(/<link([^>]*)href="([^"]+\.css)"/g, (match, attrs, href) => {
    const filename = path.basename(href);
    return `<link${attrs}href="./css/${filename}"`;
  });
  
  // Update image tags
  content = content.replace(/<img([^>]*)src="([^"]+)"/g, (match, attrs, src) => {
    const filename = path.basename(src);
    const ext = path.extname(filename).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.gif'].includes(ext)) {
      return `<img${attrs}src="./img/${filename}"`;
    }
    return match;
  });
  
  fs.writeFileSync(htmlPath, content);
  console.log(`✏️  Updated HTML: ${htmlFile}`);
});

console.log('\n✅ Build organized successfully!');