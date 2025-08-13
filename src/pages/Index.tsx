import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, Activity, Package, ShoppingCart, FileText, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard after a short delay for better UX
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, expiry dates, and manage pharmacy items',
      href: '/inventory',
    },
    {
      icon: Activity,
      title: 'Dashboard Analytics',
      description: 'Real-time insights and alerts for your pharmacy',
      href: '/dashboard',
    },
    {
      icon: ShoppingCart,
      title: 'Transaction Records',
      description: 'Manage purchase and sales history',
      href: '/transactions',
    },
    {
      icon: FileText,
      title: 'Reports & Analytics',
      description: 'Generate detailed reports and insights',
      href: '/reports',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-primary shadow-elevation">
              <Pill className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              PharmaStock
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete Pharmacy Inventory & Sales Management System
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="animate-pulse-glow"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/inventory')}
            >
              View Inventory
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="animate-scale-in cursor-pointer hover:shadow-elevation transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(feature.href)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Redirect Notice */}
        <div className="text-center animate-slide-up">
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
