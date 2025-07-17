# barKoder Angular Demo Bootstrap

A modern, responsive barcode scanning application built with Angular and the barKoder WebAssembly SDK. This demo showcases real-time barcode scanning capabilities with camera management, resolution selection, and comprehensive error handling.

## 🚀 Features

- **Real-time Barcode Scanning**: Scan QR codes, EAN8, EAN13, and PDF417 barcodes (and other symbologies, full list is provided further in this document)
- **Multi-Camera Support**: Switch between available cameras on your device
- **Resolution Management**: Choose between HD (1280x720) and Full HD (1920x1080) resolutions
- **Camera Capability Testing**: Automatic testing of camera resolutions and capabilities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with real-time status updates
- **Error Handling**: Comprehensive error messages and troubleshooting guidance
- **Permission Management**: Automatic camera permission requests and handling

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **Angular CLI** (version 14 or higher)
- **Modern Web Browser** with camera support (Chrome 64+, Firefox 69+, Edge 79+, Safari 13.1+, iOS Safari 13.4+)
- **Camera Device** (built-in or external webcam)
- **HTTPS Environment** (required for camera access in production)

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd angular_demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   ng serve
   ```

4. **Open your browser** and navigate to `http://localhost:4200`


## 📱 How to Use

### Initial Setup

1. **Allow Camera Permissions**: When you first load the app, your browser will request camera access. Click "Allow" to enable scanning.

2. **Wait for Initialization**: The app will automatically:
   - Initialize the barKoder SDK
   - Detect available cameras
   - Test camera capabilities
   - Set optimal resolution settings

### Basic Scanning

1. **Start Scanner**: Click the "🎥 Start Scanner" button
2. **Position Barcode**: Hold a supported barcode in front of your camera
3. **Scan**: The app will automatically detect and decode the barcode
4. **View Results**: Scan results appear in the "Scan Results & Messages" section
5. **Scan Again**: The scanner automatically stops after each successful scan. Click "Start Scanner" to scan another barcode

### Advanced Features

#### Camera Selection
- If multiple cameras are available, use the "📹 Select Camera" dropdown
- The app will automatically test each camera's capabilities
- Choose the camera that works best for your scanning needs

#### Resolution Settings
- **HD (1280x720)**: Faster scanning, lower quality
- **Full HD (1920x1080)**: Higher quality, may be slower on some devices
- The app automatically selects the best resolution for your camera

#### Camera Capabilities
- Click "🧪 Test Capabilities" to manually test your camera's supported resolutions
- View detailed capability information for each camera
- See which resolutions are supported and which failed

## 🎯 Supported Barcode Types

This demo includes the following barcode types, but you can easily add more:

### Currently Enabled
- **QR Code**: 2D matrix barcodes
- **EAN8**: 8-digit European Article Number
- **EAN13**: 13-digit European Article Number  
- **PDF417**: 2D stacked linear barcode

### Additional Available Types
You can enable these additional barcode types by modifying the `setEnabledDecoders` call:

```typescript
// Add these to your setEnabledDecoders call
    Barkoder.constants.Decoders.Aztec
    Barkoder.constants.Decoders.AztecCompact
    Barkoder.constants.Decoders.QR
    Barkoder.constants.Decoders.QRMicro
    Barkoder.constants.Decoders.Code128
    Barkoder.constants.Decoders.Code93
    Barkoder.constants.Decoders.Code39
    Barkoder.constants.Decoders.Codabar
    Barkoder.constants.Decoders.Code11
    Barkoder.constants.Decoders.Msi
    Barkoder.constants.Decoders.UpcA
    Barkoder.constants.Decoders.UpcE
    Barkoder.constants.Decoders.UpcE1
    Barkoder.constants.Decoders.Ean13
    Barkoder.constants.Decoders.Ean8
    Barkoder.constants.Decoders.PDF417
    Barkoder.constants.Decoders.PDF417Micro
    Barkoder.constants.Decoders.Datamatrix
    Barkoder.constants.Decoders.Code25
    Barkoder.constants.Decoders.Interleaved25
    Barkoder.constants.Decoders.ITF14
    Barkoder.constants.Decoders.IATA25
    Barkoder.constants.Decoders.Matrix25
    Barkoder.constants.Decoders.Datalogic25
    Barkoder.constants.Decoders.COOP25
    Barkoder.constants.Decoders.Code32
    Barkoder.constants.Decoders.Telepen
    Barkoder.constants.Decoders.Dotcode
    Barkoder.constants.Decoders.Databar14
    Barkoder.constants.Decoders.DatabarLimited
    Barkoder.constants.Decoders.DatabarExpanded
```

