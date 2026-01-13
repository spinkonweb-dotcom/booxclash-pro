// src/components/BackgroundSlider.tsx

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';

// --- IMPORTANT ---
// Replace these with your actual high-quality background images
const backgroundImages = [
  '/images/1.webp', // Kids in a classroom
  '/images/2.webp', // Collaborative work environment
  '/images/3.webp', // People using laptops
  '/images/4.webp'  // Abstract colorful gradient
];

const BackgroundSlider = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Swiper
        modules={[Autoplay, EffectFade]}
        spaceBetween={30}
        slidesPerView={1}
        loop={true}
        effect={'fade'}
        autoplay={{
          delay: 8080, // 5 seconds per slide
          disableOnInteraction: false,
        }}
        className="h-full w-full"
      >
        {backgroundImages.map((imgUrl, index) => (
          <SwiperSlide key={index}>
            <img 
              src={imgUrl} 
              alt={`Background slide ${index + 1}`}
              className="w-full h-full object-cover" 
            />
          </SwiperSlide>
        ))}
      </Swiper>
      {/* This overlay is CRUCIAL for text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
    </div>
  );
};

export default BackgroundSlider;