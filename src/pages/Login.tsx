import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sprout, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in."
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: "Farmer", email: "farmer_demo@example.com", password: "Passw0rd!" },
    { role: "Trader", email: "trader_demo@example.com", password: "Passw0rd!" },
    { role: "Admin", email: "admin_demo@example.com", password: "Passw0rd!" }
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setFormData(prev => ({ ...prev, email, password }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sprout className="w-10 h-10 text-primary" />
              <span className="font-heading font-bold text-3xl text-primary">AgriTrade</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue trading
            </p>
          </div>

          {/* Demo Accounts */}
          <Card className="p-6 mb-6 bg-gradient-card border-0 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Demo Accounts</h3>
            <div className="space-y-3">
              {demoAccounts.map((account) => (
                <div key={account.role} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{account.role}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fillDemoAccount(account.email, account.password)}
                  >
                    Use Demo
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Login Form */}
          <Card className="p-8 bg-gradient-card border-0 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">Remember me</Label>
                </div>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Create one here
                  </Link>
                </p>
              </div>
            </form>
          </Card>

          {/* Additional Info */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Secure login with 256-bit SSL encryption
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;