> ⚠️ **Warning**: Having all symbologies enabled is not recommended unless you are certain you need them all. Enabling too many barcode types can significantly slow down the scanning process as the scanner must check for all enabled symbologies. For optimal performance, only enable the barcode types you actually need for your use case.

## 🔧 Configuration Examples

### Basic SDK Initialization

```typescript
async function initializeBarkoder() {
  try {
    // Initialize with your license key
    const Barkoder = await BarkoderSDK.initialize("your_license_key_here");
    
    // Enable desired barcode types
    Barkoder.setEnabledDecoders(
      Barkoder.constants.Decoders.QR,
      Barkoder.constants.Decoders.Ean8,
      Barkoder.constants.Decoders.Ean13,
      Barkoder.constants.Decoders.PDF417
    );
    
    // Set camera resolution
    Barkoder.setCameraResolution(Barkoder.constants.CameraResolution.FHD);
    
    // Set decoding speed
    Barkoder.setDecodingSpeed(Barkoder.constants.DecodingSpeed.Normal);
    
    return Barkoder;
  } catch (error) {
    console.error('Failed to initialize Barkoder:', error);
    throw error;
  }
}
```

### Advanced Configuration Options

```typescript
// Set multiple configuration options
Barkoder.setCameraResolution(Barkoder.constants.CameraResolution.HD);
Barkoder.setDecodingSpeed(Barkoder.constants.DecodingSpeed.Fast);
Barkoder.setThreadsLimit(4);
Barkoder.setRegionOfInterest(0.1, 0.1, 0.8, 0.8); // x, y, width, height
Barkoder.setCloseSessionOnResultEnabled(true);
Barkoder.setImageResultEnabled(true);
Barkoder.setLocationInImageResultEnabled(true);
```

### Continuous Scanning

```typescript
// Enable continuous scanning (scanner doesn't stop after first result)
Barkoder.setCloseSessionOnResultEnabled(false);

// Start continuous scanner
Barkoder.startScanner((result) => {
  console.log('Continuous scan result:', result);
  // Process result but don't stop scanner
});
```

### Multi-Scan Mode

```typescript
// Enable multi-scan to detect multiple barcodes in one image
Barkoder.setMultiScanEnabled(true);

Barkoder.startScanner((results) => {
  // results is an array of barcode results
  results.forEach(result => {
    console.log('Multi-scan result:', result);
  });
});
```

### Image Scanning

```typescript
// Scan barcodes from image files
async function scanImage(imageFile: File) {
  try {
    const result = await Barkoder.scanImage(imageFile, (result) => {
      console.log('Image scan result:', result);
    });
  } catch (error) {
    console.error('Image scan failed:', error);
  }
}
```

### VIN (Vehicle Identification Number) Scanning

```typescript
// Enable VIN scanning
Barkoder.setEnabledDecoders(
  Barkoder.constants.Decoders.QR,
  Barkoder.constants.Decoders.VIN
);

// VIN results include additional vehicle information
Barkoder.startScanner((result) => {
  if (result.barcodeTypeName === 'VIN') {
    console.log('VIN:', result.textualData);
    console.log('Vehicle Info:', result.vinResult);
  }
});
```

### MRZ (Machine Readable Zone) Scanning

```typescript
// Enable MRZ scanning for passports and travel documents
Barkoder.setEnabledDecoders(
  Barkoder.constants.Decoders.QR,
  Barkoder.constants.Decoders.MRZ
);

// MRZ results include parsed document information
Barkoder.startScanner((result) => {
  if (result.barcodeTypeName === 'MRZ') {
    console.log('MRZ Data:', result.mrzResult);
    console.log('Document Type:', result.mrzResult.documentType);
    console.log('Issuing Country:', result.mrzResult.issuingCountry);
    console.log('Surname:', result.mrzResult.surname);
    console.log('Given Names:', result.mrzResult.givenNames);
  }
});
```

### DPM (Direct Part Marking) Mode

