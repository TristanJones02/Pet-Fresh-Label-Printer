const electronInstaller = require('electron-winstaller');
const path = require('path');

async function createInstaller() {
  console.log('Creating Windows installer...');
  
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: path.join(__dirname, 'dist', 'Pet Fresh Label Printer-win32-x64'),
      outputDirectory: path.join(__dirname, 'dist', 'installer'),
      authors: 'Pet Fresh',
      exe: 'Pet Fresh Label Printer.exe',
      description: 'Pet Fresh Label Printer - Kiosk Mode Application',
      title: 'Pet Fresh Label Printer',
      name: 'PetFreshLabelPrinter',
      setupExe: 'Pet-Fresh-Label-Printer-Setup.exe',
      setupMsi: 'Pet-Fresh-Label-Printer-Setup.msi',
      noMsi: false,
      certificateFile: undefined, // No code signing
      certificatePassword: undefined,
      remoteReleases: undefined,
      signWithParams: undefined,
      iconUrl: path.join(__dirname, 'public', 'assets', 'icon.ico'),
      setupIcon: path.join(__dirname, 'public', 'assets', 'icon.ico'),
      loadingGif: undefined,
      tags: ['label-printer', 'kiosk'],
      version: '0.2.6'
    });
    
    console.log('✅ Windows installer created successfully!');
    console.log('📁 Installer location: dist/installer/');
    
  } catch (error) {
    console.error('❌ Error creating installer:', error);
    process.exit(1);
  }
}

createInstaller();