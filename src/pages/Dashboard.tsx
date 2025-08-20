import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Eye,
  MapPin,
  Calendar,
  Star
} from 'lucide-react';
import { listingsService } from '@/lib/listings';
import type { Listing } from '@/lib/listings';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalOrders: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: listings } = await listingsService.getUserListings(user.id);
      if (listings) {
        setUserListings(listings);
        setStats({
          totalListings: listings.length,
          activeListings: listings.filter(l => l.status === 'active').length,
          totalViews: listings.reduce((sum, l) => sum + l.views_count, 0),
          totalOrders: 0 // Will implement when orders are ready
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDashboardContent = () => {
    switch (user.role) {
      case 'farmer':
        return <FarmerDashboard user={user} listings={userListings} stats={stats} />;
      case 'trader':
        return <TraderDashboard user={user} />;
      case 'admin':
        return <AdminDashboard user={user} />;
      default:
        return <DefaultDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Welcome back, {user.email}!
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {user.role || 'farmer'}
            </Badge>
          </div>
        </div>

        {getDashboardContent()}
      </main>
      <Footer />
    </div>
  );
};

const FarmerDashboard = ({ user, listings, stats }: any) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-card border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalListings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeListings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-card border-0">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => navigate('/listings/new')} 
            className="h-auto p-6 flex flex-col items-center gap-3"
            variant="hero"
          >
            <Plus className="w-8 h-8" />
            <span>Create New Listing</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/listings/manage')} 
            className="h-auto p-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <Package className="w-8 h-8" />
            <span>Manage Listings</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/messages')} 
            className="h-auto p-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <MessageSquare className="w-8 h-8" />
            <span>Messages</span>
          </Button>
        </div>
      </Card>

      {/* Recent Listings */}
      <Card className="p-6 bg-gradient-card border-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Listings</h2>
          <Button variant="outline" onClick={() => navigate('/listings/manage')}>
            View All
          </Button>
        </div>
        
        {listings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
            <Button onClick={() => navigate('/listings/new')} variant="hero">
              Create Your First Listing
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.slice(0, 3).map((listing) => (
              <div key={listing.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{listing.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {listing.state}, {listing.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {listing.views_count} views
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">₹{listing.price_per_unit}/{listing.unit}</p>
                  <Badge 
                    variant={listing.status === 'active' ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {listing.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const TraderDashboard = ({ user }: any) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <Card className="p-6 bg-gradient-card border-0">
        <h2 className="text-xl font-semibold text-foreground mb-4">Trader Dashboard</h2>
        <p className="text-muted-foreground mb-6">
          Discover agricultural products from verified farmers and manage your orders.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/browse')} 
            className="h-auto p-6 flex flex-col items-center gap-3"
            variant="hero"
          >
            <Package className="w-8 h-8" />
            <span>Browse Products</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/orders')} 
            className="h-auto p-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <ShoppingCart className="w-8 h-8" />
            <span>My Orders</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

const AdminDashboard = ({ user }: any) => {
  return (
    <div className="space-y-8">
      <Card className="p-6 bg-gradient-card border-0">
        <h2 className="text-xl font-semibold text-foreground mb-4">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage users, listings, and platform operations.
        </p>
      </Card>
    </div>
  );
};

const DefaultDashboard = ({ user }: any) => {
  return (
    <div className="space-y-8">
      <Card className="p-6 bg-gradient-card border-0">
        <h2 className="text-xl font-semibold text-foreground mb-4">Getting Started</h2>
        <p className="text-muted-foreground">
          Welcome to AgriTrade! Please contact support to set up your account role.
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;