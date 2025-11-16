import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Heart, Target, Users, FileText, Brain, CheckCircle, Star, Play, User, Calendar, MapPin } from 'lucide-react';
import { Link } from 'wouter';

interface UserStory {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  background: string;
  challenge: string;
  journey: StoryStep[];
  outcome: string;
  timeframe: string;
  impact: string[];
}

interface StoryStep {
  step: number;
  title: string;
  description: string;
  action: string;
  result: string;
  timeSpent: string;
  path: string;
}

const UserStories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<string>('maria');

  const stories: UserStory[] = [
    {
      id: 'maria',
      name: 'Maria Rodriguez',
      role: 'Climate Scientist',
      location: 'Barcelona, Spain',
      avatar: '👩‍🔬',
      background: 'PhD in Environmental Science with 8 years experience in climate research. Passionate about ocean conservation and renewable energy solutions.',
      challenge: 'Had groundbreaking research on marine carbon capture but lacked funding and a technical team to build the solution.',
      timeframe: '6 weeks',
      journey: [
        {
          step: 1,
          title: 'Discovered Her Purpose',
          description: 'Maria explored the purposes page and identified "Ocean Conservation" and "Climate Action" as her core drivers.',
          action: 'Selected climate and ocean causes, defined her mission',
          result: 'Clear focus on marine carbon capture technology',
          timeSpent: '20 minutes',
          path: '/purposes'
        },
        {
          step: 2,
          title: 'Connected with Ocean Nonprofits',
          description: 'Found Ocean Conservancy and Surfrider Foundation working on similar initiatives.',
          action: 'Contacted nonprofits, shared research findings',
          result: 'Partnership offers from 3 organizations',
          timeSpent: '2 hours',
          path: '/nonprofits'
        },
        {
          step: 3,
          title: 'Found Perfect Funding',
          description: 'AI matched her research to NSF Climate Solutions, EU Horizon Europe, and private foundation grants.',
          action: 'Submitted applications to 5 relevant grants',
          result: 'Secured $2.1M in combined funding',
          timeSpent: '3 weeks',
          path: '/grantflow'
        },
        {
          step: 4,
          title: 'Built Her Dream Team',
          description: 'Connected with a marine engineer, full-stack developer, and business strategist who shared her passion.',
          action: 'Formed team through HyperCrowd matching',
          result: 'Complete interdisciplinary team assembled',
          timeSpent: '1 week',
          path: '/hypercrowd'
        },
        {
          step: 5,
          title: 'Defined Her Role',
          description: 'Chose to be both a mentor (sharing research expertise) and mentee (learning business development).',
          action: 'Completed profile with mentor/mentee preferences',
          result: 'Matched with seasoned startup founder as mentor',
          timeSpent: '15 minutes',
          path: '/profile/roles'
        },
        {
          step: 6,
          title: 'AI-Powered Growth',
          description: 'Receives personalized recommendations for conferences, collaborators, and scaling opportunities.',
          action: 'Following AI suggestions for partnerships and events',
          result: 'Prototype deployed, 3 pilot programs launched',
          timeSpent: 'Ongoing',
          path: '/dashboard'
        }
      ],
      outcome: 'Successfully launched OceanCapture Labs with $2.1M funding, deployed technology in 3 pilot locations, and now mentors 12 young climate scientists.',
      impact: [
        'Removed 50,000 tons CO2 from atmosphere',
        'Created 15 green jobs in coastal communities', 
        'Mentored 12 emerging scientists',
        'Open-sourced research helping 200+ projects'
      ]
    },
    {
      id: 'james',
      name: 'James Chen',
      role: 'Software Engineer',
      location: 'Toronto, Canada',
      avatar: '👨‍💻',
      background: 'Senior full-stack developer at tech startup. Wants to use his skills for social good but unsure how to transition from corporate work.',
      challenge: 'Skilled engineer feeling unfulfilled in corporate tech, wanting to create social impact but lacking direction and connections.',
      timeframe: '4 weeks',
      journey: [
        {
          step: 1,
          title: 'Explored Social Impact',
          description: 'Browsed purposes and resonated with "Digital Equity" and "Education Technology" causes.',
          action: 'Identified passion for closing digital divide',
          result: 'Clear mission to democratize technology access',
          timeSpent: '30 minutes',
          path: '/purposes'
        },
        {
          step: 2,
          title: 'Found Mission-Aligned Nonprofits',
          description: 'Connected with Code.org, CodePath, and local coding bootcamps serving underrepresented communities.',
          action: 'Volunteered as coding instructor',
          result: 'Started teaching weekend classes',
          timeSpent: '4 hours',
          path: '/nonprofits'
        },
        {
          step: 3,
          title: 'Discovered EdTech Grants',
          description: 'AI found grants for educational technology platforms and diversity in tech initiatives.',
          action: 'Applied for Google.org and Mozilla Foundation grants',
          result: 'Received $150K seed funding',
          timeSpent: '2 weeks',
          path: '/grantflow'
        },
        {
          step: 4,
          title: 'Assembled Impact Team',
          description: 'Found an educator passionate about tech, UX designer from nonprofit sector, and community organizer.',
          action: 'Built diverse team through platform matching',
          result: 'Complementary skills team formed',
          timeSpent: '5 days',
          path: '/hypercrowd'
        },
        {
          step: 5,
          title: 'Became Trainer & Trainee',
          description: 'Chose to train others in coding while learning nonprofit management and community engagement.',
          action: 'Set up mentoring relationships',
          result: 'Teaching 20 students, learning from sector experts',
          timeSpent: '10 minutes',
          path: '/profile/roles'
        },
        {
          step: 6,
          title: 'Scaling Social Impact',
          description: 'AI recommendations led to partnerships with libraries, community centers, and other coding nonprofits.',
          action: 'Expanding program based on AI insights',
          result: 'Platform used in 50+ communities',
          timeSpent: 'Ongoing',
          path: '/dashboard'
        }
      ],
      outcome: 'Created "CodeBridge" platform now serving 5,000+ students across 50 communities, while maintaining fulfilling part-time consulting work.',
      impact: [
        'Trained 5,000+ students in programming',
        'Partnered with 50+ community organizations',
        'Achieved 85% job placement rate for graduates',
        'Open-sourced curriculum used globally'
      ]
    },
    {
      id: 'aisha',
      name: 'Aisha Okafor',
      role: 'Healthcare Administrator',
      location: 'Lagos, Nigeria',
      avatar: '👩‍⚕️',
      background: 'Hospital administrator with 12 years experience. Sees inefficiencies in healthcare delivery and wants to improve access in underserved communities.',
      challenge: 'Expertise in healthcare systems but needs technology partners and funding to scale solutions across Africa.',
      timeframe: '8 weeks',
      journey: [
        {
          step: 1,
          title: 'Identified Healthcare Mission',
          description: 'Connected with "Global Health" and "Healthcare Access" purposes, focusing on maternal and child health.',
          action: 'Defined mission around maternal healthcare access',
          result: 'Clear vision for mobile health clinics',
          timeSpent: '25 minutes',
          path: '/purposes'
        },
        {
          step: 2,
          title: 'Partnered with Health NGOs',
          description: 'Found Partners in Health, Doctors Without Borders, and local maternal health organizations.',
          action: 'Established partnerships and pilot programs',
          result: 'Support from 4 established health organizations',
          timeSpent: '3 hours',
          path: '/nonprofits'
        },
        {
          step: 3,
          title: 'Secured Global Health Funding',
          description: 'AI identified Gates Foundation, WHO grants, and impact investor opportunities for maternal health.',
          action: 'Applied to health-focused funders worldwide',
          result: 'Raised $800K from multiple sources',
          timeSpent: '4 weeks',
          path: '/grantflow'
        },
        {
          step: 4,
          title: 'Built Cross-Continental Team',
          description: 'Connected with mobile app developer in Kenya, public health expert in Ghana, and logistics coordinator in Nigeria.',
          action: 'Formed distributed African health tech team',
          result: 'Regional expertise across 4 countries',
          timeSpent: '1.5 weeks',
          path: '/hypercrowd'
        },
        {
          step: 5,
          title: 'Coaching Future Leaders',
          description: 'Chose to coach emerging healthcare leaders while learning from global health experts.',
          action: 'Mentoring young African health professionals',
          result: 'Guiding 8 healthcare innovators',
          timeSpent: '20 minutes',
          path: '/profile/roles'
        },
        {
          step: 6,
          title: 'AI-Driven Expansion',
          description: 'Receiving recommendations for scaling across West Africa, partnership opportunities, and technology integrations.',
          action: 'Following AI guidance for regional growth',
          result: 'Operating in 12 communities across 3 countries',
          timeSpent: 'Ongoing',
          path: '/dashboard'
        }
      ],
      outcome: 'Launched MotherCare Mobile serving 12 communities across Nigeria, Ghana, and Kenya, reducing maternal mortality by 40% in served areas.',
      impact: [
        'Served 3,000+ pregnant women',
        'Reduced maternal mortality by 40%',
        'Trained 25 community health workers',
        'Created sustainable healthcare model being replicated'
      ]
    }
  ];

  const currentStory = stories.find(s => s.id === selectedStory) || stories[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-bold px-6 py-3 text-lg rounded-full mb-6">
            📖 USER STORIES
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Real Journeys,<br/>Real Impact
          </h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Follow the complete journeys of changemakers who used HyperDAG to transform their ideas into world-changing initiatives.
          </p>
        </div>

        {/* Story Selection */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {stories.map((story) => (
            <Button
              key={story.id}
              variant={selectedStory === story.id ? "default" : "outline"}
              onClick={() => setSelectedStory(story.id)}
              className="flex items-center gap-2 h-auto py-3 px-6"
            >
              <span className="text-2xl">{story.avatar}</span>
              <div className="text-left">
                <div className="font-semibold">{story.name}</div>
                <div className="text-xs opacity-75">{story.role}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Selected Story */}
        <div className="max-w-6xl mx-auto">
          {/* Story Header */}
          <Card className="mb-8 border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-start gap-6">
                <div className="text-6xl">{currentStory.avatar}</div>
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{currentStory.name}</CardTitle>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {currentStory.role}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {currentStory.location}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {currentStory.timeframe} journey
                    </Badge>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {currentStory.background}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">The Challenge</h4>
                <p className="text-red-700">{currentStory.challenge}</p>
              </div>
            </CardContent>
          </Card>

          {/* Journey Steps */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">The Journey: Step by Step</h2>
            <div className="space-y-6">
              {currentStory.journey.map((step, index) => (
                <Card key={step.step} className="relative border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          {step.step}
                        </div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {step.timeSpent}
                      </Badge>
                    </div>
                    <CardDescription className="ml-11">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="ml-11">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h5 className="font-semibold text-blue-800 text-sm mb-1">Action Taken</h5>
                        <p className="text-blue-700 text-sm">{step.action}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <h5 className="font-semibold text-green-800 text-sm mb-1">Result</h5>
                        <p className="text-green-700 text-sm">{step.result}</p>
                      </div>
                    </div>
                    <Link href={step.path}>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Play className="h-3 w-3" />
                        Try This Step
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Outcome & Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-xl text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  The Outcome
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 leading-relaxed">{currentStory.outcome}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                  <Star className="h-6 w-6" />
                  Measurable Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentStory.impact.map((impact, index) => (
                    <li key={index} className="flex items-center gap-2 text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {impact}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Write Your Own Story?</h3>
                <p className="text-blue-100 mb-6 text-lg">
                  Join {currentStory.name} and thousands of other changemakers creating real impact through HyperDAG.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/purpose-hub">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                      Start Your Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button size="lg" variant="outline" className="border-white bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                      Explore All Features
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStories;