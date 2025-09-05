// Import avatar images
import bearImg from '$lib/images/kawaii/bear.png';
import catImg from '$lib/images/kawaii/cat.png';
import fishImg from '$lib/images/kawaii/fish.png';
import frogImg from '$lib/images/kawaii/frog.png';
import sheepImg from '$lib/images/kawaii/sheep.png';
import unicornImg from '$lib/images/kawaii/unicorn.png';

// Avatar configuration for user profile
export const avatarImages = [
    {
        id: 'kawaii-bear',
        name: 'Cute Bear',
        url: bearImg,
        category: 'kawaii'
    },
    {
        id: 'kawaii-cat',
        name: 'Adorable Cat',
        url: catImg,
        category: 'kawaii'
    },
    {
        id: 'kawaii-fish',
        name: 'Happy Fish',
        url: fishImg,
        category: 'kawaii'
    },
    {
        id: 'kawaii-frog',
        name: 'Friendly Frog',
        url: frogImg,
        category: 'kawaii'
    },
    {
        id: 'kawaii-sheep',
        name: 'Fluffy Sheep',
        url: sheepImg,
        category: 'kawaii'
    },
    {
        id: 'kawaii-unicorn',
        name: 'Magical Unicorn',
        url: unicornImg,
        category: 'kawaii'
    }
];

// Get avatar URL by ID
export function getAvatarUrl(avatarId) {
    // If it's a Google photo URL, return as is
    if (avatarId && avatarId.startsWith('http')) {
        return avatarId;
    }

    // Find from local avatars
    const avatar = avatarImages.find(a => a.id === avatarId);
    return avatar?.url || avatarImages[0].url;
}

// Default avatar for new users
export const DEFAULT_AVATAR = avatarImages[0];
