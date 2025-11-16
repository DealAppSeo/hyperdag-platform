import { RankedGrantsList } from "@/components/grants/RankedGrantsList";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import MinimalNavbar from "@/components/layout/minimal-navbar";
import { Link } from "wouter";
import { useState } from "react";

export default function GrantRankingPage() {
  const [navOpen, setNavOpen] = useState(false);
  
  // Navigation items for the slide-out menu
  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/grant-flow", label: "Projects & RFPs" },
    { href: "/grants", label: "Grant Search" },
    { href: "/grant-ranking", label: "Grant Ranking" },
    { href: "/visualizations", label: "Ethereal Visualization" },
    { href: "/identity", label: "Identity" },
    { href: "/reputation", label: "Reputation" },
    { href: "/ai-assistant", label: "AI Assistant" },
    { href: "/profile", label: "Settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Minimal Navigation Bar */}
      <MinimalNavbar 
        title="Grant Ranking & RFI Generation" 
        showBack={true}
        showMenu={true}
        onMenuToggle={() => setNavOpen(true)}
        className="z-50 sticky top-0"
      />
      
      {/* Slide-out Navigation Menu */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px]">
          <div className="py-6">
            <h2 className="text-lg font-semibold mb-6 px-4">HyperDAG Navigation</h2>
            <nav className="space-y-1">
              {navItems.map(item => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${item.href === '/grant-ranking' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Smart Grant Ranking</h1>
            <p className="text-muted-foreground mt-2">
              Automatically ranked grant opportunities based on deadlines, funding amounts, and mission alignment
            </p>
          </div>
        </div>

        <RankedGrantsList />
      </div>
    </div>
  );
}
