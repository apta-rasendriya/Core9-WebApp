module.exports = {
    plugins: [
        // Sort media queries for better organization
        require('postcss-sort-media-queries')({
            sort: 'mobile-first'
        }),
        
        // Add vendor prefixes
        require('autoprefixer'),
        
        // Convert px to vw (excludes mobileStyle.css)
        require('@minko-fe/postcss-pxtoviewport')({
            viewportWidth: 1920,
            viewportUnit: 'vw',
            propList: ['*'],
            minPixelValue: 1,
            exclude: [
                /mobileStyle\.css$/,          // Any file ending with mobileStyle.css
                /mobileStyle\.css/,           // Contains mobileStyle.css anywhere
                /src.*mobileStyle\.css/,      // In src folder
                /[\\/]src[\\/]mobileStyle\.css$/, // Windows path support
                /D:.*mobileStyle\.css/        // Absolute Windows path
            ]
        })
    ]
}