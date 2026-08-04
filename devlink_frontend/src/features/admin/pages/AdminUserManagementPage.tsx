import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Tag, Image, Video, Link as LinkIcon, FileText, Eye, Trash2, Plus, Users as UsersIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminUserApi } from '../../../api/post-service/adminApi';
import type { AdminUserResponse, AdminUserDetailResponse, UserInterestSummary, MediaItem, PostLinkItem } from '../../../api/post-service/adminApi';

type ContentTab = 'interests' | 'posts' | 'images' | 'videos' | 'files' | 'links';

const THEME = {
    font: "'Inter', sans-serif",
    colors: {
        primary: { 50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        neutral: { 0: '#FFFFFF', 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827' },
        success: { 50: '#F0FDF4', 500: '#22C55E', 600: '#16A34A' },
        error: { 50: '#FEF2F2', 500: '#EF4444', 600: '#DC2626' },
        bg: { app: '#F0F2F5', card: '#FFFFFF', input: '#F3F4F6' },
    },
    text: { h1: '24px', h2: '20px', h3: '18px', h4: '16px', body: '14px', bodySm: '13px', caption: '12px', xs: '11px' },
    spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px' },
    radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    shadow: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.07)', lg: '0 10px 15px rgba(0,0,0,0.10)' },
};

export default function AdminUserManagementPage() {
    const [users, setUsers] = useState<AdminUserResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{type:'success'|'error';msg:string}|null>(null);
    const [hovered, setHovered] = useState<AdminUserResponse|null>(null);
    const [selected, setSelected] = useState<{user: AdminUserResponse; detail: AdminUserDetailResponse}|null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [tab, setTab] = useState<ContentTab>('interests');
    const [contentPage, setContentPage] = useState(0);
    const [interests, setInterests] = useState<{data: UserInterestSummary[]; total: number}>({data:[],total:0});
    const [media, setMedia] = useState<{data: MediaItem[]; total: number}>({data:[],total:0});
    const [links, setLinks] = useState<{data: PostLinkItem[]; total: number}>({data:[],total:0});
    const [addTags, setAddTags] = useState('');
    const searchTimeout = useRef<ReturnType<typeof setTimeout>|null>(null);
    const SIZE = 15;
    const [searchParams] = useSearchParams();

    const toast = (type: 'success'|'error', msg: string) => { setStatus({type, msg}); setTimeout(() => setStatus(null), 4000); };

    const loadUsers = useCallback(async (p = 0, q = search) => {
        setLoading(true);
        try {
            const res = await adminUserApi.listUsers(q || undefined, p, SIZE);
            const d = res.data?.data;
            setUsers(d?.content ?? []);
            setTotal(d?.totalElements ?? 0);
            setPage(p);
        } catch { toast('error', 'Failed to load users'); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { 
        void loadUsers(0); 
        const uid = searchParams.get('userId');
        if (uid) {
            openUserById(Number(uid));
        }
    }, []);

    const openUserById = async (uid: number) => {
        setDetailLoading(true); setTab('interests'); setContentPage(0);
        try {
            const detailRes = await adminUserApi.getDetail(uid);
            const detail = detailRes.data?.data;
            if (detail) {
                const mockUser: AdminUserResponse = {
                    userId: detail.userId,
                    userName: detail.userName,
                    avatarUrl: detail.avatarUrl,
                    interestCount: detail.interests.length,
                    topInterests: detail.interests.slice(0, 3).map(i => i.tag),
                    lastActivity: detail.lastActivity,
                    viewedPostCount: detail.viewedPostCount
                };
                setSelected({ user: mockUser, detail });
                void loadContent('interests', uid, 0);
            }
        } catch { toast('error', 'Failed to load user detail'); }
        finally { setDetailLoading(false); }
    };

    const handleSearch = (v: string) => {
        setSearch(v);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => void loadUsers(0, v), 400);
    };

    const openUser = async (user: AdminUserResponse) => {
        setDetailLoading(true); setTab('interests'); setContentPage(0);
        try {
            const [detailRes] = await Promise.all([adminUserApi.getDetail(user.userId)]);
            setSelected({ user, detail: detailRes.data?.data });
            void loadContent('interests', user.userId, 0);
        } catch { toast('error', 'Failed to load user detail'); }
        finally { setDetailLoading(false); }
    };

    const loadContent = async (t: ContentTab, uid: number, p: number) => {
        try {
            if (t === 'interests') {
                const res = await adminUserApi.getInterests(uid, p); const d = res.data?.data; setInterests({data: d?.content ?? [], total: d?.totalElements ?? 0});
            } else if (t === 'images') {
                const res = await adminUserApi.getViewedImages(uid, p); const d = res.data?.data; setMedia({data: d?.content ?? [], total: d?.totalElements ?? 0});
            } else if (t === 'videos') {
                const res = await adminUserApi.getViewedVideos(uid, p); const d = res.data?.data; setMedia({data: d?.content ?? [], total: d?.totalElements ?? 0});
            } else if (t === 'files') {
                const res = await adminUserApi.getViewedFiles(uid, p); const d = res.data?.data; setMedia({data: d?.content ?? [], total: d?.totalElements ?? 0});
            } else if (t === 'links') {
                const res = await adminUserApi.getViewedLinks(uid, p); const d = res.data?.data; setLinks({data: d?.content ?? [], total: d?.totalElements ?? 0});
            }
        } catch { toast('error', 'Failed to load content'); }
    };

    const switchTab = (t: ContentTab) => {
        setTab(t); setContentPage(0);
        if (selected) void loadContent(t, selected.user.userId, 0);
    };

    const changePage = (p: number) => {
        setContentPage(p);
        if (selected) void loadContent(tab, selected.user.userId, p);
    };

    const handleAddInterests = async () => {
        if (!selected || !addTags.trim()) return;
        const tags = addTags.split(',').map(t => t.trim()).filter(Boolean);
        try { await adminUserApi.addInterests(selected.user.userId, tags); toast('success', 'Interests added'); setAddTags(''); void loadContent('interests', selected.user.userId, 0); }
        catch { toast('error', 'Failed to add interests'); }
    };

    const handleRemoveInterest = async (tag: string) => {
        if (!selected) return;
        try { await adminUserApi.removeInterest(selected.user.userId, tag); void loadContent('interests', selected.user.userId, contentPage); toast('success', `Removed #${tag}`); }
        catch { toast('error', 'Remove failed'); }
    };

    const handleClearInterests = async () => {
        if (!selected || !confirm('Clear ALL interests for this user?')) return;
        try { await adminUserApi.clearInterests(selected.user.userId); void loadContent('interests', selected.user.userId, 0); toast('success', 'All interests cleared'); }
        catch { toast('error', 'Clear failed'); }
    };

    const totalPages = Math.ceil(total / SIZE);
    const contentPages = Math.ceil((tab === 'links' ? links.total : tab === 'interests' ? interests.total : media.total) / 10);

    const TABS: {key: ContentTab; label: string; icon: React.ReactNode}[] = [
        {key:'interests', label:'Interests', icon:<Tag size={14}/>},
        {key:'posts', label:'Viewed Posts', icon:<Eye size={14}/>},
        {key:'images', label:'Images', icon:<Image size={14}/>},
        {key:'videos', label:'Videos', icon:<Video size={14}/>},
        {key:'files', label:'Files', icon:<FileText size={14}/>},
        {key:'links', label:'Links', icon:<LinkIcon size={14}/>},
    ];

    return (
        <div style={{fontFamily: THEME.font, display:'flex', gap: THEME.spacing[6], height:'100%', overflow:'hidden'}}>
            {/* Left: User List */}
            <div style={{width: 320, flexShrink: 0, display:'flex', flexDirection:'column', gap: THEME.spacing[3]}}>
                <div>
                    <h1 style={{margin:0, fontSize: THEME.text.h3, fontWeight:700, color: THEME.colors.neutral[900]}}>User Management</h1>
                    <p style={{margin:`${THEME.spacing[1]} 0 0`, fontSize: THEME.text.caption, color: THEME.colors.neutral[500]}}>{total} users · click to preview</p>
                </div>
                {status && <div style={{padding: THEME.spacing[3], borderRadius: THEME.radius.md, background: status.type==='success' ? THEME.colors.success[50] : THEME.colors.error[50], color: status.type==='success' ? THEME.colors.success[600] : THEME.colors.error[500], fontSize: THEME.text.bodySm, fontWeight:600}}>{status.msg}</div>}
                
                <div style={{position:'relative'}}>
                    <Search size={16} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: THEME.colors.neutral[400]}}/>
                    <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search users..." style={{width:'100%', boxSizing:'border-box', padding: `10px 12px 10px 36px`, borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.neutral[200]}`, fontSize: THEME.text.body, outline:'none', background: THEME.colors.neutral[0], color: THEME.colors.neutral[900]}}/>
                </div>
                
                <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap: THEME.spacing[2], paddingRight: 4}}>
                    {loading && users.length===0 ? <div style={{textAlign:'center', padding: '40px', color: THEME.colors.neutral[400]}}>Loading...</div> :
                    users.map(u => (
                        <div key={u.userId} onClick={() => void openUser(u)} onMouseEnter={() => setHovered(u)} onMouseLeave={() => setHovered(null)}
                            style={{padding: THEME.spacing[3], borderRadius: THEME.radius.md, cursor:'pointer', background: selected?.user.userId===u.userId ? THEME.colors.primary[50] : hovered?.userId===u.userId ? THEME.colors.neutral[50] : THEME.colors.neutral[0], border:`1px solid ${selected?.user.userId===u.userId ? THEME.colors.primary[200] : THEME.colors.neutral[200]}`, transition:'all 0.15s', boxShadow: THEME.shadow.sm}}>
                            <div style={{display:'flex', alignItems:'center', gap: THEME.spacing[3]}}>
                                <div style={{width: 40, height: 40, borderRadius:'50%', background:`hsl(${u.userId*47%360},60%,70%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: THEME.text.body, fontWeight:700, color: THEME.colors.neutral[0], flexShrink:0, overflow:'hidden'}}>
                                    {u.avatarUrl ? <img src={u.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : u.userName[0]?.toUpperCase()}
                                </div>
                                <div style={{flex:1, minWidth:0}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: THEME.spacing[1]}}>
                                        <div style={{fontSize: THEME.text.body, fontWeight:600, color: THEME.colors.neutral[900], whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.userName}</div>
                                        <div style={{fontSize: THEME.text.xs, color: THEME.colors.neutral[400]}}>#{u.userId}</div>
                                    </div>
                                    <div style={{display:'flex', gap: THEME.spacing[1], flexWrap:'wrap'}}>
                                        {u.topInterests?.length > 0 ? u.topInterests.map(tag => (
                                            <span key={tag} style={{fontSize: THEME.text.xs, padding:`2px 6px`, background: THEME.colors.neutral[100], color: THEME.colors.neutral[600], borderRadius: THEME.radius.sm, fontWeight:600}}>#{tag}</span>
                                        )) : <span style={{fontSize: THEME.text.xs, color: THEME.colors.neutral[400]}}>No tags yet</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {totalPages > 1 && (
                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap: THEME.spacing[2], paddingTop: THEME.spacing[2]}}>
                        <button onClick={() => void loadUsers(page-1)} disabled={page===0} style={pBtn}><ChevronLeft size={16} color={THEME.colors.neutral[500]}/></button>
                        <span style={{fontSize: THEME.text.bodySm, color: THEME.colors.neutral[500]}}>{page+1}/{totalPages}</span>
                        <button onClick={() => void loadUsers(page+1)} disabled={page>=totalPages-1} style={pBtn}><ChevronRight size={16} color={THEME.colors.neutral[500]}/></button>
                    </div>
                )}
            </div>

            {/* Right: Detail */}
            <div style={{flex:1, overflowY:'auto', background: THEME.colors.neutral[0], borderRadius: THEME.radius.xl, border:`1px solid ${THEME.colors.neutral[200]}`, padding: THEME.spacing[6], boxShadow: THEME.shadow.md}}>
                {detailLoading ? <div style={{textAlign:'center', padding: '48px', color: THEME.colors.neutral[400]}}>Loading detail...</div> :
                !selected ? (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color: THEME.colors.neutral[400]}}>
                        <div style={{width: 96, height: 96, borderRadius:'50%', background: THEME.colors.primary[50], display:'flex', alignItems:'center', justifyContent:'center', marginBottom: THEME.spacing[5]}}>
                            <UsersIcon size={48} style={{color: THEME.colors.primary[500]}}/>
                        </div>
                        <div style={{fontSize: THEME.text.h2, fontWeight: 700, color: THEME.colors.neutral[900], marginBottom: THEME.spacing[2]}}>User Profiles & Interests</div>
                        <div style={{fontSize: THEME.text.body, color: THEME.colors.neutral[500], textAlign:'center', maxWidth: 400, lineHeight: 1.5}}>
                            Select a user from the left panel to view their detailed profile, modify their interests, and see their interaction history across the platform.
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* User header */}
                        <div style={{display:'flex', alignItems:'center', gap: THEME.spacing[4], marginBottom: THEME.spacing[6], paddingBottom: THEME.spacing[5], borderBottom:`1px solid ${THEME.colors.neutral[100]}`}}>
                            <div style={{width: 64, height: 64, borderRadius:'50%', background:`hsl(${selected.user.userId*47%360},60%,70%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: THEME.text.h2, fontWeight:700, color: THEME.colors.neutral[0], overflow:'hidden', flexShrink:0}}>
                                {selected.detail?.avatarUrl ? <img src={selected.detail.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : selected.user.userName[0]?.toUpperCase()}
                            </div>
                            <div style={{flex:1}}>
                                <div style={{fontSize: THEME.text.h2, fontWeight:700, color: THEME.colors.neutral[900], marginBottom: THEME.spacing[1]}}>{selected.user.userName}</div>
                                <div style={{fontSize: THEME.text.body, color: THEME.colors.neutral[500]}}>ID: {selected.user.userId} · {selected.detail?.viewedPostCount ?? 0} posts viewed · {selected.detail?.totalInteractions ?? 0} interactions</div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{padding: THEME.spacing[2], borderRadius: THEME.radius.md, border:`1px solid ${THEME.colors.neutral[200]}`, background: THEME.colors.neutral[0], cursor:'pointer', color: THEME.colors.neutral[500]}}><X size={16}/></button>
                        </div>

                        {/* Tag groups */}
                        {(selected.detail?.tagGroups ?? []).length > 0 && (
                            <div style={{marginBottom: THEME.spacing[6]}}>
                                <div style={{fontSize: THEME.text.body, fontWeight:600, color: THEME.colors.neutral[700], marginBottom: THEME.spacing[3]}}>Assigned Tag Groups</div>
                                <div style={{display:'flex', flexWrap:'wrap', gap: THEME.spacing[2]}}>
                                    {selected.detail.tagGroups.map(g => (
                                        <span key={g.groupId} style={{background: THEME.colors.success[50], color: THEME.colors.success[600], fontSize: THEME.text.bodySm, padding:`6px 12px`, borderRadius: THEME.radius.full, border:`1px solid #BBF7D0`, fontWeight:600}}>{g.groupName} <span style={{fontWeight:400, color:'#86EFAC'}}>({g.assignmentType})</span></span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content Tabs */}
                        <div style={{display:'flex', gap: THEME.spacing[2], marginBottom: THEME.spacing[5], flexWrap:'wrap', borderBottom: `1px solid ${THEME.colors.neutral[200]}`, paddingBottom: THEME.spacing[2]}}>
                            {TABS.map(t => (
                                <button key={t.key} onClick={() => switchTab(t.key)} style={{display:'flex', alignItems:'center', gap: THEME.spacing[2], padding:`8px 16px`, borderRadius: THEME.radius.full, border:'none', background: tab===t.key ? THEME.colors.primary[500] : THEME.colors.neutral[100], color: tab===t.key ? THEME.colors.neutral[0] : THEME.colors.neutral[600], cursor:'pointer', fontSize: THEME.text.bodySm, fontWeight:600, transition: 'all 0.2s'}}>{t.icon}{t.label}</button>
                            ))}
                        </div>

                        {/* Interests Tab */}
                        {tab === 'interests' && (
                            <div>
                                <div style={{display:'flex', gap: THEME.spacing[2], marginBottom: THEME.spacing[4]}}>
                                    <input value={addTags} onChange={e => setAddTags(e.target.value)} placeholder="Add tags (comma-separated)" style={{flex:1, padding:`10px 14px`, borderRadius: THEME.radius.md, border:`1px solid ${THEME.colors.neutral[200]}`, fontSize: THEME.text.body, outline:'none', background: THEME.colors.bg.input}} onKeyDown={e => e.key==='Enter' && void handleAddInterests()}/>
                                    <button onClick={handleAddInterests} style={{padding:`10px 20px`, borderRadius: THEME.radius.md, border:'none', background: THEME.colors.primary[500], color: THEME.colors.neutral[0], cursor:'pointer', fontSize: THEME.text.body, fontWeight:600, display:'flex', alignItems:'center', gap: THEME.spacing[1]}}><Plus size={16}/>Add</button>
                                    <button onClick={handleClearInterests} style={{padding:`10px 16px`, borderRadius: THEME.radius.md, border:`1px solid ${THEME.colors.error[50]}`, background: THEME.colors.error[50], cursor:'pointer'}} title="Clear all"><Trash2 size={16} color={THEME.colors.error[500]}/></button>
                                </div>
                                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap: THEME.spacing[3]}}>
                                    {interests.data.map(i => (
                                        <div key={i.id} style={{background: THEME.colors.neutral[50], borderRadius: THEME.radius.md, padding:`12px 16px`, display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${THEME.colors.neutral[100]}`}}>
                                            <div>
                                                <div style={{fontSize: THEME.text.body, fontWeight:600, color: THEME.colors.neutral[900]}}>#{i.tag}</div>
                                                <div style={{fontSize: THEME.text.caption, color: THEME.colors.neutral[500]}}>Score: {i.score?.toFixed(1)}</div>
                                            </div>
                                            <button onClick={() => void handleRemoveInterest(i.tag)} style={{border:'none', background:'none', cursor:'pointer', padding: THEME.spacing[1]}}><X size={14} color={THEME.colors.neutral[400]}/></button>
                                        </div>
                                    ))}
                                    {interests.data.length === 0 && <div style={{gridColumn:'1/-1', textAlign:'center', padding: THEME.spacing[8], color: THEME.colors.neutral[400], fontSize: THEME.text.body}}>No interests yet</div>}
                                </div>
                            </div>
                        )}

                        {/* Images/Videos/Files Tab */}
                        {(tab==='images'||tab==='videos'||tab==='files') && (
                            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap: THEME.spacing[3]}}>
                                {media.data.map(m => (
                                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" style={{borderRadius: THEME.radius.md, overflow:'hidden', border:`1px solid ${THEME.colors.neutral[200]}`, textDecoration:'none', display:'block'}}>
                                        {m.mediaType==='IMAGE' ? <img src={m.url} style={{width:'100%', height:140, objectFit:'cover', display:'block'}} alt={m.originalName}/> :
                                         m.mediaType==='VIDEO' ? <video src={m.url} style={{width:'100%', height:140, objectFit:'cover', display:'block'}}/> :
                                         <div style={{height:140, background: THEME.colors.neutral[50], display:'flex', alignItems:'center', justifyContent:'center'}}><FileText size={32} color={THEME.colors.neutral[300]}/></div>}
                                        <div style={{padding:`8px 12px`, fontSize: THEME.text.bodySm, color: THEME.colors.neutral[700], whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: 500}}>{m.originalName}</div>
                                    </a>
                                ))}
                                {media.data.length===0 && <div style={{gridColumn:'1/-1', textAlign:'center', padding: THEME.spacing[8], color: THEME.colors.neutral[400]}}>No {tab} found</div>}
                            </div>
                        )}

                        {/* Links Tab */}
                        {tab==='links' && (
                            <div style={{display:'flex', flexDirection:'column', gap: THEME.spacing[2]}}>
                                {links.data.map((l, i) => (
                                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{display:'flex', alignItems:'center', gap: THEME.spacing[3], padding:`12px 16px`, borderRadius: THEME.radius.md, border:`1px solid ${THEME.colors.neutral[200]}`, textDecoration:'none', color: THEME.colors.primary[600], fontSize: THEME.text.body, background: THEME.colors.neutral[50], fontWeight: 500}}>
                                        <LinkIcon size={16} style={{flexShrink:0}}/><span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{l.url}</span>
                                    </a>
                                ))}
                                {links.data.length===0 && <div style={{textAlign:'center', padding: THEME.spacing[8], color: THEME.colors.neutral[400]}}>No links found</div>}
                            </div>
                        )}

                        {/* Posts Tab */}
                        {tab==='posts' && <div style={{textAlign:'center', padding: THEME.spacing[8], color: THEME.colors.neutral[400], fontSize: THEME.text.body}}>Viewed posts will appear here (requires post data enrichment).</div>}

                        {/* Sub-pagination */}
                        {contentPages > 1 && (
                            <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap: THEME.spacing[2], marginTop: THEME.spacing[6]}}>
                                <button onClick={() => changePage(contentPage-1)} disabled={contentPage===0} style={pBtn}><ChevronLeft size={16} color={THEME.colors.neutral[500]}/></button>
                                <span style={{fontSize: THEME.text.bodySm, color: THEME.colors.neutral[500]}}>{contentPage+1}/{contentPages}</span>
                                <button onClick={() => changePage(contentPage+1)} disabled={contentPage>=contentPages-1} style={pBtn}><ChevronRight size={16} color={THEME.colors.neutral[500]}/></button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const pBtn: React.CSSProperties = {padding:'8px 12px', borderRadius:'8px', border:'1px solid #E5E7EB', background:'#FFFFFF', cursor:'pointer'};
