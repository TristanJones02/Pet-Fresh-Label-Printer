# Pet Fresh Label Printer

A desktop application for printing labels for Pet Fresh products.

## Features

- Print labels with customizable product information
- Supports Zebra label printers
- Handles printer errors and calibration
- Real-time printer status monitoring

## Installation

You can download the latest installer from the releases section or build it yourself.

### Building from Source

1. Clone the repository:
   ```
   git clone https://github.com/your-username/Pet-Fresh-Label-Printer.git
   cd Pet-Fresh-Label-Printer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application in development mode:
   ```
   npm run dev
   ```

4. Build the installer:
   ```
   npm run build-installer
   ```
   
   The installer will be created in the `dist` directory.

## Building the Installer

The project includes a complete setup for building Windows installers:

1. The application icon is generated from code (or you can replace it with your own)
2. The build process packages all necessary files and excludes development tools
3. The installer is created using NSIS with custom settings

To build the installer, run:

```
npm run build-installer
```

This will:
1. Create the application icon
2. Build the webpack bundle
3. Package the application using electron-builder
4. Create an installer in the `dist` directory

## Configuration

The build configuration is in `electron-builder.json`. You can modify it to customize the installer:

- Change the application name or ID
- Set icons and branding
- Configure installer options
- Set up file associations

## Development Tools

The application includes some development tools that are excluded from the installer:

- `npm run label-editor` - Run the label editor tool
- `npm run image-generator` - Run the product image generator tool

## Notes

- This app works best with Zebra label printers, but is compatible with any printer
- On Windows 10, you might need to run as administrator for certain printer operations 