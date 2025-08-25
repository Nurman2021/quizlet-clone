import { createToaster } from '@skeletonlabs/skeleton-svelte';

// Create global toaster instance
export const toaster = createToaster({
    placement: 'bottom-end'
});


export const toast = {
    success: (title, description = '') => {
        toaster.success({
            title,
            description,
            duration: 3000
        });
    },

    error: (title, description = '') => {
        toaster.error({
            title,
            description,
            duration: 5000
        });
    },

    warning: (title, description = '') => {
        toaster.warning({
            title,
            description,
            duration: 4000
        });
    },

    info: (title, description = '') => {
        toaster.info({
            title,
            description,
            duration: 3000
        });
    }
};