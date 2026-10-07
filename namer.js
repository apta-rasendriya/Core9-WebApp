const { Namer } = require('@parcel/plugin');
const path = require('path');

module.exports = new Namer({
  name({ bundle }) {
    // Skip HTML bundles
    if (bundle.type === 'html') {
      return null;
    }
    
    const entry = bundle.getMainEntry();
    if (!entry) return null;
    
    const filePath = entry.filePath;
    const bundleType = bundle.type;
    
    // Get the filename with its original extension
    const baseName = path.basename(filePath);
    
    return baseName;
  }
});