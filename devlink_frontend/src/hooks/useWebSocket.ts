import { useEffect, useState, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type WsEvent = {
    eventType: string;
    payload: any;
};

export const useWebSocket = (service: 'user' | 'post', topic: string, onMessage: (event: WsEvent) => void) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) return;

        const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
        const wsUrl = service === 'user' ? `${baseUrl}/ws-user` : `${baseUrl}/ws-post`;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setConnected(true);
                client.subscribe(topic, (message: IMessage) => {
                    try {
                        const data: WsEvent = JSON.parse(message.body);
                        onMessage(data);
                    } catch (e) {
                        console.error('Failed to parse websocket message', e);
                    }
                });
            },
            onDisconnect: () => {
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [service, topic]); // Notice we exclude onMessage to prevent reconnect loops, you should ensure onMessage is stable or use a ref inside the effect if it changes often

    return { connected };
};
