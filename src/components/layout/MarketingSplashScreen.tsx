import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, PenTool, Shield, Users, Smartphone, Cloud, X } from 'lucide-react';
import { LoginDialog } from '@/components/auth/LoginDialog';

export function MarketingSplashScreen() {
  const [showFeatures, setShowFeatures] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const features = [
    {
      icon: <PenTool className="h-8 w-8" />,
      title: "Beautiful Writing Experience",
      description: "Distraction-free editor with rich formatting and beautiful themes"
    },
    {
      icon: <Cloud className="h-8 w-8" />,
      title: "Sync Across Devices",
      description: "Your notes are always up-to-date on all your devices"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Private & Secure",
      description: "End-to-end encryption keeps your thoughts private"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Share & Collaborate",
      description: "Share notes with friends and collaborate in real-time"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Works Everywhere",
      description: "Progressive Web App that works on any device, online or offline"
    }
  ];

  if (showFeatures) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-6xl my-4 sm:my-8">
          <Card className="border-2 border-accent/20 shadow-2xl mx-auto animate-scale-in">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif mb-2 flex items-center justify-start">
                    Why Choose Arcana Notes<span className="text-xs text-muted-foreground ml-0.5 -mt-1">™</span>?
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">The note-taking app designed for passionate writers</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowFeatures(false)} className="shrink-0 ml-4">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="text-center p-4 rounded-lg border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover-scale"
                  >
                    <div className="flex justify-center mb-4 text-accent">
                      {feature.icon}
                    </div>
                    <h3 className="font-serif text-base sm:text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Ready to start writing what you love?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      console.log('Features popup Get Started Free button clicked, opening login dialog');
                      setShowFeatures(false); // Close features popup first
                      setShowLoginDialog(true);
                    }} 
                    className="bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto google-shimmer"
                  >
                    Get Started Free
                  </Button>
                </div>
              </div>

              {/* SEO-friendly content for search engines */}
              <div className="sr-only">
                <h3>Arcana Notes Features for Search Engines</h3>
                <ul>
                  <li>Beautiful Writing Experience: Distraction-free editor with rich formatting and beautiful themes</li>
                  <li>Sync Across Devices: Your notes are always up-to-date on all your devices</li>
                  <li>Private & Secure: End-to-end encryption keeps your thoughts private</li>
                  <li>Share & Collaborate: Share notes with friends and collaborate in real-time</li>
                  <li>Works Everywhere: Progressive Web App that works on any device, online or offline</li>
                </ul>
                <p>Contact: help@noteily.app</p>
                <p>Free note-taking app for writers, secure and beautiful design</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl text-center space-y-6 sm:space-y-8 animate-fade-in my-8">
        
        {/* SEO-friendly content always in DOM */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Arcana Notes",
            "description": "A simple notes app focused on creative expression and passionate writing. Beautiful, secure, and designed for writers who love their craft.",
            "applicationCategory": "Productivity",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Beautiful Writing Experience with distraction-free editor",
              "Sync Across Devices with cloud storage", 
              "Private & Secure with end-to-end encryption",
              "Share & Collaborate with real-time editing",
              "Progressive Web App that works offline"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "help@noteily.app",
              "contactType": "customer support"
            }
          })}
        </script>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Heart className="h-20 w-20 text-accent animate-heartbeat" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif text-foreground flex items-center justify-center">
            Arcana Notes<span className="text-xs sm:text-sm md:text-base text-muted-foreground ml-1 -mt-2">™</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light">
            Write What You Love
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto px-4">
            A simple notes app focused on creative expression and passionate writing. 
            Beautiful, secure, and designed for writers who love their craft.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              onClick={() => {
                console.log('Main splash button clicked, opening login dialog');
                setShowLoginDialog(true);
              }} 
              size="lg"
              className="bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto google-shimmer"
            >
              Start Writing Today
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                console.log('Learn More button clicked');
                setShowFeatures(true);
              }}
              className="w-full sm:w-auto"
            >
              Learn More
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2 px-4">
            <p>✨ Always free • 🔒 Private & secure • 📱 Works everywhere</p>
            <p>
              Questions? Contact us at{' '}
              <a href="mailto:help@noteily.app" className="text-accent hover:underline">
                help@noteily.app
              </a>
            </p>
          </div>
        </div>

        {/* LoginDialog should be accessible from anywhere */}
        <LoginDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog} 
        />
      </div>
    </div>
  );
}