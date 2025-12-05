import { supabase } from '../lib/supabaseClient.js'

// ===== USER OPERATIONS =====

export async function createOrUpdateUser(googleUser) {
  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleUser.id)
      .maybeSingle()

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar,
          picture: googleUser.picture
        })
        .eq('google_id', googleUser.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } else {
      // Create new user (let Supabase generate UUID for id)
      const { data, error } = await supabase
        .from('users')
        .insert([{
          google_id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar,
          picture: googleUser.picture
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    }

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return { success: false, error: error.message }
  }
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get only the current user's friends (people they've added or been added by)
export async function getUserFriends(userId) {
  try {
    // First get the user's UUID from their google_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', userId)
      .single()

    if (!user) {
      return { success: true, data: [] }
    }

    let allFriends = []
    const friendsSet = new Set()

    // Step 1: Get all users that were added as friends (users without google_id)
    // These are users created when adding friends manually
    const { data: addedFriends, error: friendsError } = await supabase
      .from('users')
      .select('*')
      .is('google_id', null) // Users added as friends have null google_id

    if (friendsError) throw friendsError

    // Add all manually added friends
    addedFriends?.forEach(friend => {
      if (!friendsSet.has(friend.id)) {
        allFriends.push(friend)
        friendsSet.add(friend.id)
      }
    })

    // Step 1.5: Always include the current user in the users array (but not in friends list for UI)
    // This ensures the current user data is available for group displays, etc.
    const { data: currentUserData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // Store current user data separately - we'll add it to the final array but mark it
    let currentUserForGroups = null
    if (currentUserData) {
      currentUserForGroups = currentUserData
    }

    // Step 2: Get all groups the user is a member of
    const { data: userGroups, error: groupsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (groupsError) throw groupsError

    const userGroupIds = userGroups?.map(g => g.group_id) || []

    // Step 3: Get all users in those groups (if user has any groups)
    if (userGroupIds.length > 0) {
      // Get all members from user's groups
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users (
            id,
            name,
            email,
            avatar,
            picture,
            google_id
          )
        `)
        .in('group_id', userGroupIds)

      if (membersError) throw membersError

      // Add unique group members (exclude current user from friends list but keep their data available)
      groupMembers?.forEach(member => {
        if (member.users && !friendsSet.has(member.users.id)) {
          if (member.users.id !== user.id) {
            // Add other users to friends list
            allFriends.push(member.users)
            friendsSet.add(member.users.id)
          } else {
            // Update current user data if found in groups
            currentUserForGroups = member.users
          }
        }
      })
    }

    // Create final result: friends + current user data for lookups
    // The UI will filter out current user from friends display, but group lookups will work
    const result = [...allFriends]
    
    // Add current user data to the result array for group member lookups
    // This ensures current user can be found when displaying group members
    if (currentUserForGroups && !friendsSet.has(currentUserForGroups.id)) {
      result.push(currentUserForGroups)
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching user friends:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function addFriend(friendData, currentUserId) {
  try {
    // First, try to find if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', friendData.email)
      .maybeSingle()

    let friendUser;
    if (existingUser) {
      // User already exists
      friendUser = existingUser
    } else {
      // Create new user (Let Supabase generate a UUID automatically)
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: friendData.name,
          email: friendData.email,
          avatar: friendData.avatar,
          google_id: null // This indicates it's a friend, not a Google OAuth user
        }])
        .select()
        .single()

      if (error) throw error
      friendUser = data
    }

    // TODO: Create friendship relationship when friendships table is available
    // For now, friends are managed through shared groups and expenses
    console.log('Friend added successfully:', friendUser)

    return { success: true, data: friendUser }
  } catch (error) {
    console.error('Error adding friend:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details
    })
    return { success: false, error: error.message }
  }
}

export async function updateUser(userId, userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId) {
  try {
    // Check if user has any expenses or group memberships
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .or(`paid_by.eq.${userId}`)

    const { data: splits } = await supabase
      .from('expense_splits')
      .select('id')
      .eq('user_id', userId)

    const { data: groupMemberships } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', userId)

    if ((expenses && expenses.length > 0) || (splits && splits.length > 0) || (groupMemberships && groupMemberships.length > 0)) {
      return { success: false, error: 'Cannot delete user with existing expenses or group memberships' }
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }
}

// ===== GROUP OPERATIONS =====

export async function createGroup(groupData, currentUserId) {
  try {
    // First get the user's UUID from their google_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', currentUserId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: groupData.name,
        type: groupData.type,
        created_by: user.id
      }])
      .select()
      .single()

    if (groupError) throw groupError

    // Convert member IDs to UUIDs and add members to the group
    const memberUuids = []
    const processedMembers = new Set() // Track processed members to avoid duplicates
    
    // Always include the current user first
    memberUuids.push(user.id)
    processedMembers.add(user.id)
    
    // Process other members
    for (const memberId of groupData.members) {
      if (memberId === currentUserId || processedMembers.has(memberId)) {
        continue // Skip current user (already added) and duplicates
      }
      
      let finalUuid = null
      
      // Try to find the user by UUID first, then by google_id
      let { data: memberUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', memberId)
        .maybeSingle()
      
      if (!memberUser) {
        // Try by google_id if UUID lookup failed
        const { data: memberByGoogleId } = await supabase
          .from('users')
          .select('id')
          .eq('google_id', memberId)
          .maybeSingle()
        
        if (memberByGoogleId) {
          memberUser = memberByGoogleId
        }
      }
      
      if (memberUser) {
        finalUuid = memberUser.id
      } else {
        console.warn(`Could not find user with ID: ${memberId}`)
      }
      
      // Only add if we haven't processed this UUID yet
      if (finalUuid && !processedMembers.has(finalUuid)) {
        memberUuids.push(finalUuid)
        processedMembers.add(finalUuid)
      }
    }
    
    console.log('Group members to add:', memberUuids.length)

    const memberInserts = memberUuids.map(memberId => ({
      group_id: group.id,
      user_id: memberId
    }))

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(memberInserts)

    if (membersError) throw membersError

    return { success: true, data: group }
  } catch (error) {
    console.error('Error creating group:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details
    })
    return { success: false, error: error.message }
  }
}

export async function getUserGroups(userId) {
  try {
    // First get the user's UUID from their google_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', userId)
      .single()

    if (!user) {
      return { success: true, data: [] }
    }

    // Only get groups where the user is actually a member
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        type,
        created_by,
        group_members!inner (
          user_id
        )
      `)
      .eq('group_members.user_id', user.id)

    if (error) throw error

    // For each group, get all members (but only for groups the user belongs to)
    const groupsWithMembers = await Promise.all(
      (data || []).map(async (group) => {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id)

        return {
          id: group.id,
          name: group.name,
          type: group.type,
          members: members?.map(m => m.user_id) || []
        }
      })
    )

    return { success: true, data: groupsWithMembers }
  } catch (error) {
    console.error('Error fetching groups:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function updateGroup(groupId, groupData) {
  try {
    // Update group basic info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .update({
        name: groupData.name,
        type: groupData.type
      })
      .eq('id', groupId)
      .select()
      .single()

    if (groupError) throw groupError

    // Update group members if provided
    if (groupData.members) {
      // Remove existing members
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)

      // Add new members
      const memberInserts = groupData.members.map(memberId => ({
        group_id: groupId,
        user_id: memberId
      }))

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts)

      if (membersError) throw membersError
    }

    return { success: true, data: group }
  } catch (error) {
    console.error('Error updating group:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteGroup(groupId) {
  try {
    // Check if group has any expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('group_id', groupId)

    if (expenses && expenses.length > 0) {
      return { success: false, error: 'Cannot delete group with existing expenses' }
    }

    // Delete group members first (foreign key constraint)
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)

    // Delete the group
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting group:', error)
    return { success: false, error: error.message }
  }
}

// ===== EXPENSE OPERATIONS =====

export async function createExpense(expenseData) {
  try {
    // Handle both old and new data formats
    const paidById = expenseData.paid_by || expenseData.paidBy;
    const splitWith = expenseData.split_with || expenseData.splitBetween || [];
    const groupId = expenseData.group_id || expenseData.groupId;
    
    // Convert payer ID to UUID if needed
    let payerUuid = paidById
    
    // Check if this looks like a Google ID (not a UUID)
    const isGoogleId = typeof paidById === 'string' && 
                      !paidById.includes('-') && 
                      paidById.length > 15; // Google IDs are typically 21 chars long
    
    if (isGoogleId) {
      // This looks like a Google ID, convert to UUID
      const { data: payerUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', paidById)
        .single()
      
      if (userError || !payerUser) {
        console.error('User lookup error:', userError);
        throw new Error(`Payer not found for Google ID: ${paidById}`)
      }
      payerUuid = payerUser.id
      console.log(`Converted Google ID ${paidById} to UUID ${payerUuid}`);
    }

    // Create the expense (without currency column for now)
    const insertData = {
      description: expenseData.description,
      amount: expenseData.amount,
      // currency: expenseData.currency || 'USD', // TODO: Add currency column to database
      paid_by: payerUuid,
      group_id: groupId,
      category: expenseData.category || 'General'
    };

    // Add date if provided, otherwise let database use default timestamp
    if (expenseData.date) {
      insertData.created_at = expenseData.date;
    }

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([insertData])
      .select()
      .single()

    if (expenseError) throw expenseError

    // Handle custom splits or equal splits
    const splitInserts = []
    
    if (expenseData.split_method === 'custom' && expenseData.custom_splits) {
      // Use custom split amounts
      for (const [userId, amount] of Object.entries(expenseData.custom_splits)) {
        let userUuid = userId
        
        // Check if this looks like a Google ID (not a UUID)
        const isGoogleId = typeof userId === 'string' && 
                          !userId.includes('-') && 
                          userId.length > 15;
        
        if (isGoogleId) {
          // Convert Google ID to UUID
          const { data: splitUser, error: splitUserError } = await supabase
            .from('users')
            .select('id')
            .eq('google_id', userId)
            .single()
          
          if (splitUserError || !splitUser) {
            console.error('Split user lookup error:', splitUserError);
            throw new Error(`Split user not found for Google ID: ${userId}`);
          }
          userUuid = splitUser.id
        }
        
        splitInserts.push({
          expense_id: expense.id,
          user_id: userUuid,
          amount: parseFloat(amount)
        })
      }
    } else {
      // Equal split among all members
      const splitAmount = expenseData.amount / splitWith.length
      
      for (const userId of splitWith) {
        let userUuid = userId
        
        // Check if this looks like a Google ID (not a UUID)
        const isGoogleId = typeof userId === 'string' && 
                          !userId.includes('-') && 
                          userId.length > 15;
        
        if (isGoogleId) {
          // This looks like a Google ID, convert to UUID
          const { data: splitUser, error: splitUserError } = await supabase
            .from('users')
            .select('id')
            .eq('google_id', userId)
            .single()
          
          if (splitUserError || !splitUser) {
            console.error('Split user lookup error:', splitUserError);
            throw new Error(`Split user not found for Google ID: ${userId}`);
          }
          userUuid = splitUser.id
        }
        
        splitInserts.push({
          expense_id: expense.id,
          user_id: userUuid,
          amount: splitAmount
        })
      }
    }

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitInserts)

    if (splitsError) throw splitsError

    return { success: true, data: expense }
  } catch (error) {
    console.error('Error creating expense:', error)
    return { success: false, error: error.message }
  }
}

export async function updateExpense(expenseId, expenseData) {
  try {
    // Handle both old and new data formats
    const paidById = expenseData.paid_by || expenseData.paidBy;
    const splitWith = expenseData.split_with || expenseData.splitBetween || [];
    const groupId = expenseData.group_id || expenseData.groupId;
    
    // Convert payer ID to UUID if needed
    let payerUuid = paidById
    
    // Check if this looks like a Google ID (not a UUID)
    const isGoogleId = typeof paidById === 'string' && 
                      !paidById.includes('-') && 
                      paidById.length > 15; // Google IDs are typically 21 chars long
    
    if (isGoogleId) {
      // This looks like a Google ID, convert to UUID
      const { data: payerUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', paidById)
        .single()
      
      if (userError || !payerUser) {
        console.error('User lookup error:', userError);
        throw new Error(`Payer not found for Google ID: ${paidById}`)
      }
      payerUuid = payerUser.id
      console.log(`Converted Google ID ${paidById} to UUID ${payerUuid}`);
    }

    // Update the expense
    const updateData = {
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by: payerUuid,
      group_id: groupId,
      category: expenseData.category || 'General'
    };

    // Add date if provided
    if (expenseData.date) {
      updateData.created_at = expenseData.date;
    }

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select()
      .single()

    if (expenseError) throw expenseError

    // Delete existing splits
    const { error: deleteSplitsError } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId)

    if (deleteSplitsError) throw deleteSplitsError

    // Handle custom splits or equal splits
    const splitInserts = []
    
    if (expenseData.split_method === 'custom' && expenseData.custom_splits) {
      // Custom splits
      for (const [userId, amount] of Object.entries(expenseData.custom_splits)) {
        let userUuid = userId
        
        // Check if this looks like a Google ID (not a UUID)
        const isGoogleId = typeof userId === 'string' && 
                          !userId.includes('-') && 
                          userId.length > 15;
        
        if (isGoogleId) {
          // This looks like a Google ID, convert to UUID
          const { data: splitUser, error: splitUserError } = await supabase
            .from('users')
            .select('id')
            .eq('google_id', userId)
            .single()
          
          if (splitUserError || !splitUser) {
            console.error('Split user lookup error:', splitUserError);
            throw new Error(`Split user not found for Google ID: ${userId}`);
          }
          userUuid = splitUser.id
        }
        
        splitInserts.push({
          expense_id: expense.id,
          user_id: userUuid,
          amount: parseFloat(amount)
        })
      }
    } else {
      // Equal split among all members
      const splitAmount = expenseData.amount / splitWith.length
      
      for (const userId of splitWith) {
        let userUuid = userId
        
        // Check if this looks like a Google ID (not a UUID)
        const isGoogleId = typeof userId === 'string' && 
                          !userId.includes('-') && 
                          userId.length > 15;
        
        if (isGoogleId) {
          // This looks like a Google ID, convert to UUID
          const { data: splitUser, error: splitUserError } = await supabase
            .from('users')
            .select('id')
            .eq('google_id', userId)
            .single()
          
          if (splitUserError || !splitUser) {
            console.error('Split user lookup error:', splitUserError);
            throw new Error(`Split user not found for Google ID: ${userId}`);
          }
          userUuid = splitUser.id
        }
        
        splitInserts.push({
          expense_id: expense.id,
          user_id: userUuid,
          amount: splitAmount
        })
      }
    }

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitInserts)

    if (splitsError) throw splitsError

    return { success: true, data: expense }
  } catch (error) {
    console.error('Error updating expense:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserExpenses(userId) {
  try {
    // First get the user's UUID from their google_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', userId)
      .single()

    if (!user) {
      return { success: true, data: [] }
    }

    // Get all groups the user is a member of
    const { data: userGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    const userGroupIds = userGroups?.map(g => g.group_id) || []

    // Get expenses where user is the payer
    const { data: paidExpenses, error: paidError } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:users!paid_by (
          id,
          name,
          email,
          avatar,
          picture
        ),
        expense_splits (
          user_id,
          amount,
          users (
            id,
            name,
            email,
            avatar,
            picture
          )
        ),
        groups (
          id,
          name,
          type
        )
      `)
      .eq('paid_by', user.id)
      .order('created_at', { ascending: false })

    if (paidError) throw paidError

    // Get expenses where user is in the splits
    const { data: splitExpenses, error: splitError } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:users!paid_by (
          id,
          name,
          email,
          avatar,
          picture
        ),
        expense_splits!inner (
          user_id,
          amount,
          users (
            id,
            name,
            email,
            avatar,
            picture
          )
        ),
        groups (
          id,
          name,
          type
        )
      `)
      .eq('expense_splits.user_id', user.id)
      .order('created_at', { ascending: false })

    if (splitError) throw splitError

    // Combine and deduplicate expenses
    const allExpenses = [...(paidExpenses || []), ...(splitExpenses || [])]
    const uniqueExpenses = allExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.id === expense.id)
    )

    // Filter to only include expenses from user's groups or personal expenses
    const filteredExpenses = uniqueExpenses.filter(expense => {
      // Include if no group (personal expense) or if user is in the group
      return !expense.group_id || userGroupIds.includes(expense.group_id)
    })

    // Transform the data to match your app's format
    const transformedExpenses = filteredExpenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: parseFloat(expense.amount),
      currency: expense.currency || 'USD',
      created_at: expense.created_at,
      paid_by: expense.paid_by,
      group_id: expense.group_id,
      paid_by_user: expense.paid_by_user,
      expense_splits: expense.expense_splits,
      groups: expense.groups,
      category: expense.category
    }))

    // Sort by created_at
    transformedExpenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return { success: true, data: transformedExpenses }
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function getGroupExpenses(groupId) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:users!paid_by (
          id,
          name,
          email,
          avatar,
          picture
        ),
        expense_splits (
          user_id,
          amount,
          users (
            id,
            name,
            email,
            avatar,
            picture
          )
        )
      `)
      .eq('group_id', groupId)
      .order('date', { ascending: false })

    if (error) throw error

    const transformedExpenses = data?.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: parseFloat(expense.amount),
      currency: expense.currency || 'USD',
      date: expense.date,
      paidBy: expense.paid_by,
      groupId: expense.group_id,
      splitBetween: expense.expense_splits?.map(split => split.user_id) || [],
      category: expense.category
    })) || []

    return { success: true, data: transformedExpenses }
  } catch (error) {
    console.error('Error fetching group expenses:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ===== BALANCE CALCULATIONS =====

export function calculateBalances(expenses, currentUserId, users) {
  let owedToUser = 0
  let userOwes = 0
  const debts = {} // userId -> amount (positive = they owe you, negative = you owe them)

  expenses.forEach(expense => {
    // Handle both old and new data formats
    const paidById = expense.paid_by || expense.paidBy;
    
    // Handle new database structure with expense_splits
    let splitBetween = [];
    if (expense.expense_splits && Array.isArray(expense.expense_splits)) {
      splitBetween = expense.expense_splits.map(split => split.user_id);
    } else {
      // Fallback to old format
      splitBetween = expense.split_between || expense.splitBetween || [];
    }
    
    if (splitBetween.length === 0) return; // Skip if no splits
    
    const splitAmount = expense.amount / splitBetween.length;

    if (paidById === currentUserId) {
      // You paid, others owe you
      splitBetween.forEach(memberId => {
        if (memberId !== currentUserId) {
          debts[memberId] = (debts[memberId] || 0) + splitAmount
        }
      })
    } else if (splitBetween.includes(currentUserId)) {
      // Someone else paid, you owe them
      debts[paidById] = (debts[paidById] || 0) - splitAmount
    }
  })

  // Aggregate totals
  Object.values(debts || {}).forEach(amount => {
    if (amount > 0) owedToUser += amount
    if (amount < 0) userOwes += Math.abs(amount)
  })

  return { totalOwed: owedToUser, totalOwes: userOwes, details: debts }
}

// ===== DEMO MODE FALLBACKS =====

export const DEMO_USERS = [
  { id: 'u1', name: 'You', email: 'you@example.com', avatar: 'Me' },
  { id: 'u2', name: 'Alice', email: 'alice@example.com', avatar: 'AL' },
  { id: 'u3', name: 'Bob', email: 'bob@example.com', avatar: 'BO' },
  { id: 'u4', name: 'Charlie', email: 'charlie@example.com', avatar: 'CH' },
]

export const DEMO_GROUPS = [
  { id: 'g1', name: 'Vegas Trip', members: ['u1', 'u2', 'u3'], type: 'Trip' },
  { id: 'g2', name: 'Apartment 4B', members: ['u1', 'u4'], type: 'Home' },
]

export const DEMO_EXPENSES = [
  { id: 'e1', description: 'Hotel Booking', amount: 300, currency: 'USD', created_at: new Date(Date.now() - 86400000).toISOString(), paid_by: 'u1', group_id: 'g1', split_between: ['u1', 'u2', 'u3'], category: 'Travel' },
  { id: 'e2', description: 'Dinner at Restaurant', amount: 200, currency: 'USD', created_at: new Date(Date.now() - 172800000).toISOString(), paid_by: 'u2', group_id: 'g1', split_between: ['u1', 'u2', 'u3'], category: 'Food' },
  { id: 'e3', description: 'Groceries', amount: 45, currency: 'USD', created_at: new Date(Date.now() - 259200000).toISOString(), paid_by: 'u1', group_id: 'g2', split_between: ['u1', 'u4'], category: 'Food' },
  { id: 'e4', description: 'Dinner', amount: 90, currency: 'USD', created_at: new Date().toISOString(), paid_by: 'u2', group_id: 'g1', split_between: ['u1', 'u2', 'u3'], category: 'Food' },
  { id: 'e5', description: 'Internet Bill', amount: 60, currency: 'USD', created_at: new Date().toISOString(), paid_by: 'u4', group_id: 'g2', split_between: ['u1', 'u4'], category: 'Utilities' },
]

// ===== USER PREFERENCES =====

export async function updateUserPreferences(userId, preferences) {
  try {
    // For now, use localStorage until database schema is updated
    // This provides immediate functionality while waiting for DB migration
    if (typeof window !== 'undefined') {
      const userPrefsKey = `fairshare_preferences_${userId}`
      localStorage.setItem(userPrefsKey, JSON.stringify(preferences))
      return { success: true, data: preferences }
    }

    // TODO: Uncomment this when preferred_currency column is added to users table
    /*
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', userId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        preferred_currency: preferences.currency
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
    */

    return { success: true, data: preferences }
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserPreferences(userId) {
  try {
    // For now, use localStorage until database schema is updated
    if (typeof window !== 'undefined') {
      const userPrefsKey = `fairshare_preferences_${userId}`
      const savedPrefs = localStorage.getItem(userPrefsKey)
      
      if (savedPrefs) {
        const preferences = JSON.parse(savedPrefs)
        return { success: true, preferences }
      }
    }

    // TODO: Uncomment this when preferred_currency column is added to users table
    /*
    const { data: user } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('google_id', userId)
      .single()

    return { 
      success: true, 
      preferences: {
        currency: user?.preferred_currency || 'USD'
      }
    }
    */

    // Default preferences
    return { 
      success: true, 
      preferences: { currency: 'USD' }
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return { 
      success: false, 
      error: error.message,
      preferences: { currency: 'USD' }
    }
  }
}

// Check if Supabase is properly configured
export function isSupabaseConfigured() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}