```typescript
// Enable DPM mode for challenging barcodes
Barkoder.setDpmEnabled(true);

// DPM mode is useful for:
// - Barcodes marked directly on metal parts
// - Low contrast barcodes
// - Damaged or worn barcodes
```

## 🏗️ Development

### Project Structure

```
src/
├── app/
│   ├── app.component.ts          # Main application component
│   ├── app.component.html        # Main UI template
│   ├── app.component.css         # Main styles
│   └── button-animations.css     # Button animation styles
├── assets/                       # Static assets
├── barkoder.wasm                 # barKoder WebAssembly binary
└── barkoder_nosimd.wasm          # barKoder WebAssembly binary (no SIMD)
```

### Key Components

- **AppComponent**: Main application logic and UI
- **Camera Management**: Automatic camera detection and capability testing
- **Scanner Control**: Start/stop scanner functionality
- **Result Processing**: Barcode result handling and display
- **Error Handling**: Comprehensive error management and user guidance


### Building for Production

```bash
ng build --configuration production
```

The built application will be in the `dist/` directory.

### License Management

#### Trial License
- Get a free 30-day trial license from the [barKoder Portal](https://barkoder.com/register)
- Trial licenses support up to 25 devices
- Results are partially masked with asterisks (*) without a valid license
- For production use, contact sales@barkoder.com

> ⚠️ **Warning**: This project comes with a trial license, but it may have expired by the time you use it. You will likely need to create a new trial license from the [barKoder Portal](https://barkoder.com/register) to get the demo working properly.
> 💡 **Alternative**: You can also use the [barKoder Quote System](https://barkoder.com/quote) which offers an option to automatically generate a trial license while creating your barKoder account. This provides a seamless way to get started with both account creation and license generation in one step.

#### Production License
- Contact the barKoder sales team for production licensing
- Production licenses remove result masking
- Support for unlimited devices based on your license tier

## 🌐 Browser Compatibility

- **Chrome** 64+
- **Firefox** 69+
- **Safari** 13.1+
- **Edge** 79+
- **iOS Safari** 13.4+

## 🔧 Troubleshooting

### Camera Issues

**"Camera access denied"**
- Click the camera icon in your browser's address bar
- Select "Allow" for camera access
- Refresh the page and try again

**"No camera found"**
- Ensure your device has a camera connected
- Check that no other applications are using the camera
- Try refreshing the page

**"Camera not supported"**
- Update your browser to the latest version
- Try a different browser (Chrome, Firefox, Safari, Edge)
- Ensure your browser supports WebRTC

### Scanning Issues

**"No barcode detected"**
- Ensure the barcode is clearly visible and well-lit
- Move the camera closer to the barcode
- Clean the barcode surface if dirty
- Check that the barcode type is supported

**"Multiple barcodes detected"**
- Ensure only one barcode is visible in the camera view
- Move the camera closer to a single barcode
- Ensure good lighting conditions

**"Scanner timed out"**
- Check your internet connection
- Ensure the camera is working properly
- Try refreshing the page

### Performance Issues

**Slow scanning**
- Try switching to HD resolution
- Close other applications using the camera
- Ensure good lighting conditions
- Check your device's performance

### WebAssembly Issues

**"WASM not supported"**
- Update your browser to a WebAssembly-compatible version
- Enable WebAssembly in your browser settings
- Check that your server serves WASM files with correct MIME type

**"WASM loading failed"**
- Ensure `barkoder.wasm` is in the correct location
- Check that your server serves WASM files over HTTPS
- Verify the WASM file is not corrupted

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review the browser console for error messages
- Ensure your browser and camera are working properly
- **Free Developer Support**: Available through the [barKoder Portal](https://barkoder.com/)
- **Email Support**: support@barkoder.com
- **Sales Inquiries**: sales@barkoder.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## 📚 Additional Resources

- [barKoder Web SDK Documentation](https://barkoder.com/docs/v1/barkoder-web-sdk/web-sdk-guide-installation)
- [barKoder API Reference](https://barkoder.com/docs/v1/barkoder-web-sdk/web-sdk-api-reference)
- [barKoder Examples](https://barkoder.com/docs/v1/barkoder-web-sdk/web-sdk-examples)
- [barKoder Portal](https://barkoder.com/register) - Get trial licenses and support
