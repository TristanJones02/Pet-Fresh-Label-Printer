const installer = require('electron-installer-windows');
const path = require('path');

const options = {
  src: path.join(__dirname, 'dist', 'Pet Fresh Label Printer-win32-x64'),
  dest: path.join(__dirname, 'dist', 'installer'),
  icon: path.join(__dirname, 'public', 'assets', 'icon.ico'),
  setupIcon: path.join(__dirname, 'public', 'assets', 'icon.ico'),
  animation: path.join(__dirname, 'public', 'assets', 'logo.svg'),
  authors: 'Pet Fresh',
  owners: 'Pet Fresh',
  exe: 'Pet Fresh Label Printer.exe',
  description: 'Pet Fresh Label Printer - Kiosk Mode Application',
  version: '0.2.6',
  title: 'Pet Fresh Label Printer',
  name: 'pet-fresh-label-printer',
  productName: 'Pet Fresh Label Printer',
  setupExe: 'Pet-Fresh-Label-Printer-Setup.exe',
  msi: 'Pet-Fresh-Label-Printer-Setup.msi',
  certificateFile: undefined,
  certificatePassword: undefined,
  signWithParams: undefined,
  tags: ['label-printer', 'kiosk-app'],
  remoteReleases: undefined,
  noMsi: false
};

console.log('Creating Windows .exe installer...');

installer(options)
  .then(() => {
    console.log('✅ Windows installer created successfully!');
    console.log('📁 Installer location: dist/installer/');
  })
  .catch((error) => {
    console.error('❌ Error creating installer:', error);
  });