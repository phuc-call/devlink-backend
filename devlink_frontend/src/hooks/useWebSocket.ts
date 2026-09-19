import { useEffect, useState, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { STORAGE_KEYS, STORAGE_VALUES } from '../constants/storage';
import { WS_SERVICES } from '../constants/wsChat';

export type WsEvent = {
    eventType: string;
    payload: any;
};

export const useWebSocket = (service: 'user' | 'post' | 'chat', topic: string, onMessage: (event: WsEvent) => void) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === STORAGE_VALUES.LOGGED_IN_TRUE;
        if (!isLoggedIn) return;

        const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
        const wsPath = service === 'user'
            ? WS_SERVICES.USER
            : service === 'post'
                ? WS_SERVICES.POST
                : WS_SERVICES.CHAT;
        const wsUrl = `${baseUrl}${wsPath}`;

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
    }, [service, topic]); 

    const sendMessage = (destination: string, body: any) => {
        if (clientRef.current && connected) {
            clientRef.current.publish({ destination, body: JSON.stringify(body) });
        }
    };

    return { connected, sendMessage };
};
