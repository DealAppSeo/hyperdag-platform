import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EtherealConnectionVisualizer from '@/components/visualizations/EtherealConnectionVisualizer';
import EtherealContainer from '@/components/visualizations/EtherealContainer';
import MinimalNavbar from '@/components/layout/minimal-navbar';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link } from 'wouter';

const VisualizationsPage = () => {
  const [selectedTheme, setSelectedTheme] = useState<'default' | 'blue' | 'green' | 'orange' | 'rainbow'>('default');
  const [selectedDensity, setSelectedDensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedTab, setSelectedTab] = useState('demo');
  const [navOpen, setNavOpen] = useState(false);
  
  // Mapping of theme names to more user-friendly display names
  const themeNames = {
    default: 'HyperDAG (Purple)',
    blue: 'Developer (Blue)',
    green: 'Influencer (Green)',
    orange: 'Designer (Orange)',
    rainbow: 'Multi-Persona'
  };

  // These colors represent the color scheme for each persona/theme
  const personaColors = {
    default: 'bg-indigo-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-amber-500',
    rainbow: 'bg-gradient-to-r from-red-500 via-purple-500 to-blue-500'
  };
  
  // Navigation items for the slide-out menu
  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/grant-flow", label: "Projects & RFPs" },
    { href: "/grants", label: "Grant Search" },
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
        title="Ethereal Visualization" 
        showBack={true}
        showMenu={true}
        onMenuToggle={() => setNavOpen(true)}
        transparent={true}
        className="z-50 absolute top-0 left-0 right-0"
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
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${item.href === '/visualizations' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="container py-16 mx-auto flex-1">
        <h1 className="text-3xl font-bold mb-2">Ethereal Connection Visualization</h1>
        <p className="text-gray-500 mb-6">Interactive visualization of the web of connections in the HyperDAG ecosystem</p>
      
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="usage">Usage Guide</TabsTrigger>
          </TabsList>
          
          {/* Demo Tab */}
          <TabsContent value="demo" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Visualization Settings</CardTitle>
                    <CardDescription>Customize the ethereal connection visualization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="theme-select">Persona Theme</Label>
                      <Select value={selectedTheme} onValueChange={(value: any) => setSelectedTheme(value)}>
                        <SelectTrigger id="theme-select">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(themeNames).map(([value, name]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${personaColors[value as keyof typeof personaColors]}`}></div>
                                {name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="density-select">Particle Density</Label>
                      <RadioGroup 
                        value={selectedDensity} 
                        onValueChange={(value: any) => setSelectedDensity(value)}
                        className="flex justify-between mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="density-low" />
                          <Label htmlFor="density-low">Low</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="density-medium" />
                          <Label htmlFor="density-medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="density-high" />
                          <Label htmlFor="density-high">High</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="text-sm text-gray-500">
                      Move your cursor over the visualization to interact with the particles.
                    </div>
                  </CardFooter>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>About This Visualization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      The ethereal connection visualization represents the interconnected nature of identities, projects, and grants within the HyperDAG ecosystem. Each particle represents an entity, and the connections between them symbolize potential collaborations and relationships.
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      The different color themes represent the various personas in the HyperDAG ecosystem:
                    </p>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-indigo-500"></div>
                        <span className="text-sm">Purple - HyperDAG Core</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div>
                        <span className="text-sm">Blue - Developers</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                        <span className="text-sm">Green - Influencers</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-amber-500"></div>
                        <span className="text-sm">Orange - Designers</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="col-span-1 lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Interactive Visualization</CardTitle>
                    <CardDescription>
                      Explore the ethereal connections in the {themeNames[selectedTheme]} theme
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px] p-0">
                    <EtherealConnectionVisualizer 
                      colorTheme={selectedTheme}
                      density={selectedDensity}
                      interactive={true}
                      className="w-full h-full"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Ethereal Connections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Ethereal Connection Visualization is a core visual component of the HyperDAG platform, representing the interconnected web of relationships between users, projects, grant sources, and other entities within the ecosystem.
                </p>
                
                <h3 className="text-lg font-medium mt-4">Visual Representation</h3>
                <p>
                  Each floating particle represents an entity in the HyperDAG ecosystem. The connections between particles symbolize potential relationships, collaborations, and information flow between these entities. The more dense the connections, the stronger the network effect within that segment of the ecosystem.
                </p>
                
                <h3 className="text-lg font-medium mt-4">Color Coding</h3>
                <p>
                  Colors in the visualization are meaningful and tied to HyperDAG's persona system:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-2">
                  <li><span className="text-indigo-500 font-medium">Purple/Indigo</span> represents the core HyperDAG infrastructure and services</li>
                  <li><span className="text-blue-500 font-medium">Blue</span> represents developers and technical contributors</li>
                  <li><span className="text-green-500 font-medium">Green</span> represents influencers, community builders, and growth hackers</li>
                  <li><span className="text-amber-500 font-medium">Orange</span> represents designers, UX specialists, and creatives</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Usage Guide Tab */}
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Developer Usage Guide</CardTitle>
                <CardDescription>How to implement the Ethereal Connection Visualization in your HyperDAG components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-lg font-medium">Basic Usage</h3>
                <p>
                  The Ethereal Connection Visualization can be easily integrated into any component or page. There are two main components available:
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <code className="text-sm">
                    <pre>{`import EtherealConnectionVisualizer from '@/components/visualizations/EtherealConnectionVisualizer';

// Basic usage
<EtherealConnectionVisualizer 
  colorTheme="default" 
  density="medium" 
  interactive={true} 
/>`}</pre>
                  </code>
                </div>
                
                <h3 className="text-lg font-medium mt-4">Component Props</h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">colorTheme</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">string</td>
                      <td className="px-6 py-4 text-sm">Theme to use: 'default', 'blue', 'green', 'orange', or 'rainbow'</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">density</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">string</td>
                      <td className="px-6 py-4 text-sm">Particle density: 'low', 'medium', or 'high'</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">interactive</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">boolean</td>
                      <td className="px-6 py-4 text-sm">Whether the visualization responds to mouse movement</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Full-screen background visualization demo */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <EtherealContainer>
          <div className="relative h-full w-full">
            <EtherealConnectionVisualizer 
              colorTheme={selectedTheme} 
              density="low"
              interactive={false}
              className="absolute inset-0"
            />
            
            <div className="absolute bottom-10 right-10 max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Connecting {themeNames[selectedTheme]} Ecosystem
              </h3>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Visualize and interact with the web of connections within the HyperDAG ecosystem. 
                Each particle represents an entity, and connections represent potential collaborations.
              </p>
              <button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-md">
                Explore Connections
              </button>
            </div>
          </div>
        </EtherealContainer>
      </div>
    </div>
  );
};

export default VisualizationsPage;