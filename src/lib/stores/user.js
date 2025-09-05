import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { getAvatarUrl, DEFAULT_AVATAR } from '$lib/config/avatars.js';

// User profile store
export const userProfile = writable(null);
export const isLoadingProfile = writable(false);

// Cache to prevent duplicate API calls
let profileCache = new Map();
let isLoading = false;

// Load user profile with caching
export async function loadUserProfile(forceRefresh = false) {
    try {
        // Prevent multiple simultaneous calls
        if (isLoading && !forceRefresh) {
            return get(userProfile);
        }

        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
            userProfile.set(null);
            profileCache.clear();
            return null;
        }

        // Check cache first (unless force refresh)
        if (!forceRefresh && profileCache.has(user.id)) {
            const cachedProfile = profileCache.get(user.id);
            userProfile.set(cachedProfile);
            return cachedProfile;
        }

        isLoading = true;
        isLoadingProfile.set(true);

        // Get user profile from users table
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            // If user doesn't exist in users table, create one
            if (error.code === 'PGRST116') {
                const newProfile = await createUserProfile(user);
                profileCache.set(user.id, newProfile);
                userProfile.set(newProfile);
                return newProfile;
            }
            throw error;
        }

        // Cache the profile
        profileCache.set(user.id, profile);
        userProfile.set(profile);
        return profile;
    } catch (error) {
        console.error('Error loading user profile:', error);
        userProfile.set(null);
        return null;
    } finally {
        isLoading = false;
        isLoadingProfile.set(false);
    }
}

// Create new user profile
async function createUserProfile(user) {
    try {
        const userData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            avatar_id: DEFAULT_AVATAR.id,
            avatar_url: DEFAULT_AVATAR.url,
            created_at: new Date().toISOString()
        };

        // Cache Google avatar if available
        if (user.user_metadata?.avatar_url) {
            userData.avatar_id = user.user_metadata.avatar_url;
            userData.avatar_url = user.user_metadata.avatar_url;
        }

        const { data, error } = await supabase.from('users').insert([userData]).select().single();

        if (error) throw error;

        // Cache the new profile
        profileCache.set(user.id, data);
        return data;
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

// Update user profile
export async function updateUserProfile(updates) {
    try {
        // Get current profile from store (much faster than Promise)
        const currentProfile = get(userProfile);

        if (!currentProfile) {
            throw new Error('No user profile loaded');
        }

        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        // Update avatar_url if avatar_id changed
        if (updates.avatar_id) {
            updateData.avatar_url = getAvatarUrl(updates.avatar_id);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', currentProfile.id)
            .select()
            .single();

        if (error) throw error;

        // Update cache and store immediately
        profileCache.set(currentProfile.id, data);
        userProfile.set(data);

        console.log('Profile updated successfully:', data);
        return data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Get user avatar URL
export function getUserAvatarUrl(profile) {
    if (!profile) return DEFAULT_AVATAR.url;
    return getAvatarUrl(profile.avatar_id) || profile.avatar_url || DEFAULT_AVATAR.url;
}

// Initialize user profile on auth state change (with debouncing)
let authChangeTimeout;
supabase.auth.onAuthStateChange(async (event, session) => {
    // Clear previous timeout to prevent rapid-fire calls
    if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
    }

    // Debounce auth state changes
    authChangeTimeout = setTimeout(async () => {
        if (event === 'SIGNED_IN' && session?.user) {
            // Only load if we don't have cached profile
            const cachedProfile = profileCache.get(session.user.id);
            if (!cachedProfile) {
                await loadUserProfile();
            } else {
                userProfile.set(cachedProfile);
            }
        } else if (event === 'SIGNED_OUT') {
            userProfile.set(null);
            profileCache.clear();
        }
    }, 100); // 100ms debounce
});
