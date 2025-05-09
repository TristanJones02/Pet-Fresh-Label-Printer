const browserify = require('browserify');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const distDir = path.join(__dirname, 'public', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build the app bundle
console.log('Building app bundle...');
const appBundle = browserify({
  entries: [path.join(__dirname, 'src', 'index.js')],
  debug: true,
  transform: [
    ['babelify', {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: ['@babel/plugin-transform-runtime']
    }]
  ]
});

// Write the bundle to a file
const bundleStream = fs.createWriteStream(path.join(distDir, 'bundle.js'));
appBundle.bundle().pipe(bundleStream);

bundleStream.on('finish', () => {
  console.log('Bundle created successfully!');
  console.log('Output: ' + path.join(distDir, 'bundle.js'));
});

bundleStream.on('error', (err) => {
  console.error('Error creating bundle:', err);
});
