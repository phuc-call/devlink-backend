import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalConversationConfig } from '../../../utils/db';
import { chatApi } from '../../../api/chat-service/chatApi';

export function useConversationConfig(conversationId: number | null) {
    const [isLoading, setIsLoading] = useState(false);

    // Watch local indexedDB real-time whenever conversationId changes
    const config = useLiveQuery(
        () => conversationId ? db.conversationConfigs.get(String(conversationId)) : Promise.resolve(undefined),
        [conversationId]
    );

    // Fetch from API to ensure we have the latest if we just came online / to sync
    useEffect(() => {
        if (!conversationId) return;

        const checkConfig = async () => {
            const isOnline = navigator.onLine;
            if (!isOnline) {
                return;
            }

            try {
                const response = await chatApi.getConfig(conversationId);
                if (response.success && response.data) {
                    await db.conversationConfigs.put({
                        conversationId: String(response.data.conversationId),
                        themeColor: response.data.themeColor,
                        backgroundImageUrl: response.data.backgroundImageUrl
                    });
                }
            } catch (error) {
                console.error("Failed to sync config for conversation", conversationId, error);
            }
        };

        checkConfig();
    }, [conversationId]);

    const updateThemeConfig = async (themeColor?: string, backgroundFile?: File) => {
        if (!conversationId) return;
        setIsLoading(true);
        try {
            // Predictively / or we can wait for WS. We'll let the user wait for WS / API response.
            // But we can directly put the return to LocalDB if we want.
            const response = await chatApi.updateConfig(conversationId, themeColor, backgroundFile);
            if (response.success && response.data) {
                await db.conversationConfigs.put({
                    conversationId: String(response.data.conversationId),
                    themeColor: response.data.themeColor,
                    backgroundImageUrl: response.data.backgroundImageUrl
                });
            }
            return response.data;
        } catch (error) {
            console.error("Failed to update conversation config", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        config: config || {
            conversationId: String(conversationId),
            themeColor: '#0084ff',
            backgroundImageUrl: null
        } as LocalConversationConfig,
        isLoading,
        updateThemeConfig
    };
}
