import { supabase } from '../lib/supabaseClient.js'

// ===== USER OPERATIONS =====

export async function createOrUpdateUser(googleUser) {
  try {
    // First check if user already exists with google_id
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleUser.id)
      .maybeSingle()

    let userData;
    let isNewUser = false;
    let autoJoinedGroups = 0;

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
      userData = data;
    } else {
      // Check if there's a placeholder user with this email
      const placeholderResult = await convertPlaceholderUser(googleUser.email, googleUser);
      
      if (placeholderResult.success && placeholderResult.data) {
        // Placeholder user was converted successfully
        userData = placeholderResult.data;
        autoJoinedGroups = placeholderResult.groupsJoined;
        isNewUser = true;
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
        userData = data;
        isNewUser = true;
      }
    }

    return { 
      success: true, 
      data: userData,
      isNewUser,
      autoJoinedGroups: autoJoinedGroups
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Get user by google_id (for refreshing session from localStorage)
export async function getUserByGoogleId(googleId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .maybeSingle()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Get user by email (for refreshing session)
export async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
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
    return { success: false, error: error.message, data: [] }
  }
}

// Search users by email (for invite/add friend feature)
export async function searchUsersByEmail(emailQuery, currentUserId) {
  try {
    if (!emailQuery || emailQuery.length < 2) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar, picture')
      .ilike('email', `%${emailQuery}%`)
      .neq('id', currentUserId) // Exclude current user
      .not('email', 'ilike', '%@phone.user') // Exclude placeholder phone users
      .limit(5)

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

// Get only the current user's friends (people they've added or been added by)
export async function getUserFriends(userId) {
  try {
    // Verify user exists by their id
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: true, data: [] }
    }

    let allFriends = []
    const friendsSet = new Set()

    // Step 1: Get friends from friends table (created_by = current user)
    const { data: myFriends, error: myFriendsError } = await supabase
      .from('friends')
      .select('*')
      .eq('created_by', user.id)

    if (myFriendsError) {
      console.error('Error fetching my friends:', myFriendsError);
    } else {
      for (const friend of myFriends || []) {
        // Check if this friend email matches a real signed-up user
        const { data: realUser } = await supabase
          .from('users')
          .select('id, name, email, avatar, picture, google_id')
          .eq('email', friend.email)
          .maybeSingle()

        if (realUser && !friendsSet.has(realUser.id)) {
          // This friend is a real user, use their actual user data
          allFriends.push(realUser)
          friendsSet.add(realUser.id)
        } else if (!realUser && !friendsSet.has(friend.id)) {
          // This is a placeholder friend (not signed up yet)
          allFriends.push({
            id: friend.id,
            name: friend.name,
            email: friend.email,
            avatar: friend.avatar,
            picture: friend.picture || null,
            google_id: null
          })
          friendsSet.add(friend.id)
        }
      }
    }

    // Step 2: Get users who added ME as a friend (bidirectional relationship)
    if (user.email) {
      const { data: addedByOthers, error: addedByError } = await supabase
        .from('friends')
        .select('created_by')
        .eq('email', user.email)

      if (!addedByError && addedByOthers && addedByOthers.length > 0) {
        const creatorIds = addedByOthers.map(f => f.created_by).filter(id => id !== user.id)
        
        if (creatorIds.length > 0) {
          const { data: usersWhoAddedMe } = await supabase
            .from('users')
            .select('id, name, email, avatar, picture, google_id')
            .in('id', creatorIds)

          usersWhoAddedMe?.forEach(addingUser => {
            if (!friendsSet.has(addingUser.id)) {
              allFriends.push(addingUser)
              friendsSet.add(addingUser.id)
            }
          })
        }
      }
    }

    // Step 3: Get current user data for lookups
    const { data: currentUserData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    let currentUserForGroups = currentUserData

    // Step 4: Get all groups the user is a member of
    const { data: userGroups, error: groupsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (groupsError) throw groupsError

    const userGroupIds = userGroups?.map(g => g.group_id) || []

    // Step 5: Get all users in those groups
    if (userGroupIds.length > 0) {
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

      groupMembers?.forEach(member => {
        if (member.users && !friendsSet.has(member.users.id)) {
          if (member.users.id !== user.id) {
            allFriends.push(member.users)
            friendsSet.add(member.users.id)
          } else {
            currentUserForGroups = member.users
          }
        }
      })
    }

    // Create final result
    const result = [...allFriends]
    
    if (currentUserForGroups && !friendsSet.has(currentUserForGroups.id)) {
      result.push(currentUserForGroups)
    }

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function addFriend(friendData, currentUserId) {
  try {
    // Verify current user exists by their id
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', currentUserId)
      .single()

    if (!currentUser) {
      throw new Error('Current user not found')
    }

    // Check if friend with this email already exists for this user
    const { data: existingFriend } = await supabase
      .from('friends')
      .select('*')
      .eq('created_by', currentUser.id)
      .eq('email', friendData.email)
      .maybeSingle()

    if (existingFriend) {
      // Friend already exists for this user
      return { success: true, data: existingFriend }
    }

    // Create new friend record (only store basic info - picture comes from users table for signed-up users)
    const { data, error } = await supabase
      .from('friends')
      .insert([{
        name: friendData.name,
        email: friendData.email,
        avatar: friendData.avatar,
        created_by: currentUser.id
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function updateUser(userId, userData) {
  try {
    // First, try to fetch current user data by id
    let currentUser = null;
    
    // Check if userId is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        currentUser = data;
      }
    }
    
    // If not found by UUID, try to find by google_id (in case old ID format is passed)
    if (!currentUser) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        currentUser = data;
      }
    }
    
    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Build update object with only fields that have actually changed
    const updateData = {};
    
    if (userData.name !== undefined && userData.name !== currentUser.name) {
      updateData.name = userData.name;
    }
    if (userData.email !== undefined && userData.email !== currentUser.email) {
      updateData.email = userData.email;
    }
    if (userData.avatar !== undefined && userData.avatar !== currentUser.avatar) {
      updateData.avatar = userData.avatar;
    }
    if (userData.picture !== undefined && userData.picture !== currentUser.picture) {
      updateData.picture = userData.picture;
    }
    if (userData.phone !== undefined && userData.phone !== currentUser.phone) {
      updateData.phone = userData.phone;
    }
    if (userData.google_id !== undefined && userData.google_id !== currentUser.google_id) {
      updateData.google_id = userData.google_id;
    }

    // If nothing has changed, return current user
    if (Object.keys(updateData).length === 0) {
      return { success: true, data: currentUser };
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', currentUser.id) // Always use the actual UUID
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        if (error.message.includes('email') || error.details?.includes('email')) {
          return { success: false, error: 'EMAIL_EXISTS' };
        } else if (error.message.includes('phone') || error.details?.includes('phone')) {
          return { success: false, error: 'PHONE_EXISTS' };
        }
      }
      throw error;
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Merge phone user account with existing email user account
export async function mergePhoneUserWithEmail(phoneUserId, email, phoneNumber, newUserData = {}) {
  try {
    // Find the existing user with this email
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !existingUser) {
      return { success: false, error: 'No existing account found with this email' };
    }

    // Update the existing user with the phone number and any new data
    const updateData = {
      phone: phoneNumber
    };

    // Optionally update other fields if provided and not already set
    if (newUserData.name && !existingUser.name) {
      updateData.name = newUserData.name;
    }
    if (newUserData.avatar && !existingUser.avatar) {
      updateData.avatar = newUserData.avatar;
    }
    if (newUserData.picture && !existingUser.picture) {
      updateData.picture = newUserData.picture;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Delete the temporary phone user account
    // First, we need to handle any data associated with the phone user
    // Transfer any group memberships from phone user to existing user
    await supabase
      .from('group_members')
      .update({ user_id: existingUser.id })
      .eq('user_id', phoneUserId);

    // Transfer any expense splits
    await supabase
      .from('expense_splits')
      .update({ user_id: existingUser.id })
      .eq('user_id', phoneUserId);

    // Transfer any expenses paid by phone user
    await supabase
      .from('expenses')
      .update({ paid_by: existingUser.id })
      .eq('paid_by', phoneUserId);

    // Transfer any friends created by phone user
    await supabase
      .from('friends')
      .update({ created_by: existingUser.id })
      .eq('created_by', phoneUserId);

    // Now delete the temporary phone user
    await supabase
      .from('users')
      .delete()
      .eq('id', phoneUserId);

    return { 
      success: true, 
      data: updatedUser,
      merged: true,
      message: 'Account linked successfully! Your phone number has been added to your existing account.'
    };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message }
  }
}

// ===== GROUP OPERATIONS =====

export async function createGroup(groupData, currentUserId) {
  try {
    // Verify user exists by their id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', currentUserId)
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
        default_currency: groupData.default_currency || 'USD',
        created_by: user.id
      }])
      .select()
      .single()

    if (groupError) throw groupError

    // Convert member IDs to UUIDs and add members to the group
    const memberUuids = []
    const processedMembers = new Set() // Track processed members to avoid duplicates
    const pendingInvitations = [] // Track email invitations to create
    
    // Always include the current user first
    memberUuids.push(user.id)
    processedMembers.add(user.id)
    
    // Process other members
    for (const memberId of groupData.members) {
      if (memberId === currentUserId || processedMembers.has(memberId)) {
        continue // Skip current user (already added) and duplicates
      }
      
      let finalUuid = null
      
      // Check if memberId looks like an email address
      const isEmail = memberId.includes('@') && memberId.includes('.')
      
      if (isEmail) {
        // Try to find existing user by email
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', memberId.toLowerCase())
          .maybeSingle()
        
        if (userByEmail) {
          finalUuid = userByEmail.id
        } else {
          // User doesn't exist yet, create placeholder user entry
          const { data: placeholderUser, error: placeholderError } = await supabase
            .from('users')
            .insert([{
              email: memberId.toLowerCase(),
              name: memberId.split('@')[0], // Use part before @ as temporary name
              avatar: memberId.substring(0, 2).toUpperCase(),
              google_id: null // No google_id indicates this is a placeholder
            }])
            .select()
            .single()
          
          if (placeholderError) {
          } else {
            finalUuid = placeholderUser.id
          }
        }
      } else {
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

    return { 
      success: true, 
      data: group
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getUserGroups(userId) {
  try {
    // Verify user exists by their id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
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
        default_currency,
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
          default_currency: group.default_currency || 'USD',
          created_by: group.created_by,
          members: members?.map(m => m.user_id) || []
        }
      })
    )


    return { success: true, data: groupsWithMembers }
  } catch (error) {
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
        type: groupData.type,
        default_currency: groupData.default_currency || 'USD'
      })
      .eq('id', groupId)
      .select()
      .single()

    if (groupError) {
      throw groupError;
    }
    

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
    return { success: false, error: error.message }
  }
}

// ===== EXPENSE OPERATIONS =====

export async function createExpense(expenseData) {
  try {
    // Handle both old and new data formats
    const paidById = expenseData.paid_by || expenseData.paidBy;
    const splitWith = (expenseData.split_with || expenseData.splitBetween || [])
      .filter(id => id !== undefined && id !== null && id !== 'undefined' && id !== ''); // Filter out invalid IDs
    const groupId = expenseData.group_id || expenseData.groupId;
    
    // Validate we have valid split members
    if (splitWith.length === 0) {
      throw new Error('No valid members to split expense with');
    }
    
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
        throw new Error(`Payer not found for Google ID: ${paidById}`)
      }
      payerUuid = payerUser.id
    }

    // Create the expense
    const insertData = {
      description: expenseData.description,
      amount: expenseData.amount,
      currency: expenseData.currency || 'USD',
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

    // Handle image upload if provided
    let imageUrl = null;
    let imageUploadWarning = null;
    
    if (expenseData.imageFile) {
      const imageResult = await uploadExpenseImage(expenseData.imageFile, expense.id);
      if (imageResult.success) {
        imageUrl = imageResult.publicUrl;
        
        // For base64 storage, store the actual data URL in receipt_image_url
        // For Supabase storage, store the public URL
        const updateData = {
          receipt_image_path: imageResult.filePath,
          receipt_image_url: imageUrl
        };
        
        // Update expense with image information
        const { error: updateError } = await supabase
          .from('expenses')
          .update(updateData)
          .eq('id', expense.id);

        if (updateError) {
          imageUploadWarning = 'Expense created but image upload failed';
        } else {
        }
      } else {
        imageUploadWarning = imageResult.error;
        
        // Don't fail the entire expense creation if image upload fails
        if (!imageResult.isConfigError && !imageResult.isPermissionError) {
        }
      }
    }

    // Handle custom splits or equal splits
    const splitInserts = []
    
    if (expenseData.split_method === 'custom' && expenseData.custom_splits) {
      // Use custom split amounts
      for (const [userId, amount] of Object.entries(expenseData.custom_splits)) {
        // Skip invalid user IDs
        if (!userId || userId === 'undefined' || userId === 'null') {
          console.warn('Skipping invalid user ID in custom splits:', userId);
          continue;
        }
        
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
        // Skip invalid user IDs (already filtered above, but double-check)
        if (!userId || userId === 'undefined' || userId === 'null') {
          console.warn('Skipping invalid user ID in equal splits:', userId);
          continue;
        }
        
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

    // Validate we have at least one valid split
    if (splitInserts.length === 0) {
      throw new Error('No valid expense splits could be created');
    }

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitInserts)

    if (splitsError) throw splitsError

    // Return result with any image upload warnings
    const result = { success: true, data: expense };
    if (imageUploadWarning) {
      result.warning = imageUploadWarning;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function updateExpense(expenseId, expenseData) {
  try {
    // Handle both old and new data formats
    const paidById = expenseData.paid_by || expenseData.paidBy;
    const splitWith = (expenseData.split_with || expenseData.splitBetween || [])
      .filter(id => id !== undefined && id !== null && id !== 'undefined' && id !== ''); // Filter out invalid IDs
    const groupId = expenseData.group_id || expenseData.groupId;
    
    // Validate we have valid split members
    if (splitWith.length === 0) {
      throw new Error('No valid members to split expense with');
    }
    
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
        throw new Error(`Payer not found for Google ID: ${paidById}`)
      }
      payerUuid = payerUser.id
    }

    // Update the expense
    const updateData = {
      description: expenseData.description,
      amount: expenseData.amount,
      currency: expenseData.currency || 'USD',
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
        // Skip invalid user IDs
        if (!userId || userId === 'undefined' || userId === 'null') {
          console.warn('Skipping invalid user ID in custom splits:', userId);
          continue;
        }
        
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
        // Skip invalid user IDs
        if (!userId || userId === 'undefined' || userId === 'null') {
          console.warn('Skipping invalid user ID in equal splits:', userId);
          continue;
        }
        
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

    // Validate we have at least one valid split
    if (splitInserts.length === 0) {
      throw new Error('No valid expense splits could be created');
    }

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitInserts)

    if (splitsError) throw splitsError

    // Handle image upload/replacement if provided
    if (expenseData.imageFile) {
      // If there's an existing image, delete it first
      if (expenseData.existingImagePath) {
        await deleteExpenseImage(expenseData.existingImagePath);
      }

      // Upload new image
      const imageResult = await uploadExpenseImage(expenseData.imageFile, expense.id);
      if (imageResult.success) {
        // Update expense with new image path and URL
        // For both storage types, publicUrl contains the usable image URL
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ 
            receipt_image_path: imageResult.filePath,
            receipt_image_url: imageResult.publicUrl 
          })
          .eq('id', expenseId);

        if (updateError) {
        } else {
        }
      }
    } else if (expenseData.removeImage && expenseData.existingImagePath) {
      // Remove image if requested
      await deleteExpenseImage(expenseData.existingImagePath);
      
      // Clear image fields in database
      const { error: clearError } = await supabase
        .from('expenses')
        .update({ 
          receipt_image_path: null,
          receipt_image_url: null 
        })
        .eq('id', expenseId);

      if (clearError) {
      }
    }

    return { success: true, data: expense }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getUserExpenses(userId) {
  try {
    // Verify user exists by their id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
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

    // Get all expenses from user's groups
    let groupExpenses = []
    if (userGroupIds.length > 0) {
      const { data, error: groupError } = await supabase
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
        .in('group_id', userGroupIds)
        .order('created_at', { ascending: false })

      if (groupError) throw groupError
      groupExpenses = data || []
    }

    // Get personal expenses (no group) where user is involved
    const { data: userSplits, error: userSplitsError } = await supabase
      .from('expense_splits')
      .select('expense_id')
      .eq('user_id', user.id)

    if (userSplitsError) throw userSplitsError

    const expenseIdsFromSplits = userSplits?.map(s => s.expense_id) || []

    // Get personal expenses (without group_id)
    let personalExpenses = []
    if (expenseIdsFromSplits.length > 0) {
      const { data, error: personalError } = await supabase
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
        .in('id', expenseIdsFromSplits)
        .is('group_id', null)
        .order('created_at', { ascending: false })

      if (personalError) throw personalError
      personalExpenses = data || []
    }

    // Combine and deduplicate expenses
    const allExpenses = [...groupExpenses, ...personalExpenses]
    const uniqueExpenses = allExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.id === expense.id)
    )

    const filteredExpenses = uniqueExpenses

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
      category: expense.category,
      receipt_image_url: expense.receipt_image_url
    }))

    // Sort by created_at
    transformedExpenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return { success: true, data: transformedExpenses }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getUserExpensesPaginated(userId, page = 1, pageSize = 20) {
  try {
    // Verify user exists by their id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: true, data: [], hasMore: false, totalCount: 0 }
    }

    // Get all groups the user is a member of
    const { data: userGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    const userGroupIds = userGroups?.map(g => g.group_id) || []

    // Get all expense IDs from user's groups
    const allExpenseIds = new Set()
    
    // Add all expenses from user's groups
    if (userGroupIds.length > 0) {
      const { data: groupExpenseIds, error: groupIdsError } = await supabase
        .from('expenses')
        .select('id')
        .in('group_id', userGroupIds)
      
      if (groupIdsError) throw groupIdsError
      
      groupExpenseIds?.forEach(exp => {
        allExpenseIds.add(exp.id)
      })
    }
    
    // Add personal expenses where user is in the splits
    const { data: userSplits, error: userSplitsError } = await supabase
      .from('expense_splits')
      .select('expense_id')
      .eq('user_id', user.id)

    if (userSplitsError) throw userSplitsError

    const expenseIdsFromSplits = userSplits?.map(s => s.expense_id) || []
    
    // Get only personal expenses (no group_id) from splits
    if (expenseIdsFromSplits.length > 0) {
      const { data: personalExpenseIds, error: personalIdsError } = await supabase
        .from('expenses')
        .select('id')
        .in('id', expenseIdsFromSplits)
        .is('group_id', null)
      
      if (personalIdsError) throw personalIdsError
      
      personalExpenseIds?.forEach(exp => {
        allExpenseIds.add(exp.id)
      })
    }

    // Convert to array and sort by getting full data
    const idsArray = Array.from(allExpenseIds)
    
    if (idsArray.length === 0) {
      return { success: true, data: [], hasMore: false, totalCount: 0 }
    }

    // Get full expense data for sorting
    const { data: allExpensesForSort, error: sortError } = await supabase
      .from('expenses')
      .select('id, created_at, group_id')
      .in('id', idsArray)
      .order('created_at', { ascending: false })

    if (sortError) throw sortError

    // Filter by user's groups
    const filteredForSort = allExpensesForSort.filter(expense => 
      !expense.group_id || userGroupIds.includes(expense.group_id)
    )

    const totalCount = filteredForSort.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const hasMore = endIndex < totalCount

    // Get IDs for current page
    const pageExpenseIds = filteredForSort
      .slice(startIndex, endIndex)
      .map(e => e.id)

    if (pageExpenseIds.length === 0) {
      return { success: true, data: [], hasMore: false, totalCount }
    }

    // Fetch full data for current page
    const { data: pageExpenses, error: pageError } = await supabase
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
      .in('id', pageExpenseIds)
      .order('created_at', { ascending: false })

    if (pageError) throw pageError

    // Transform the data
    const transformedExpenses = (pageExpenses || []).map(expense => ({
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
      category: expense.category,
      receipt_image_url: expense.receipt_image_url
    }))

    // Sort by created_at to maintain order
    transformedExpenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return { 
      success: true, 
      data: transformedExpenses, 
      hasMore,
      totalCount,
      currentPage: page
    }
  } catch (error) {
    return { success: false, error: error.message, data: [], hasMore: false, totalCount: 0 }
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
    return { success: false, error: error.message, data: [] }
  }
}

