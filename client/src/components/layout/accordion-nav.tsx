import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { coreNavigationItems } from './navigation-config';

interface AccordionNavProps {
  navigationItems?: typeof coreNavigationItems;
  personaColor?: string;
  className?: string;
  onClose?: () => void;
}

export default function AccordionNav({ 
  navigationItems = coreNavigationItems,
  personaColor = 'primary',
  className = '',
  onClose 
}: AccordionNavProps) {
  const [location] = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Projects & GrantFlow': true, // Expanded by default
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <div className={`w-full ${className}`}>
      {navigationItems.map((group) => (
        <div key={group.title} className="mb-4">
          <h3 
            className="flex items-center text-sm font-medium text-gray-600 mb-1 cursor-pointer"
            onClick={() => toggleGroup(group.title)}
          >
            {expandedGroups[group.title] ? 
              <ChevronDown className="h-4 w-4 mr-1" /> : 
              <ChevronRight className="h-4 w-4 mr-1" />
            }
            {group.title}
          </h3>
          
          {expandedGroups[group.title] && (
            <div className="pl-5 space-y-1 mt-1">
              {group.items.map((item) => 
                item.subitems ? (
                  <div key={item.id} className="mb-2">
                    <div className="text-sm font-medium text-gray-800 mb-1">{item.text}</div>
                    <div className="pl-3 space-y-1 border-l border-gray-200">
                      {item.subitems.map((subitem) => (
                        <button
                          key={subitem.id}
                          onClick={() => {
                            if (onClose) onClose();
                            window.location.href = subitem.href!;
                          }}
                          className={`block py-1 px-2 text-sm rounded w-full text-left ${location === subitem.href ? `bg-gray-100 text-${personaColor} font-medium` : 'text-gray-600'}`}
                        >
                          {subitem.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onClose) onClose();
                      window.location.href = item.href!;
                    }}
                    className={`block py-1 px-2 text-sm rounded w-full text-left ${location === item.href ? `bg-gray-100 text-${personaColor} font-medium` : 'text-gray-600'}`}
                  >
                    {item.text}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
