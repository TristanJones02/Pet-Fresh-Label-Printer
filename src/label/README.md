# Label System Documentation

This directory contains all the code related to label generation, rendering, and printing in the Pet Fresh Label Printer application.

## Directory Structure

- `components/` - React components related to labels
  - `LabelTemplate.js` - The core label template component that defines the visual structure
  - `LabelPreview.js` - The interactive preview component with zoom/pan controls
- `utils/` - Utility functions for label processing
  - `labelUtils.js` - Shared utilities like barcode generation and config management

## Usage

### Basic Import

```jsx
import { LabelPreview, LabelTemplate } from '../label';
```

### Label Preview

The `LabelPreview` component provides a complete UI for previewing labels with zoom/pan controls and quantity selection:

```jsx
<LabelPreview 
  product={selectedProduct}
  quantity={quantity}
  onQuantityChange={handleQuantityChange}
  onPrintLabel={handlePrintLabel}
/>
```

### Label Template

The `LabelTemplate` component can be used standalone if you need just the raw label without controls:

```jsx
<LabelTemplate 
  product={product} 
  barcodeRef={barcodeRef} 
  showOverlay={true} 
  labelConfig={labelConfig} 
/>
```

### Utilities

```jsx
import { generateBarcode, getLabelConfig } from '../label/utils/labelUtils';

// Generate a barcode for a product
useEffect(() => {
  if (product && barcodeRef.current) {
    generateBarcode(product, barcodeRef);
  }
}, [product]);

// Get label configuration
useEffect(() => {
  async function fetchConfig() {
    const config = await getLabelConfig();
    setLabelConfig(config);
  }
  fetchConfig();
}, []);
```

## Configuration

The label system uses a configuration object with the following properties:

```js
{
  width: 60, // mm
  height: 162, // mm
  horizontalMargin: 5, // mm
  verticalMargin: 5, // mm
}
```

This configuration can be managed through the application settings and is used to ensure consistent printing and preview rendering. 