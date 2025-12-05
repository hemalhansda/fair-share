import React, { useState, useEffect } from 'react';
import { X, DollarSign, Upload, Eye, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { CURRENCIES, getCurrencyOptions, getCurrencySymbol } from '../../services/currency';

const EditExpenseModal = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser, 
  groups,
  onUpdateExpense,
  expense,
  selectedGroup = null
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paidBy, setPaidBy] = useState('');
  const [splitWith, setSplitWith] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [splitMethod, setSplitMethod] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});
  const [customSplitType, setCustomSplitType] = useState('amount');
  const [category, setCategory] = useState('General');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseTime, setExpenseTime] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Initialize form with expense data when modal opens
  useEffect(() => {
    if (isOpen && expense) {
      setDescription(expense.description || '');
      setAmount(expense.amount?.toString() || '');
      setCurrency(expense.currency || 'USD');
      setPaidBy(expense.paid_by || '');
      setGroupId(expense.group_id || '');
      setCategory(expense.category || 'General');
      
      // Handle date/time
      if (expense.created_at) {
        const date = new Date(expense.created_at);
        setExpenseDate(date.toISOString().split('T')[0]);
        setExpenseTime(date.toTimeString().slice(0, 5));
      }
      
      // Handle splits
      if (expense.expense_splits && expense.expense_splits.length > 0) {
        setSplitWith(expense.expense_splits.map(split => split.user_id));
        
        // Check if it's custom splits
        const equalSplit = expense.amount / expense.expense_splits.length;
        const hasCustomSplits = expense.expense_splits.some(split => 
          Math.abs(split.amount - equalSplit) > 0.01
        );
        
        if (hasCustomSplits) {
          setSplitMethod('custom');
          setCustomSplitType('amount');
          const splits = {};
          expense.expense_splits.forEach(split => {
            splits[split.user_id] = split.amount;
          });
          setCustomSplits(splits);
        } else {
          setSplitMethod('equal');
          setCustomSplits({});
        }
      } else if (expense.split_with) {
        setSplitWith(expense.split_with);
        setSplitMethod('equal');
        setCustomSplits({});
      }
      
      // Handle existing image
      if (expense.receipt_image_url) {
        setExistingImageUrl(expense.receipt_image_url);
      }
      
      // Reset new image state
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
    }
  }, [isOpen, expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || splitWith.length === 0 || !isCustomSplitValid()) return;

    // Calculate actual split amounts for each user
    let finalSplits = {};
    
    if (splitMethod === 'custom') {
      if (customSplitType === 'percentage') {
        // Convert percentages to actual amounts
        const expenseAmount = parseFloat(amount);
        splitWith.forEach(userId => {
          const percentage = customSplits[userId] || 0;
          finalSplits[userId] = (expenseAmount * percentage) / 100;
        });
      } else {
        // Use amounts directly
        finalSplits = { ...customSplits };
      }
    } else {
      // Equal split
      const expenseAmount = parseFloat(amount);
      const splitAmount = expenseAmount / splitWith.length;
      splitWith.forEach(userId => {
        finalSplits[userId] = splitAmount;
      });
    }

    // Create datetime from date and time inputs
    const expenseDateTime = new Date(`${expenseDate}T${expenseTime}`);
    
    const updatedExpense = {
      description: description.trim(),
      amount: parseFloat(amount),
      currency: currency,
      paid_by: paidBy,
      group_id: groupId || null,
      split_with: splitWith,
      split_method: splitMethod,
      custom_splits: splitMethod === 'custom' ? finalSplits : null,
      custom_split_type: splitMethod === 'custom' ? customSplitType : null,
      category: category,
      date: expenseDateTime.toISOString(),
      imageFile: imageFile,
      existingImagePath: expense?.receipt_image_path,
      removeImage: removeExistingImage
    };

    onUpdateExpense(expense.id, updatedExpense);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setPaidBy('');
    setSplitWith([]);
    setGroupId('');
    setSplitMethod('equal');
    setCustomSplits({});
    setCustomSplitType('amount');
    setCategory('General');
    setExpenseDate('');
    setExpenseTime('');
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setRemoveExistingImage(false);
    onClose();
  };

  const toggleSplitWith = (userId) => {
    setSplitWith(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: parseFloat(value) || 0
    }));
  };

  // Image handling functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleRemoveExistingImage = () => {
    setRemoveExistingImage(true);
    setExistingImageUrl(null);
  };

  // Calculate total of custom splits
  const getTotalCustomSplits = () => {
    return Object.values(customSplits).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Check if custom splits are valid
  const isCustomSplitValid = () => {
    if (splitMethod !== 'custom') return true;
    
    const total = getTotalCustomSplits();
    const expenseAmount = parseFloat(amount) || 0;
    
    if (customSplitType === 'percentage') {
      return Math.abs(total - 100) < 0.01;
    } else {
      return Math.abs(total - expenseAmount) < 0.01;
    }
  };

  // Get the difference for validation display
  const getCustomSplitDifference = () => {
    if (splitMethod !== 'custom') return 0;
    
    const total = getTotalCustomSplits();
    const expenseAmount = parseFloat(amount) || 0;
    
    if (customSplitType === 'percentage') {
      return 100 - total;
    } else {
      return expenseAmount - total;
    }
  };

  const availableUsers = groupId 
    ? users.filter(user => {
        const group = groups.find(g => g.id === groupId);
        return group?.members?.includes(user.id);
      })
    : users;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Expense">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What was this expense for?"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getCurrencyOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.value} - {option.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="General">General</option>
            <option value="Food">Food & Dining</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills & Utilities</option>
            <option value="Travel">Travel</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Groceries">Groceries</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Date and Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={expenseTime}
              onChange={(e) => setExpenseTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Receipt Image Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipt Image
          </label>
          {!window.location.hostname.includes('localhost') && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              ⚠️ Image upload may fail if Supabase storage isn't configured with proper permissions
            </div>
          )}
          
          {/* Existing Image Display */}
          {existingImageUrl && !removeExistingImage && (
            <div className="mb-4">
              <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={existingImageUrl}
                  alt="Current receipt"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(existingImageUrl, '_blank')}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
                    title="View full size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveExistingImage}
                    className="p-2 bg-red-500 bg-opacity-80 text-white rounded-lg hover:bg-opacity-100 transition-all"
                    title="Remove current image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 bg-gray-50 border-t">
                  <p className="text-sm text-gray-600">Current receipt image</p>
                </div>
              </div>
            </div>
          )}
          
          {/* New Image Upload/Preview */}
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="receipt-upload-edit"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="receipt-upload-edit"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {existingImageUrl && !removeExistingImage 
                    ? 'Click to replace receipt image' 
                    : 'Click to upload receipt image'
                  }
                </span>
                <span className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 5MB
                </span>
              </label>
            </div>
          ) : (
            <div className="relative border border-gray-300 rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="New receipt preview"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(imagePreview, '_blank')}
                  className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
                  title="View full size"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={removeNewImage}
                  className="p-2 bg-red-500 bg-opacity-80 text-white rounded-lg hover:bg-opacity-100 transition-all"
                  title="Remove new image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 bg-gray-50 border-t">
                <p className="text-sm text-gray-600 truncate">
                  {imageFile?.name} (new)
                </p>
                <p className="text-xs text-gray-400">
                  {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paid by
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group {selectedGroup ? '' : '(optional)'}
          </label>
          {selectedGroup ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 flex items-center gap-2">
              <span className="text-sm font-medium">{selectedGroup.name}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {selectedGroup.type}
              </span>
            </div>
          ) : (
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No group</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split with
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableUsers.map(user => (
              <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitWith.includes(user.id)}
                  onChange={() => toggleSplitWith(user.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Avatar user={user} size="sm" />
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        {splitWith.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split method
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="equal"
                  checked={splitMethod === 'equal'}
                  onChange={(e) => setSplitMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Equal split</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="custom"
                  checked={splitMethod === 'custom'}
                  onChange={(e) => setSplitMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Custom amounts</span>
              </label>
            </div>

            {splitMethod === 'custom' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {/* Split Type Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split by
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="amount"
                        checked={customSplitType === 'amount'}
                        onChange={(e) => {
                          setCustomSplitType(e.target.value);
                          setCustomSplits({});
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Amount ({getCurrencySymbol(currency)})</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="percentage"
                        checked={customSplitType === 'percentage'}
                        onChange={(e) => {
                          setCustomSplitType(e.target.value);
                          setCustomSplits({});
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Percentage (%)</span>
                    </label>
                  </div>
                </div>

                {/* Members Split Input */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Enter {customSplitType === 'amount' ? 'amounts' : 'percentages'} for each member:
                  </div>
                  
                  {splitWith.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <div key={userId} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <Avatar user={user} size="sm" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800">{user?.name}</span>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            {customSplitType === 'amount' ? getCurrencySymbol(currency) : '%'}
                          </span>
                          <input
                            type="number"
                            value={customSplits[userId] || ''}
                            onChange={(e) => handleCustomSplitChange(userId, e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={customSplitType === 'amount' ? '0.00' : '0'}
                            step={customSplitType === 'amount' ? '0.01' : '1'}
                            min="0"
                            max={customSplitType === 'percentage' ? '100' : undefined}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Validation Summary */}
                <div className="mt-4 p-3 rounded-lg border-l-4 border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Total {customSplitType === 'amount' ? 'amount' : 'percentage'}:
                    </span>
                    <span className={`font-medium ${isCustomSplitValid() ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {customSplitType === 'amount' 
                        ? `${getCurrencySymbol(currency)}${getTotalCustomSplits().toFixed(2)}`
                        : `${getTotalCustomSplits().toFixed(1)}%`
                      }
                    </span>
                  </div>
                  
                  {!isCustomSplitValid() && (
                    <div className="mt-2 text-sm">
                      <span className="text-orange-600">
                        {customSplitType === 'amount' ? (
                          getCustomSplitDifference() > 0 
                            ? `Missing ${getCurrencySymbol(currency)}${Math.abs(getCustomSplitDifference()).toFixed(2)}`
                            : `Excess of ${getCurrencySymbol(currency)}${Math.abs(getCustomSplitDifference()).toFixed(2)}`
                        ) : (
                          getCustomSplitDifference() > 0 
                            ? `Missing ${Math.abs(getCustomSplitDifference()).toFixed(1)}%`
                            : `Excess of ${Math.abs(getCustomSplitDifference()).toFixed(1)}%`
                        )}
                      </span>
                    </div>
                  )}
                  
                  {isCustomSplitValid() && (
                    <div className="mt-2 text-sm text-emerald-600">
                      ✓ Split is balanced
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!description.trim() || !amount || splitWith.length === 0 || !isCustomSplitValid()}
            className="flex-1"
          >
            Update Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditExpenseModal;