import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import Alert from './components/ui/Alert';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { useAlert } from './hooks/useAlert';
import { useConfirm } from './hooks/useConfirm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import AppLayout from './components/layout/AppLayout';
import DashboardView from './components/views/DashboardView';
import GroupsView from './components/views/GroupsView';
import GroupDetailView from './components/views/GroupDetailView';
import FriendsView from './components/views/FriendsView';
import ActivityView from './components/views/ActivityView';
import AddExpenseModal from './components/modals/AddExpenseModal';
import EditExpenseModal from './components/modals/EditExpenseModal';
import AddGroupModal from './components/modals/AddGroupModal';
import AddFriendModal from './components/modals/AddFriendModal';
import EditUserModal from './components/modals/EditUserModal';
import EditGroupModal from './components/modals/EditGroupModal';
import SettingsModal from './components/modals/SettingsModal';

// Database services
import { 
  createOrUpdateUser,
  getAllUsers,
  getUserFriends,
  addFriend,
  updateUser,
  deleteUser,
  createGroup,
  updateGroup,
  deleteGroup,
  getUserGroups,
  createExpense,
  updateExpense,
  getUserExpenses,
  calculateBalances,
  updateUserPreferences,
  getUserPreferences,
  isSupabaseConfigured,
  uploadExpenseImage,
  deleteExpenseImage,
  getExpenseImageUrl,
  DEMO_USERS,
  DEMO_GROUPS,
  DEMO_EXPENSES
} from './services/database.js';

// Currency services
import { convertCurrency, formatCurrency, CURRENCIES } from './services/currency.js';

