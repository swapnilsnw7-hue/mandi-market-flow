import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Heart,
  Wheat,
  Carrot,
  Apple,
  ChefHat
} from "lucide-react";

// Mock data for products
const mockProducts = [
  {
    id: 1,
    title: "Premium Basmati Rice",
    category: "Cereals",
    grade: "Grade A",
    moisture: "12%",
    variety: "Pusa Basmati 1121",
    price: 4500,
    unit: "quintal",
    minOrder: 50,
    location: "Punjab, India",
    farmer: "Rajesh Kumar",
    rating: 4.8,
    organic: true,
    image: "/placeholder-rice.jpg",
    harvestDate: "2024-01-15"
  },
  {
    id: 2,
    title: "Fresh Red Onions",
    category: "Vegetables",
    grade: "Grade A",
    moisture: "8%",
    variety: "Nashik Red",
    price: 2800,
    unit: "quintal",
    minOrder: 20,
    location: "Maharashtra, India",
    farmer: "Sunita Patil",
    rating: 4.6,
    organic: false,
    image: "/placeholder-onion.jpg",
    harvestDate: "2024-01-20"
  },
  {
    id: 3,
    title: "Alphonso Mangoes",
    category: "Fruits",
    grade: "Export Quality",
    moisture: "85%",
    variety: "Alphonso",
    price: 8000,
    unit: "quintal",
    minOrder: 10,
    location: "Ratnagiri, Maharashtra",
    farmer: "Mahesh Desai",
    rating: 4.9,
    organic: true,
    image: "/placeholder-mango.jpg",
    harvestDate: "2024-01-25"
  },
  {
    id: 4,
    title: "Organic Turmeric Powder",
    category: "Spices",
    grade: "Organic Certified",
    moisture: "10%",
    variety: "Salem Turmeric",
    price: 12000,
    unit: "quintal",
    minOrder: 5,
    location: "Tamil Nadu, India",
    farmer: "Karthik Raman",
    rating: 4.7,
    organic: true,
    image: "/placeholder-turmeric.jpg",
    harvestDate: "2024-01-10"
  }
];

const Browse = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Cereals": return <Wheat className="w-4 h-4" />;
      case "Vegetables": return <Carrot className="w-4 h-4" />;
      case "Fruits": return <Apple className="w-4 h-4" />;
      case "Spices": return <ChefHat className="w-4 h-4" />;
      default: return <Wheat className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
            Browse Products
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover fresh agricultural products from verified farmers across India
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-6 mb-8 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cereals">Cereals & Grains</SelectItem>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="spices">Spices & Herbs</SelectItem>
                <SelectItem value="dairy">Dairy Products</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="punjab">Punjab</SelectItem>
                <SelectItem value="maharashtra">Maharashtra</SelectItem>
                <SelectItem value="karnataka">Karnataka</SelectItem>
                <SelectItem value="gujarat">Gujarat</SelectItem>
                <SelectItem value="rajasthan">Rajasthan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5000">₹0 - ₹5,000</SelectItem>
                <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
                <SelectItem value="10000-20000">₹10,000 - ₹20,000</SelectItem>
                <SelectItem value="20000+">₹20,000+</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="hero" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{mockProducts.length}</span> products
          </p>
          <Select defaultValue="newest">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="nearest">Nearest Location</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-card border-0 shadow-card">
              {/* Product Image */}
              <div className="relative h-48 bg-muted">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  {getCategoryIcon(product.category)}
                  <span className="ml-2 text-sm">{product.category}</span>
                </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.organic && (
                    <Badge variant="secondary" className="bg-success text-success-foreground">
                      Organic
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-background/80">
                    {product.grade}
                  </Badge>
                </div>
                
                {/* Wishlist */}
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-background/80 hover:bg-background">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(product.category)}
                  <span className="text-sm text-muted-foreground">{product.category}</span>
                </div>
                
                <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
                  {product.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {product.variety} • Moisture: {product.moisture}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{product.location}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">({product.farmer})</span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">per {product.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Min Order</p>
                    <p className="text-sm font-medium">{product.minOrder} {product.unit}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Send RFQ
                  </Button>
                  <Button variant="hero" size="sm" className="flex-1">
                    Buy Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Products
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Browse;