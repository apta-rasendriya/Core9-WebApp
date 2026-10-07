const fs = require('fs');
const path = require('path');

const buildDir = './build';

function fixHtmlPaths() {
  const htmlFiles = fs.readdirSync(buildDir).filter(f => f.endsWith('.html'));
  
  htmlFiles.forEach(htmlFile => {
    const htmlPath = path.join(buildDir, htmlFile);
    let content = fs.readFileSync(htmlPath, 'utf8');
    
    // Update script tags to point to js folder
    content = content.replace(/<script type="module" src="\.\/([^"]+\.js)">/g, (match, filename) => {
      // Check if the file exists in js folder
      const jsPath = path.join(buildDir, 'js', filename);
      if (fs.existsSync(jsPath)) {
        return `<script type="module" src="./js/${filename}">`;
      }
      return match;
    });
    
    // Update CSS links
    content = content.replace(/<link rel="stylesheet" href="\.\/([^"]+\.css)">/g, (match, filename) => {
      const cssPath = path.join(buildDir, 'css', filename);
      if (fs.existsSync(cssPath)) {
        return `<link rel="stylesheet" href="./css/${filename}">`;
      }
      return match;
    });
    
    fs.writeFileSync(htmlPath, content);
    console.log(`✅ Fixed paths in: ${htmlFile}`);
  });
}

fixHtmlPaths();