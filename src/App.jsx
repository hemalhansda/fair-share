import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Receipt, 
  Home, 
  Settings, 
  Check, 
  X, 
  ChevronRight, 
  DollarSign, 
  PieChart, 
  Activity,
  Trash2,
  LogOut,
  Wallet,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Mail,
  ChevronLeft,
  Play,
  User
} from 'lucide-react';

// Database services
import { 
  createOrUpdateUser,
  getAllUsers,
  addFriend,
  createGroup,
  getUserGroups,
  createExpense,
  getUserExpenses,
  calculateBalances,
  isSupabaseConfigured,
  DEMO_USERS,
  DEMO_GROUPS,
  DEMO_EXPENSES
} from './services/database.js';

// --- Data Structures ---
// User: { id, name, email, avatar }
// Group: { id, name, members[], type }
// Expense: { id, description, amount, date, paidBy, groupId?, splitBetween[], category }
// Debt: { from, to, amount }

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Components ---

// 1. Avatar Component
const Avatar = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  if (!user) return <div className={`${sizeClasses[size]} bg-gray-200 rounded-full`} />;

  // Show Google profile picture if available
  if (user.picture) {
    return (
      <img 
        src={user.picture} 
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full border-2 border-white shadow-sm object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm`}>
      {user.avatar}
    </div>
  );
};

// 2. Button Component
const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1";
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500 shadow-md shadow-emerald-200",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
    danger: "bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-500",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 3. Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [googleUser, setGoogleUser] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Database state
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured());
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // State
  const [users, setUsers] = useState(isDemoMode ? DEMO_USERS : []);
  const [groups, setGroups] = useState(isDemoMode ? DEMO_GROUPS : []);
  const [expenses, setExpenses] = useState(isDemoMode ? DEMO_EXPENSES : []);
  const [currentUser, setCurrentUser] = useState(isDemoMode ? DEMO_USERS[0] : null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Modals State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Google OAuth setup
  useEffect(() => {
    const initGoogleAuth = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: '372713663318-11ob025d5sp4j0l6ec8kebpmhm9fldt9.apps.googleusercontent.com',
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: false
        });
        console.log('Google OAuth initialized successfully');
      }
    };

    // Load Google OAuth script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleAuth;
      document.head.appendChild(script);
    } else {
      initGoogleAuth();
    }
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!showLanding || isAuthenticated) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, [showLanding, isAuthenticated]);

  // Load user data after authentication
  useEffect(() => {
    if (isAuthenticated && currentUser && !isDemoMode) {
      loadUserData();
    }
  }, [isAuthenticated, currentUser?.id, isDemoMode]);

  // --- Database Loading Functions ---

  const loadUserData = async () => {
    if (isDemoMode || !currentUser) return;
    
    setIsDataLoading(true);
    try {
      // Load all users
      const usersResult = await getAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      // Load user's groups
      const groupsResult = await getUserGroups(currentUser.id);
      if (groupsResult.success) {
        setGroups(groupsResult.data);
      }

      // Load user's expenses
      const expensesResult = await getUserExpenses(currentUser.id);
      if (expensesResult.success) {
        setExpenses(expensesResult.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  // --- Logic & Calculations ---

  // Calculate debts for the current user
  const balances = useMemo(() => {
    if (!currentUser) return { totalOwed: 0, totalOwes: 0, details: {} };
    return calculateBalances(expenses, currentUser.id, users);
  }, [expenses, currentUser?.id, users]);

  // Format currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // --- Handlers ---

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description');
    const groupId = formData.get('group');
    const payerId = formData.get('payer');
    
    // Simple split: If group selected, split by all group members. If no group, split by Payer + User.
    let splitUsers = [];
    if (groupId && groupId !== 'none') {
      const group = groups.find(g => g.id === groupId);
      splitUsers = group ? group.members : [currentUser?.id].filter(Boolean);
    } else {
      // If "No Group", split between all users (demo mode) or just with current user
      splitUsers = users.map(u => u.id); 
    }

    const expenseData = {
      description,
      amount,
      paidBy: payerId,
      groupId: groupId === 'none' ? undefined : groupId,
      splitBetween: splitUsers,
      category: 'General'
    };

    if (isDemoMode) {
      // Demo mode - just update local state
      const newExpense = {
        id: generateId(),
        ...expenseData,
        date: new Date().toISOString()
      };
      setExpenses([newExpense, ...expenses]);
    } else {
      // Database mode
      const result = await createExpense(expenseData);
      if (result.success) {
        // Reload expenses to get updated data
        const expensesResult = await getUserExpenses(currentUser.id);
        if (expensesResult.success) {
          setExpenses(expensesResult.data);
        }
      } else {
        alert('Failed to add expense: ' + result.error);
        return;
      }
    }

    setIsExpenseModalOpen(false);
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const type = formData.get('type');
    
    // Get selected members from checkboxes
    const selectedMembers = [];
    const checkboxes = e.target.querySelectorAll('input[name="members"]:checked');
    checkboxes.forEach(checkbox => selectedMembers.push(checkbox.value));
    
    const groupData = {
      name,
      type,
      members: [currentUser?.id, ...selectedMembers].filter(Boolean) 
    };

    if (isDemoMode) {
      // Demo mode - just update local state
      const newGroup = {
        id: generateId(),
        ...groupData
      };
      setGroups([...groups, newGroup]);
    } else {
      // Database mode
      const result = await createGroup(groupData, currentUser.id);
      if (result.success) {
        // Reload groups to get updated data
        const groupsResult = await getUserGroups(currentUser.id);
        if (groupsResult.success) {
          setGroups(groupsResult.data);
        }
      } else {
        alert('Failed to create group: ' + result.error);
        return;
      }
    }

    setIsGroupModalOpen(false);
  };

  const handleSettleUp = (friendId) => {
    // Determine amount to settle
    const amount = Math.abs(balances.details[friendId] || 0);
    const userOwesFriend = (balances.details[friendId] || 0) < 0;

    if (amount === 0) return;

    const settlementExpense = {
      id: generateId(),
      description: 'Settlement',
      amount: amount,
      date: new Date().toISOString(),
      // If user owes friend, user pays. If friend owes user, friend pays.
      paidBy: userOwesFriend ? currentUser?.id : friendId, 
      splitBetween: [userOwesFriend ? friendId : currentUser?.id].filter(Boolean), // The receiver keeps 100% of value, logic is slightly diff for settlement
      // Actually, settlement is just a transaction that reverses the balance.
      // Standard way: A pays B $50. The split is 100% assigned to A (so A "consumed" 0, paid 50. B "consumed" 0, paid 0).
      // Wait, simpler: A pays B. B receives money.
      // To zero out:
      // If I owe Alice $50. I pay Alice $50.
      // Expense: Paid by Me. Split: Alice pays 0, I pay 0? No.
      // Splitwise logic: Payment is a special type. 
      // Workaround for this engine: 
      // Expense: "Payment", Paid by Me ($50). Split: Assigned entirely to Alice ($50).
      // Result: I paid +50, Alice "consumed" +50. Net for me: +50 owed. 
      // Since I owed -50 before, -50 + 50 = 0. Correct.
      category: 'Settlement'
    };

    // Override the split logic above for the settlement specifically
    // We need to inject the expense such that the 'splitBetween' implies who 'benefited' (received the money)
    settlementExpense.splitBetween = [userOwesFriend ? friendId : currentUser?.id].filter(Boolean);
    
    setExpenses([settlementExpense, ...expenses]);
    setIsSettleModalOpen(false);
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    
    const friendData = {
      name,
      email,
      avatar: name.substring(0, 2).toUpperCase()
    };

    if (isDemoMode) {
      // Demo mode - just update local state
      const newUser = {
        id: generateId(),
        ...friendData
      };
      setUsers([...users, newUser]);
    } else {
      // Database mode
      const result = await addFriend(friendData, currentUser.id);
      if (result.success) {
        // Reload users to get updated data
        const usersResult = await getAllUsers();
        if (usersResult.success) {
          setUsers(usersResult.data);
        }
      } else {
        alert('Failed to add friend: ' + result.error);
        return;
      }
    }

    setIsFriendModalOpen(false);
  };

  const handleGoogleCallback = async (credentialResponse) => {
    try {
      setIsGoogleLoading(true);
      
      // Decode the JWT token to get user info
      const token = credentialResponse.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const googleUserData = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar: payload.given_name?.substring(0, 2).toUpperCase() || payload.name?.substring(0, 2).toUpperCase(),
        picture: payload.picture
      };
      
      // Create or update user in database (if not in demo mode)
      if (!isDemoMode) {
        const result = await createOrUpdateUser(googleUserData);
        if (!result.success) {
          console.error('Failed to create/update user:', result.error);
          // Continue anyway, might be network issue
        }
      }
      
      // Update states
      setGoogleUser(googleUserData);
      setCurrentUser(googleUserData);
      
      // Simulate API call delay
      setTimeout(() => {
        setIsAuthenticated(true);
        setShowLanding(false);
        setIsGoogleLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    console.log('handleGoogleLogin called');
    
    if (window.google && window.google.accounts) {
      try {
        // Request credentials directly
        window.google.accounts.id.prompt((notification) => {
          console.log('Prompt notification:', notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If prompt fails, try alternative method
            console.log('Prompt failed, showing manual login');
            // Create a temporary container for Google button
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '50%';
            tempContainer.style.left = '50%';
            tempContainer.style.transform = 'translate(-50%, -50%)';
            tempContainer.style.zIndex = '10000';
            tempContainer.style.backgroundColor = 'white';
            tempContainer.style.padding = '20px';
            tempContainer.style.borderRadius = '10px';
            tempContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            
            document.body.appendChild(tempContainer);
            
            window.google.accounts.id.renderButton(tempContainer, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'signin_with',
              logo_alignment: 'left'
            });
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '5px';
            closeBtn.style.right = '10px';
            closeBtn.style.border = 'none';
            closeBtn.style.background = 'none';
            closeBtn.style.fontSize = '16px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => document.body.removeChild(tempContainer);
            tempContainer.appendChild(closeBtn);
          }
        });
      } catch (error) {
        console.error('Google login error:', error);
        alert('Error during Google login. Please try again.');
      }
    } else {
      alert('Google authentication is loading. Please try again in a moment.');
    }
  };

  const handleLogout = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    setIsAuthenticated(false);
    setShowLanding(true);
    setGoogleUser(null);
    setCurrentUser(isDemoMode ? DEMO_USERS[0] : null);
    // Reset to demo data if in demo mode
    if (isDemoMode) {
      setUsers(DEMO_USERS);
      setGroups(DEMO_GROUPS);
      setExpenses(DEMO_EXPENSES);
    }
  };

  // Feature slides data
  const featureSlides = [
    {
      title: "Split Bills Effortlessly",
      description: "Never worry about who owes what. Split expenses with friends, family, and colleagues in seconds.",
      icon: "💰",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      title: "Track Group Expenses",
      description: "Create groups for trips, shared apartments, or any activity. Keep everything organized in one place.",
      icon: "👥",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      title: "Settle Up Instantly",
      description: "Smart calculations show exactly who owes whom. Settle debts with a single tap.",
      icon: "⚡",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: "Stay in Sync",
      description: "Real-time updates keep everyone on the same page. No more awkward money conversations.",
      icon: "🔄",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  // --- Sub-Components ---

  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo Animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center transform animate-pulse">
            <PieChart className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce delay-75"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-150"></div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">FairShare</h2>
        <p className="text-gray-600 mb-8">Making money simple</p>
        
        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </div>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">FairShare</h1>
          </div>
          <button
            onClick={() => setShowLanding(false)}
            className="px-6 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 hover:bg-white transition-all duration-200"
          >
            Skip Intro
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Split expenses like a pro
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Money made
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent"> simple</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Split bills, track expenses, and settle up with friends. The easiest way to manage shared expenses.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex justify-center items-center mb-16">
              {isGoogleLoading ? (
                <div className="flex items-center gap-3 px-8 py-4">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-gray-600">Signing in...</span>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="group px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-lg hover:border-gray-300 hover:shadow-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Feature Slides */}
          <div className="relative">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12 overflow-hidden">
              {/* Slide Navigation */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex space-x-2">
                  {featureSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-12 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + featureSlides.length) % featureSlides.length)}
                    className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % featureSlides.length)}
                    className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Slide Content */}
              <div className="relative h-80 overflow-hidden rounded-2xl">
                {featureSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 transform ${
                      index === currentSlide 
                        ? 'translate-x-0 opacity-100' 
                        : index < currentSlide 
                          ? '-translate-x-full opacity-0' 
                          : 'translate-x-full opacity-0'
                    }`}
                  >
                    <div className={`h-full bg-gradient-to-br ${slide.gradient} rounded-2xl p-8 md:p-12 text-white relative overflow-hidden`}>
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white rounded-full"></div>
                        <div className="absolute bottom-10 left-10 w-20 h-20 border border-white rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-center">
                        <div className="text-6xl mb-6">{slide.icon}</div>
                        <h3 className="text-3xl md:text-4xl font-bold mb-4">{slide.title}</h3>
                        <p className="text-lg md:text-xl opacity-90 leading-relaxed max-w-md">{slide.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="text-center mt-8">
                <p className="text-gray-600 mb-4">Ready to get started?</p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  {isGoogleLoading ? 'Signing in...' : 'Start Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const FriendsView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Friends</h2>
        <Button onClick={() => setIsFriendModalOpen(true)} variant="secondary" className="!px-3 !py-1 text-sm">
          <UserPlus size={16} /> Add Friend
        </Button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {users.filter(u => u.id !== currentUser?.id).map(user => {
          const balance = balances.details[user.id] || 0;
          const isOwed = balance > 0;
          
          return (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div>
                  <div className="font-semibold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="text-right">
                {Math.abs(balance) > 0.01 ? (
                  <>
                    <div className={`font-bold text-sm ${isOwed ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isOwed ? 'owes you' : 'you owe'} {formatMoney(Math.abs(balance))}
                    </div>
                    <button 
                      onClick={() => handleSettleUp(user.id)}
                      className="text-xs text-blue-500 hover:underline mt-1"
                    >
                      Settle Up
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Check size={12} className="text-emerald-500" />
                    All settled
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {users.length <= 1 && (
          <div className="p-8 text-center text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No friends added yet.</p>
            <p className="text-xs mt-1">Add friends to start splitting expenses!</p>
          </div>
        )}
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col">
          <span className="text-emerald-600 font-medium text-xs uppercase tracking-wider mb-1">You are owed</span>
          <span className="text-2xl font-bold text-emerald-700">{formatMoney(balances.totalOwed)}</span>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col">
          <span className="text-rose-600 font-medium text-xs uppercase tracking-wider mb-1">You owe</span>
          <span className="text-2xl font-bold text-rose-700">{formatMoney(balances.totalOwes)}</span>
        </div>
      </div>

      {/* Net Balance Breakdown */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Friends Balance</h2>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('friends')}>See all</Button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {Object.entries(balances.details).filter(([_, amt]) => Math.abs(amt) > 0.01).map(([userId, amount]) => {
            const user = users.find(u => u.id === userId);
            const isOwed = amount > 0;
            return (
              <div key={userId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar user={user} />
                  <div>
                    <div className="font-semibold text-gray-800">{user?.name}</div>
                    <div className={`text-xs ${isOwed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isOwed ? 'owes you' : 'you owe'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${isOwed ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatMoney(Math.abs(amount))}
                  </div>
                  <button 
                    onClick={() => handleSettleUp(userId)}
                    className="text-xs text-blue-500 hover:underline mt-1"
                  >
                    Settle Up
                  </button>
                </div>
              </div>
            );
          })}
          {Object.keys(balances.details).length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <Check className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>You are all settled up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Snippet */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {expenses.slice(0, 3).map(expense => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
        </div>
      </div>
    </div>
  );

  const GroupsView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Your Groups</h2>
        <Button onClick={() => setIsGroupModalOpen(true)} variant="secondary" className="!px-3 !py-1 text-sm">
          <Plus size={16} /> New Group
        </Button>
      </div>
      
      <div className="grid gap-3">
        {groups.map(group => (
          <div 
            key={group.id} 
            onClick={() => { setSelectedGroup(group); setActiveTab('activity'); }}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                {group.type === 'Trip' ? '✈️' : group.type === 'Home' ? '🏠' : '👥'}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{group.name}</h3>
                <p className="text-xs text-gray-500">{group.members.length} members</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );

  const ActivityView = () => {
    // Filter expenses if a specific group is selected
    const displayExpenses = selectedGroup 
      ? expenses.filter(e => e.groupId === selectedGroup.id)
      : expenses;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center sticky top-0 bg-gray-50/95 backdrop-blur py-2 z-10">
          <div className="flex items-center gap-2">
            {selectedGroup && (
              <button onClick={() => setSelectedGroup(null)} className="p-1 -ml-2 hover:bg-gray-200 rounded-full">
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800">
              {selectedGroup ? selectedGroup.name : 'Recent Activity'}
            </h2>
          </div>
        </div>

        <div className="space-y-3 pb-20">
          {displayExpenses.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No expenses yet.</p>
            </div>
          ) : (
            displayExpenses.map(expense => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))
          )}
        </div>
      </div>
    );
  };

  const ExpenseItem = ({ expense }) => {
    const payer = users.find(u => u.id === expense.paidBy);
    const isPayer = expense.paidBy === currentUser.id;
    const date = new Date(expense.date);
    
    // Determine the text to show
    let statusText = '';
    let statusColor = '';

    if (expense.category === 'Settlement') {
      const receiverId = expense.splitBetween[0];
      const receiver = users.find(u => u.id === receiverId);
      statusText = `${payer?.name} paid ${receiver?.name}`;
      statusColor = 'text-gray-500';
    } else if (isPayer) {
      statusText = `you lent ${formatMoney(expense.amount - (expense.amount / expense.splitBetween.length))}`;
      statusColor = 'text-emerald-600 font-medium';
    } else {
      // You owe
      if (expense.splitBetween.includes(currentUser.id)) {
        statusText = `you borrowed ${formatMoney(expense.amount / expense.splitBetween.length)}`;
        statusColor = 'text-rose-600 font-medium';
      } else {
        statusText = 'not involved';
        statusColor = 'text-gray-400';
      }
    }

    return (
      <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-lg text-gray-400 border border-gray-100">
            <span className="text-xs font-bold uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
            <span className="text-lg font-bold leading-none">{date.getDate()}</span>
          </div>
          <div>
            <div className="font-semibold text-gray-800 line-clamp-1">{expense.description}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {expense.category === 'Settlement' ? <Wallet size={12}/> : <Receipt size={12} />}
              {payer?.name} paid {formatMoney(expense.amount)}
            </div>
          </div>
        </div>
        <div className={`text-xs text-right ${statusColor}`}>
          {statusText}
        </div>
      </div>
    );
  };

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show landing page
  if (showLanding && !isAuthenticated) {
    return <LandingPage />;
  }

  // Show main app
  // Don't render if no currentUser in database mode
  if (!isDemoMode && !currentUser) {
    return (
      <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to FairShare</h2>
          <p className="text-gray-600 mb-4">Please sign in to continue</p>
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden font-sans text-gray-900">
      
      {/* Sidebar (Desktop) / Hidden on Mobile usually, but let's make it responsive container */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
        <div className="p-6 flex items-center gap-2 text-emerald-600">
          <PieChart className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">FairShare</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'groups', label: 'Groups', icon: Users },
            { id: 'friends', label: 'Friends', icon: UserPlus },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedGroup(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <Avatar user={currentUser} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'Guest'}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'Not signed in'}</p>
            </div>
            <Settings size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-emerald-600">
            <PieChart className="w-6 h-6" />
            <h1 className="text-lg font-bold">FairShare</h1>
          </div>
          <Avatar user={currentUser} size="sm" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 md:pb-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'groups' && <GroupsView />}
          {activeTab === 'friends' && <FriendsView />}
          {activeTab === 'activity' && <ActivityView />}
        </div>

        {/* Floating Action Button (Mobile & Desktop) */}
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8">
          <Button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="rounded-full w-14 h-14 !p-0 shadow-lg shadow-emerald-300 flex items-center justify-center transform hover:scale-105 active:scale-95"
          >
            <Plus size={28} />
          </Button>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden bg-white border-t border-gray-200 flex justify-around p-3 fixed bottom-0 w-full z-20 safe-area-bottom">
          {[
            { id: 'dashboard', icon: Home },
            { id: 'groups', icon: Users },
            { id: 'friends', icon: UserPlus },
            { id: 'activity', icon: Activity },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedGroup(null); }}
              className={`p-2 rounded-xl transition-colors ${
                activeTab === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400'
              }`}
            >
              <item.icon size={24} />
            </button>
          ))}
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Add Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">With you and:</label>
            <select name="group" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="none">All Friends (No Group)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-emerald-500 py-2 transition-colors">
              <Receipt size={20} className="text-gray-400" />
              <input 
                name="description" 
                type="text" 
                required
                placeholder="Enter a description" 
                className="w-full bg-transparent focus:outline-none text-lg" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-emerald-500 py-2 transition-colors">
              <DollarSign size={20} className="text-gray-400" />
              <input 
                name="amount" 
                type="number" 
                step="0.01" 
                required
                placeholder="0.00" 
                className="w-full bg-transparent focus:outline-none text-3xl font-bold text-gray-800" 
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 flex items-center gap-2 pt-2">
            <span>Paid by</span>
            <select name="payer" className="bg-emerald-50 text-emerald-700 font-medium py-1 px-2 rounded cursor-pointer border-none focus:ring-0">
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.id === currentUser.id ? 'You' : u.name}</option>
              ))}
            </select>
            <span>and split equally.</span>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Add Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create Group">
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input 
              name="name" 
              type="text" 
              required
              placeholder="e.g., Summer Trip" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {['Trip', 'Home', 'Couple', 'Other'].map(type => (
                <label key={type} className="border rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 transition-all">
                  <input type="radio" name="type" value={type} className="hidden" defaultChecked={type === 'Other'} />
                  <span className="text-xs font-medium block">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {users.filter(u => u.id !== currentUser.id).map(user => (
                <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="members" 
                    value={user.id} 
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Avatar user={user} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </label>
              ))}
              {users.filter(u => u.id !== currentUser.id).length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No friends available.</p>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsGroupModalOpen(false);
                      setIsFriendModalOpen(true);
                    }}
                    className="text-emerald-600 hover:underline text-xs mt-1"
                  >
                    Add a friend first
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">You will be automatically added to the group</p>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">Create Group</Button>
          </div>
        </form>
      </Modal>

      {/* Add Friend Modal */}
      <Modal isOpen={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)} title="Add Friend">
        <form onSubmit={handleAddFriend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              name="name" 
              type="text" 
              required
              placeholder="Enter friend's name" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              name="email" 
              type="email" 
              required
              placeholder="Enter friend's email" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsFriendModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Add Friend</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}