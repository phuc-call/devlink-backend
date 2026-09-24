import { useState, useEffect } from 'react';
import { chatApi } from '../../../../api/chat-service/chatApi';
import { Video, File, Loader2 } from 'lucide-react';

interface MediaPanelProps {
    conversationId: number | null;
}

export default function ConversationMediaPanel({ conversationId }: MediaPanelProps) {
    const [mediaList, setMediaList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterType, setFilterType] = useState<'' | 'IMAGE' | 'VIDEO' | 'FILE'>('');
    // Optionally filters by uploaderId, fromDate, toDate could be added easily in UI as well

    useEffect(() => {
        if (!conversationId) return;

        const fetchMedia = async () => {
            setIsLoading(true);
            try {
                const response = await chatApi.getConversationMedia(conversationId, {
                    mediaType: filterType ? filterType as any : undefined,
                    page: 0,
                    size: 30 // hardcoded size for now just for viewing
                });

                if (response.success && response.data) {
                    setMediaList(response.data.content || []);
                }
            } catch (e) {
                console.error("Failed to fetch media", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMedia();

        const handleUpdate = () => fetchMedia();
        window.addEventListener('chat_media_updated', handleUpdate);
        return () => window.removeEventListener('chat_media_updated', handleUpdate);
    }, [conversationId, filterType]);

    if (!conversationId) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#111827' }}>Ảnh/Cột gửi trong chat</h3>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
                <button onClick={() => setFilterType('')} style={{ background: filterType === '' ? '#E0F2FE' : '#F3F4F6', color: filterType === '' ? '#0369A1' : '#4B5563', border: 'none', borderRadius: 16, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                    Tất cả
                </button>
                <button onClick={() => setFilterType('IMAGE')} style={{ background: filterType === 'IMAGE' ? '#E0F2FE' : '#F3F4F6', color: filterType === 'IMAGE' ? '#0369A1' : '#4B5563', border: 'none', borderRadius: 16, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                    Hình ảnh
                </button>
                <button onClick={() => setFilterType('VIDEO')} style={{ background: filterType === 'VIDEO' ? '#E0F2FE' : '#F3F4F6', color: filterType === 'VIDEO' ? '#0369A1' : '#4B5563', border: 'none', borderRadius: 16, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                    Video
                </button>
                <button onClick={() => setFilterType('FILE')} style={{ background: filterType === 'FILE' ? '#E0F2FE' : '#F3F4F6', color: filterType === 'FILE' ? '#0369A1' : '#4B5563', border: 'none', borderRadius: 16, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                    File
                </button>
            </div>

            {/* Media Grid */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} /></div>
                ) : mediaList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.85rem', padding: 20 }}>
                        Không có hình ảnh/file nào
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                        {mediaList.map((m: any) => {
                            const isImage = m.mediaType === 'IMAGE';
                            const isVideo = m.mediaType === 'VIDEO';
                            const isFile = m.mediaType === 'FILE';

                            return (
                                <div key={m.id} style={{ aspectRatio: '1/1', background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                                    onClick={() => window.open(m.fileUrl, '_blank')}
                                    title={m.fileName}>
                                    {isImage && <img src={m.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    {isVideo && (
                                        <>
                                            {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Video size={20} color="#9CA3AF" />}
                                            <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: 4 }}>{m.duration ? m.duration + 's' : 'Video'}</div>
                                        </>
                                    )}
                                    {isFile && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                                            <File size={24} color="#6B7280" />
                                            <span style={{ fontSize: '0.6rem', color: '#4B5563', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', marginTop: 4 }}>{m.fileName}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
