# Pet Fresh Label Printer - Installer Builder

This directory contains scripts and configuration files for building the installer for the Pet Fresh Label Printer application.

## How to Build the Installer

1. Ensure all dependencies are installed:
   ```
   npm install
   ```

2. Generate the application icon:
   ```
   node installer/icon-generator.js
   ```

3. Prepare the application for packaging:
   ```
   node installer/installer.js
   ```

4. Build the actual installer:
   ```
   npm run build
   ```

5. The installer will be created in the `dist` directory.

## Customization

The installer configuration is defined in the `build` field of `package.json`. You can modify these settings to customize the installer.

### Key Configuration Options

- **appId**: The unique identifier for the application
- **productName**: The name of the application as shown in the installer
- **directories.output**: The directory where the installer will be created
- **files**: Files and directories to include in the installer
- **win.icon**: Path to the application icon
- **nsis**: Configuration for the NSIS installer

## Troubleshooting

- If you encounter issues with the build process, ensure that all dependencies are installed correctly
- Make sure the application icon exists at the specified path
- Review the build logs for any error messages

For more information, refer to the [Electron Builder documentation](https://www.electron.build/). 