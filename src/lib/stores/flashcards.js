import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabase.js';

export const flashcardSets = writable([]);
export const folders = writable([]);

// Store untuk flashcard set yang sedang aktif
export const currentFlashcardSet = writable(null);
export const currentFolder = writable(null);

// Store untuk recent activities
export const recentActivities = writable([]);

// Store untuk quiz state
export const quizState = writable({
    isActive: false,
    currentCardIndex: 0,
    score: 0,
    answers: [],
    mode: 'flashcard',
    sessionId: null
});

// Helper functions untuk mengelola flashcard sets dengan Supabase
export const flashcardActions = {
    // Load semua flashcard sets dari Supabase
    loadSets: async (userId = null) => {
        try {
            let query = supabase
                .from('flashcard_sets')
                .select(`
                    *,
                    folders (
                        id,
                        name,
                        color
                    ),
                    flashcards (
                        id,
                        term,
                        definition,
                        image_url,
                        position
                    )
                `)
                .order('created_at', { ascending: false });

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;

            flashcardSets.set(data || []);
            return data;
        } catch (error) {
            console.error('Error loading flashcard sets:', error);
            return [];
        }
    },

    // Load recent activities untuk homepage
    loadRecentActivities: async () => {
        try {
            const { data, error } = await supabase
                .from('flashcard_sets')
                .select(`
					id,
					title,
					description,
					total_cards,
					created_at,
					updated_at,
					last_studied_at,
					users!inner (
						full_name
					)
				`)
                .eq('is_public', true)
                .order('last_studied_at', { ascending: false, nullsLast: false })
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            recentActivities.set(data || []);
            return data;
        } catch (error) {
            console.error('Error loading recent activities:', error);
            recentActivities.set([]);
            return [];
        }
    },

    // Menambah flashcard set baru ke Supabase
    addSet: async (setData, userId) => {
        try {
            // Cek apakah user ada di tabel users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                // Jika user belum ada di tabel users, coba insert
                const { data: authUser } = await supabase.auth.getUser();
                if (authUser?.user) {
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert({
                            id: authUser.user.id,
                            email: authUser.user.email,
                            full_name: authUser.user.user_metadata?.full_name || ''
                        })
                        .select()
                        .single();

                    if (insertError && insertError.code !== '23505') { // 23505 is duplicate key error
                        throw new Error('Failed to create user profile');
                    }
                }
            }

            // Insert flashcard set
            const { data: newSet, error: setError } = await supabase
                .from('flashcard_sets')
                .insert({
                    user_id: userId,
                    title: setData.title,
                    description: setData.description,
                    folder_id: setData.folderId || null,
                    total_cards: setData.cards.length,
                    is_public: true // Set as public agar muncul di recent
                })
                .select()
                .single(); if (setError) throw setError;

            // Insert flashcards
            const flashcardsToInsert = setData.cards.map((card, index) => ({
                set_id: newSet.id,
                term: card.term,
                definition: card.definition,
                position: index
            }));

            const { error: cardsError } = await supabase
                .from('flashcards')
                .insert(flashcardsToInsert);

            if (cardsError) throw cardsError;

            // Reload sets untuk user
            await flashcardActions.loadSets(userId);

            // Reload recent activities untuk homepage
            await flashcardActions.loadRecentActivities();

            return newSet;
        } catch (error) {
            console.error('Error adding flashcard set:', error);
            throw error;
        }
    },

    // Update flashcard set di Supabase
    updateSet: async (id, updates) => {
        try {
            const { error } = await supabase
                .from('flashcard_sets')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Reload sets
            await flashcardActions.loadSets();
            await flashcardActions.loadRecentActivities();
        } catch (error) {
            console.error('Error updating flashcard set:', error);
            throw error;
        }
    },

    // Hapus flashcard set dari Supabase
    deleteSet: async (id) => {
        try {
            const { error } = await supabase
                .from('flashcard_sets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Update local store
            flashcardSets.update(sets => sets.filter(set => set.id !== id));
        } catch (error) {
            console.error('Error deleting flashcard set:', error);
            throw error;
        }
    },

    // Load single flashcard set dengan cards
    loadSetWithCards: async (setId) => {
        try {
            const { data, error } = await supabase
                .from('flashcard_sets')
                .select(`
                    *,
                    folders (
                        id,
                        name,
                        color
                    ),
                    flashcards (
                        id,
                        term,
                        definition,
                        image_url,
                        position
                    )
                `)
                .eq('id', setId)
                .single();

            if (error) throw error;

            // Sort flashcards by position
            if (data && data.flashcards) {
                data.flashcards.sort((a, b) => a.position - b.position);
            }

            currentFlashcardSet.set(data);
            return data;
        } catch (error) {
            console.error('Error loading flashcard set:', error);
            return null;
        }
    }
};

