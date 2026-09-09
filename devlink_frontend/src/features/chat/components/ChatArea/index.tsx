import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Paperclip, Image as ImageIcon, Smile, Send, ArrowLeft, MoreHorizontal, Loader2, Check, AlertCircle, RefreshCw, MoreVertical, Trash2, CornerUpLeft, Search, X } from 'lucide-react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { chatApi } from '../../../../api/chat-service/chatApi';
import type { MessageHistoryResponse } from '../../../../types/chat.types';
import styles from './ChatArea.module.css';

export interface SelectedUser {
    userId: number;
    fullName: string;
    avatar?: string;
}

interface ChatAreaProps {
    selectedUser: SelectedUser | null;
    onBack?: () => void;
}

type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';

interface LocalMessage {
    tempId: string;
    serverId?: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    content: string;
    files?: File[];
    filePreviewUrls?: string[];
    status: MessageStatus;
    createdAt: string;
    isLocal: true;
}

type DisplayMessage = (MessageHistoryResponse & { isLocal?: false }) | LocalMessage;

let tempIdCounter = 0;
const genTempId = () => `temp_${Date.now()}_${++tempIdCounter}`;

export default function ChatArea({ selectedUser, onBack }: ChatAreaProps) {
    // Conversation + Messages state
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [serverMessages, setServerMessages] = useState<MessageHistoryResponse[]>([]);
    const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
    const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Input state
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const stompClientRef = useRef<Client | null>(null);
    
    const currentUserId = Number(localStorage.getItem('userId'));
    const currentUserName = localStorage.getItem('fullName') || '';
    const currentUserAvatar = localStorage.getItem('avatar') || undefined;

    

    
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [menuOpenMsgId, setMenuOpenMsgId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{type: 'delete'|'recall', msgId: number} | null>(null);
    const draftsRef = useRef<Record<number, { message: string; files: File[] }>>({});
    const currentInputRef = useRef({ message: '', files: [] as File[] });
    const [activeUserId, setActiveUserId] = useState<number | null>(null);

    // Search state
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<MessageHistoryResponse[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [highlightedMsgId, setHighlightedMsgId] = useState<number | null>(null);
    const [hoveredSearchMsgId, setHoveredSearchMsgId] = useState<number | null>(null);

    // Cập nhật ref mỗi khi user gõ để không bị stale closure
    useEffect(() => {
        currentInputRef.current = { message, files };
    }, [message, files]);

    // Xử lý chuyển đổi người dùng (đổi conversation)
    useEffect(() => {
        const incomingId = selectedUser?.userId || null;
        if (incomingId !== activeUserId) {
            // 1. Lưu draft của người cũ
            if (activeUserId !== null) {
                draftsRef.current[activeUserId] = currentInputRef.current;
            }
            
            // 2. Load draft của người mới (hoặc reset nếu chưa có)
            if (incomingId !== null) {
                const draft = draftsRef.current[incomingId];
                setMessage(draft ? draft.message : '');
                setFiles(draft ? draft.files : []);
            } else {
                setMessage('');
                setFiles([]);
            }
            
            setActiveUserId(incomingId);
        }
    }, [selectedUser?.userId, activeUserId]);

    
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        const urls = files.map(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            if (isImage || isVideo) {
                return URL.createObjectURL(file);
            }
            return '';
        });
        setPreviewUrls(urls);

        // Tránh rò rỉ bộ nhớ bằng cách thu hồi URL khi files thay đổi
        return () => {
            urls.forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [files]);

    // Merge server messages + local pending/failed messages
    const displayMessages: DisplayMessage[] = useMemo(() => {
        const serverIds = new Set(serverMessages.map(m => m.id));
        // Chỉ hiện local messages chưa có trong server list
        const pendingLocal = localMessages.filter(lm =>
            lm.conversationId === conversationId &&
            (!lm.serverId || !serverIds.has(lm.serverId))
        );
        return [...serverMessages, ...pendingLocal];
    }, [serverMessages, localMessages, conversationId]);

    useEffect(() => {
        const handleClickOutside = () => {
            setMenuOpenMsgId(null);
        };
        if (menuOpenMsgId) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [menuOpenMsgId]);

    // Step 1: Khi click vào user → tạo/lấy conversation
    useEffect(() => {
        if (!selectedUser) {
            setConversationId(null);
            setServerMessages([]);
            setLocalMessages([]);
            return;
        }

        setConversationId(null);
        setServerMessages([]);
        setLocalMessages([]);
        setNextCursor(undefined);
        setHasMore(false);

        const fetchConversation = async () => {
            try {
                const res = await chatApi.createOrGetDirectConversation({ receiverId: selectedUser.userId });
                setConversationId(res.data.id);
            } catch (error) {
                console.error('Failed to fetch/create conversation:', error);
            }
        };

        fetchConversation();
    }, [selectedUser]);

    // Step 2: Khi có conversationId → load tin nhắn lần đầu
    useEffect(() => {
        if (!conversationId) return;
        loadMessages(conversationId, undefined, true);
    }, [conversationId]);

    const loadMessages = useCallback(async (convId: number, cursor?: number, isFirst = false) => {
        setLoadingMessages(true);
        try {
            const res = await chatApi.getMessages(convId, cursor);
            const data = res.data;

            setIsBlocked(data.isBlocked);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);

            if (isFirst) {
                setServerMessages([...data.messages].reverse());
            } else {
                setServerMessages(prev => [...[...data.messages].reverse(), ...prev]);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // WebSocket STOMP Connection cho tin nhắn mới
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn || !currentUserId) return;

        const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
        const token = localStorage.getItem('accessToken') || '';
        const wsUrl = `${baseUrl}/ws-chat?token=${token}`;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('[STOMP] Connected to chat-service');
                
                // Lắng nghe tin nhắn mới
                client.subscribe(`/queue/messages/${currentUserId}`, (message: IMessage) => {
                    try {
                        const payload = JSON.parse(message.body);
                        console.log('[STOMP] Received payload:', payload);

                        if (payload.action === 'RECALL_MESSAGE') {
                            setServerMessages(prev => prev.map(m => 
                                m.id === payload.messageId ? { ...m, isRecalled: true, content: '' } : m
                            ));
                            return;
                        }

                        if (payload.action === 'DELETE_MESSAGE_FOR_ME') {
                            setServerMessages(prev => prev.filter(m => m.id !== payload.messageId));
                            return;
                        }

                        const newMsg = payload as MessageHistoryResponse;
                        // Cập nhật vào danh sách nếu đúng conversation đang mở
                        setConversationId(prevConvId => {
                            if (prevConvId === newMsg.conversationId) {
                                setServerMessages(prev => {
                                    // Tránh duplicate nếu là tin nhắn mình vừa gửi (vì đã có optimistic update)
                                    if (prev.some(m => m.id === newMsg.id)) return prev;
                                    return [...prev, newMsg];
                                });
                            }
                            return prevConvId;
                        });
                    } catch (e) {
                        console.error('Failed to parse incoming message', e);
                    }
                });

                // Lắng nghe cập nhật media cho tin nhắn (Async Upload)
                client.subscribe(`/queue/messages/media/${currentUserId}`, (message: IMessage) => {
                    try {
                        const mediaUpdate = JSON.parse(message.body);
                        console.log('[STOMP] Media update received:', mediaUpdate);
                        // Cập nhật serverMessages với media mới
                        setServerMessages(prev => prev.map(msg => {
                            // Backend trả về entity Media, cần kiểm tra messageId
                            if (msg.id === mediaUpdate.message?.id) {
                                return {
                                    ...msg,
                                    mediaList: [...(msg.mediaList || []), mediaUpdate]
                                };
                            }
                            return msg;
                        }));
                    } catch (e) {
                        console.error('Failed to parse incoming media update', e);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, [currentUserId]);

    // Tự scroll xuống cuối khi có tin nhắn mới
    const prevMsgCountRef = useRef(0);
    useEffect(() => {
        if (displayMessages.length > prevMsgCountRef.current) {
            const isInitialLoad = prevMsgCountRef.current === 0;
            messageEndRef.current?.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
        }
        prevMsgCountRef.current = displayMessages.length;
    }, [displayMessages]);

    // Theo dõi trạng thái mạng
    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // Auto-retry khi có mạng lại
    useEffect(() => {
        if (!isOnline) return;
        const failedMessages = localMessages.filter(m => m.status === 'FAILED');
        if (failedMessages.length === 0) return;

        // Retry tất cả tin nhắn FAILED theo thứ tự
        failedMessages.forEach(msg => {
            retrySendMessage(msg.tempId);
        });
    }, [isOnline]);

    // Load thêm tin nhắn cũ khi scroll lên trên
    const handleLoadMore = () => {
        if (conversationId && hasMore && !loadingMessages && nextCursor !== undefined) {
            loadMessages(conversationId, nextCursor);
        }
    };

    

    const sendMessageWithStatus = useCallback(async (localMsg: LocalMessage) => {
        // Cập nhật thành PENDING
        setLocalMessages(prev =>
            prev.map(m => m.tempId === localMsg.tempId ? { ...m, status: 'PENDING' as MessageStatus } : m)
        );

        try {
            const res = await chatApi.sendMessage({
                conversationId: localMsg.conversationId,
                content: localMsg.content,
                files: localMsg.files,
            });

            const sent = res.data;

            // Thành công → cập nhật SENT + serverId
            setLocalMessages(prev =>
                prev.map(m => m.tempId === localMsg.tempId
                    ? { ...m, status: 'SENT' as MessageStatus, serverId: sent.id }
                    : m
                )
            );

            // Thêm vào serverMessages để hiện đúng (với media, attachments từ server)
            const serverMsg: MessageHistoryResponse = {
                id: sent.id,
                conversationId: sent.conversationId,
                senderId: sent.senderId,
                senderName: sent.senderName,
                senderAvatar: sent.senderAvatar,
                content: sent.content,
                isRecalled: false,
                createdAt: sent.createdAt,
                mediaList: [],
                attachmentList: [],
            };
            setServerMessages(prev => [...prev, serverMsg]);

            // Xóa local message sau 2s (đã có server message thay thế)
            setTimeout(() => {
                setLocalMessages(prev => prev.filter(m => m.tempId !== localMsg.tempId));
            }, 2000);

        } catch (error) {
            console.error('Failed to send message:', error);
            // Thất bại → cập nhật FAILED
            setLocalMessages(prev =>
                prev.map(m => m.tempId === localMsg.tempId ? { ...m, status: 'FAILED' as MessageStatus } : m)
            );
        }
    }, []);

    const handleSendMessage = async () => {
        if (!conversationId || (!message.trim() && files.length === 0)) return;

        // Tạo file preview URLs cho local message
        const localFilePreviewUrls = files.map(f => {
            if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
                return URL.createObjectURL(f);
            }
            return '';
        });

        const localMsg: LocalMessage = {
            tempId: genTempId(),
            conversationId,
            senderId: currentUserId,
            senderName: currentUserName,
            senderAvatar: currentUserAvatar,
            content: message.trim(),
            files: [...files],
            filePreviewUrls: localFilePreviewUrls,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            isLocal: true,
        };

        // Thêm vào local messages + clear input ngay
        setLocalMessages(prev => [...prev, localMsg]);
        setMessage('');
        setFiles([]);

        // Gửi async
        sendMessageWithStatus(localMsg);
    };

    const retrySendMessage = useCallback((tempId: string) => {
        const msg = localMessages.find(m => m.tempId === tempId);
        if (!msg) return;
        sendMessageWithStatus(msg);
    }, [localMessages, sendMessageWithStatus]);

    const deleteFailedMessage = (tempId: string) => {
        setLocalMessages(prev => prev.filter(m => m.tempId !== tempId));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
        if (mediaInputRef.current) mediaInputRef.current.value = '';
    };

    // Xử lý paste ảnh từ clipboard (Ctrl+V)
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const imageFiles: File[] = [];
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }
        if (imageFiles.length > 0) {
            e.preventDefault();
            setFiles(prev => [...prev, ...imageFiles]);
        }
    };

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Helpers
    const handleDeleteMessageForMe = async (msgId: number) => {
        try {
            await chatApi.deleteMessageForMe(msgId);
            setMenuOpenMsgId(null);
            // WebSocket sẽ báo về, hoặc có thể optimistic update local state
            setServerMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (e) { console.error('Failed to delete message', e); }
    };

    const handleRecallMessage = async (msgId: number) => {
        try {
            await chatApi.recallMessage(msgId);
            setMenuOpenMsgId(null);
            // WebSocket sẽ báo về
        } catch (e: any) { 
            console.error('Failed to recall message', e); 
            if (e.response?.data?.message) {
                alert(e.response.data.message);
            } else {
                alert("Không thể thu hồi tin nhắn.");
            }
        }
    };

    const handleSearchMessages = async () => {
        if (!conversationId || !searchKeyword.trim()) return;
        setIsSearching(true);
        try {
            const res = await chatApi.searchMessages(conversationId, searchKeyword);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Failed to search messages', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleJumpToMessage = (msgId: number) => {
        setHighlightedMsgId(msgId);
        
        // Find the element and scroll into view
        setTimeout(() => {
            const element = document.getElementById(`msg-${msgId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert('Tin nhắn này ở quá khứ, hiện tại chưa tự động cuộn lên được do chưa được load vào DOM.');
            }
        }, 100);

        // Remove highlight after 3 seconds
        setTimeout(() => {
            setHighlightedMsgId(null);
        }, 3000);
    };

    const initials = selectedUser?.fullName
        ? selectedUser.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '?';

    const formatTime = (dateStr: string) => {
        // Đảm bảo trình duyệt hiểu đây là giờ UTC nếu backend không trả về ký tự 'Z'
        const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
        const d = new Date(utcDateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    
    const renderStatusIcon = (msg: LocalMessage) => {
        switch (msg.status) {
            case 'PENDING':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                        <Loader2
                            size={12}
                            style={{
                                color: '#9CA3AF',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>Đang gửi...</span>
                    </div>
                );
            case 'SENT':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                        <Check size={12} style={{ color: '#10B981' }} />
                        <span style={{ fontSize: '0.65rem', color: '#10B981' }}>Đã gửi</span>
                    </div>
                );
            case 'FAILED':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => retrySendMessage(msg.tempId)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                borderRadius: 4,
                            }}
                            title="Bấm để gửi lại"
                        >
                            <AlertCircle size={14} style={{ color: '#EF4444' }} />
                            <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 500 }}>
                                Gửi thất bại
                            </span>
                            <RefreshCw size={12} style={{ color: '#EF4444' }} />
                        </button>
                        <button
                            onClick={() => deleteFailedMessage(msg.tempId)}
                            style={{
                                fontSize: '0.6rem',
                                color: '#9CA3AF',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px 4px',
                            }}
                            title="Xóa tin nhắn"
                        >
                            Xóa
                        </button>
                    </div>
                );
        }
    };

    
    if (!selectedUser) {
        return (
            <div className={styles.chatArea} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#6B7280', fontSize: '1.125rem' }}>Select a conversation to start chatting</div>
            </div>
        );
    }

    return (
        <div className={styles.chatArea}>
            <div className={styles.chatMain}>
            {/* CSS cho spinner animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    {onBack && (
                        <button className={styles.backBtn} onClick={onBack} title="Quay lại">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt="User Avatar" className={styles.avatar} />
                    ) : (
                        <div className={styles.avatar} style={{ backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#4B5563' }}>
                            {initials}
                        </div>
                    )}
                    <div>
                        <div className={styles.userName}>{selectedUser.fullName}</div>
                        <div className={styles.status}>Active now</div>
                    </div>
                </div>
                {/* Network status indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {!isOnline && (
                        <div style={{ fontSize: '0.75rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                            Mất kết nối
                        </div>
                    )}
                    <button
                        onClick={() => setIsSearchMode(!isSearchMode)}
                        style={{
                            background: isSearchMode ? '#E0F2FE' : 'transparent',
                            color: isSearchMode ? '#0369A1' : '#4B5563',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 8,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        title="Tìm kiếm tin nhắn"
                    >
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {/* ── Vùng hiển thị tin nhắn ───────────────────────────────────── */}
            <div className={styles.messageListWrapper}>
                <div className={styles.messageListContent}>

                    {/* Nút tải thêm tin nhắn cũ */}
                    {hasMore && (
                        <div style={{ textAlign: 'center', padding: '8px' }}>
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMessages}
                                style={{ fontSize: '0.75rem', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {loadingMessages ? 'Đang tải...' : '↑ Tải tin nhắn cũ hơn'}
                            </button>
                        </div>
                    )}

                    {/* Loading lần đầu */}
                    {loadingMessages && serverMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>Đang tải tin nhắn...</div>
                    )}

                    {/* Danh sách tin nhắn */}
                    {displayMessages.map(msg => {
                        const isLocal = 'isLocal' in msg && msg.isLocal;
                        const isMine = isLocal
                            ? (msg as LocalMessage).senderId === currentUserId
                            : (msg as MessageHistoryResponse).senderId === currentUserId;
                        const msgKey = isLocal ? (msg as LocalMessage).tempId : `server-${(msg as MessageHistoryResponse).id}`;
                        const localMsg = isLocal ? msg as LocalMessage : null;
                        const serverMsg = !isLocal ? msg as MessageHistoryResponse : null;
                        const isPending = localMsg?.status === 'PENDING';
                        const isFailed = localMsg?.status === 'FAILED';

                        return (
                            <div
                                key={msgKey}
                                id={serverMsg ? `msg-${serverMsg.id}` : undefined}
                                style={{
                                    display: 'flex',
                                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                                    marginBottom: '8px',
                                    padding: '8px 12px',
                                    opacity: isPending ? 0.7 : 1,
                                    background: serverMsg?.id === highlightedMsgId ? '#FEF3C7' : 'transparent',
                                    transition: 'background 0.5s ease'
                                }}
                                onMouseEnter={() => setHoveredMsgId(msgKey)}
                                onMouseLeave={() => setHoveredMsgId(null)}
                            >
                                {/* Avatar người khác */}
                                {!isMine && (
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginRight: '8px', flexShrink: 0, alignSelf: 'flex-start' }}>
                                        {(serverMsg?.senderAvatar || localMsg?.senderAvatar)
                                            ? <img src={(serverMsg?.senderAvatar || localMsg?.senderAvatar)!} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                            : (serverMsg?.senderName || localMsg?.senderName)?.charAt(0)?.toUpperCase()
                                        }
                                    </div>
                                )}

                                <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ position: 'relative' }}>
                                        {/* Server message content */}
                                        {serverMsg && (
                                            <>
                                                {(serverMsg.isRecalled || serverMsg.recalled) ? (
                                                    <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#F3F4F6', color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.875rem', border: '1px solid #E5E7EB', opacity: 0.6 }}>
                                                        Tin nhắn đã được thu hồi
                                                    </div>
                                                ) : (
                                                    <>
                                                        {serverMsg.content && (
                                                            <div style={{
                                                                padding: '8px 12px',
                                                                borderRadius: '8px',
                                                                background: isMine ? '#E0F2FE' : '#FFFFFF',
                                                                color: '#111827',
                                                                fontSize: '0.9rem',
                                                                wordBreak: 'break-word',
                                                                border: isMine ? '1px solid #BAE6FD' : '1px solid #E5E7EB',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                            }}>
                                                                <div>{serverMsg.content}</div>
                                                                <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '4px', textAlign: 'right', alignSelf: 'flex-end' }}>
                                                                    {formatTime(serverMsg.createdAt)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Hiển thị ảnh / video */}
                                                        {serverMsg.mediaList?.map(media => (
                                                            <div key={media.id} style={{ marginTop: 4 }}>
                                                                {media.mediaType === 'IMAGE' ? (
                                                                    <img
                                                                        src={media.fileUrl}
                                                                        alt="ảnh"
                                                                        style={{
                                                                            width: media.width ? Math.min(media.width, 320) : undefined,
                                                                            height: media.height && media.width
                                                                                ? Math.min(media.width, 320) * (media.height / media.width)
                                                                                : undefined,
                                                                            maxWidth: '100%',
                                                                            borderRadius: 8,
                                                                            display: 'block',
                                                                            cursor: 'pointer',
                                                                            border: '1px solid #E5E7EB',
                                                                        }}
                                                                        onClick={() => window.open(media.fileUrl, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <video
                                                                        src={media.fileUrl}
                                                                        poster={media.thumbnailUrl}
                                                                        controls
                                                                        style={{
                                                                            width: media.width ? Math.min(media.width, 320) : 320,
                                                                            maxWidth: '100%',
                                                                            borderRadius: 8,
                                                                            display: 'block',
                                                                            border: '1px solid #E5E7EB',
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Hiển thị file đính kèm */}
                                                        {serverMsg.attachmentList?.map(att => (
                                                            <div key={att.id} style={{ marginTop: 4 }}>
                                                                <a href={att.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: isMine ? '#0369A1' : '#3B82F6', background: isMine ? '#E0F2FE' : '#FFFFFF', padding: '6px 10px', borderRadius: 8, display: 'inline-block', border: isMine ? '1px solid #BAE6FD' : '1px solid #E5E7EB' }}>
                                                                    📎 {att.fileName}
                                                                </a>
                                                            </div>
                                                        ))}

                                                        {/* Thời gian cho media/attachment nếu không có text */}
                                                        {!serverMsg.content && (serverMsg.mediaList?.length || serverMsg.attachmentList?.length) ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                                                <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                                                    {formatTime(serverMsg.createdAt)}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {/* Local message content (PENDING / FAILED) */}
                                        {localMsg && (
                                            <>
                                                {localMsg.content && (
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        background: isFailed ? '#FEE2E2' : '#E0F2FE',
                                                        color: isFailed ? '#991B1B' : '#111827',
                                                        fontSize: '0.9rem',
                                                        wordBreak: 'break-word',
                                                        border: isFailed ? '1px solid #FECACA' : '1px solid #BAE6FD',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }}>
                                                        <div>{localMsg.content}</div>
                                                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '4px', textAlign: 'right', alignSelf: 'flex-end' }}>
                                                            {formatTime(localMsg.createdAt)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Preview files đang gửi */}
                                                {localMsg.filePreviewUrls && localMsg.filePreviewUrls.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                                        {localMsg.files?.map((file, i) => {
                                                            const url = localMsg.filePreviewUrls?.[i];
                                                            if (file.type.startsWith('image/') && url) {
                                                                return (
                                                                    <img
                                                                        key={i}
                                                                        src={url}
                                                                        alt={file.name}
                                                                        style={{
                                                                            maxWidth: 200,
                                                                            maxHeight: 200,
                                                                            borderRadius: 8,
                                                                            opacity: isPending ? 0.6 : 1,
                                                                            border: isFailed ? '2px solid #EF4444' : '1px solid #E5E7EB',
                                                                        }}
                                                                    />
                                                                );
                                                            }
                                                            if (file.type.startsWith('video/') && url) {
                                                                return (
                                                                    <div key={i} style={{ position: 'relative' }}>
                                                                        <video
                                                                            src={url}
                                                                            style={{
                                                                                maxWidth: 200,
                                                                                maxHeight: 200,
                                                                                borderRadius: 8,
                                                                                opacity: isPending ? 0.6 : 1,
                                                                                border: isFailed ? '2px solid #EF4444' : '1px solid #E5E7EB',
                                                                            }}
                                                                            muted
                                                                            preload="metadata"
                                                                        />
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '50%',
                                                                            left: '50%',
                                                                            transform: 'translate(-50%, -50%)',
                                                                            width: 32,
                                                                            height: 32,
                                                                            borderRadius: '50%',
                                                                            background: 'rgba(0,0,0,0.5)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            color: '#fff',
                                                                            fontSize: 16,
                                                                        }}>
                                                                            ▶
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div key={i} style={{
                                                                    padding: '6px 10px',
                                                                    background: isFailed ? '#FEE2E2' : '#E0F2FE',
                                                                    borderRadius: 8,
                                                                    fontSize: '0.75rem',
                                                                    color: '#374151',
                                                                    opacity: isPending ? 0.6 : 1,
                                                                    border: isFailed ? '1px solid #FECACA' : '1px solid #BAE6FD',
                                                                }}>
                                                                    📎 {file.name}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                
                                                {/* Thời gian cho file đang gửi nếu không có text */}
                                                {!localMsg.content && localMsg.files && localMsg.files.length > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                                            {formatTime(localMsg.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Menu 3 chấm (Hover) */}
                                        {(!isPending && !isFailed && (hoveredMsgId === msgKey || menuOpenMsgId === msgKey)) && serverMsg && (
                                            <div style={{ 
                                                position: 'absolute', 
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                ...(isMine ? { right: '100%', marginRight: 8 } : { left: '100%', marginLeft: 8 }),
                                                zIndex: 10
                                            }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenMsgId(menuOpenMsgId === msgKey ? null : msgKey);
                                                    }}
                                                    style={{
                                                        background: '#F3F4F6', border: 'none', borderRadius: '50%',
                                                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', color: '#4B5563',
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                
                                                {menuOpenMsgId === msgKey && (
                                                    <div style={{
                                                        position: 'absolute', zIndex: 10,
                                                        top: 30, right: isMine ? 0 : 'auto', left: isMine ? 'auto' : 0,
                                                        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: 4, minWidth: 150
                                                    }}>
                                                            <button
                                                                onClick={() => {
                                                                    setConfirmAction({ type: 'delete', msgId: serverMsg.id });
                                                                    setMenuOpenMsgId(null);
                                                                }}
                                                                style={{
                                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                                                    padding: '8px 12px', background: 'none', border: 'none',
                                                                    cursor: 'pointer', fontSize: '0.875rem', color: '#EF4444',
                                                                    textAlign: 'left', borderRadius: 4
                                                                }}
                                                            >
                                                                <Trash2 size={16} /> Xóa phía tôi
                                                            </button>
                                                            {isMine && !(serverMsg.isRecalled || serverMsg.recalled) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setConfirmAction({ type: 'recall', msgId: serverMsg.id });
                                                                        setMenuOpenMsgId(null);
                                                                    }}
                                                                    style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                                                        padding: '8px 12px', background: 'none', border: 'none',
                                                                        cursor: 'pointer', fontSize: '0.875rem', color: '#4B5563',
                                                                        textAlign: 'left', borderRadius: 4, marginTop: 2
                                                                    }}
                                                                >
                                                                    <CornerUpLeft size={16} /> Thu hồi
                                                                </button>
                                                            )}
                                                        </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status icon cho tin nhắn local */}
                                    {localMsg && isMine && renderStatusIcon(localMsg)}
                                </div>
                            </div>

                        );
                    })}

                    <div ref={messageEndRef} />
                </div>
            </div>

            {/* ── Input Area ────────────────────────────────────────────────── */}
            <div className={styles.inputArea}>
                {/* Cảnh báo bị block */}
                {isBlocked && (
                    <div style={{ textAlign: 'center', padding: '6px', color: '#EF4444', fontSize: '0.8rem' }}>
                        Bạn hoặc người dùng này đã chặn nhau. Không thể gửi tin nhắn.
                    </div>
                )}

                {/* File preview - hiển thị trước khi gửi */}
                {files.length > 0 && (
                    <div style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #E5E7EB',
                        marginBottom: 6,
                        background: '#FAFAFA',
                        borderRadius: '8px 8px 0 0',
                    }}>
                        {/* Header preview */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>
                                {files.length} tệp đã chọn
                            </span>
                            <button
                                onClick={() => setFiles([])}
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#EF4444',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                }}
                            >
                                Xóa tất cả
                            </button>
                        </div>

                        {/* Preview list */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {files.map((file, idx) => {
                                const isImage = file.type.startsWith('image/');
                                const isVideo = file.type.startsWith('video/');
                                const previewUrl = previewUrls[idx];

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 4,
                                            maxWidth: 100,
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        {isImage && previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt={file.name}
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                    border: '1px solid #E5E7EB',
                                                }}
                                            />
                                        ) : isVideo && previewUrl ? (
                                            <div style={{ position: 'relative', width: 80, height: 80 }}>
                                                <video
                                                    src={previewUrl}
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        objectFit: 'cover',
                                                        borderRadius: 8,
                                                        border: '1px solid #E5E7EB',
                                                    }}
                                                    muted
                                                    preload="metadata"
                                                />
                                                {/* Play icon overlay */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    background: 'rgba(0,0,0,0.5)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontSize: 14,
                                                }}>
                                                    ▶
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: 80,
                                                height: 80,
                                                background: '#F3F4F6',
                                                borderRadius: 8,
                                                border: '1px solid #E5E7EB',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 4,
                                            }}>
                                                <span style={{ fontSize: 24 }}>📎</span>
                                                <span style={{
                                                    fontSize: '0.6rem',
                                                    color: '#3B82F6',
                                                    fontWeight: 500,
                                                    textTransform: 'uppercase',
                                                }}>
                                                    {file.name.split('.').pop()}
                                                </span>
                                            </div>
                                        )}

                                        {/* File name + size */}
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                color: '#374151',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: 90,
                                            }}>
                                                {file.name}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>

                                        {/* Nút xóa */}
                                        <button
                                            onClick={() => removeFile(idx)}
                                            style={{
                                                position: 'absolute',
                                                top: -6,
                                                right: 4,
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: '#EF4444',
                                                color: '#fff',
                                                border: '2px solid #fff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 10,
                                                fontWeight: 700,
                                                lineHeight: 1,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className={styles.inputContainer}>
                    <div className={styles.inputActions}>
                        <button className={`${styles.iconBtn} ${styles.moreBtn}`} title="More">
                            <MoreHorizontal size={20} />
                        </button>

                        {/* Input file cho tất cả loại file */}
                        <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                        {/* Input riêng cho ảnh/video */}
                        <input type="file" multiple accept="image/*,video/*" ref={mediaInputRef} style={{ display: 'none' }} onChange={handleMediaChange} />

                        <button type="button" className={`${styles.iconBtn} ${styles.desktopOnly}`} title="Đính kèm file" onClick={() => fileInputRef.current?.click()} disabled={isBlocked}>
                            <Paperclip size={20} />
                        </button>
                        <button type="button" className={`${styles.iconBtn} ${styles.desktopOnly}`} title="Gửi ảnh/video" onClick={() => mediaInputRef.current?.click()} disabled={isBlocked}>
                            <ImageIcon size={20} />
                        </button>
                        <button type="button" className={styles.iconBtn} title="Send emoji" disabled={isBlocked}>
                            <Smile size={20} />
                        </button>
                    </div>

                    <input
                        type="text"
                        className={styles.inputBox}
                        placeholder={isBlocked ? 'Không thể gửi tin nhắn' : 'Type a message...'}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        disabled={!conversationId || isBlocked}
                    />

                    <button
                        type="button"
                        className={styles.sendBtn}
                        title="Send message"
                        onClick={handleSendMessage}
                        disabled={!conversationId || isBlocked || (!message.trim() && files.length === 0)}
                        style={{ opacity: (!conversationId || isBlocked || (!message.trim() && files.length === 0)) ? 0.5 : 1 }}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div> {/* Đóng inputArea */}

            {/* Confirm Overlay */}
            {confirmAction && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', padding: 24, borderRadius: 12, width: 320, maxWidth: '90%',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.125rem', color: '#111827' }}>
                            Xác nhận {confirmAction.type === 'delete' ? 'xóa' : 'thu hồi'}
                        </h3>
                        <p style={{ margin: '0 0 20px 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                            {confirmAction.type === 'delete' 
                                ? 'Bạn có chắc chắn muốn xóa tin nhắn này phía bạn?' 
                                : 'Bạn có chắc chắn muốn thu hồi tin nhắn này? Mọi người sẽ không thấy nữa.'}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmAction(null)}
                                style={{
                                    padding: '8px 16px', background: '#F3F4F6', color: '#4B5563',
                                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction.type === 'delete') handleDeleteMessageForMe(confirmAction.msgId);
                                    else handleRecallMessage(confirmAction.msgId);
                                    setConfirmAction(null);
                                }}
                                style={{
                                    padding: '8px 16px', background: confirmAction.type === 'delete' ? '#EF4444' : '#3B82F6',
                                    color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
                                }}
                            >
                                {confirmAction.type === 'delete' ? 'Xóa' : 'Thu hồi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div> {/* End chatMain */}

            {/* Right Sidebar */}
            <div className={styles.rightSidebar} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {isSearchMode ? (
                    <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Tìm kiếm tin nhắn</h3>
                            <button
                                onClick={() => setIsSearchMode(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input
                                type="text"
                                placeholder="Nhập từ khóa..."
                                value={searchKeyword}
                                onChange={e => setSearchKeyword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearchMessages()}
                                style={{
                                    flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                                    outline: 'none', fontSize: '0.875rem'
                                }}
                            />
                            <button
                                onClick={handleSearchMessages}
                                disabled={isSearching || !searchKeyword.trim()}
                                style={{
                                    background: '#0369A1', color: '#fff', border: 'none', borderRadius: 8,
                                    padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                            >
                                {isSearching ? <Loader2 size={16} className={styles.spin} /> : <Search size={16} />}
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {searchResults.length === 0 && searchKeyword && !isSearching && (
                                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', marginTop: 32 }}>
                                    Không tìm thấy tin nhắn nào
                                </div>
                            )}
                            {searchResults.map(msg => (
                                <div
                                    key={msg.id}
                                    style={{
                                        padding: 12, borderBottom: '1px solid #E5E7EB', cursor: 'pointer',
                                        transition: 'background 0.2s', position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#F3F4F6';
                                        setHoveredSearchMsgId(msg.id);
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        setHoveredSearchMsgId(null);
                                    }}
                                    onClick={() => handleJumpToMessage(msg.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        {msg.senderAvatar ? (
                                            <img src={msg.senderAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600 }}>
                                                {msg.senderName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{msg.senderName}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#6B7280', marginLeft: 'auto' }}>
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#4B5563', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {msg.content}
                                    </div>

                                    {hoveredSearchMsgId === msg.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJumpToMessage(msg.id);
                                            }}
                                            style={{
                                                position: 'absolute', bottom: 8, right: 12,
                                                background: '#E0F2FE', color: '#0369A1',
                                                border: '1px solid #BAE6FD', borderRadius: 4,
                                                padding: '4px 8px', fontSize: '0.75rem', fontWeight: 500,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                            }}
                                        >
                                            Xem tin nhắn gốc
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {selectedUser.avatar ? (
                            <img src={selectedUser.avatar} alt="User Avatar" className={styles.rightSidebarAvatar} />
                        ) : (
                            <div className={styles.rightSidebarAvatar}>
                                {initials}
                            </div>
                        )}
                        <div className={styles.rightSidebarName}>{selectedUser.fullName}</div>
                        {/* Dành cho các chức năng tương lai */}
                    </>
                )}
            </div>
        </div>
    );
}
