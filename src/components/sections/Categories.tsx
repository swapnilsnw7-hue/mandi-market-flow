import { Card } from "@/components/ui/card";
import { 
  Wheat, 
  Carrot, 
  Apple, 
  Flower2, 
  Milk, 
  ChefHat,
  Flower,
  TreePine
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    id: "cereals",
    name: "Cereals & Grains",
    icon: Wheat,
    count: "12,450",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "vegetables",
    name: "Vegetables",
    icon: Carrot,
    count: "8,320",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "fruits",
    name: "Fruits",
    icon: Apple,
    count: "6,890",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "spices",
    name: "Spices & Herbs",
    icon: ChefHat,
    count: "4,560",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: "dairy",
    name: "Dairy Products",
    icon: Milk,
    count: "3,200",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "flowers",
    name: "Flowers",
    icon: Flower2,
    count: "2,100",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    id: "pulses",
    name: "Pulses & Legumes",
    icon: Flower,
    count: "5,670",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "others",
    name: "Other Products",
    icon: TreePine,
    count: "1,800",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

const Categories = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Explore Categories
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover a wide range of agricultural products from verified farmers across India
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link key={category.id} to={`/browse?category=${category.id}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-card border-0 shadow-card">
                  <div className={`w-16 h-16 rounded-xl ${category.bgColor} flex items-center justify-center mb-4 mx-auto`}>
                    <IconComponent className={`w-8 h-8 ${category.color}`} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} products</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;