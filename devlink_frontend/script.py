import re

with open('src/features/chat/components/ChatArea/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

unified_block = '''
                                        {/* Unified Message Content */}
                                        {msg.isRecalled ? (
                                            <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#F3F4F6', color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.875rem', border: '1px solid #E5E7EB', opacity: 0.6 }}>
                                                Tin nh?n dã du?c thu h?i
                                            </div>
                                        ) : (
                                            <>
                                                {msg.content && (
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        background: isFailed ? '#FEE2E2' : (isMine ? '#E0F2FE' : '#FFFFFF'),
                                                        color: isFailed ? '#991B1B' : '#111827',
                                                        fontSize: '0.9rem',
                                                        wordBreak: 'break-word',
                                                        border: isFailed ? '1px solid #FECACA' : (isMine ? '1px solid #BAE6FD' : '1px solid #E5E7EB'),
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }}>
                                                        <div>{msg.content}</div>
                                                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '4px', textAlign: 'right', alignSelf: 'flex-end' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Hi?n th? ?nh / video t? Server */}
                                                {msg.mediaList?.map(media => (
                                                    <div key={media.id} style={{ marginTop: 4 }}>
                                                        {media.mediaType === 'IMAGE' ? (
                                                            <img
                                                                src={media.fileUrl}
                                                                alt="?nh"
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

                                                {/* Hi?n th? file dính kèm t? Server */}
                                                {msg.attachmentList?.map(att => (
                                                    <div key={att.id} style={{ marginTop: 4 }}>
                                                        <a href={att.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: isMine ? '#0369A1' : '#3B82F6', background: isMine ? '#E0F2FE' : '#FFFFFF', padding: '6px 10px', borderRadius: 8, display: 'inline-block', border: isMine ? '1px solid #BAE6FD' : '1px solid #E5E7EB' }}>
                                                            ?? {att.fileName}
                                                        </a>
                                                    </div>
                                                ))}

                                                {/* Preview files dang g?i (Local) */}
                                                {msg.filePreviewUrls && msg.filePreviewUrls.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                                        {msg.files?.map((file, i) => {
                                                            const url = msg.filePreviewUrls?.[i];
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
                                                                            color: 'white'
                                                                        }}>
                                                                            ?
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
                                                                    ?? {file.name}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Th?i gian cho media/attachment/files n?u không có text */}
                                                {!msg.content && (msg.mediaList?.length || msg.attachmentList?.length || msg.files?.length) ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
'''

pattern = r'\{\/\*\s*Server message content\s*\*\/\}.*?\{\/\*\s*Th?i gian\s*\*\/\}'
content = re.sub(pattern, unified_block + '\n                                    {/* Th?i gian */}', content, flags=re.DOTALL)

with open('src/features/chat/components/ChatArea/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
