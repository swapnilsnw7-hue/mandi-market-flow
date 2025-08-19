import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sprout, User, Building, Shield } from "lucide-react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") || "";
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    firmName: "",
    state: "",
    district: "",
    pincode: "",
    gstin: "",
    agreeToTerms: false
  });

  const userRoles = [
    {
      id: "farmer",
      title: "Farmer",
      description: "Sell your agricultural products directly to traders",
      icon: Sprout,
      color: "text-green-600",
      bgColor: "bg-green-50",
      benefits: ["Direct market access", "Better prices", "Quality certification", "Logistics support"]
    },
    {
      id: "trader",
      title: "Trader/Buyer",
      description: "Source quality agricultural products from verified farmers",
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      benefits: ["Quality assurance", "Bulk sourcing", "Competitive pricing", "Secure payments"]
    },
    {
      id: "admin",
      title: "Admin",
      description: "Manage and oversee marketplace operations",
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      benefits: ["Full access", "User management", "Analytics", "Dispute resolution"]
    }
  ];

  const states = [
    "Punjab", "Maharashtra", "Karnataka", "Gujarat", "Rajasthan", 
    "Tamil Nadu", "Uttar Pradesh", "Madhya Pradesh", "Andhra Pradesh", "Telangana"
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log("Registration data:", { ...formData, role: selectedRole });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
              Join AgriTrade
            </h1>
            <p className="text-xl text-muted-foreground">
              Create your account and start connecting with the agricultural community
            </p>
          </div>

          {/* Role Selection */}
          {!selectedRole && (
            <div className="mb-12">
              <h2 className="text-2xl font-heading font-semibold text-foreground mb-6 text-center">
                Choose Your Role
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {userRoles.map((role) => {
                  const IconComponent = role.icon;
                  return (
                    <Card 
                      key={role.id}
                      className="p-8 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-card border-2 border-transparent hover:border-primary"
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <div className={`w-16 h-16 rounded-xl ${role.bgColor} flex items-center justify-center mb-6 mx-auto`}>
                        <IconComponent className={`w-8 h-8 ${role.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3 text-center">{role.title}</h3>
                      <p className="text-muted-foreground mb-6 text-center">{role.description}</p>
                      <div className="space-y-2">
                        {role.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm text-muted-foreground">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registration Form */}
          {selectedRole && (
            <Card className="p-8 bg-gradient-card border-0 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-heading font-semibold text-foreground">
                  Register as {userRoles.find(r => r.id === selectedRole)?.title}
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedRole("")}
                  className="text-muted-foreground"
                >
                  Change Role
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
                    
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Create a strong password"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Business Information</h3>
                    
                    <div>
                      <Label htmlFor="firmName">
                        {selectedRole === "farmer" ? "Farm Name" : "Company Name"} *
                      </Label>
                      <Input
                        id="firmName"
                        value={formData.firmName}
                        onChange={(e) => handleInputChange("firmName", e.target.value)}
                        placeholder={selectedRole === "farmer" ? "Enter your farm name" : "Enter your company name"}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state.toLowerCase()}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="district">District *</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => handleInputChange("district", e.target.value)}
                        placeholder="Enter your district"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="pincode">PIN Code *</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange("pincode", e.target.value)}
                        placeholder="Enter your PIN code"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="gstin">GSTIN (Optional)</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange("gstin", e.target.value)}
                        placeholder="Enter your GSTIN"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={!formData.agreeToTerms}
                >
                  Create Account
                </Button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;