// ===== BALANCE CALCULATIONS =====

export function calculateBalances(expenses, currentUserId, users) {
  let owedToUser = 0
  let userOwes = 0
  const debts = {} // userId -> amount (positive = they owe you, negative = you owe them)

  // Debug logging
  if (process.env.NODE_ENV === 'development' && expenses.length > 0) {
  }

  expenses.forEach((expense, index) => {
    // Handle both old and new data formats
    const paidById = expense.paid_by || expense.paidBy;
    
    // Handle new database structure with expense_splits
    let splitBetween = [];
    if (expense.expense_splits && Array.isArray(expense.expense_splits)) {
      splitBetween = expense.expense_splits.map(split => split.user_id);
    } else {
      // Fallback to old format
      splitBetween = expense.split_between || expense.splitBetween || expense.split_with || [];
    }
    
    if (splitBetween.length === 0) {
      return; // Skip if no splits
    }
    
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
      const userPrefsKey = `fyrshare_preferences_${userId}`
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
    return { success: false, error: error.message }
  }
}

export async function getUserPreferences(userId) {
  try {
    // For now, use localStorage until database schema is updated
    if (typeof window !== 'undefined') {
      const userPrefsKey = `fyrshare_preferences_${userId}`
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



// ===== FILE UPLOAD OPERATIONS =====

export async function uploadExpenseImage(file, referenceId, type = 'expense') {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return await uploadImageAsBase64(file, referenceId)
    }

    // Generate unique filename with timestamp
    const fileExt = file.name.split('.').pop()
    const fileName = `${referenceId}_${Date.now()}.${fileExt}`
    const folder = type === 'profile' ? 'profile-pictures' : 'expense-receipts'
    const filePath = `${folder}/${fileName}`

    // Try to upload to Supabase storage first
    const { data, error } = await supabase.storage
      .from('expense-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      // Handle RLS policy errors by falling back to base64
      // Check multiple possible error formats from Supabase
      const isRLSError = error.message?.includes('row-level security policy') || 
                        error.message?.includes('Unauthorized') ||
                        error.statusCode === '403' ||
                        error.statusCode === 403 ||
                        (typeof error === 'object' && error.statusCode === '403') ||
                        (typeof error === 'object' && error.error === 'Unauthorized');
                        
      if (isRLSError) {
        return await uploadImageAsBase64(file, referenceId)
      }
      
      
      // Handle bucket not found errors
      const isBucketError = error.message?.includes('not found') || 
                           error.statusCode === '404' ||
                           error.statusCode === 404;
                           
      if (isBucketError) {
        return await uploadImageAsBase64(file, referenceId)
      }
      
      // For any other storage error, also fall back to base64 as a safety measure
      return await uploadImageAsBase64(file, referenceId)
    }

    // Get public URL for successful storage upload
    const { data: { publicUrl } } = supabase.storage
      .from('expense-files')
      .getPublicUrl(filePath)

    return { 
      success: true, 
      filePath: filePath,
      publicUrl: publicUrl,
      storageType: 'supabase'
    }
  } catch (error) {
    return await uploadImageAsBase64(file, referenceId)
  }
}

// Fallback function to store images as base64 in database
async function uploadImageAsBase64(file, referenceId) {
  return new Promise((resolve) => {
    // Validate file size (max 2MB for base64 to avoid database bloat)
    if (file.size > 2 * 1024 * 1024) {
      resolve({
        success: false,
        error: 'Image too large for base64 storage (max 2MB)',
        isFileSizeError: true
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      resolve({
        success: true,
        publicUrl: base64, // base64 data URL can be used directly as src
        filePath: `base64_${referenceId}_${Date.now()}`, // dummy path for identification
        storageType: 'base64'
      })
    }
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read image file',
        isFileReadError: true
      })
    }
    reader.readAsDataURL(file)
  })
}

export async function deleteExpenseImage(filePath) {
  try {
    if (!filePath) {
      return { success: true } // Nothing to delete
    }

    // If it's a base64 stored image, no actual file to delete
    if (filePath.startsWith('base64_')) {
      return { success: true }
    }

    // Check if Supabase is configured for actual storage deletion
    if (!isSupabaseConfigured()) {
      return { success: true } // Don't block the operation
    }

    const { error } = await supabase.storage
      .from('expense-files')
      .remove([filePath])

    if (error) {
      // Don't fail the operation if storage deletion fails
      return { success: true, warning: error.message }
    }

    return { success: true }
  } catch (error) {
    // Don't fail the operation if deletion fails
    return { success: true, warning: error.message || 'Failed to delete image file' }
  }
}

export async function getExpenseImageUrl(filePath) {
  try {
    if (!filePath) {
      return { success: false, error: 'No image path provided' }
    }

    // If it's a base64 image, the filePath is actually the data URL
    if (filePath.startsWith('base64_')) {
      // For base64 images, we need to get the actual data URL from the expense record
      // This is a simplified approach - in practice you'd query the expense record
      return { success: false, error: 'Base64 image URL should be stored in expense record' }
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Storage not configured' }
    }

    const { data } = supabase.storage
      .from('expense-files')
      .getPublicUrl(filePath)

    return { success: true, url: data.publicUrl }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===== PENDING INVITATIONS FUNCTIONS =====

export async function createPendingInvitation(groupId, email, invitedBy) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Database not available in demo mode' }
    }

    // Verify inviter exists by their id
    const { data: inviterUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', invitedBy)
      .single()

    if (!inviterUser) {
      throw new Error('Inviter not found')
    }

    // Create pending invitation
    const { data: invitation, error } = await supabase
      .from('pending_invitations')
      .insert([{
        group_id: groupId,
        email: email.toLowerCase(),
        invited_by: inviterUser.id
      }])
      .select()
      .single()

    if (error) {
      // If it's a duplicate error, that's okay - invitation already exists
      if (error.code === '23505') {
        return { success: true, message: 'Invitation already exists' }
      }
      throw error
    }

    return { success: true, data: invitation }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getPendingInvitationsForEmail(email) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return { success: true, data: [] } // Return empty array in demo mode
    }

    const { data: invitations, error } = await supabase
      .from('pending_invitations')
      .select(`
        id,
        group_id,
        email,
        created_at,
        groups (
          id,
          name,
          type,
          created_by
        )
      `)
      .eq('email', email.toLowerCase())

    if (error) throw error

    return { success: true, data: invitations || [] }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function convertPlaceholderUser(userEmail, googleUserData) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return { success: true, groupsJoined: 0 }
    }

    // Find placeholder user with this email
    const { data: placeholderUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail.toLowerCase())
      .is('google_id', null) // Placeholder users have null google_id
      .maybeSingle()

    if (findError) throw findError

    if (!placeholderUser) {
      // No placeholder user found
      return { success: false, groupsJoined: 0 }
    }


    // Update the placeholder user with real Google user data
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        google_id: googleUserData.id,
        name: googleUserData.name,
        avatar: googleUserData.avatar,
        picture: googleUserData.picture
      })
      .eq('id', placeholderUser.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Count how many groups this user is now a member of
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', placeholderUser.id)

    if (membershipError) throw membershipError

    const groupsJoined = memberships ? memberships.length : 0

    return { 
      success: true, 
      data: updatedUser,
      groupsJoined: groupsJoined,
      message: groupsJoined > 0 ? `Automatically joined ${groupsJoined} group(s)` : 'No groups to join'
    }
  } catch (error) {
    return { success: false, error: error.message, groupsJoined: 0 }
  }
}

