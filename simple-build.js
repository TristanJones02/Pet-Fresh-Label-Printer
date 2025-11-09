const { build } = require('electron-builder');
const path = require('path');

async function createInstaller() {
  console.log('Creating Windows installer with electron-builder...');
  
  try {
    const result = await build({
      targets: new Map([
        ['win32', new Map([['nsis', ['x64']]])]
      ]),
      config: {
        appId: 'com.petfresh.labelprinter',
        productName: 'Pet Fresh Label Printer',
        directories: {
          output: 'dist/installer'
        },
        files: [
          {
            from: 'dist/Pet Fresh Label Printer-win32-x64',
            to: '.',
            filter: ['**/*']
          }
        ],
        win: {
          icon: 'public/assets/icon.ico',
          target: [
            {
              target: 'nsis',
              arch: ['x64']
            }
          ],
          artifactName: '${productName}-Setup-${version}.${ext}'
        },
        nsis: {
          oneClick: false,
          perMachine: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'Pet Fresh Label Printer'
        },
        publish: null,
        npmRebuild: false,
        nodeGypRebuild: false,
        buildDependenciesFromSource: false
      }
    });
    
    console.log('✅ Windows installer created successfully!');
    console.log('📁 Result:', result);
    
  } catch (error) {
    console.error('❌ Error creating installer:', error.message);
    process.exit(1);
  }
}

createInstaller();