// Folder actions dengan Supabase
export const folderActions = {
    // Load semua folders
    loadFolders: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('folders')
                .select(`
                    *,
                    flashcard_sets (
                        id,
                        title,
                        total_cards,
                        created_at
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            folders.set(data || []);
            return data;
        } catch (error) {
            console.error('Error loading folders:', error);
            return [];
        }
    },

    // Create new folder
    createFolder: async (folderData, userId) => {
        try {
            const { data, error } = await supabase
                .from('folders')
                .insert({
                    user_id: userId,
                    name: folderData.name,
                    description: folderData.description,
                    icon: folderData.icon || 'folder',
                    color: folderData.color || '#3B82F6'
                })
                .select()
                .single();

            if (error) throw error;

            // Reload folders
            await folderActions.loadFolders(userId);

            return data;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    },

    // Update folder
    updateFolder: async (folderId, updates) => {
        try {
            const { error } = await supabase
                .from('folders')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', folderId);

            if (error) throw error;

            // Reload folders
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await folderActions.loadFolders(user.id);
            }
        } catch (error) {
            console.error('Error updating folder:', error);
            throw error;
        }
    },

    // Delete folder
    deleteFolder: async (folderId) => {
        try {
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', folderId);

            if (error) throw error;

            folders.update(items => items.filter(f => f.id !== folderId));
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    },

    // Add flashcard set to folder
    addSetToFolder: async (setId, folderId) => {
        try {
            const { error } = await supabase
                .from('flashcard_sets')
                .update({ folder_id: folderId })
                .eq('id', setId);

            if (error) throw error;
        } catch (error) {
            console.error('Error adding set to folder:', error);
            throw error;
        }
    },

    // Remove flashcard set from folder
    removeSetFromFolder: async (setId) => {
        try {
            const { error } = await supabase
                .from('flashcard_sets')
                .update({ folder_id: null })
                .eq('id', setId);

            if (error) throw error;
        } catch (error) {
            console.error('Error removing set from folder:', error);
            throw error;
        }
    }
};

// Quiz actions dengan Supabase
export const quizActions = {
    // Mulai quiz session
    startQuiz: async (setId, userId, mode = 'flashcard') => {
        try {
            // Load flashcard set
            const set = await flashcardActions.loadSetWithCards(setId);
            if (!set) throw new Error('Flashcard set not found');

            // Create study session
            const { data: session, error } = await supabase
                .from('study_sessions')
                .insert({
                    user_id: userId,
                    set_id: setId,
                    mode: mode,
                    total_cards: set.flashcards.length
                })
                .select()
                .single();

            if (error) throw error;

            // Update quiz state
            quizState.set({
                isActive: true,
                currentCardIndex: 0,
                score: 0,
                answers: [],
                mode: mode,
                sessionId: session.id
            });

            // Update last studied
            await supabase
                .from('flashcard_sets')
                .update({ last_studied_at: new Date().toISOString() })
                .eq('id', setId);

            // Reload recent activities
            await flashcardActions.loadRecentActivities();

            return set;
        } catch (error) {
            console.error('Error starting quiz:', error);
            throw error;
        }
    },

    // Submit jawaban
    submitAnswer: async (flashcardId, userAnswer, isCorrect) => {
        const state = get(quizState);

        try {
            // Save answer to database
            const { error } = await supabase
                .from('user_answers')
                .insert({
                    session_id: state.sessionId,
                    flashcard_id: flashcardId,
                    user_answer: userAnswer,
                    is_correct: isCorrect
                });

            if (error) throw error;

            // Update local state
            quizState.update(state => ({
                ...state,
                answers: [...state.answers, { flashcardId, userAnswer, isCorrect }],
                score: isCorrect ? state.score + 1 : state.score
            }));
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    },

    // Pindah ke kartu berikutnya
    nextCard: () => {
        quizState.update(state => ({
            ...state,
            currentCardIndex: state.currentCardIndex + 1
        }));
    },

    // Pindah ke kartu sebelumnya
    previousCard: () => {
        quizState.update(state => ({
            ...state,
            currentCardIndex: Math.max(0, state.currentCardIndex - 1)
        }));
    },

    // Reset quiz
    resetQuiz: () => {
        quizState.update(state => ({
            ...state,
            currentCardIndex: 0,
            score: 0,
            answers: []
        }));
    },

    // Selesai quiz
    endQuiz: async () => {
        const state = get(quizState);

        try {
            // Update study session
            const { error } = await supabase
                .from('study_sessions')
                .update({
                    correct_answers: state.score,
                    wrong_answers: state.answers.length - state.score,
                    score: (state.score / state.answers.length) * 100,
                    completed_at: new Date().toISOString()
                })
                .eq('id', state.sessionId);

            if (error) throw error;

            // Reset quiz state
            quizState.set({
                isActive: false,
                currentCardIndex: 0,
                score: 0,
                answers: [],
                mode: 'flashcard',
                sessionId: null
            });
        } catch (error) {
            console.error('Error ending quiz:', error);
        }
    },

    // Load recent activities
    loadRecentActivities: async () => {
        try {
            const { data, error } = await supabase
                .from('recent_activities')
                .select('*')
                .limit(10);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error loading recent activities:', error);
            return [];
        }
    }
};

// Helper function untuk get store value
import { get } from 'svelte/store';