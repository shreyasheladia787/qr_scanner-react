import { useEffect, useRef, useState } from 'react'
import { QRScanner } from '@shreyasheladia787/qr-scanner'
import './App.css'

function App() {
  const scannerRef = useRef(null)
  const [status, setStatus] = useState('Requesting camera access...')
  const [result, setResult] = useState('No code scanned yet')
  const [isScanning, setIsScanning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [cameraOptions, setCameraOptions] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')


  useEffect(() => {
    const scanner = new QRScanner({
      elementId: 'reader',
      onScan: (value) => {
        setResult(value)
        setStatus('Code scanned successfully.')
        setIsScanning(false)
        setIsPaused(true)
        scannerRef.current?.pause()
      },
      onError: (message) => {
        setStatus(message)
      },
    })

    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        const cameras = await QRScanner.getCameras()
        setCameraOptions(cameras)

        if (cameras.length > 0) {
          setSelectedCameraId(cameras[0].id)
        }

        await scanner.start({ facingMode: 'environment' })
        setIsScanning(true)
        setIsPaused(false)
        setStatus('Point the camera at a code or upload an image.')
      } catch (error) {
        setStatus(error?.message || 'The camera could not be started.')
      }
    }

    startScanner()

    return () => {
      scannerRef.current?.stop()
    }
  }, [])

  const handlePauseResume = () => {
    if (!scannerRef.current) return

    if (isPaused) {
      scannerRef.current.resume()
      setIsPaused(false)
      setStatus('Scanner resumed.')
    } else {
      scannerRef.current.pause()
      setIsPaused(true)
      setStatus('Scanner paused.')
    }
  }

  const handleSwitchCamera = async (event) => {
    const nextCameraId = event.target.value
    setSelectedCameraId(nextCameraId)

    try {
      await scannerRef.current?.stop()
      setIsScanning(false)
      setIsPaused(false)
      await scannerRef.current?.start(nextCameraId)
      setIsScanning(true)
      setStatus('Camera switched.')
    } catch (error) {
      setStatus(error?.message || 'Could not switch camera.')
    }
  }

  const handleFileScan = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (scannerRef.current) {
        scannerRef.current.pause()
      }

      const scannedValue = await scannerRef.current.scanFile(file)
      setResult(scannedValue)
      setStatus('Code scanned successfully.')
      setIsPaused(true)
    } catch (error) {
      setStatus(error?.message || 'No readable QR code or barcode was found in the selected image.')
    }
  }

  return (
    <main className="app-shell">
      <section className="scanner-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">QR & BARCODE READER</p>
            <h1>QR Scanner</h1>
          </div>
          <span className={`badge ${isScanning ? 'active' : ''}`}>
            {isScanning ? 'Scanning' : 'Ready'}
          </span>
        </div>

        <div className="reader-wrap">
          <div id="reader" className="reader" />
        </div>

        <div className="controls-row">
          <label className="select-wrap">
            <span>Camera</span>
            <select value={selectedCameraId} onChange={handleSwitchCamera}>
              {cameraOptions.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || 'Camera'}
                </option>
              ))}
            </select>
          </label>

          <label className="upload-button">
            <input type="file" accept="image/*" onChange={handleFileScan} />
            Upload Image
          </label>
        </div>

        <div className="action-row">
          <button type="button" onClick={handlePauseResume}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <p className="status" role="status">{status}</p>
      </section>

      <section className="result-panel">
        <p className="eyebrow">LATEST SCAN</p>
        <h2>Scanned result</h2>
        <div className="result-box">{result}</div>
      </section>
    </main>
  )
}

export default App
