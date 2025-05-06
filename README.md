# Pet Fresh Label Printer

An Electron desktop application for generating and printing product labels for pet food products.

## Features

- User-friendly interface with three-column layout
- Search and category filtering for products
- Live label preview with barcode generation
- Print job management and status monitoring
- Quantity control with increment/decrement functionality

## Technology Stack

- Electron for cross-platform desktop application
- React for UI components
- Material UI (MUI) for design components
- JsBarcode for barcode generation

## Development Setup

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
npm run dev
```

## Application Structure

- **Header**: Contains app name, printer status, and settings
- **Search & Categories**: Left column for searching products and filtering by category
- **Product List**: Middle column showing available products grouped by type
- **Label Preview**: Right column with label preview and print controls

## Building for Production

To build the application for production, run:
```
npm run build
```

## Future Enhancements

- Integration with printer API
- Online product database synchronization
- User settings and preferences
- Advanced label customization 