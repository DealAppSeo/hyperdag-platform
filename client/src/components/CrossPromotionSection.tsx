import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Target, Zap, Heart } from "lucide-react";
import { Link } from "wouter";

interface CrossPromotionProps {
  currentPage: string;
  showAll?: boolean;
}

const features = [
  {
    id: "purpose-discovery",
    title: "Purpose Discovery",
    description: "Find your Ikigai and connect with causes that match your passion and skills",
    icon: Target,
    url: "/register",
    badge: "Start Here",
    color: "bg-purple-500",
    benefits: ["Personal fulfillment", "Skill alignment", "Impact clarity"]
  },
  {
    id: "nonprofits",
    title: "Non-Profit Directory",
    description: "Discover 1000+ verified nonprofits and connect with causes you care about",
    icon: Heart,
    url: "/non-profits",
    badge: "1000+ Orgs",
    color: "bg-red-500",
    benefits: ["Verified organizations", "Impact tracking", "Direct connection"]
  },
  {
    id: "grantflow",
    title: "GrantFlow AI",
    description: "AI-powered grant discovery and application generation from 20+ funding sources",
    icon: Zap,
    url: "/grantflow",
    badge: "AI-Powered",
    color: "bg-blue-500",
    benefits: ["Automated discovery", "Smart matching", "Application assistance"]
  },
  {
    id: "hackathons",
    title: "Hackathon Hub",
    description: "Join 35+ verified hackathons with $100M+ in prizes including XPRIZE",
    icon: Users,
    url: "/hackathons",
    badge: "$100M+ Prizes",
    color: "bg-green-500",
    benefits: ["High-value competitions", "Skill development", "Network building"]
  },
  {
    id: "hypercrowd",
    title: "HyperCrowd Matching",
    description: "AI-powered team formation and mentor/mentee connections",
    icon: Users,
    url: "/hypercrowd",
    badge: "Smart Matching",
    color: "bg-orange-500",
    benefits: ["Team formation", "Mentor connections", "Skill complementing"]
  }
];

export default function CrossPromotionSection({ currentPage, showAll = false }: CrossPromotionProps) {
  const otherFeatures = features.filter(feature => feature.id !== currentPage);
  const displayFeatures = showAll ? otherFeatures : otherFeatures.slice(0, 3);

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Your Journey in the HyperDAG Ecosystem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the virtuous loop of value creation: discover your purpose → find causes → 
            secure funding → build teams → create impact → repeat with greater reach
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {displayFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={feature.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Link href={feature.url}>
                    <Button 
                      className="w-full group-hover:bg-blue-600 transition-colors"
                      variant="default"
                    >
                      Explore {feature.title}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              The Power of Integration
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Each feature amplifies the others. Your purpose discovery guides grant applications, 
              hackathon participation builds your profile for team matching, and nonprofit connections 
              provide real-world impact opportunities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-4 py-2">🎯 Purpose-driven</Badge>
              <Badge variant="outline" className="px-4 py-2">🤝 Team-powered</Badge>
              <Badge variant="outline" className="px-4 py-2">💰 Grant-funded</Badge>
              <Badge variant="outline" className="px-4 py-2">🏆 Competition-tested</Badge>
              <Badge variant="outline" className="px-4 py-2">❤️ Impact-focused</Badge>
            </div>
          </div>

          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4">
              Start Your Journey Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}