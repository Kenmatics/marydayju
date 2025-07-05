import React, { useEffect, useState } from 'react';
import styles from './BackgroundSlider.module.css';

const images = [
  "https://res.cloudinary.com/dzvxwh8mp/image/upload/v1747543519/PXL_20250516_162840394.MP_b38lct.jpg",
  "https://res.cloudinary.com/dzvxwh8mp/image/upload/v1747645618/PXL_20250516_163153776.MP_bx2kkf.jpg",
  "https://res.cloudinary.com/dzvxwh8mp/image/upload/v1747645653/PXL_20250516_163146851_uomnlb.jpg",
  "https://res.cloudinary.com/dzvxwh8mp/image/upload/v1747645685/PXL_20250516_162628634.MP_hskoit.jpg"
];

function BackgroundSlider() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.sliderContainer}>
      {images.map((img, index) => (
        <div
          key={index}
          className={`${styles.slide} ${index === currentImageIndex ? styles.activeSlide : ''}`}
          style={{ backgroundImage: `url(${img})` }}
        ></div>
      ))}
    </div>
  );
}

export default BackgroundSlider;
