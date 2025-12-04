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

export async function addFriend(friendData, currentUserId) {
  try {
    // First, try to find if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', friendData.email)
      .maybeSingle()

    if (existingUser) {
      // User already exists, just return it
      return { success: true, data: existingUser }
    }

    // Let Supabase generate a UUID automatically (don't specify id)
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
    return { success: true, data }
  } catch (error) {
    console.error('Error adding friend:', error)
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
    
    for (const memberId of groupData.members) {
      let finalUuid = null
      
      if (memberId === currentUserId) {
        // Current user - use the UUID we already have
        finalUuid = user.id
      } else {
        // Other members - look up their UUIDs
        const { data: memberUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', memberId)  // Assuming other members are already UUIDs from friends
          .single()
        
        if (memberUser) {
          finalUuid = memberUser.id
        }
      }
      
      // Only add if we haven't processed this UUID yet
      if (finalUuid && !processedMembers.has(finalUuid)) {
        memberUuids.push(finalUuid)
        processedMembers.add(finalUuid)
      }
    }

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

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (
          user_id,
          users (
            id,
            name,
            email,
            avatar,
            picture
          )
        )
      `)
      .eq('group_members.user_id', user.id)

    if (error) throw error

    // Transform the data to match your app's format
    const transformedGroups = data?.map(group => ({
      id: group.id,
      name: group.name,
      type: group.type,
      members: group.group_members?.map(member => member.user_id) || []
    })) || []

    return { success: true, data: transformedGroups }
  } catch (error) {
    console.error('Error fetching groups:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ===== EXPENSE OPERATIONS =====

export async function createExpense(expenseData) {
  try {
    // Convert payer ID to UUID if needed
    let payerUuid = expenseData.paidBy
    if (typeof expenseData.paidBy === 'string' && expenseData.paidBy.length > 36) {
      // This looks like a Google ID, convert to UUID
      const { data: payerUser } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', expenseData.paidBy)
        .single()
      
      if (!payerUser) {
        throw new Error('Payer not found')
      }
      payerUuid = payerUser.id
    }

    // Create the expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([{
        description: expenseData.description,
        amount: expenseData.amount,
        paid_by: payerUuid,
        group_id: expenseData.groupId,
        category: expenseData.category
      }])
      .select()
      .single()

    if (expenseError) throw expenseError

    // Convert split user IDs to UUIDs and create expense splits
    const splitAmount = expenseData.amount / expenseData.splitBetween.length
    const splitInserts = []
    
    for (const userId of expenseData.splitBetween) {
      let userUuid = userId
      if (typeof userId === 'string' && userId.length > 36) {
        // This looks like a Google ID, convert to UUID
        const { data: splitUser } = await supabase
          .from('users')
          .select('id')
          .eq('google_id', userId)
          .single()
        
        if (splitUser) {
          userUuid = splitUser.id
        }
      }
      
      splitInserts.push({
        expense_id: expense.id,
        user_id: userUuid,
        amount: splitAmount
      })
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
      .order('date', { ascending: false })

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
      .order('date', { ascending: false })

    if (splitError) throw splitError

    // Combine and deduplicate the results
    const allExpenses = [...(paidExpenses || []), ...(splitExpenses || [])]
    const uniqueExpenses = allExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.id === expense.id)
    )

    // Sort by date
    const data = uniqueExpenses.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Transform the data to match your app's format
    const transformedExpenses = data?.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: parseFloat(expense.amount),
      date: expense.date,
      paidBy: expense.paid_by,
      groupId: expense.group_id,
      splitBetween: expense.expense_splits?.map(split => split.user_id) || [],
      category: expense.category
    })) || []

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
    const splitAmount = expense.amount / expense.splitBetween.length

    if (expense.paidBy === currentUserId) {
      // You paid, others owe you
      expense.splitBetween.forEach(memberId => {
        if (memberId !== currentUserId) {
          debts[memberId] = (debts[memberId] || 0) + splitAmount
        }
      })
    } else if (expense.splitBetween.includes(currentUserId)) {
      // Someone else paid, you owe them
      debts[expense.paidBy] = (debts[expense.paidBy] || 0) - splitAmount
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
  { id: 'e1', description: 'Hotel Booking', amount: 300, date: new Date().toISOString(), paidBy: 'u1', groupId: 'g1', splitBetween: ['u1', 'u2', 'u3'], category: 'Travel' },
  { id: 'e2', description: 'Dinner', amount: 90, date: new Date().toISOString(), paidBy: 'u2', groupId: 'g1', splitBetween: ['u1', 'u2', 'u3'], category: 'Food' },
  { id: 'e3', description: 'Internet Bill', amount: 60, date: new Date().toISOString(), paidBy: 'u4', groupId: 'g2', splitBetween: ['u1', 'u4'], category: 'Utilities' },
]

// Check if Supabase is properly configured
export function isSupabaseConfigured() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}