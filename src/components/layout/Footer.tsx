import { Sprout, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sprout className="w-8 h-8" />
              <span className="font-heading font-bold text-2xl">AgriTrade</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              India's leading B2B agricultural marketplace connecting farmers and traders for better prices and sustainable trade.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span className="text-sm">support@agritrade.in</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* For Farmers */}
          <div>
            <h3 className="font-semibold text-lg mb-6">For Farmers</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/sell" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Sell Your Crops
                </Link>
              </li>
              <li>
                <Link to="/pricing-farmer" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Pricing Guide
                </Link>
              </li>
              <li>
                <Link to="/quality-standards" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Quality Standards
                </Link>
              </li>
              <li>
                <Link to="/farmer-support" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Farmer Support
                </Link>
              </li>
            </ul>
          </div>

          {/* For Traders */}
          <div>
            <h3 className="font-semibold text-lg mb-6">For Traders</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/browse" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link to="/bulk-orders" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Bulk Orders
                </Link>
              </li>
              <li>
                <Link to="/logistics" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Logistics Support
                </Link>
              </li>
              <li>
                <Link to="/trader-benefits" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Trader Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-primary-foreground/20 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/80 text-sm">
            © 2024 AgriTrade. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/security" className="text-primary-foreground/80 hover:text-secondary transition-colors text-sm">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;