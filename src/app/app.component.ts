import { Component } from '@angular/core';

// @ts-ignore
import * as BarkoderSDK from 'barkoder-wasm';
import { Barkoder, BKResult } from 'barkoder-wasm';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './button-animations.css']
})
export class AppComponent {
  title = 'Barkoder demo';
  Barkoder!:Barkoder;
  ready:boolean = false;
  version = 'Barkoder version: ';
  scanResult = '';
  isLoading = false;
  isScanning = false;
  availableCameras: MediaDeviceInfo[] = [];
  selectedCameraId: string = '';
  selectedResolution: string = '';
  cameraCapabilities: { [deviceId: string]: any } = {};

  
  scannerReadyListener = (): void => {
	this.version = 'Barkoder version: ' + this.Barkoder.getVersion().barkoderFullVersion;
	this.ready = true;
	this.isLoading = false;
	
	// Now that Barkoder is ready, run the complete camera setup process
	this.initializeCameraSystem();
  }
  
  constructor() {
    console.log('AppComponent constructor: initializing Barkoder...');
    
    // Add global error handlers
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
    
    // Initialize Barkoder - camera setup will happen after Barkoder is ready
    (async () => {
      try {
        console.log('Attempting BarkoderSDK.initialize...');
        this.Barkoder = await BarkoderSDK.initialize("PEmBIohr9EZXgCkySoetbwP4gvOfMcGzgxKPL2X6uqPMq7u8sQjClseu2AxhJMMdi0JebA-gP5WmJPJIMA3wYDNMEDkOrtuPZgrfk-t7g7iQ5fErcyx3cs0ZVywb1B_vItKeTrmlOFANPzYxyYSAZ50B1TYGUn5qkPyYHUjoOM19BIff2HgSpA7cukcktd3tBue1bpeWsYaK1p_MM_bPvXmR94DXGSJMsUK9HPDewWl0PB7pQtpVwNAWchih8mam5PN6TOh-I8xktZ0vfyruGhQ3AIeowcWs6ZA0l2BRfUR-EuovH754_hrsdPiHjqnlyERi-yPzfrln6dLcMGw3fxD6Eq_kYX-ZbgiUNsndmn_8V-Wa-N2O_RNAh4DB3QTKY4H_Oj0WIyodhxQV16DEy0GVkF3M70-QoYAOeAqABuE.");
        console.log('BarkoderSDK.initialize complete:', this.Barkoder);
        
        //------config-------
        //enable symbologies you'd like to scan
        this.Barkoder.setEnabledDecoders(
          this.Barkoder.constants.Decoders.QR,
          this.Barkoder.constants.Decoders.Ean8,
          this.Barkoder.constants.Decoders.Ean13,
          this.Barkoder.constants.Decoders.PDF417
        );
        console.log('Decoders enabled.');
        
        //change any additional settings
        this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.HD);
        this.Barkoder.setDecodingSpeed(this.Barkoder.constants.DecodingSpeed.Slow);
        console.log('Camera resolution and decoding speed set.');
        //------config-------
        
        //events
        this.Barkoder.addEventListener("startScanner", (e: any) => {
          console.log('Event: startScanner', e.detail); //Prints "Camera started."
          this.isScanning = true;
          this.isLoading = false;
        });
        this.Barkoder.addEventListener("stopScanner", (e: any) => {
          console.log('Event: stopScanner', e.detail); //Prints "Camera stopped."
          // Don't override state if we have a successful scan
          if (!this.scanResult.includes('✅ Scan Successful')) {
            this.isScanning = false;
            this.isLoading = false;
            this.scanResult = 'Scanner stopped externally. Click "Start Scanner" to resume.';
          }
        });
        this.Barkoder.addEventListener("scannerTimeout", (e: any) => {
          console.log('Event: scannerTimeout', e.detail); //Prints "Scanner timed out."
          this.isScanning = false;
          this.isLoading = false;
          this.scanResult = 'Scanner timed out. Click "Start Scanner" to try again.';
        });
        
        // Add error event listener
        this.Barkoder.addEventListener("error", (e: any) => {
          console.error('Barkoder event: error', e);
        });
        
        // Add any other available events
        this.Barkoder.addEventListener("frameProcessed", (e: any) => {
          console.log('Event: frameProcessed', e.detail);
        });
        
        this.scannerReadyListener();
      } catch (initError) {
        console.error('Error during Barkoder initialization:', initError);
      }
    })();
  }
  
  private async logAvailableCameras(): Promise<void> {
    try {
      console.log('🔐 Requesting camera permissions...');
      
      // First, request camera permissions to ensure we can access device information
      // This will trigger the browser's permission dialog if not already granted
      const permissionStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      // Stop the permission stream immediately - we just needed it for permissions
      permissionStream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera permissions granted');
      
      // Now enumerate devices - this will now include proper labels and device IDs
      console.log('📹 Enumerating available camera devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      
      // Populate available cameras for the selector
      this.availableCameras = videoDevices;
      if (videoDevices.length > 0) {
        this.selectedCameraId = videoDevices[0].deviceId;
        // Initialize selected resolution (will be updated when capabilities are tested)
        this.selectedResolution = 'HD';
        console.log('Default camera device:', videoDevices[0]);
        if (videoDevices.length > 1) {
          console.log('Alternative camera device:', videoDevices[1]);
        }
      } else {
        console.warn('⚠️ No camera devices found after permission request');
      }
      
      // Camera capability tests will run after Barkoder is ready
      
    } catch (error: any) {
      console.error('❌ Error during camera permission/enumeration:', error);
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError') {
        console.error('🚫 Camera permission denied by user');
        this.scanResult = '❌ Camera access denied\n\nPlease allow camera permissions in your browser to use the barcode scanner.\n\nTo fix this:\n• Click the camera icon in your browser\'s address bar\n• Select "Allow" for camera access\n• Refresh the page and try again';
      } else if (error.name === 'NotFoundError') {
        console.error('📷 No camera devices found');
        this.scanResult = '❌ No camera found\n\nPlease ensure you have a camera connected to your device and try again.';
      } else if (error.name === 'NotSupportedError') {
        console.error('🌐 Camera API not supported');
        this.scanResult = '❌ Camera not supported\n\nYour browser does not support camera access. Please try a different browser.';
      } else {
        console.error('🔧 Unexpected camera error:', error);
        this.scanResult = `❌ Camera error\n\nAn unexpected error occurred while accessing the camera:\n\n${error.name}: ${error.message}\n\nPlease try refreshing the page or contact support.`;
      }
    }
  }

  /**
   * Complete camera system initialization - runs after Barkoder is ready
   */
  private async initializeCameraSystem(): Promise<void> {
    console.log('🚀 Starting complete camera system initialization...');
    
    try {
      // Step 1: Enumerate cameras with proper permissions
      await this.logAvailableCameras();
      
      // Step 2: If we have cameras, test their capabilities
      if (this.availableCameras.length > 0) {
        console.log('📹 Cameras found, testing capabilities...');
        await this.testAllCamerasWithBarkoderSettings();
        console.log('✅ Camera system initialization complete');
      } else {
        console.warn('⚠️ No cameras available for capability testing');
      }
    } catch (error) {
      console.error('❌ Error during camera system initialization:', error);
    }
  }

  private async testAllCamerasWithBarkoderSettings(): Promise<void> {
    if (!this.ready || !this.Barkoder) {
      console.log('Barkoder not ready, skipping camera capability tests');
      return;
    }

    console.log('🔍 Testing all cameras with Barkoder resolution settings...');
    
    // Get all available Barkoder resolution constants
    const barkoderResolutions = [
      { name: 'HD', value: this.Barkoder.constants.CameraResolution.HD, width: 1280, height: 720 },
      { name: 'FHD', value: this.Barkoder.constants.CameraResolution.FHD, width: 1920, height: 1080 }
    ];

    const cameraCapabilities: { [deviceId: string]: any } = {};

    for (const device of this.availableCameras) {
      console.log(`\n📹 Testing camera: ${device.label || 'Unknown Camera'}`);
      cameraCapabilities[device.deviceId] = {
        deviceId: device.deviceId,
        label: device.label || 'Unknown Camera',
        maxSupportedResolution: null,
        supportedResolutions: [],
        testResults: []
      };

      // Test each resolution for this camera
      for (const resolution of barkoderResolutions) {
        console.log(`  Testing ${resolution.name} (${resolution.width}x${resolution.height})...`);
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: device.deviceId },
              width: { exact: resolution.width },
              height: { exact: resolution.height }
            }
          });

          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          
          console.log(`    ✅ ${resolution.name} SUCCESS - Actual: ${settings.width}x${settings.height}`);
          
          cameraCapabilities[device.deviceId].supportedResolutions.push({
            name: resolution.name,
            barkoderValue: resolution.value,
            width: resolution.width,
            height: resolution.height,
            actualWidth: settings.width,
            actualHeight: settings.height
          });

          // Update max supported resolution
          if (!cameraCapabilities[device.deviceId].maxSupportedResolution || 
              resolution.width > cameraCapabilities[device.deviceId].maxSupportedResolution.width) {
            cameraCapabilities[device.deviceId].maxSupportedResolution = {
              name: resolution.name,
              barkoderValue: resolution.value,
              width: resolution.width,
              height: resolution.height
            };
          }

          stream.getTracks().forEach(track => track.stop());
          
        } catch (error: any) {
          console.log(`    ❌ ${resolution.name} FAILED - ${error.name}: ${error.message}`);
          cameraCapabilities[device.deviceId].testResults.push({
            resolution: resolution.name,
            error: error.name,
            message: error.message
          });
        }
      }

      // Log summary for this camera
      const cameraInfo = cameraCapabilities[device.deviceId];
      if (cameraInfo.maxSupportedResolution) {
        console.log(`  🎯 Max supported resolution: ${cameraInfo.maxSupportedResolution.name} (${cameraInfo.maxSupportedResolution.width}x${cameraInfo.maxSupportedResolution.height})`);
      } else {
        console.log(`  ❌ No supported resolutions found`);
      }
    }

    // Log overall summary
    console.log('\n📊 Camera Capability Summary:');
    console.log('================================');
    for (const deviceId in cameraCapabilities) {
      const camera = cameraCapabilities[deviceId];
      console.log(`\n📹 ${camera.label}:`);
      console.log(`   Supported: ${camera.supportedResolutions.map((r: any) => r.name).join(', ') || 'None'}`);
      if (camera.maxSupportedResolution) {
        console.log(`   Max: ${camera.maxSupportedResolution.name} (${camera.maxSupportedResolution.width}x${camera.maxSupportedResolution.height})`);
      }
      if (camera.testResults.length > 0) {
        console.log(`   Failed: ${camera.testResults.map((r: any) => `${r.resolution} (${r.error})`).join(', ')}`);
      }
    }

    // Store camera capabilities for UI display
    this.cameraCapabilities = cameraCapabilities;
    
    // Update selected resolution to max supported for current camera
    this.selectedResolution = this.getMaxSupportedResolution();
    console.log('Updated selected resolution to:', this.selectedResolution);
  }
  
      resultCallback = (result: BKResult): void => {
    console.log('resultCallback called:', result);
    
    if (typeof result.error == 'object') {
      console.error('Scan error:', result.error);
      this.handleScannerError(result.error);
    } else if (result.resultsCount == 1) {
      console.log('Scan successful:', result.barcodeTypeName, result.textualData);
      
      // Handle successful scan exactly like timeout - simple and direct
      this.isScanning = false;
      this.isLoading = false;
      this.scanResult = `✅ Scan Successful!\n\n📋 Type: ${result.barcodeTypeName}\n📄 Data: ${result.textualData}\n\n`;
      
      console.log('Scan complete - isScanning:', this.isScanning, 'isLoading:', this.isLoading);
    } else if (result.resultsCount > 1) {
      console.log('Multiple results found:', result);
      this.scanResult = `⚠️ Multiple barcodes detected (${result.resultsCount})\n\nPlease ensure only one barcode is visible in the camera view.\n\nTry:\n• Moving the camera closer to a single barcode\n• Ensuring good lighting\n• Cleaning the barcode surface`;
    } else if (result.resultsCount == 0) {
      console.log('No results found');
      this.scanResult = `🔍 No barcode detected\n\nTry:\n• Ensuring the barcode is clearly visible\n• Moving the camera closer to the barcode\n• Checking that the barcode type is supported (QR, EAN8, PDF417)\n• Ensuring good lighting conditions\n• Cleaning the barcode surface if dirty`;
    } else {
      console.log('Unexpected result format:', result);
      this.scanResult = `❓ Unexpected scan result\n\nPlease try scanning again or contact support if the problem persists.\n\nResult: ${JSON.stringify(result, null, 2)}`;
    }
  }
  
  public startScanner(): void {
    console.log('startScanner called.');
	

    this.scanResult = '';
    this.isLoading = true;
    this.isScanning = false;
    
    // Set camera resolution based on selection or default to max supported
    const resolutionToUse = this.selectedResolution || this.getMaxSupportedResolution();
    console.log('Using resolution:', resolutionToUse);
    
    try {
      // Set the camera ID if one is selected
      if (this.selectedCameraId) {
        try {
          this.Barkoder.setCameraId(this.selectedCameraId);
          console.log('Set camera ID to:', this.selectedCameraId);
        } catch (cameraIdError) {
          console.warn('Failed to set camera ID, using default camera:', cameraIdError);
          // Continue with default camera selection
        }
      } else {
        console.log('No specific camera selected, using default');
      }
      
      // Set the camera resolution before starting
      if (resolutionToUse === 'FHD') {
        this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.FHD);
        console.log('Set camera resolution to FHD (1920x1080)');
      } else {
        this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.HD);
        console.log('Set camera resolution to HD (1280x720)');
      }
    } catch (error) {
      console.error('Error setting camera configuration:', error);
    }
    
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      try {
        console.log('Attempting to start scanner...');
        
        // Try to catch any async errors by wrapping in a Promise
        const startPromise = new Promise((resolve, reject) => {
          try {
            this.Barkoder.startScanner((result: BKResult) => {
              console.log('Scanner callback received:', result);
              this.resultCallback(result);
              this.isLoading = false;
              resolve(result);
            });
            console.log('Barkoder.startScanner called successfully.');
          } catch (error) {
            console.error('Synchronous error in startScanner:', error);
            this.isLoading = false;
            reject(error);
          }
        });
        
        // Handle any async errors
        startPromise.catch((error) => {
          console.error('Async error in startScanner:', error);
          this.isLoading = false;
          this.handleScannerError(error);
        });
        
      } catch (error: any) {
        console.error('Scanner start error:', error, error?.stack);
        this.isLoading = false;
        this.handleScannerError(error);
      }
    }, 100);
  }
  
  public async startScannerWithAlternativeSettings(): Promise<void> {
    console.log('Trying alternative camera settings...');
    this.scanResult = '';
    
    try {
      // Set the camera ID if one is selected
      if (this.selectedCameraId) {
        this.Barkoder.setCameraId(this.selectedCameraId);
        console.log('Set camera ID to:', this.selectedCameraId);
      }
      
      // Try with lower resolution first
      this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.HD);
      console.log('Set camera resolution to HD');
      
      setTimeout(() => {
        try {
          this.Barkoder.startScanner((result: BKResult) => {
            console.log('Alternative scanner callback received:', result);
            this.resultCallback(result);
          });
          console.log('Alternative Barkoder.startScanner called successfully.');
        } catch (error) {
          console.error('Alternative scanner start error:', error);
          this.handleScannerError(error);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error setting alternative camera settings:', error);
      this.handleScannerError(error);
    }
  }

  public async startScannerWithFHD(): Promise<void> {
    console.log('Trying FHD (Full HD) resolution...');
    this.scanResult = '';
    
    try {
      // Set the camera ID if one is selected
      if (this.selectedCameraId) {
        this.Barkoder.setCameraId(this.selectedCameraId);
        console.log('Set camera ID to:', this.selectedCameraId);
      }
      
      // Set to FHD resolution which might cause issues
      this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.FHD);
      console.log('Set camera resolution to FHD (1920x1080)');
      
      setTimeout(() => {
        try {
          this.Barkoder.startScanner((result: BKResult) => {
            console.log('FHD scanner callback received:', result);
            this.resultCallback(result);
          });
          console.log('FHD Barkoder.startScanner called successfully.');
        } catch (error) {
          console.error('FHD scanner start error:', error);
          this.handleScannerError(error);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error setting FHD camera settings:', error);
      this.handleScannerError(error);
    }
  }

  public async startScannerWithSelectedCamera(): Promise<void> {
    if (!this.selectedCameraId) {
      this.scanResult = '❌ No camera selected. Please select a camera from the dropdown.';
      return;
    }

    console.log('Starting scanner with selected camera:', this.selectedCameraId);
    this.scanResult = '';
    this.isLoading = true;
    this.isScanning = false;
    
    try {
      // Set the camera ID for Barkoder
      this.Barkoder.setCameraId(this.selectedCameraId);
      console.log('Set camera ID to:', this.selectedCameraId);
      
      // Set camera resolution based on selection or default to max supported
      const resolutionToUse = this.selectedResolution || this.getMaxSupportedResolution();
      console.log('Using resolution:', resolutionToUse);
      
      if (resolutionToUse === 'FHD') {
        this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.FHD);
        console.log('Set camera resolution to FHD (1920x1080)');
      } else {
        this.Barkoder.setCameraResolution(this.Barkoder.constants.CameraResolution.HD);
        console.log('Set camera resolution to HD (1280x720)');
      }
      
      // Now start with Barkoder
      setTimeout(() => {
        try {
          this.Barkoder.startScanner((result: BKResult) => {
            console.log('Selected camera scanner callback received:', result);
            this.resultCallback(result);
            this.isScanning = true;
            this.isLoading = false;
          });
          console.log('Selected camera Barkoder.startScanner called successfully.');
        } catch (error) {
          console.error('Selected camera scanner start error:', error);
          this.isLoading = false;
          this.handleScannerError(error);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error setting up selected camera:', error);
      this.isLoading = false;
      this.handleScannerError(error);
    }
  }



  public async startScannerWithOverconstrainedSettings(): Promise<void> {
    console.log('Trying to trigger OverconstrainedError with extreme settings...');
    this.scanResult = '';
    
    try {
      // Test direct camera access with extreme constraints that should cause OverconstrainedError
      console.log('Testing direct camera access with extreme constraints...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { exact: 9999 }, // Extremely high width that no camera supports
          height: { exact: 9999 }, // Extremely high height that no camera supports
          frameRate: { exact: 1000 }, // Extremely high frame rate
          aspectRatio: { exact: 999.99 } // Impossible aspect ratio
        } 
      });
      console.log('Unexpected: Extreme constraints worked:', stream);
      stream.getTracks().forEach(track => track.stop());
      
    } catch (overconstrainedError: any) {
      console.error('OverconstrainedError triggered:', overconstrainedError);
      
      if (overconstrainedError.name === 'OverconstrainedError') {
        this.scanResult = `🎯 OverconstrainedError Successfully Triggered!\n\n📋 Error Name: ${overconstrainedError.name}\n📄 Error Message: ${overconstrainedError.message}\n\n🔍 Constraint that failed: ${overconstrainedError.constraint}\n\n💡 This error occurs when the requested camera settings are not supported by the hardware.`;
      } else {
        this.scanResult = `❌ Expected OverconstrainedError but got: ${overconstrainedError.name}\n\n📄 Error Message: ${overconstrainedError.message}`;
      }
    }
  }
  
  private handleScannerError(error: any): void {
    console.error('Handling scanner error:', error);
    
    let errorMessage = '';
    let suggestions = '';
    
    switch (error.name) {
      case 'NotReadableError':
        errorMessage = 'Camera Error: Could not start video source';
        suggestions = `
Possible causes and solutions:
1. 📹 Camera is in use by another application
   • Close other apps using camera (Zoom, Teams, OBS, etc.)
   • Check Task Manager for camera-using processes
   
2. 🔧 Camera hardware issue
   • Try unplugging and reconnecting the camera
   • Restart your computer
   • Check device manager for camera driver issues
   
3. 📱 Camera resolution too high
   • Try "Alternative Settings" button (uses lower resolution)
   • Your camera may not support Full HD (1920x1080)
   
4. 🔄 Browser cache/cookies
   • Clear browser cache and cookies
   • Try incognito/private browsing mode
   • Try a different browser (Chrome, Edge, Firefox)
   
5. 🛡️ Antivirus/firewall blocking
   • Temporarily disable antivirus camera protection
   • Check Windows privacy settings for camera access`;
        break;
        
      case 'NotAllowedError':
        errorMessage = 'Permission Error: Camera access denied';
        suggestions = `
Solutions:
1. 🔐 Allow camera permissions
   • Click the camera icon in the address bar
   • Select "Allow" for camera access
   • Refresh the page after allowing permissions
   
2. 🖥️ Check Windows privacy settings
   • Go to Settings > Privacy & Security > Camera
   • Ensure "Camera access" is turned On
   • Make sure your browser is allowed to access camera
   
3. 🌐 Browser settings
   • Go to browser settings > Privacy & Security > Site Settings > Camera
   • Ensure localhost is allowed or not blocked`;
        break;
        
      case 'NotFoundError':
        errorMessage = 'Camera Error: No camera found on this device';
        suggestions = `
Solutions:
1. 🔌 Check camera connection
   • Ensure camera is properly connected
   • Try a different USB port
   • Check if camera shows up in Device Manager
   
2. 📱 Multiple cameras detected
   • Try "Virtual Camera" button if available
   • Check if you have built-in and external cameras
   
3. 🖥️ Camera not recognized
   • Install/update camera drivers
   • Restart your computer
   • Try the camera in another application first`;
        break;
        
      case 'OverconstrainedError':
        errorMessage = 'Camera Error: Requested settings not supported';
        suggestions = `
Solutions:
1. 📐 Resolution too high
   • Try "Alternative Settings" button (uses HD instead of Full HD)
   • Your camera may not support 1920x1080 resolution
   
2. 🔧 Camera capabilities
   • Try different camera settings
   • Check camera specifications for supported resolutions
   
3. 📱 Try different camera
   • If you have multiple cameras, try the other one
   • Use "Virtual Camera" button if available`;
        break;
        
      case 'AbortError':
        errorMessage = 'Camera Error: Camera access was aborted';
        suggestions = `
Possible causes:
1. ⏱️ Request timed out
   • Try again in a few seconds
   • Check if camera is responding
   
2. 🔄 Browser interrupted
   • Refresh the page and try again
   • Close other camera-using applications`;
        break;
        
      case 'SecurityError':
        errorMessage = 'Security Error: Camera access blocked';
        suggestions = `
Solutions:
1. 🔒 HTTPS required
   • Camera access requires secure connection (HTTPS)
   • Use "Try Alternative Settings" or contact administrator
   
2. 🛡️ Security software
   • Check antivirus/firewall settings
   • Temporarily disable security software for testing`;
        break;
        
      default:
        errorMessage = `Scanner Error: ${error.name}`;
        suggestions = `
General troubleshooting:
1. 🔄 Refresh the page and try again
2. 🖥️ Restart your browser
3. 📱 Try a different browser
4. 🔌 Check camera connections
5. 🛠️ Contact support if problem persists

Error details: ${error.message}`;
    }
    
    this.scanResult = `${errorMessage}\n\n${suggestions}`;
  }
  
  public stopScanner(): void {
    console.log('stopScanner called.');
    try {
      this.Barkoder.stopScanner();
      this.isScanning = false;
      this.isLoading = false;
      this.scanResult = 'Scanner stopped manually. Click "Start Scanner" to begin scanning again.';
    } catch (error) {
      console.error('Error stopping scanner:', error);
      // Even if there's an error, update our state
      this.isScanning = false;
      this.isLoading = false;
      this.scanResult = 'Error stopping scanner. Click "Start Scanner" to try again.';
    }
  }
  

  
  public getCameraStatus(): string {
    if (this.isLoading) {
      return '🔄 Loading camera...';
    }
    
    if (!this.ready) {
      return '🔄 Initializing Barkoder...';
    }
    
    if (this.isScanning) {
      return '🔍 Scanner Active - Ready for barcode';
    }
    
    if (this.scanResult.includes('Camera Error') || this.scanResult.includes('Permission Error')) {
      return '❌ Camera Error - Check error details below';
    }
    
    if (this.scanResult.includes('✅ Scan Successful')) {
      return '✅ Scan Complete - Ready for next scan';
    }
    
    if (this.scanResult.includes('🔍 No barcode detected')) {
      return '🔍 Scanner Active - Waiting for barcode';
    }
    
    if (this.scanResult.includes('⚠️ Multiple barcodes detected')) {
      return '⚠️ Scanner Active - Multiple barcodes detected';
    }
    
    if (this.scanResult.includes('Scanner stopped') || this.scanResult.includes('timed out')) {
      return '⏹️ Scanner Stopped - Click "Start Scanner" to resume';
    }
    
    return '🟡 Scanner Ready - Click "Start Scanner" to begin';
  }
  
  public getSupportedFormats(): string {
    return 'Supported formats: QR Code, EAN8, PDF417';
  }

  public getCameraSettings(): string {
    if (!this.ready) {
      return 'Settings: Loading...';
    }
    
    try {
      const resolution = this.Barkoder.getCameraResolution();
      const decodingSpeed = this.Barkoder.getDecodingSpeed();
      
      let resolutionText = 'Unknown';
      let speedText = 'Unknown';
      
      // Map resolution constants to readable text
      switch (resolution) {
        case this.Barkoder.constants.CameraResolution.HD:
          resolutionText = 'HD (1280x720)';
          break;
        case this.Barkoder.constants.CameraResolution.FHD:
          resolutionText = 'Full HD (1920x1080)';
          break;
        default:
          resolutionText = `Resolution ${resolution}`;
      }
      
      // Map decoding speed constants to readable text
      switch (decodingSpeed) {
        case this.Barkoder.constants.DecodingSpeed.Slow:
          speedText = 'Slow';
          break;
        case this.Barkoder.constants.DecodingSpeed.Normal:
          speedText = 'Normal';
          break;
        case this.Barkoder.constants.DecodingSpeed.Fast:
          speedText = 'Fast';
          break;
        default:
          speedText = `Speed ${decodingSpeed}`;
      }
      
      return `Camera: ${resolutionText} | Speed: ${speedText}`;
    } catch (error) {
      console.error('Error getting camera settings:', error);
      return 'Settings: Error reading configuration';
    }
  }

  public getSelectedCameraCapabilities(): string {
    if (!this.selectedCameraId || !this.cameraCapabilities[this.selectedCameraId]) {
      return 'Camera capabilities: Not tested yet\n\n💡 Click "Test Camera Capabilities" to run tests';
    }

    const camera = this.cameraCapabilities[this.selectedCameraId];
    const supported = camera.supportedResolutions.map((r: any) => r.name).join(', ');
    const maxResolution = camera.maxSupportedResolution;
    
    let result = `📹 ${camera.label}\n`;
    result += `✅ Supported: ${supported || 'None'}\n`;
    
    if (maxResolution) {
      result += `🎯 Max: ${maxResolution.name} (${maxResolution.width}x${maxResolution.height})`;
    } else {
      result += `❌ No supported resolutions`;
    }

    if (camera.testResults.length > 0) {
      const failed = camera.testResults.map((r: any) => `${r.resolution} (${r.error})`).join(', ');
      result += `\n❌ Failed: ${failed}`;
    }

    return result;
  }

  public getAvailableResolutions(): Array<{name: string, value: string, disabled: boolean}> {
    if (!this.selectedCameraId || !this.cameraCapabilities[this.selectedCameraId]) {
      return [
        { name: 'HD (1280x720)', value: 'HD', disabled: true },
        { name: 'FHD (1920x1080)', value: 'FHD', disabled: true }
      ];
    }

    const camera = this.cameraCapabilities[this.selectedCameraId];
    const supportedResolutions = camera.supportedResolutions.map((r: any) => r.name);
    
    return [
      { 
        name: 'HD (1280x720)', 
        value: 'HD', 
        disabled: !supportedResolutions.includes('HD') 
      },
      { 
        name: 'FHD (1920x1080)', 
        value: 'FHD', 
        disabled: !supportedResolutions.includes('FHD') 
      }
    ];
  }

  public getMaxSupportedResolution(): string {
    if (!this.selectedCameraId || !this.cameraCapabilities[this.selectedCameraId]) {
      return 'HD'; // Default fallback
    }

    const camera = this.cameraCapabilities[this.selectedCameraId];
    if (camera.maxSupportedResolution) {
      return camera.maxSupportedResolution.name;
    }
    
    return 'HD'; // Default fallback
  }

  public onCameraSelectionChange(): void {
    // Update selected resolution to the maximum supported for this camera
    this.selectedResolution = this.getMaxSupportedResolution();
    console.log('Camera selection changed to:', this.selectedCameraId);
    console.log('Updated resolution to:', this.selectedResolution);
  }

  public async testCameraCapabilities(): Promise<void> {
    if (!this.ready) {
      this.scanResult = '❌ Barkoder not ready yet. Please wait for initialization to complete.';
      return;
    }

    this.scanResult = '🔍 Testing camera capabilities... This may take a few seconds.';
    console.log('Manually triggering camera capability tests...');
    
    try {
      await this.testAllCamerasWithBarkoderSettings();
      this.scanResult = '✅ Camera capability tests completed! Check the camera capabilities section above.';
    } catch (error) {
      console.error('Error during camera capability tests:', error);
      this.scanResult = '❌ Camera capability tests failed. Check console for details.';
    }
  }

  /**
   * Check if camera permissions are granted
   */
  public async checkCameraPermissions(): Promise<boolean> {
    try {
      // Try to get a media stream to check permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        return false;
      }
      // For other errors (NotFoundError, NotSupportedError), we consider it as no permission
      return false;
    }
  }



  /**
   * Request camera permissions explicitly
   */
  public async requestCameraPermissions(): Promise<boolean> {
    try {
      console.log('🔐 Requesting camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera permissions granted');
      
      // If Barkoder is ready, re-run the complete camera initialization
      if (this.ready) {
        await this.initializeCameraSystem();
      } else {
        // If Barkoder isn't ready yet, just re-enumerate cameras
        await this.logAvailableCameras();
      }
      return true;
    } catch (error: any) {
      console.error('❌ Camera permission request failed:', error);
      
      if (error.name === 'NotAllowedError') {
        this.scanResult = '❌ Camera access denied\n\nPlease allow camera permissions in your browser to use the barcode scanner.\n\nTo fix this:\n• Click the camera icon in your browser\'s address bar\n• Select "Allow" for camera access\n• Refresh the page and try again';
      } else if (error.name === 'NotFoundError') {
        this.scanResult = '❌ No camera found\n\nPlease ensure you have a camera connected to your device and try again.';
      } else if (error.name === 'NotSupportedError') {
        this.scanResult = '❌ Camera not supported\n\nYour browser does not support camera access. Please try a different browser.';
      } else {
        this.scanResult = `❌ Camera error\n\nAn unexpected error occurred:\n\n${error.name}: ${error.message}`;
      }
      
      return false;
    }
  }
}