// --- Data Structures ---
// User: { id, name, email, avatar }
// Group: { id, name, members[], type }
// Expense: { id, description, amount, created_at, paid_by, group_id?, split_between[], category }
// Debt: { from, to, amount }

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// Wrapper component to handle group context for expense modal
const ExpenseModalWrapper = ({ 
  isExpenseModalOpen, 
  setIsExpenseModalOpen, 
  users, 
  currentUser, 
  groups, 
  handleAddExpense, 
  selectedGroup 
}) => {
  const location = useLocation();
  
  // Determine if we're in a group detail view and get the group
  const currentGroup = useMemo(() => {
    const groupIdMatch = location.pathname.match(/\/groups\/([^\/]+)$/);
    if (groupIdMatch) {
      const groupId = groupIdMatch[1];
      return groups.find(g => g.id === groupId) || null;
    }
    return selectedGroup;
  }, [location.pathname, groups, selectedGroup]);

  return (
    <AddExpenseModal
      isOpen={isExpenseModalOpen}
      onClose={() => setIsExpenseModalOpen(false)}
      users={users}
      currentUser={currentUser}
      groups={groups}
      onAddExpense={handleAddExpense}
      selectedGroup={currentGroup}
    />
  );
};

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
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState({ currency: 'USD' });
  
  // Custom alert system
  const { alert, showError, showSuccess, showWarning, hideAlert } = useAlert();
  
  // Custom confirmation system
  const { confirmState, hideConfirm, confirmDelete } = useConfirm();
  
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
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [selectedGroupToEdit, setSelectedGroupToEdit] = useState(null);
  const [selectedExpenseToEdit, setSelectedExpenseToEdit] = useState(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const savedAuthState = localStorage.getItem('fyrshare_auth_state');
        const savedUser = localStorage.getItem('fyrshare_user');
        
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
        localStorage.removeItem('fyrshare_auth_state');
        localStorage.removeItem('fyrshare_user');
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
    if (isAuthenticated && currentUser) {
      if (isDemoMode) {
        initializeDemoData();
      } else {
        loadUserData();
      }
    }
  }, [isAuthenticated, currentUser?.id, isDemoMode]);

  // --- Database Loading Functions ---

  const initializeDemoData = () => {
    // In demo mode, create user-specific data based on current user
    if (!currentUser) return;
    
    // Each user gets their own isolated demo environment
    const userDemoData = createUserDemoData(currentUser);
    setUsers(userDemoData.users);
    setGroups(userDemoData.groups);
    setExpenses(userDemoData.expenses);
  };

  const createUserDemoData = (user) => {
    // Create friends based on user's ID to ensure consistency but isolation
    const friends = [
      user, // Current user
      { id: `${user.id}_friend_1`, name: 'Alice Johnson', email: 'alice@example.com', avatar: 'AJ' },
      { id: `${user.id}_friend_2`, name: 'Bob Smith', email: 'bob@example.com', avatar: 'BS' },
      { id: `${user.id}_friend_3`, name: 'Charlie Davis', email: 'charlie@example.com', avatar: 'CD' },
    ];

    const demoGroups = [
      { 
        id: `${user.id}_group_1`, 
        name: 'Weekend Trip', 
        members: [user.id, `${user.id}_friend_1`, `${user.id}_friend_2`], 
        type: 'Trip' 
      },
      { 
        id: `${user.id}_group_2`, 
        name: 'Shared Apartment', 
        members: [user.id, `${user.id}_friend_3`], 
        type: 'Home' 
      },
    ];

    const demoExpenses = [
      { 
        id: `${user.id}_expense_1`, 
        description: 'Hotel Booking', 
        amount: 300, 
        currency: 'USD',
        created_at: new Date(Date.now() - 86400000).toISOString(), 
        paid_by: user.id, 
        group_id: `${user.id}_group_1`, 
        split_between: [user.id, `${user.id}_friend_1`, `${user.id}_friend_2`], 
        category: 'Travel' 
      },
      { 
        id: `${user.id}_expense_2`, 
        description: 'Thai Dinner', 
        amount: 1200, 
        currency: 'THB',
        created_at: new Date(Date.now() - 172800000).toISOString(), 
        paid_by: `${user.id}_friend_1`, 
        group_id: `${user.id}_group_1`, 
        split_between: [user.id, `${user.id}_friend_1`, `${user.id}_friend_2`], 
        category: 'Food' 
      },
      { 
        id: `${user.id}_expense_3`, 
        description: 'Groceries', 
        amount: 65, 
        currency: 'EUR',
        created_at: new Date(Date.now() - 259200000).toISOString(), 
        paid_by: user.id, 
        group_id: `${user.id}_group_2`, 
        split_between: [user.id, `${user.id}_friend_3`], 
        category: 'Food' 
      },
      { 
        id: `${user.id}_expense_4`, 
        description: 'Utilities Bill', 
        amount: 8500, 
        currency: 'JPY',
        created_at: new Date().toISOString(), 
        paid_by: `${user.id}_friend_3`, 
        group_id: `${user.id}_group_2`, 
        split_between: [user.id, `${user.id}_friend_3`], 
        category: 'Utilities' 
      },
    ];

    return {
      users: friends,
      groups: demoGroups,
      expenses: demoExpenses
    };
  };

  const loadUserData = async () => {
    if (isDemoMode || !currentUser) return;
    
    setIsDataLoading(true);
    try {
      // Load user preferences
      const preferencesResult = await getUserPreferences(currentUser.id);
      if (preferencesResult.success) {
        setUserPreferences(preferencesResult.preferences);
      }

      // Load user's friends (not all users)
      const usersResult = await getUserFriends(currentUser.id);
      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      // Load user's groups (only groups they're members of)
      const groupsResult = await getUserGroups(currentUser.id);
      if (groupsResult.success) {
        setGroups(groupsResult.data);
      }

      // Load user's expenses (only expenses they're involved in)
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

  // Calculate debts for the current user (in their preferred currency)
  const [balances, setBalances] = useState({ totalOwed: 0, totalOwes: 0, details: {} });

  // Memoized filtered expenses to prevent unnecessary re-renders
  const filteredExpenses = useMemo(() => {
    return selectedGroup ? expenses.filter(e => e.group_id === selectedGroup.id) : expenses;
  }, [expenses, selectedGroup?.id]);

  // Calculate balances with currency conversion
  useEffect(() => {
    const calculateBalancesWithCurrency = async () => {
      if (!currentUser) {
        setBalances({ totalOwed: 0, totalOwes: 0, details: {} });
        return;
      }

      // If no expenses, balances are zero but this is normal
      if (expenses.length === 0) {
        console.log('No expenses found - balances will be zero');
        setBalances({ totalOwed: 0, totalOwes: 0, details: {} });
        return;
      }

      try {
        console.log(`Calculating balances for ${expenses.length} expenses`);
        const userCurrency = userPreferences.currency || 'USD';
        const convertedExpenses = [];

        // Convert all expenses to user's preferred currency
        for (const expense of expenses) {
          const expenseCurrency = expense.currency || 'USD';
          
          if (expenseCurrency === userCurrency) {
            convertedExpenses.push(expense);
          } else {
            const { success, amount: convertedAmount } = await convertCurrency(
              expense.amount, 
              expenseCurrency, 
              userCurrency
            );
            
            convertedExpenses.push({
              ...expense,
              amount: success ? convertedAmount : expense.amount,
              currency: userCurrency
            });
          }
        }

        // Calculate balances with converted amounts
        const newBalances = calculateBalances(convertedExpenses, currentUser.id, users);
        console.log('Calculated balances:', newBalances);
        setBalances(newBalances);
      } catch (error) {
        console.error('Error calculating balances with currency conversion:', error);
        // Fallback to original calculation
        setBalances(calculateBalances(expenses, currentUser.id, users));
      }
    };

    calculateBalancesWithCurrency();
  }, [expenses, currentUser?.id, users, userPreferences.currency]);

  // Format currency with conversion to user's preferred currency
  const formatMoney = async (amount, originalCurrency = 'USD') => {
    const userCurrency = userPreferences.currency || 'USD';
    
    if (originalCurrency === userCurrency) {
      return formatCurrency(amount, userCurrency);
    }
    
    try {
      const { success, amount: convertedAmount } = await convertCurrency(amount, originalCurrency, userCurrency);
      if (success) {
        return formatCurrency(convertedAmount, userCurrency);
      }
    } catch (error) {
      console.error('Currency conversion failed:', error);
    }
    
    // Fallback: show original currency
    return formatCurrency(amount, originalCurrency);
  };
  
  // Synchronous version for immediate display (uses cached rates or shows original)
  const formatMoneySync = (amount, originalCurrency = 'USD') => {
    const userCurrency = userPreferences.currency || 'USD';
    return formatCurrency(amount, originalCurrency);
  };

  // --- Handlers ---

  const handleAddExpense = async (expense) => {
    if (isDemoMode) {
      // Demo mode - just update local state
      const newExpense = {
        id: generateId(),
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency || 'USD',
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
        
        // Show warning if image upload failed
        if (result.warning) {
          showWarning(`Expense created successfully, but ${result.warning}`);
        } else {
          showSuccess('Expense added successfully');
        }
      } else {
        showError('Failed to add expense: ' + result.error);
        return;
      }
    }
  };

  const handleUpdateExpense = async (expenseId, updatedExpense) => {
    if (isDemoMode) {
      // Demo mode - update local state
      setExpenses(prevExpenses => 
        prevExpenses.map(expense => 
          expense.id === expenseId 
            ? {
                ...expense,
                description: updatedExpense.description,
                amount: updatedExpense.amount,
                currency: updatedExpense.currency || 'USD',
                created_at: updatedExpense.date,
                paid_by: updatedExpense.paid_by,
                group_id: updatedExpense.group_id,
                split_between: updatedExpense.split_with,
                category: updatedExpense.category || 'General'
              }
            : expense
        )
      );
      showSuccess('Expense updated successfully');
    } else {
      // Database mode
      const result = await updateExpense(expenseId, updatedExpense);
      if (result.success) {
        // Reload expenses to get updated data
        const expensesResult = await getUserExpenses(currentUser.id);
        if (expensesResult.success) {
          setExpenses(expensesResult.data);
        }
        showSuccess('Expense updated successfully');
      } else {
        showError('Failed to update expense: ' + result.error);
        return;
      }
    }
  };

  const handleEditExpense = (expense) => {
    setSelectedExpenseToEdit(expense);
    setIsEditExpenseModalOpen(true);
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
        showError('Failed to create group: ' + result.error);
        return;
      }
    }
  };

  const handleEditGroup = async (groupId, groupData) => {
    if (isDemoMode) {
      // Demo mode - update local state
      setGroups(groups.map(group => 
        group.id === groupId ? { ...group, ...groupData } : group
      ));
    } else {
      // Database mode
      const result = await updateGroup(groupId, groupData);
      if (result.success) {
        // Reload groups to get updated data
        const groupsResult = await getUserGroups(currentUser.id);
        if (groupsResult.success) {
          setGroups(groupsResult.data);
        }
      } else {
        showError('Failed to update group: ' + result.error);
        throw new Error(result.error);
      }
    }
  };

  const handleDeleteGroup = async (group) => {
    confirmDelete(group.name, async () => {
      await performDeleteGroup(group);
    });
  };

  const performDeleteGroup = async (group) => {

    if (isDemoMode) {
      // Demo mode - remove from local state
      setGroups(groups.filter(g => g.id !== group.id));
      // Also remove group-related expenses
      setExpenses(expenses.filter(e => e.group_id !== group.id));
    } else {
      // Database mode
      const result = await deleteGroup(group.id);
      if (result.success) {
        // Reload groups and expenses to get updated data
        const groupsResult = await getUserGroups(currentUser.id);
        if (groupsResult.success) {
          setGroups(groupsResult.data);
        }
        const expensesResult = await getUserExpenses(currentUser.id);
        if (expensesResult.success) {
          setExpenses(expensesResult.data);
        }
      } else {
        showError('Failed to delete group: ' + result.error);
      }
    }
  };

  const handleShowEditGroup = (group) => {
    setSelectedGroupToEdit(group);
    setIsEditGroupModalOpen(true);
  };

  const handleUpdatePreferences = async (preferences) => {
    if (isDemoMode) {
      // Demo mode - just update local state
      setUserPreferences(preferences);
    } else {
      // Database mode
      const result = await updateUserPreferences(currentUser.id, preferences);
      if (result.success) {
        setUserPreferences(preferences);
      } else {
        showError('Failed to update preferences: ' + result.error);
        throw new Error(result.error);
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
        // Reload user's friends to get updated data
        const usersResult = await getUserFriends(currentUser.id);
        if (usersResult.success) {
          setUsers(usersResult.data);
        }
      } else {
        showError('Failed to add friend: ' + result.error);
        throw new Error(result.error);
      }
    }
  };

  const handleEditUser = async (userId, userData) => {
    if (isDemoMode) {
      // Demo mode - update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));
    } else {
      // Database mode
      const result = await updateUser(userId, userData);
      if (result.success) {
        // Reload user's friends to get updated data
        const usersResult = await getUserFriends(currentUser.id);
        if (usersResult.success) {
          setUsers(usersResult.data);
        }
      } else {
        showError('Failed to update user: ' + result.error);
        throw new Error(result.error);
      }
    }
  };

  const handleDeleteUser = async (user) => {
    confirmDelete(user.name, async () => {
      await performDeleteUser(user);
    });
  };

  const performDeleteUser = async (user) => {

    if (isDemoMode) {
      // Demo mode - remove from local state
      setUsers(users.filter(u => u.id !== user.id));
      // Also remove from groups
      setGroups(groups.map(group => ({
        ...group,
        members: group.members.filter(memberId => memberId !== user.id)
      })));
    } else {
      // Database mode
      const result = await deleteUser(user.id);
      if (result.success) {
        // Reload user's friends and groups to get updated data
        const usersResult = await getUserFriends(currentUser.id);
        if (usersResult.success) {
          setUsers(usersResult.data);
        }
        const groupsResult = await getUserGroups(currentUser.id);
        if (groupsResult.success) {
          setGroups(groupsResult.data);
        }
      } else {
        showError('Failed to delete user: ' + result.error);
      }
    }
  };

  const handleShowEditUser = (user) => {
    setSelectedUserToEdit(user);
    setIsEditUserModalOpen(true);
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
      let autoJoinedGroups = 0;
      if (!isDemoMode) {
        const result = await createOrUpdateUser(googleUserData);
        if (!result.success) {
          console.error('Failed to create/update user:', result.error);
          // Continue anyway, might be network issue
        } else {
          autoJoinedGroups = result.autoJoinedGroups || 0;
        }
      }
      
      // Update states
      setGoogleUser(googleUserData);
      setCurrentUser(googleUserData);
      
      // Save authentication state to localStorage
      localStorage.setItem('fyrshare_auth_state', 'true');
      localStorage.setItem('fyrshare_user', JSON.stringify(googleUserData));
      
      // Simulate API call delay
      setTimeout(() => {
        setIsAuthenticated(true);
        setShowLanding(false);
        setIsGoogleLoading(false);
        
        // Show success message if user was auto-added to groups
        if (autoJoinedGroups > 0) {
          showAlert(`Welcome! You've been automatically added to ${autoJoinedGroups} group${autoJoinedGroups > 1 ? 's' : ''} you were invited to.`, 'success');
        }
        
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
      showError('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    console.log('handleGoogleLogin called');
    
    if (!window.google || !window.google.accounts) {
      showWarning('Google authentication is still loading. Please wait a moment and try again.');
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
              showError('Your browser doesn\'t support Google Sign-In. Please try a different browser.');
              break;
            case 'unregistered_origin':
              console.error('Domain not authorized for Google OAuth');
              showError('Authentication setup issue. Please ensure localhost:5173 is authorized.');
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
    localStorage.removeItem('fyrshare_auth_state');
    localStorage.removeItem('fyrshare_user');
    
    setIsAuthenticated(false);
    setShowLanding(true);
    setGoogleUser(null);
    setCurrentUser(null);
    // Clear all user data
    setUsers([]);
    setGroups([]);
    setExpenses([]);
    
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
    if (!currentUser?.id || !expenses || expenses.length === 0) return 0;
    
    // Filter expenses for this specific group
    const groupExpenses = expenses.filter(e => e.group_id === groupId);
    
    if (groupExpenses.length === 0) return 0;
    
    try {
      // Calculate what the current user paid and owes for this specific group
      let totalPaid = 0;
      let totalOwes = 0;
      
      groupExpenses.forEach(expense => {
        // Add to what current user paid
        if (expense.paid_by === currentUser.id) {
          totalPaid += expense.amount;
        }
        
        // Add to what current user owes
        if (expense.expense_splits) {
          const userSplit = expense.expense_splits.find(split => split.user_id === currentUser.id);
          if (userSplit) {
            totalOwes += expense.amount / expense.expense_splits.length;
          }
        } else if (expense.split_with && expense.split_with.includes(currentUser.id)) {
          // Fallback for old split_with format
          totalOwes += expense.amount / expense.split_with.length;
        }
      });
      
      // Return net balance (negative = you owe, positive = you are owed)
      const netBalance = totalPaid - totalOwes;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Group ${groupId} balance calculation:`, {
          expenses: groupExpenses.length,
          totalPaid,
          totalOwes,
          netBalance
        });
      }
      
      return netBalance;
    } catch (error) {
      console.error('Error calculating group balance:', error);
      return 0;
    }
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
                setIsSettingsModalOpen={setIsSettingsModalOpen}
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
                formatMoney={formatMoneySync}
                users={users}
                handleSettleUp={handleSettleUp}
                expenses={expenses}
                userCurrency={userPreferences.currency}
                currentUser={currentUser}
                isDataLoading={isDataLoading}
                onEditExpense={handleEditExpense}
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
                onEditGroup={handleShowEditGroup}
                onDeleteGroup={handleDeleteGroup}
                userCurrency={userPreferences.currency}
                isDataLoading={isDataLoading}
              />
            } 
          />
          <Route 
            path="groups/:groupId" 
            element={
              <GroupDetailView 
                groups={groups}
                users={users}
                expenses={expenses}
                currentUser={currentUser}
                formatMoney={formatMoney}
                setShowAddExpense={() => setIsExpenseModalOpen(true)}
                userCurrency={userPreferences.currency}
                onEditExpense={handleEditExpense}
                onUpdateGroup={handleEditGroup}
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
                onEditUser={handleShowEditUser}
                onDeleteUser={handleDeleteUser}
                userCurrency={userPreferences.currency}
                isDataLoading={isDataLoading}
              />
            } 
          />
          <Route 
            path="activity" 
            element={
              <ActivityView 
                expenses={filteredExpenses}
                users={users}
                currentUser={currentUser}
                formatMoney={formatMoneySync}
                userCurrency={userPreferences.currency}
                isLoading={isDataLoading}
                onEditExpense={handleEditExpense}
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
      <ExpenseModalWrapper
        isExpenseModalOpen={isExpenseModalOpen}
        setIsExpenseModalOpen={setIsExpenseModalOpen}
        users={users}
        currentUser={currentUser}
        groups={groups}
        handleAddExpense={handleAddExpense}
        selectedGroup={selectedGroup}
      />

      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setSelectedExpenseToEdit(null);
        }}
        expense={selectedExpenseToEdit}
        users={users}
        currentUser={currentUser}
        groups={groups}
        onUpdateExpense={handleUpdateExpense}
        selectedGroup={selectedGroup}
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

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setSelectedUserToEdit(null);
        }}
        user={selectedUserToEdit}
        onEditUser={handleEditUser}
      />

      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setSelectedGroupToEdit(null);
        }}
        group={selectedGroupToEdit}
        users={users}
        currentUser={currentUser}
        onEditGroup={handleEditGroup}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userPreferences={userPreferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={hideConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
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