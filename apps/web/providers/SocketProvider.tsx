'use client'
import { Socket} from "socket.io-client";
import React, {createContext, useContext, useEffect, useState} from "react";
import {socket} from "@/providers/socket";

interface SocketContextType {
    socket: Socket| null;
    isConnected:boolean;
    connectionError: Error | null;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected:false,
  connectionError: null,
})

export const useSocket = ()=> {
   const context =  useContext(SocketContext);
   if(context === undefined){
       throw new Error("'useSocket must be used within a SocketProvider");
   }
   return context;
}


export const SocketProvider = ({children}:{children:React.ReactNode})=>{
 const [isConnected,setIsConnected]=useState(false);
 const [connectionError, setConnectionError] = useState<Error|null>(null);
console.log(process.env.NEXT_PUBLIC_WS_URL)
 useEffect(()=>{


         const onConnect = ()=> {
             setIsConnected(true);
             setConnectionError(null);
         }

         const onDisconnect = ()=>{
             setIsConnected(false);
         }
         const onConnectionError = (error:Error)=>{
             setIsConnected(false);
             setConnectionError(error);
         }


     socket.on('connect', onConnect);
     socket.on('disconnect', onDisconnect);
     socket.on('connect_error', onConnectionError)

     socket.connect();


     return ()=>{
         socket.off("connect", onConnect);
         socket.off("disconnect", onDisconnect);
         socket.disconnect();
     }
 },[])

    return (
        <SocketContext.Provider value={{socket: socket, isConnected,connectionError}}>
            {children}
        </SocketContext.Provider>
    )

}