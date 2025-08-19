import { Button } from "@/components/ui/button";
import { Sprout, Search, Bell, User } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl text-primary">
          <Sprout className="w-8 h-8 text-primary" />
          AgriTrade
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/browse" className="text-foreground hover:text-primary transition-colors font-medium">
            Browse Products
          </Link>
          <Link to="/categories" className="text-foreground hover:text-primary transition-colors font-medium">
            Categories
          </Link>
          <Link to="/how-it-works" className="text-foreground hover:text-primary transition-colors font-medium">
            How it Works
          </Link>
          <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
            About
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search products, locations..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Auth & Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full text-xs"></span>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Login</Link>
          </Button>
          
          <Button variant="hero" size="sm" asChild>
            <Link to="/register">Join AgriTrade</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;