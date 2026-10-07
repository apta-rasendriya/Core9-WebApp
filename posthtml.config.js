const include = require('posthtml-include');

module.exports = {
  plugins: [
    include({
      root: './src',
      encoding: 'utf8'
    })
  ],
  parser: {
    options: {
      xmlMode: true,
      decodeEntities: true,
      lowerCaseTags: false,
      lowerCaseAttributeNames: false,
      recognizeSelfClosing: true
    }
  }
};