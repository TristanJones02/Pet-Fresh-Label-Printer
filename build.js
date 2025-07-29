const browserify = require('browserify');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const distDir = path.join(__dirname, 'public', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
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
  
  // Generate default placeholder icon if not exists
  const iconPath = path.join(assetsDir, 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.log('Creating placeholder icon...');
    // Here we could use a library to generate an icon, but for simplicity
    // we'll just copy a placeholder or create a simple file
    fs.writeFileSync(iconPath, Buffer.from('Placeholder for icon file'));
    console.log('Placeholder icon created at:', iconPath);
  }
  
  console.log('Build process completed. Run "npm run build" to create the installer');
});

bundleStream.on('error', (err) => {
  console.error('Error creating bundle:', err);
});
