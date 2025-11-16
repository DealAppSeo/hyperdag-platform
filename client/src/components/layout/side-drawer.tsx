import { X } from "lucide-react";
import MobileSidebar from "./mobile-sidebar";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden ${isOpen ? '' : 'hidden'}`}
      onClick={(e) => {
        // Close the drawer if clicking on the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white h-full w-3/4 max-w-xs p-4 animate-in slide-in-from-left overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
            </svg>
            <h1 className="ml-2 text-xl font-bold text-primary">HyperDAG</h1>
          </div>
          <button className="text-gray-500 hover:text-primary" onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile Sidebar Component */}
        <MobileSidebar onClose={onClose} />
      </div>
    </div>
  );
}