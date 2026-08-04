import React, { useEffect, useState } from 'react';
import styles from './ImagePreviewModal.module.css';

interface Props {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImagePreviewModal({ images, currentIndex: initialIndex, isOpen, onClose }: Props) {
    const [index, setIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        setIndex(initialIndex);
        setScale(1);
        setRotation(0);
    }, [initialIndex, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, index, images.length]);

    if (!isOpen || images.length === 0) return null;

    const handlePrev = () => {
        setIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
        setScale(1);
        setRotation(0);
    };

    const handleNext = () => {
        setIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
        setScale(1);
        setRotation(0);
    };

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const currentUrl = images[index] || '';

    return (
        <div className={styles.overlay} onClick={onClose}>
            {/* Top Toolbar */}
            <div className={styles.topBar} onClick={e => e.stopPropagation()}>
                <div className={styles.counter}>
                    {index + 1} / {images.length}
                </div>
                <div className={styles.actions}>
                    <button className={styles.iconBtn} onClick={handleZoomIn} title="Phóng to">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <line x1="11" y1="8" x2="11" y2="14"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button className={styles.iconBtn} onClick={handleZoomOut} title="Thu nhỏ">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button className={styles.iconBtn} onClick={handleRotate} title="Xoay ảnh">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                    </button>
                    <button className={styles.iconBtn} onClick={onClose} title="Đóng (Esc)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Image Stage */}
            <div className={styles.mainStage} onClick={onClose}>
                {images.length > 1 && (
                    <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={e => { e.stopPropagation(); handlePrev(); }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                )}

                <div 
                    className={styles.imageWrapper} 
                    style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                    onClick={e => e.stopPropagation()}
                >
                    <img src={currentUrl} alt={`preview-${index}`} className={styles.previewImage} />
                </div>

                {images.length > 1 && (
                    <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={e => { e.stopPropagation(); handleNext(); }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Bottom Thumbnails */}
            {images.length > 1 && (
                <div className={styles.bottomBar} onClick={e => e.stopPropagation()}>
                    {images.map((url, i) => (
                        <div 
                            key={i} 
                            className={`${styles.thumbItem} ${i === index ? styles.thumbActive : ''}`}
                            onClick={() => { setIndex(i); setScale(1); setRotation(0); }}
                        >
                            <img src={url} alt={`thumb-${i}`} className={styles.thumbImage} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
