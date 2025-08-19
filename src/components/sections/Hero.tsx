import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Package, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Modern agricultural farmland with crops and farming equipment"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 animate-fade-in">
            Connect. Trade. 
            <span className="text-secondary block">Grow Together.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-slide-up">
            India's leading B2B agricultural marketplace where farmers and traders connect directly. 
            Get better prices, reduce middlemen, and build lasting business relationships.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/register?role=farmer">
                Sell Your Crops <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            
            <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary" asChild>
              <Link to="/register?role=trader">
                Source Products
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center animate-bounce-gentle">
              <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">10,000+</div>
              <div className="text-white/80">Active Farmers</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center animate-bounce-gentle" style={{animationDelay: '0.2s'}}>
              <Package className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">50,000+</div>
              <div className="text-white/80">Products Listed</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center animate-bounce-gentle" style={{animationDelay: '0.4s'}}>
              <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">₹500Cr+</div>
              <div className="text-white/80">Trade Volume</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;