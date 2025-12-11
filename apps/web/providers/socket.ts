import {io, Socket} from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
const fullUrl = `${WS_URL}/matching`;
console.log('Socket URL:', fullUrl, '| env:', process.env.NEXT_PUBLIC_WS_URL);

export const socket: Socket = io(fullUrl, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,

});