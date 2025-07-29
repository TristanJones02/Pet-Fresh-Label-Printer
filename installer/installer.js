/**
 * Pre-build script to prepare the application for packaging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing Pet Fresh Label Printer for packaging...');

// Ensure the icon exists
require('./icon-generator');

// Create a temporary build directory
const buildDir = path.join(__dirname, '..', 'build-temp');
if (fs.existsSync(buildDir)) {
  // Clear the directory
  console.log('Cleaning previous build directory...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// Copy necessary files to the build directory
console.log('Copying application files...');

// Define directories and files to include
const includeDirs = [
  'src',
  'public',
  'electron'
];

// Files in root directory to include
const includeFiles = [
  'package.json',
  'main.js',
  '.babelrc',
  'webpack.config.js'
];

// Directories to exclude
const excludeDirs = [
  'src/tools'
];

// Function to copy directories recursively
function copyDirRecursively(src, dest, excludes = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Check if this path should be excluded
    if (excludes.some(exclude => srcPath.includes(exclude))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirRecursively(srcPath, destPath, excludes);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy each directory
for (const dir of includeDirs) {
  const srcDir = path.join(__dirname, '..', dir);
  const destDir = path.join(buildDir, dir);
  
  if (fs.existsSync(srcDir)) {
    console.log(`Copying ${dir} directory...`);
    copyDirRecursively(srcDir, destDir, excludeDirs);
  }
}

// Copy individual files
for (const file of includeFiles) {
  const srcFile = path.join(__dirname, '..', file);
  const destFile = path.join(buildDir, file);
  
  if (fs.existsSync(srcFile)) {
    console.log(`Copying ${file}...`);
    fs.copyFileSync(srcFile, destFile);
  }
}

console.log('Application prepared for packaging!');
console.log('Run "npm run build" to build the installer.'); 