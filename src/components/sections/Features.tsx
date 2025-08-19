import { Card } from "@/components/ui/card";
import { 
  ShieldCheck, 
  TrendingUp, 
  Truck, 
  MessageSquare,
  CreditCard,
  Award
} from "lucide-react";
import businessImage from "@/assets/agri-business.jpg";
import productsImage from "@/assets/products-variety.jpg";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Users",
    description: "All farmers and traders are KYC verified for safe and secure trading",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: TrendingUp,
    title: "Best Prices",
    description: "Get competitive prices with direct farmer-to-trader connections",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Truck,
    title: "Logistics Support",
    description: "End-to-end logistics solutions for seamless product delivery",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description: "Chat directly with farmers and traders to negotiate the best deals",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Escrow payment system ensures secure transactions for all parties",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "AGMARK certified products with detailed quality specifications",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Why Choose AgriTrade?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built specifically for the agricultural industry with features that matter most to farmers and traders
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="p-8 hover:shadow-lg transition-all duration-300 bg-gradient-card border-0 shadow-card">
                <div className={`w-16 h-16 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                  <IconComponent className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-3xl font-heading font-bold text-foreground mb-6">
              Connecting Farmers & Traders Nationwide
            </h3>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our platform bridges the gap between farmers and traders, creating a transparent marketplace 
              where quality meets demand. With advanced search filters, real-time communication, and secure 
              payment systems, we're revolutionizing agricultural trade in India.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Direct access to 28 states across India</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Multi-language support for regional markets</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Real-time price tracking and market insights</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src={businessImage} 
              alt="Agricultural business meeting between farmers and traders"
              className="rounded-2xl shadow-lg w-full h-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-20">
          <div className="relative order-2 lg:order-1">
            <img 
              src={productsImage} 
              alt="Variety of fresh agricultural products including grains, vegetables and fruits"
              className="rounded-2xl shadow-lg w-full h-auto"
            />
          </div>
          
          <div className="order-1 lg:order-2">
            <h3 className="text-3xl font-heading font-bold text-foreground mb-6">
              Premium Quality Products
            </h3>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Every product on our platform goes through rigorous quality checks. From AGMARK certified 
              grains to farm-fresh vegetables, we ensure that only the best products reach our traders. 
              Our quality assurance process includes moisture content analysis, grade verification, and 
              organic certification validation.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span className="text-foreground">AGMARK certified products</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span className="text-foreground">Detailed quality specifications</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span className="text-foreground">Freshness guarantee with harvest dates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;