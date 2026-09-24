import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number; // e.g., 1 for avatar (1:1), 16/9 for background, etc.
}

export default function ImageCropperModal({ imageSrc, onClose, onCropComplete, aspectRatio = 1 }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, padding: 24,
        width: '90%', maxWidth: 600, height: '80vh',
        display: 'flex', flexDirection: 'column'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Cắt chỉnh hình ảnh</h3>
        
        <div style={{ position: 'relative', flex: 1, backgroundColor: '#333', borderRadius: 8, overflow: 'hidden' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Thu phóng:</span>
          <input 
            type="range" 
            min={1} 
            max={3} 
            step={0.1} 
            value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '8px 16px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
            }}
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={isProcessing}
            style={{
              padding: '8px 16px', background: '#3B82F6', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
            }}
          >
            {isProcessing ? 'Đang xử lý...' : 'Lưu ảnh'}
          </button>
        </div>
      </div>
    </div>
  );
}
