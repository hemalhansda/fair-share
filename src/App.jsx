import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

// Components
import LoadingScreen from './components/common/LoadingScreen';
import LandingPage from './components/auth/LandingPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import AppLayout from './components/layout/AppLayout';
import DashboardView from './components/views/DashboardView';
import GroupsView from './components/views/GroupsView';
import FriendsView from './components/views/FriendsView';
import ActivityView from './components/views/ActivityView';
import AddExpenseModal from './components/modals/AddExpenseModal';
import AddGroupModal from './components/modals/AddGroupModal';
import AddFriendModal from './components/modals/AddFriendModal';

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
// Expense: { id, description, amount, created_at, paid_by, group_id?, split_between[], category }
// Debt: { from, to, amount }

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Utility Functions ---

// --- Main Application Components ---

function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
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
  
  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') setActiveTab('dashboard');
    else if (path === '/groups') setActiveTab('groups');
    else if (path === '/friends') setActiveTab('friends');
    else if (path === '/activity') setActiveTab('activity');
  }, [location.pathname]);
  
  // Navigation helpers
  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    setSelectedGroup(null);
    navigate(`/${tab}`);
  };
  
  // Modals State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const savedAuthState = localStorage.getItem('fairshare_auth_state');
        const savedUser = localStorage.getItem('fairshare_user');
        
        if (savedAuthState === 'true' && savedUser) {
          const userData = JSON.parse(savedUser);
          setIsAuthenticated(true);
          setShowLanding(false);
          setGoogleUser(userData);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading saved auth state:', error);
        // Clear invalid data
        localStorage.removeItem('fairshare_auth_state');
        localStorage.removeItem('fairshare_user');
      }
    };

    // Check auth state immediately
    checkAuthState();
    
    // Set loading timer
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Google OAuth setup
  useEffect(() => {
    const initGoogleAuth = () => {
      if (window.google && window.google.accounts) {
        // Disable FedCM first to avoid browser compatibility issues
        if (window.google.accounts.id.disableFedCm) {
          try {
            window.google.accounts.id.disableFedCm();
            console.log('FedCM disabled successfully');
          } catch (error) {
            console.log('FedCM disable failed (this is normal):', error);
          }
        }
        
        window.google.accounts.id.initialize({
          client_id: '372713663318-11ob025d5sp4j0l6ec8kebpmhm9fldt9.apps.googleusercontent.com',
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: false,
          ux_mode: 'popup',
          context: 'signin'
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
      script.onerror = () => console.error('Failed to load Google OAuth script');
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

  const handleAddExpense = async (expense) => {
    if (isDemoMode) {
      // Demo mode - just update local state
      const newExpense = {
        id: generateId(),
        description: expense.description,
        amount: expense.amount,
        created_at: new Date().toISOString(),
        paid_by: expense.paid_by,
        group_id: expense.group_id,
        split_between: expense.split_with,
        category: expense.category || 'General'
      };
      setExpenses([newExpense, ...expenses]);
    } else {
      // Database mode
      const result = await createExpense(expense);
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
  };

  const handleAddGroup = async (group) => {
    if (isDemoMode) {
      // Demo mode - just update local state
      const newGroup = {
        id: generateId(),
        ...group
      };
      setGroups([...groups, newGroup]);
    } else {
      // Database mode
      const result = await createGroup(group, currentUser.id);
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
      created_at: new Date().toISOString(),
      // If user owes friend, user pays. If friend owes user, friend pays.
      paid_by: userOwesFriend ? currentUser?.id : friendId, 
      split_between: [userOwesFriend ? friendId : currentUser?.id].filter(Boolean), // The receiver keeps 100% of value, logic is slightly diff for settlement
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
    // We need to inject the expense such that the 'split_between' implies who 'benefited' (received the money)
    settlementExpense.split_between = [userOwesFriend ? friendId : currentUser?.id].filter(Boolean);
    
    setExpenses([settlementExpense, ...expenses]);
    setIsSettleModalOpen(false);
  };

  const handleAddFriend = async (friendData) => {
    const friendDataWithAvatar = {
      ...friendData,
      avatar: friendData.name.substring(0, 2).toUpperCase()
    };

    if (isDemoMode) {
      // Demo mode - just update local state
      const newUser = {
        id: generateId(),
        ...friendDataWithAvatar
      };
      setUsers([...users, newUser]);
    } else {
      // Database mode
      const result = await addFriend(friendDataWithAvatar, currentUser.id);
      if (result.success) {
        // Reload users to get updated data
        const usersResult = await getAllUsers();
        if (usersResult.success) {
          setUsers(usersResult.data);
        }
      } else {
        alert('Failed to add friend: ' + result.error);
        throw new Error(result.error);
      }
    }
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
      
      // Save authentication state to localStorage
      localStorage.setItem('fairshare_auth_state', 'true');
      localStorage.setItem('fairshare_user', JSON.stringify(googleUserData));
      
      // Simulate API call delay
      setTimeout(() => {
        setIsAuthenticated(true);
        setShowLanding(false);
        setIsGoogleLoading(false);
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    console.log('handleGoogleLogin called');
    
    if (!window.google || !window.google.accounts) {
      alert('Google authentication is still loading. Please wait a moment and try again.');
      return;
    }
    
    setIsGoogleLoading(true);
    
    try {
      console.log('Attempting Google prompt');
      
      // Clear any previous state that might interfere
      if (window.google.accounts.id.cancel) {
        window.google.accounts.id.cancel();
      }
      
      // Use renderButton method instead of prompt for better reliability
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-1000px';
      tempDiv.style.left = '-1000px';
      document.body.appendChild(tempDiv);
      
      window.google.accounts.id.renderButton(tempDiv, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        width: 300
      });
      
      // Programmatically click the button
      setTimeout(() => {
        const button = tempDiv.querySelector('div[role="button"]');
        if (button) {
          button.click();
        } else {
          console.error('Google sign-in button not found');
          setIsGoogleLoading(false);
          // Fallback to prompt method
          fallbackToPrompt();
        }
        // Clean up
        document.body.removeChild(tempDiv);
      }, 100);
      
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
      fallbackToPrompt();
    }
  };

  const fallbackToPrompt = () => {
    console.log('Falling back to prompt method');
    
    try {
      window.google.accounts.id.prompt((notification) => {
        console.log('Prompt notification:', notification);
        setIsGoogleLoading(false);
        
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.log('Prompt not displayed:', reason);
          
          switch (reason) {
            case 'browser_not_supported':
              alert('Your browser doesn\'t support Google Sign-In. Please try a different browser.');
              break;
            case 'unregistered_origin':
              console.error('Domain not authorized for Google OAuth');
              alert('Authentication setup issue. Please ensure localhost:5173 is authorized.');
              break;
            case 'suppressed_by_user':
              console.log('User previously dismissed Google sign-in');
              break;
            default:
              console.log('Google sign-in not available:', reason);
              break;
          }
        } else if (notification.isSkippedMoment()) {
          console.log('Prompt skipped:', notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
          console.log('Prompt dismissed:', notification.getDismissedReason());
        }
      });
    } catch (error) {
      console.error('Fallback prompt failed:', error);
      setIsGoogleLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    // Clear localStorage
    localStorage.removeItem('fairshare_auth_state');
    localStorage.removeItem('fairshare_user');
    
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
    
    // Navigate to welcome page
    navigate('/welcome');
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

  // Helper functions for group calculations
  const getGroupBalance = (groupId) => {
    const groupExpenses = expenses.filter(e => e.group_id === groupId);
    return calculateBalances(groupExpenses, currentUser?.id, users).totalOwed - calculateBalances(groupExpenses, currentUser?.id, users).totalOwes;
  };

  // Show loading screen during initial app load
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/welcome" 
          element={
            <PublicRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <LandingPage 
                featureSlides={featureSlides}
                currentSlide={currentSlide}
                setCurrentSlide={setCurrentSlide}
                isGoogleLoading={isGoogleLoading}
                handleGoogleLogin={handleGoogleLogin}
                setShowLanding={setShowLanding}
              />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={false}>
              <AppLayout 
                currentUser={currentUser}
                setSelectedGroup={setSelectedGroup}
                handleLogout={handleLogout}
                setIsExpenseModalOpen={setIsExpenseModalOpen}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="dashboard" 
            element={
              <DashboardView 
                balances={balances}
                formatMoney={formatMoney}
                users={users}
                handleSettleUp={handleSettleUp}
                expenses={expenses}
              />
            } 
          />
          <Route 
            path="groups" 
            element={
              <GroupsView 
                groups={groups}
                users={users}
                formatMoney={formatMoney}
                getGroupBalance={getGroupBalance}
                setShowAddGroup={() => setIsGroupModalOpen(true)}
                setSelectedGroup={setSelectedGroup}
              />
            } 
          />
          <Route 
            path="friends" 
            element={
              <FriendsView 
                users={users}
                currentUser={currentUser}
                balances={balances}
                formatMoney={formatMoney}
                handleSettleUp={handleSettleUp}
                setShowAddFriend={() => setIsFriendModalOpen(true)}
              />
            } 
          />
          <Route 
            path="activity" 
            element={
              <ActivityView 
                expenses={selectedGroup ? expenses.filter(e => e.group_id === selectedGroup.id) : expenses}
                users={users}
                currentUser={currentUser}
                formatMoney={formatMoney}
                isLoading={isDataLoading}
              />
            } 
          />
        </Route>
        
        {/* Catch all route - redirect to welcome if not authenticated, dashboard if authenticated */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/welcome" replace />
          } 
        />
      </Routes>

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        users={users}
        currentUser={currentUser}
        groups={groups}
        onAddExpense={handleAddExpense}
      />

      <AddGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onAddGroup={handleAddGroup}
      />

      <AddFriendModal
        isOpen={isFriendModalOpen}
        onClose={() => setIsFriendModalOpen(false)}
        onAddFriend={handleAddFriend}
      />
    </>
  );
}

// Main App component with Router
export default function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}