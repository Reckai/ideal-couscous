export const ROUTES = {
    HOME: '/',

    ROOM: {
        ROOT: '/room',
        CREATE: '/room/create',
        JOIN: '/room/join',
        DETAIL: (roomId: string) => `/room/${roomId}`,
    },

    SWIPING: {
        SESSION: (roomId: string) => `/swiping/${roomId}`,
    },

} as const;
