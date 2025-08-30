// src/lib/services/progressService.js
import { supabase } from '$lib/supabase.js';

export class ProgressService {

    // Record a single attempt
    static async recordAttempt(flashcardId, setId, mode, isCorrect, responseTime = null, answerText = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('User not authenticated, skipping progress recording');
                return;
            }

            // Validate inputs
            if (!flashcardId || !setId) {
                console.error('Invalid flashcardId or setId:', { flashcardId, setId });
                return;
            }

            // Ensure flashcardId and setId are valid UUIDs or integers
            const flashcardIdStr = String(flashcardId);
            const setIdStr = String(setId);

            console.log('Recording attempt:', {
                flashcardId: flashcardIdStr,
                setId: setIdStr,
                mode,
                isCorrect
            });

            // Record attempt history
            const { error: historyError } = await supabase
                .from('attempt_history')
                .insert({
                    user_id: user.id,
                    flashcard_id: flashcardIdStr,
                    set_id: setIdStr,
                    mode,
                    is_correct: isCorrect,
                    response_time_ms: responseTime,
                    answer_text: answerText
                });

            if (historyError) {
                console.warn('Could not record attempt history:', historyError.message);
                // Don't throw error, just log warning
            }

            // Update or create user progress
            await this.updateProgress(flashcardIdStr, setIdStr, mode, isCorrect);

        } catch (error) {
            console.warn('Error recording attempt (non-critical):', error.message);
            // Don't throw error to prevent breaking the main application flow
        }
    }

    // Update user progress
    static async updateProgress(flashcardId, setId, mode, isCorrect) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('User not authenticated, skipping progress update');
                return;
            }

            // Validate inputs
            if (!flashcardId || !setId) {
                console.warn('Invalid flashcardId or setId in updateProgress:', { flashcardId, setId });
                return;
            }

            // Get current progress
            const { data: currentProgress, error: fetchError } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('flashcard_id', flashcardId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.warn('Could not fetch progress:', fetchError.message);
                return;
            }

            const now = new Date().toISOString();

            if (currentProgress) {
                // Update existing progress
                const newCorrectAttempts = currentProgress.correct_attempts + (isCorrect ? 1 : 0);
                const newTotalAttempts = currentProgress.total_attempts + 1;
                const accuracy = newCorrectAttempts / newTotalAttempts;

                // Determine new status and confidence
                let newStatus = currentProgress.status;
                let newConfidenceLevel = currentProgress.confidence_level;
                let masteredAt = currentProgress.mastered_at;

                if (isCorrect) {
                    newConfidenceLevel = Math.min(5, newConfidenceLevel + 1);
                    if (newConfidenceLevel >= 4 && accuracy >= 0.8) {
                        newStatus = 'mastered';
                        masteredAt = now;
                    }
                } else {
                    newConfidenceLevel = Math.max(1, newConfidenceLevel - 1);
                    newStatus = 'learning';
                    masteredAt = null;
                }

                const { error } = await supabase
                    .from('user_progress')
                    .update({
                        correct_attempts: newCorrectAttempts,
                        total_attempts: newTotalAttempts,
                        confidence_level: newConfidenceLevel,
                        status: newStatus,
                        last_attempt_at: now,
                        mastered_at: masteredAt,
                        updated_at: now
                    })
                    .eq('id', currentProgress.id);

                if (error) {
                    console.warn('Could not update progress:', error.message);
                }

            } else {
                // Create new progress
                const { error } = await supabase
                    .from('user_progress')
                    .insert({
                        user_id: user.id,
                        flashcard_id: flashcardId,
                        set_id: setId,
                        mode,
                        status: isCorrect ? 'learning' : 'learning',
                        confidence_level: isCorrect ? 2 : 1,
                        correct_attempts: isCorrect ? 1 : 0,
                        total_attempts: 1,
                        first_attempt_at: now,
                        last_attempt_at: now,
                        mastered_at: isCorrect && mode === 'test' ? now : null
                    });

                if (error) {
                    console.warn('Could not create new progress:', error.message);
                }
            }

        } catch (error) {
            console.warn('Error updating progress (non-critical):', error.message);
            // Don't throw error to prevent breaking the main application flow
        }
    }

    // Get progress for a flashcard set
    static async getSetProgress(setId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { stillLearning: [], mastered: [] };

            const { data: progress, error } = await supabase
                .from('user_progress')
                .select(`
                    *,
                    flashcards (
                        id,
                        term,
                        definition,
                        is_starred
                    )
                `)
                .eq('user_id', user.id)
                .eq('set_id', setId);

            if (error) {
                console.warn('Could not fetch set progress:', error.message);
                return { stillLearning: [], mastered: [] };
            }

            const stillLearning = progress?.filter(p => p.status === 'learning') || [];
            const mastered = progress?.filter(p => p.status === 'mastered') || [];

            return { stillLearning, mastered };

        } catch (error) {
            console.warn('Error getting set progress:', error.message);
            return { stillLearning: [], mastered: [] };
        }
    }

    // Get detailed statistics
    static async getDetailedStats(setId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: stats, error } = await supabase
                .from('attempt_history')
                .select('*')
                .eq('user_id', user.id)
                .eq('set_id', setId);

            if (error) {
                console.warn('Could not fetch detailed stats:', error.message);
                return null;
            }

            // Process statistics
            const byMode = {};
            const byDate = {};
            let totalAttempts = 0;
            let correctAttempts = 0;

            stats?.forEach(attempt => {
                const mode = attempt.mode;
                const date = attempt.created_at.split('T')[0];

                if (!byMode[mode]) byMode[mode] = { correct: 0, total: 0 };
                if (!byDate[date]) byDate[date] = { correct: 0, total: 0 };

                byMode[mode].total++;
                byDate[date].total++;
                totalAttempts++;

                if (attempt.is_correct) {
                    byMode[mode].correct++;
                    byDate[date].correct++;
                    correctAttempts++;
                }
            });

            return {
                totalAttempts,
                correctAttempts,
                accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
                byMode,
                byDate,
                recentActivity: stats?.slice(-10) || []
            };

        } catch (error) {
            console.warn('Error getting detailed stats:', error.message);
            return null;
        }
    }
}