# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pet Fresh Label Printer is an Electron-based desktop application for printing product labels on Zebra label printers. It supports both ZPL-based network printing and HTML/PDF-based printing workflows. The app can run in two modes: kiosk mode (locked fullscreen for dedicated label stations) or standard desktop mode.

## Development Commands

### Running the Application
```bash
npm run dev          # Development mode with hot reload
npm start           # Production mode via Electron Forge
```

### Building & Packaging
```bash
npm run build                # Build webpack bundle + create installer
npm run build-installer      # Build and create NSIS installer (outputs to dist/)
npm run simple-build        # Build without creating installer (for testing)
```

### Development Tools
```bash
npm run label-editor        # Launch label template editor (dev only)
npm run image-generator     # Launch product image generator (dev only)
```

Note: Development tools in `src/tools/` are excluded from production builds.

## Architecture Overview

### Application Structure

**Main Process** ([src/main.js](src/main.js))
- Entry point for Electron main process
- Handles window creation and lifecycle
- Manages app configuration (kiosk vs desktop mode)
- Implements kiosk mode lockdown (Ctrl+Alt+Shift+X to exit)
- Initializes ProductDataService for API syncing
- Sets up IPC handlers for print jobs, settings, product data

**Printing System** ([electron/printing.js](electron/printing.js))
- Dual printing modes: HTML/PDF and ZPL
- Memory monitoring for long-running kiosk deployments
- Printer management (Windows PowerShell-based detection)
- Print job queue and tracking
- Windows Event Log integration for production monitoring

**Preload Script** ([src/preload.js](src/preload.js))
- Context bridge between renderer and main process
- Exposes IPC methods to React frontend via `window.api`
- Security: Uses contextIsolation for safe IPC communication

### Data Flow

1. **Product Data Sync** ([src/services/productDataService.js](src/services/productDataService.js))
   - Fetches from `https://wms-api.neicha.com.au/labels/scale-machine-products`
   - Auto-syncs every 10 minutes
   - Caches to `%APPDATA%/pet-fresh-label-printer/scale-products.json`
   - Validates and transforms data via [src/utils/productDataTransformer.js](src/utils/productDataTransformer.js)

2. **Label Printing Workflow**
   - User selects product → Frontend generates label HTML
   - Two printing paths:
     - **HTML/PDF**: React renders label → Puppeteer/Electron converts to PDF → Electron prints
     - **ZPL**: Product data → ZPL template → Network printer (via Windows file share at `\\\\<hostname>\\zebra_print`)

### ZPL Label System

**Architecture** ([src/zpl/](src/zpl/))
- [index.js](src/zpl/index.js) - Main export module
- [newLabelSystem.js](src/zpl/newLabelSystem.js) - Label generation from API data
- [dataTransformer.js](src/zpl/dataTransformer.js) - Transforms API product data to ZPL variables
- [networkPrinter.js](src/zpl/networkPrinter.js) - Network share-based printer communication
- [templates/label_template.zpl](src/zpl/templates/label_template.zpl) - ZPL template with placeholders

**ZPL Printing Process:**
1. Load template from `src/zpl/templates/label_template.zpl`
2. Transform product data to ZPL field mappings
3. Replace template variables (e.g., `PRODUCT_NAME_L1_VAR`)
4. Apply printer margins if configured
5. Write ZPL to Windows network share (`\\\\<hostname>\\zebra_print`)

### React Frontend

**Main Components:**
- [App.js](src/components/App.js) - Material-UI theme, main layout, state management
- [Header.js](src/components/Header.js) - Top bar with settings, printer controls
- [SearchCategories.js](src/components/SearchCategories.js) - Category filtering UI
- [ProductList.js](src/components/ProductList.js) - Product grid with search
- [LabelPreview.js](src/components/LabelPreview.js) - Live label preview before printing

**Dialog System** ([src/components/dialogs/DialogManager.js](src/components/dialogs/DialogManager.js))
- Centralized dialog state management
- Types: Settings, PrintQueue, ProductValidation, ApiError, HideDepartment

### Configuration System

**App Configuration** ([electron/config-manager.js](electron/config-manager.js))
- Stored at `%APPDATA%/pet-fresh-label-printer/labelMachineConfig.json`
- Key settings:
  - `usageType`: 'kiosk' or 'desktop'
  - `debuggingMode`: Enables DevTools in production

**User Settings** (via IPC `save-settings`/`load-settings`)
- Stored at `%APPDATA%/pet-fresh-label-printer/settings.json`
- Includes printer preferences, margins, dark mode, logging

**Label Config** (via IPC `save-label-config`/`load-label-config`)
- Stored at `%APPDATA%/pet-fresh-label-printer/label-config.json`
- Contains label dimensions and printer adjustments

### Build System

**Webpack** ([webpack.config.js](webpack.config.js))
- Bundles React app to `public/bundle.js`
- Target: `electron-renderer`
- Babel transpiles JSX and ES6+

**Electron Builder** ([electron-builder.json](electron-builder.json))
- NSIS installer for Windows
- ASAR packaging disabled (`asar: false`)
- Excludes `src/tools/` from builds
- Output: `dist/Pet Fresh Label Printer-Setup-{version}.exe`

## Important Development Notes

### Kiosk Mode
- Activates fullscreen lock and disables normal exit methods
- Special exit combo: Ctrl+Alt+Shift+X
- Prevents Alt+F4 and F11 from exiting fullscreen
- Use `reset-app-config` IPC to return to setup screen

### Memory Management
- Auto-monitors heap usage every 5 minutes
- Warns at 200MB, prompts restart at 275MB
- Critical for long-running kiosk deployments
- See [electron/printing.js:15-94](electron/printing.js#L15-L94)

### Printer Detection
- Windows-only via PowerShell: `Get-Printer | ConvertTo-Json`
- Zebra printers detected by name patterns: 'zebra', 'zdesigner'
- Network share printing uses `\\\\<hostname>\\zebra_print`
- Hostname retrieved via [src/utils/systemConfig.js](src/utils/systemConfig.js)

### IPC Communication
All main ↔ renderer communication uses `ipcRenderer.invoke()` / `ipcMain.handle()`:
- Print operations: `print-label`, `print-zpl-label`
- Product data: `product-data-refetch-all`, `product-data-sync-latest`
- Settings: `save-settings`, `load-settings`
- Printer management: `get-printers`, `reset-print-spooler`

### Product Data Format
API returns products with fields like `productname`, `productNameL1`, `productNameL2`, `ingredients`, etc. The [productDataTransformer.js](src/utils/productDataTransformer.js) converts this to UI-friendly format and validates required fields.

## Common Development Tasks

When adding new printer commands, create ZPL files in `src/zpl/printer_commands/` and use the `send-printer-command` IPC handler.

When modifying label templates, update `src/zpl/templates/label_template.zpl` and ensure variable names match those in [dataTransformer.js](src/zpl/dataTransformer.js).

When changing app configuration schema, update both [config-manager.js](electron/config-manager.js) and the config UI in [public/app-config.html](public/app-config.html).

## Windows Event Logging

Production deployments log to Windows Event Log under source "PetFreshLabelPrinter" for monitoring print jobs, errors, and system events. See [electron/printing.js:162-202](electron/printing.js#L162-L202).

## Testing Network Printers

Use the `test-zpl-printer` IPC handler which checks if `\\\\<hostname>\\zebra_print` share is accessible via `net view` command.
