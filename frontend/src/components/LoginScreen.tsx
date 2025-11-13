import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

import { SignupScreen, type SignupSuccessPayload } from './SignupScreen';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Smartphone,
  Shield,
  Zap,
  Bot,
  Sparkles,
  TrendingUp,
  Clock,
  BarChart3,
  Utensils,
  Star,
  Coffee,
  Wifi,
  Globe
} from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export interface LoginResponsePayload {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role: string;
    permissions: string[];
    dashboardModules: string[];
  };
  restaurant: {
    id: string;
    useRedis?: boolean;
  };
}

interface LoginScreenProps {
  onLogin: (payload: LoginResponsePayload) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiFeatures = [
    {
      icon: Bot,
      title: "AI-Powered Insights",
      description: "Smart analytics predict busy hours and optimize staff scheduling automatically",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Sparkles,
      title: "Intelligent Menu Optimization",
      description: "AI suggests popular dishes and identifies profit opportunities in real-time",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Forecast sales trends and inventory needs before they happen",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Smart Reporting",
      description: "Get AI-generated insights on performance and actionable recommendations",
      color: "from-orange-500 to-red-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % aiFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    if (!email || !password || !restaurantId) {
      const message = 'Please enter your restaurant ID, email, and password to continue.';
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<LoginResponsePayload>('/login', { email, password }, {
        headers: {
          'X-Restaurant-Id': restaurantId,
        },
      });

      const data = response.data;

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('restaurantId', data.restaurant.id);
      localStorage.setItem('user', JSON.stringify(data.user));

      setPassword('');
      onLogin(data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || 'Failed to sign in. Please verify your credentials and restaurant ID.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = (payload: SignupSuccessPayload) => {
    setShowSignup(false);
    if (payload.email) {
      setEmail(payload.email);
    }
    setRestaurantId(payload.restaurantId);
    toast.success(`Restaurant created successfully! Note your Restaurant ID: ${payload.restaurantId}`);
  };

  if (showSignup) {
    return (
      <SignupScreen 
        onSignup={handleSignupSuccess}
        onBackToLogin={() => setShowSignup(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-8 -right-4 w-72 h-72 bg-gradient-to-r from-cyan-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-60"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Branding & Features */}
        <motion.div 
          className="text-center lg:text-left space-y-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Brand Header */}
          <motion.div 
            className="flex items-center gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-4xl">🍽️</span>
            </motion.div>
            <div>
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Eat With Me
              </motion.h1>
              <motion.p 
                className="text-lg text-muted-foreground flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Bot className="w-4 h-4" />
                AI-Powered Restaurant Management
              </motion.p>
            </div>
          </motion.div>
          
          {/* Main Headline */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Transform Your Restaurant with{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg">
              Join thousands of restaurants using AI to boost efficiency, increase profits, and create amazing dining experiences.
            </p>
          </motion.div>

          {/* Animated AI Features */}
          <div className="relative h-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className={`bg-gradient-to-r ${aiFeatures[currentFeature].color} p-6 rounded-2xl text-white shadow-xl`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {(() => {
                        const IconComponent = aiFeatures[currentFeature].icon;
                        return <IconComponent className="w-6 h-6" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{aiFeatures[currentFeature].title}</h3>
                      <p className="text-white/90 text-sm">{aiFeatures[currentFeature].description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Feature Dots */}
          <div className="flex justify-center lg:justify-start gap-2">
            {aiFeatures.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentFeature ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-semibold text-xl">30%</p>
              <p className="text-xs text-muted-foreground">Profit Increase</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-semibold text-xl">50%</p>
              <p className="text-xs text-muted-foreground">Time Saved</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <p className="font-semibold text-xl">4.9</p>
              <p className="text-xs text-muted-foreground">User Rating</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="w-full max-w-md mx-auto backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your AI-powered restaurant dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="text-sm font-medium">Restaurant ID</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter your restaurant ID"
                  value={restaurantId}
                  onChange={(e) => {
                    setRestaurantId(e.target.value.trim());
                    if (error) {
                      setError(null);
                    }
                  }}
                  className="h-12 bg-white/50 border-primary/20 focus:border-primary"
                  autoComplete="off"
                />
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  className="h-12 bg-white/50 border-primary/20 focus:border-primary"
                  autoComplete="email"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) {
                        setError(null);
                      }
                    }}
                    className="h-12 bg-white/50 border-primary/20 focus:border-primary pr-12"
                    autoComplete="current-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </motion.button>
                </div>
              </motion.div>



              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <Button variant="link" className="text-sm px-0 text-primary">
                  Forgot password?
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  onClick={handleLogin} 
                  className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Signing In...
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Sign In with AI
                    </span>
                  )}
                </Button>
              </motion.div>

              {error && (
                <motion.p
                  className="text-sm text-destructive text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {error}
                </motion.p>
              )}

              <Separator />

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSignup(true)}
                  className="text-sm hover:bg-primary/5"
                >
                  New to Eat With Me? <span className="text-primary ml-1 font-medium">Create Account</span>
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                className="flex items-center justify-center gap-6 pt-4 border-t"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  Secure
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Wifi className="w-3 h-3" />
                  Cloud Sync
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  Global
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}