export async function acceptPendingInvitations(userEmail, userUuid) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return { success: true, message: 'No invitations to process in demo mode' }
    }

    // Get all pending invitations for this email
    const { data: invitations, error: fetchError } = await supabase
      .from('pending_invitations')
      .select('group_id')
      .eq('email', userEmail.toLowerCase())

    if (fetchError) throw fetchError

    if (!invitations || invitations.length === 0) {
      return { success: true, message: 'No pending invitations found', groupsJoined: 0 }
    }

    // Only proceed if userUuid is provided
    if (!userUuid) {
      return { success: true, message: 'No user UUID provided', groupsJoined: 0 }
    }

    // Add user to all groups they were invited to
    const memberInserts = invitations.map(inv => ({
      group_id: inv.group_id,
      user_id: userUuid
    }))

    const { error: insertError } = await supabase
      .from('group_members')
      .insert(memberInserts)

    if (insertError) {
      // Handle duplicate membership gracefully
      if (insertError.code !== '23505') {
        throw insertError
      }
    }

    // Delete the pending invitations
    const { error: deleteError } = await supabase
      .from('pending_invitations')
      .delete()
      .eq('email', userEmail.toLowerCase())

    if (deleteError) {
      // Don't fail the process if deletion fails
    }

    return { 
      success: true, 
      message: `Joined ${invitations.length} group(s) automatically`,
      groupsJoined: invitations.length
    }
  } catch (error) {
    return { success: false, error: error.message, groupsJoined: 0 }
  }
}