import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Heart } from 'lucide-react';

/**
 * A floating button that appears on mobile screens to provide quick access 
 * to the nonprofit hub page
 */
export default function NonprofitFloatingButton() {
  const [visible, setVisible] = useState(true);

  // Hide the button when user scrolls down
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`md:hidden fixed ${visible ? 'bottom-20' : '-bottom-20'} right-5 z-50 transition-all duration-300`}>
      <Link href="/nonprofits">
        <button 
          className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          aria-label="Nonprofit Hub"
        >
          <div className="relative">
            <Heart className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              !
            </span>
          </div>
        </button>
      </Link>
    </div>
  );
}