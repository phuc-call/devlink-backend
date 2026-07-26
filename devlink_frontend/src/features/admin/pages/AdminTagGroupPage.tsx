import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Users, Sparkles, RefreshCw, ChevronLeft, ChevronRight, X, Check, TrendingUp, Tag, Search, Eye, AlertCircle, Layers, ScanSearch, Minus } from 'lucide-react';
import { tagGroupApi, adminUserApi } from '../../../api/post-service/adminApi';
import type { TagGroupResponse, TagWithCount, AdminUserResponse, ProposedGroupResponse, TagGroupRequest } from '../../../api/post-service/adminApi';

// ─── Shared Styles ────────────────────────────────────────────────────────────
const S = {
  card: { background:'#fff', borderRadius:12, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', border:'1px solid #E5E7EB' } as React.CSSProperties,
  badge: (color='#3B82F6') => ({ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:600, background:color+'18', color } as React.CSSProperties),
  btn: (bg='#3B82F6', color='#fff') => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:bg, color, fontWeight:600, fontSize:13, cursor:'pointer', transition:'opacity .15s' } as React.CSSProperties),
  input: { padding:'8px 12px', borderRadius:8, border:'1px solid #D1D5DB', fontSize:13, outline:'none', background:'#F9FAFB', width:'100%', boxSizing:'border-box' as const },
  panel: { display:'flex', flexDirection:'column' as const, gap:12, height:'calc(100vh - 120px)', overflowY:'auto' as const },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewGroup { name:string; description:string; tags:string[]; matchKeyword:string; autoAssignable:boolean }

export default function AdminTagGroupPage() {
  // ── Tag Pool (Left) ──
  const [tagPool, setTagPool] = useState<TagWithCount[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagPoolLoading, setTagPoolLoading] = useState(false);

  // ── Groups (Center) ──
  const [groups, setGroups] = useState<TagGroupResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupsLoading, setGroupsLoading] = useState(false);

  // ── Create Form ──
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<TagGroupResponse|null>(null);
  const [form, setForm] = useState({ name:'', description:'', tags:[] as string[], matchKeyword:'', autoAssignable:false });
  const [formLoading, setFormLoading] = useState(false);

  // ── Auto-Preview Modal ──
  const [previewKeyword, setPreviewKeyword] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewGroup|null>(null);

  // ── Users (Right) ──
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number|null>(null);

  // ── Assign Modal ──
  const [assignModal, setAssignModal] = useState<{groupId:number;groupName:string}|null>(null);
  const [assignUserIds, setAssignUserIds] = useState('');

  // ── Ranking ──
  const [ranking, setRanking] = useState<TagGroupResponse[]>([]);
  const [rankingPage, setRankingPage] = useState(0);
  const [rankingTotal, setRankingTotal] = useState(0);
  const [rankingLoading, setRankingLoading] = useState(false);

  // ── Suggest Groups ──
  const [suggestions, setSuggestions] = useState<ProposedGroupResponse[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{type:'ok'|'err';msg:string}|null>(null);

  const SIZE = 12;
  const tagSearchRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const groupSearchRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const showToast = (type:'ok'|'err', msg:string) => { setToast({type,msg}); setTimeout(()=>setToast(null),3500); };

  // ── Loaders ──
  const loadTagPool = useCallback(async (kw=tagSearch) => {
    setTagPoolLoading(true);
    try {
      if (kw.trim()) {
        const r = await tagGroupApi.searchTags(kw);
        const tags:string[] = r.data?.data || [];
        setTagPool(tags.map(t=>({tag:t,count:0})));
      } else {
        const r = await tagGroupApi.getPopularTagsWithCount();
        setTagPool(r.data?.data || []);
      }
    } catch { showToast('err','Failed to load tags'); }
    finally { setTagPoolLoading(false); }
  }, [tagSearch]);

  const loadGroups = useCallback(async (p=0, q=groupSearch) => {
    setGroupsLoading(true);
    try {
      const r = await tagGroupApi.list(q||undefined, p, SIZE);
      const d = r.data?.data;
      setGroups(d?.content ?? []);
      setTotal(d?.totalElements ?? 0);
      setPage(p);
    } catch { showToast('err','Failed to load groups'); }
    finally { setGroupsLoading(false); }
  }, [groupSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const r = await adminUserApi.listUsers(undefined, 0, 20);
      setUsers(r.data?.data?.content ?? []);
    } catch { showToast('err','Failed to load users'); }
    finally { setUsersLoading(false); }
  }, []);

  const loadRanking = useCallback(async (p=0) => {
    setRankingLoading(true);
    try {
      const r = await tagGroupApi.getRanking(p, 5);
      setRanking(r.data?.data?.content || []);
      setRankingTotal(r.data?.data?.totalElements || 0);
      setRankingPage(p);
    }
    catch { /* silent — ranking is non-critical */ }
    finally { setRankingLoading(false); }
  }, []);

  useEffect(() => { void loadTagPool(); void loadGroups(0); void loadUsers(); void loadRanking(); }, []);

  const handleTagSearch = (v:string) => {
    setTagSearch(v);
    if (tagSearchRef.current) clearTimeout(tagSearchRef.current);
    tagSearchRef.current = setTimeout(()=>void loadTagPool(v),350);
  };
  const handleGroupSearch = (v:string) => {
    setGroupSearch(v);
    if (groupSearchRef.current) clearTimeout(groupSearchRef.current);
    groupSearchRef.current = setTimeout(()=>void loadGroups(0,v),350);
  };

  // ── Add tag from pool to form ──
  const addTagFromPool = (tag:string) => {
    if (!showForm) { openForm(null); }
    setForm(f => {
      if (f.tags.includes(tag) || f.tags.length >= 50) return f;
      return { ...f, tags:[...f.tags, tag] };
    });
  };
  const removeFormTag = (tag:string) => setForm(f=>({...f,tags:f.tags.filter(t=>t!==tag)}));

  // ── Open form ──
  const openForm = (g:TagGroupResponse|null) => {
    setEditTarget(g);
    setForm(g ? { name:g.name, description:g.description||'', tags:[...(g.tags||[])], matchKeyword:g.matchKeyword||'', autoAssignable:g.autoAssignable }
              : { name:'', description:'', tags:[], matchKeyword:'', autoAssignable:false });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.tags.length===0) { showToast('err','Name and at least 1 tag required'); return; }
    setFormLoading(true);
    try {
      const req = { name:form.name, description:form.description, tags:form.tags, autoAssignable:form.autoAssignable, matchKeyword:form.matchKeyword||undefined };
      if (editTarget) { await tagGroupApi.update(editTarget.id, req); showToast('ok','Group updated'); }
      else { await tagGroupApi.create(req); showToast('ok','Group created'); }
      setShowForm(false); setEditTarget(null);
      void loadGroups(page);
    } catch { showToast('err','Save failed'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id:number) => {
    if (!confirm('Delete this group?')) return;
    try { await tagGroupApi.delete(id); showToast('ok','Deleted'); void loadGroups(page); }
    catch { showToast('err','Delete failed'); }
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    const ids = assignUserIds.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n));
    if (!ids.length) { showToast('err','Enter valid user IDs'); return; }
    try {
      await tagGroupApi.assignGroups({ userIds:ids, tagGroupIds:[assignModal.groupId] });
      showToast('ok',`Assigned to ${ids.length} users`);
      setAssignModal(null); setAssignUserIds('');
      void loadUsers();
    } catch { showToast('err','Assign failed'); }
  };



  // ── Suggest Tag Groups ──
  const handleSuggestGroups = async () => {
    setSuggestLoading(true);
    try {
      const r = await tagGroupApi.suggestGroups();
      const data = r.data?.data ?? [];
      if (!data.length) { showToast('ok', 'No new groups to suggest — all tags are already grouped'); return; }
      setSuggestions(data);
      setSuggestModalOpen(true);
    } catch { showToast('err', 'Failed to analyze tags'); }
    finally { setSuggestLoading(false); }
  };

  const removeSuggestionTag = (groupIdx: number, tag: string) => {
    setSuggestions(prev => prev.map((g, i) => i !== groupIdx ? g : { ...g, tags: g.tags.filter(t => t !== tag), tagCount: g.tags.filter(t => t !== tag).length }));
  };

  const removeSuggestionGroup = (groupIdx: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== groupIdx));
  };

  const handleConfirmSuggestions = async () => {
    const valid = suggestions.filter(g => g.tags.length >= 1);
    if (!valid.length) { showToast('err', 'No groups to save'); return; }
    setConfirmLoading(true);
    try {
      const requests: TagGroupRequest[] = valid.map(g => ({
        name: g.suggestedName,
        description: `Auto-generated group for: ${g.suggestedKeyword}`,
        tags: g.tags,
        matchKeyword: g.suggestedKeyword,
        autoAssignable: true,
      }));
      const r = await tagGroupApi.confirmSuggestions(requests);
      const assigned = r.data?.data ?? 0;
      showToast('ok', `✓ Created ${valid.length} groups, ${assigned} new user-group assignments`);
      setSuggestModalOpen(false);
      setSuggestions([]);
      await Promise.all([loadGroups(0), loadUsers(), loadRanking()]);
    } catch { showToast('err', 'Failed to save groups'); }
    finally { setConfirmLoading(false); }
  };

  // ── Preview auto-group ──
  const handlePreviewKeyword = async () => {
    if (!previewKeyword.trim()) { showToast('err','Enter a keyword'); return; }
    setPreviewLoading(true);
    try {
      const r = await tagGroupApi.searchTags(previewKeyword.trim());
      const tags:string[] = r.data?.data || [];
      if (!tags.length) { showToast('err','No matching tags found'); return; }
      setPreview({ name:'Group: '+previewKeyword.trim(), description:'Auto-generated from keyword: '+previewKeyword.trim(), tags:tags.slice(0,50), matchKeyword:previewKeyword.trim(), autoAssignable:true });
    } catch { showToast('err','Search failed'); }
    finally { setPreviewLoading(false); }
  };

  const handleConfirmPreview = async () => {
    if (!preview) return;
    setFormLoading(true);
    try {
      await tagGroupApi.create({ name:preview.name, description:preview.description, tags:preview.tags, autoAssignable:preview.autoAssignable, matchKeyword:preview.matchKeyword });
      showToast('ok','Group created from keyword!');
      setPreview(null); setPreviewKeyword('');
      void loadGroups(0);
    } catch { showToast('err','Create failed'); }
    finally { setFormLoading(false); }
  };

  const totalPages = Math.ceil(total/SIZE);

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:'#F0F2F5',minHeight:'100vh',padding:'16px 20px'}}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{position:'fixed',top:16,right:16,zIndex:9999,padding:'12px 20px',borderRadius:10,fontWeight:600,fontSize:13,
          background:toast.type==='ok'?'#D1FAE5':'#FEE2E2',color:toast.type==='ok'?'#065F46':'#991B1B',
          boxShadow:'0 4px 12px rgba(0,0,0,0.15)',display:'flex',alignItems:'center',gap:8}}>
          {toast.type==='ok'?<Check size={15}/>:<AlertCircle size={15}/>}{toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:8}}><Layers size={22} color='#3B82F6'/> Tag Group Management</h1>
          <p style={{margin:'2px 0 0',fontSize:13,color:'#6B7280'}}>{total} groups <Minus size={10} style={{display:'inline',verticalAlign:'middle'}}/> Manage tags, groups &amp; user interests</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={handleSuggestGroups} disabled={suggestLoading}
            style={{...S.btn('#F59E0B'), opacity: suggestLoading ? 0.7 : 1, cursor: suggestLoading ? 'not-allowed' : 'pointer'}}>
            {suggestLoading
              ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>
              : <Sparkles size={14}/>}
            {suggestLoading ? 'Analyzing Tags...' : 'Suggest Groups'}
          </button>
          <button onClick={()=>openForm(null)} style={S.btn()}>
            <Plus size={14}/> New Group
          </button>
        </div>
      </div>

      {/* ── 3-Panel Layout ── */}
      <div className="three-panel-grid">

        {/* ══ LEFT: Tag Pool ══ */}
        <div style={{...S.card,display:'flex',flexDirection:'column',gap:10,maxHeight:'calc(100vh - 140px)',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,fontWeight:700,fontSize:14,color:'#1D4ED8'}}>
            <Tag size={15}/> Tag Pool
            <span style={{marginLeft:'auto',fontSize:11,color:'#6B7280',fontWeight:400}}>{tagPool.length} tags</span>
          </div>
          <div style={{position:'relative'}}>
            <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF'}}/>
            <input value={tagSearch} onChange={e=>handleTagSearch(e.target.value)} placeholder="Search tags..." style={{...S.input,paddingLeft:28,fontSize:12}}/>
          </div>
          <div style={{overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:4}}>
            {tagPoolLoading ? <div style={{textAlign:'center',padding:20,color:'#9CA3AF',fontSize:12}}>Loading...</div>
            : tagPool.length===0 ? <div style={{textAlign:'center',padding:20,color:'#9CA3AF',fontSize:12}}>No tags found</div>
            : tagPool.map(t=>(
              <div key={t.tag} onClick={()=>addTagFromPool(t.tag)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:8,cursor:'pointer',
                  background: form.tags.includes(t.tag)?'#DBEAFE':'#F9FAFB',border:`1px solid ${form.tags.includes(t.tag)?'#93C5FD':'#E5E7EB'}`,transition:'all .15s'}}>
                <span style={{fontSize:12,fontWeight:500,color:'#374151'}}>#{t.tag}</span>
                {t.count>0 && <span style={{fontSize:10,padding:'1px 6px',borderRadius:999,background:'#F3F4F6',color:'#6B7280',fontWeight:600}}>{t.count}</span>}
              </div>
            ))}
          </div>
          <button onClick={()=>loadTagPool()} style={{...S.btn('#F3F4F6','#374151'),justifyContent:'center',fontSize:12}}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>

        {/* ══ CENTER: Groups ══ */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>

          {/* Auto-keyword bar */}
          <div style={{...S.card,background:'linear-gradient(135deg,#EFF6FF,#F0FDF4)',borderColor:'#BFDBFE',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <Sparkles size={16} color='#3B82F6'/>
            <span style={{fontSize:13,fontWeight:700,color:'#1D4ED8',whiteSpace:'nowrap'}}>Auto-Group by keyword:</span>
            <input value={previewKeyword} onChange={e=>setPreviewKeyword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&void handlePreviewKeyword()}
              placeholder="e.g. tintuc, java, react..." style={{...S.input,flex:1,minWidth:160,fontSize:12}}/>
            <button onClick={handlePreviewKeyword} disabled={previewLoading} style={S.btn()}>
              {previewLoading?'Searching...':'Preview & Create'}
            </button>
          </div>

          {/* Create/Edit form */}
          {showForm && (
            <div style={{...S.card,borderLeft:'4px solid #3B82F6'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontWeight:700,fontSize:15,color:'#111827'}}>{editTarget?'Edit':'Create'} Tag Group</span>
                <button onClick={()=>{setShowForm(false);setEditTarget(null);}} style={{border:'none',background:'none',cursor:'pointer',color:'#6B7280'}}><X size={18}/></button>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Group name *" style={{...S.input, flex: 1, minWidth: 140}}/>
                <input value={form.matchKeyword} onChange={e=>setForm(f=>({...f,matchKeyword:e.target.value}))} placeholder="Match keyword (auto-assign)" style={{...S.input, flex: 1, minWidth: 140}}/>
              </div>
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" style={{...S.input,marginBottom:8}}/>
              {/* Tags in form */}
              <div style={{background:'#F9FAFB',borderRadius:8,padding:10,border:'1px solid #E5E7EB',marginBottom:8}}>
                <div style={{fontSize:11,color:'#6B7280',marginBottom:6,fontWeight:600}}>TAGS ({form.tags.length}/50) — click tags from left panel to add</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {form.tags.length===0 && <span style={{fontSize:12,color:'#D1D5DB'}}>No tags yet. Click from Tag Pool →</span>}
                  {form.tags.map(t=>(
                    <span key={t} style={{...S.badge(),cursor:'pointer',userSelect:'none'}} onClick={()=>removeFormTag(t)}>
                      #{t} <X size={9}/>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:10}}>
                <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
                  <input type="checkbox" checked={form.autoAssignable} onChange={e=>setForm(f=>({...f,autoAssignable:e.target.checked}))}/> Auto-assignable
                </label>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={handleSave} disabled={formLoading} style={S.btn()}>
                  <Check size={13}/>{formLoading?'Saving...':'Save Group'}
                </button>
                <button onClick={()=>{setShowForm(false);setEditTarget(null);}} style={S.btn('#F3F4F6','#374151')}>Cancel</button>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div style={{display:'flex',gap:8}}>
            <div style={{position:'relative',flex:1}}>
              <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF'}}/>
              <input value={groupSearch} onChange={e=>handleGroupSearch(e.target.value)} placeholder="Search groups..." style={{...S.input,paddingLeft:30}}/>
            </div>
            <button onClick={()=>loadGroups(page)} style={{...S.btn('#F3F4F6','#374151'),padding:'8px 12px'}}><RefreshCw size={14}/></button>
          </div>

          {/* Groups grid */}
          {groupsLoading && groups.length===0 ? (
            <div style={{textAlign:'center',padding:40,color:'#9CA3AF'}}>Loading groups...</div>
          ) : groups.length===0 ? (
            <div style={{...S.card,textAlign:'center',padding:40,color:'#9CA3AF'}}>
              <Tag size={32} style={{opacity:.3,marginBottom:8}}/><br/>No tag groups yet. Create one above!
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {groups.map(g=>(
                <div key={g.id} style={{...S.card,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#111827',flex:1,lineHeight:1.3}}>{g.name}</div>
                    <div style={{display:'flex',gap:4,marginLeft:6,flexShrink:0}}>
                      {g.autoAssignable && <span style={S.badge('#10B981')}>AUTO</span>}
                    </div>
                  </div>
                  {g.description && <div style={{fontSize:12,color:'#6B7280',lineHeight:1.4}}>{g.description}</div>}
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {(g.tags??[]).slice(0,10).map(t=>(
                      <span key={t} style={S.badge()}>#{t}</span>
                    ))}
                    {(g.tags?.length??0)>10 && <span style={{fontSize:11,color:'#9CA3AF',alignSelf:'center'}}>+{(g.tags?.length??0)-10}</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#9CA3AF'}}>
                    <Users size={11}/> {g.assignedUserCount??0} users
                    {g.matchKeyword && <><span style={{margin:'0 2px',color:'#D1D5DB'}}>|</span><Tag size={11}/>{g.matchKeyword}</>}
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:2}}>
                    <button onClick={()=>setAssignModal({groupId:g.id,groupName:g.name})} style={{...S.btn(),flex:1,justifyContent:'center',fontSize:12,padding:'6px'}}>
                      <Users size={12}/> Assign
                    </button>
                    <button onClick={()=>openForm(g)} style={{...S.btn('#F3F4F6','#374151'),fontSize:12,padding:'6px 10px'}}>Edit</button>
                    <button onClick={()=>handleDelete(g.id)} style={{...S.btn('#FEF2F2','#DC2626'),fontSize:12,padding:'6px 10px'}}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages>1 && (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
              <button onClick={()=>loadGroups(page-1)} disabled={page===0} style={S.btn('#F3F4F6','#374151')}><ChevronLeft size={16}/></button>
              <span style={{fontSize:13,color:'#374151'}}>Page {page+1} / {totalPages}</span>
              <button onClick={()=>loadGroups(page+1)} disabled={page>=totalPages-1} style={S.btn('#F3F4F6','#374151')}><ChevronRight size={16}/></button>
            </div>
          )}
        </div>

        {/* ══ RIGHT: Ranking + Users ══ */}
        <div style={{display:'flex',flexDirection:'column',gap:12,maxHeight:'calc(100vh - 140px)' ,overflow:'hidden'}}>

          {/* ── Ranking (always visible) ── */}
          <div style={{...S.card,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontWeight:700,fontSize:13,color:'#D97706',marginBottom:10}}>
              <TrendingUp size={14}/> Group Ranking
              <button onClick={()=>loadRanking(rankingPage)} style={{marginLeft:'auto',border:'none',background:'none',cursor:'pointer',color:'#9CA3AF',padding:2}}>
                <RefreshCw size={11} style={{animation:rankingLoading?'spin 1s linear infinite':undefined}}/>
              </button>
            </div>
            {rankingLoading ? (
              <div style={{fontSize:11,color:'#9CA3AF',textAlign:'center',padding:'8px 0'}}>Loading...</div>
            ) : ranking.length===0 ? (
              <div style={{fontSize:11,color:'#D1D5DB',textAlign:'center',padding:'8px 0'}}>No data yet</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {ranking.map((g,i)=>{
                  const max = ranking[0]?.assignedUserCount??1;
                  const pct = max>0?Math.round(((g.assignedUserCount??0)/Number(max))*100):0;
                  return (
                    <div key={g.id}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          <span style={{fontSize:11,fontWeight:800,color:(rankingPage===0&&i<3)?'#F59E0B':'#9CA3AF',width:16}}>#{rankingPage*5+i+1}</span>
                          <span style={{fontSize:12,fontWeight:600,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{g.name}</span>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:'#3B82F6',flexShrink:0}}>{g.assignedUserCount??0}</span>
                      </div>
                      <div style={{background:'#E5E7EB',borderRadius:999,height:4}}>
                        <div style={{height:4,borderRadius:999,background:'linear-gradient(90deg,#F59E0B,#3B82F6)',width:`${pct}%`,transition:'width .4s'}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {Math.ceil(rankingTotal/5) > 1 && (
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                <button onClick={()=>loadRanking(rankingPage-1)} disabled={rankingPage===0} style={{...S.btn('#F3F4F6','#374151'),padding:'4px 8px'}}><ChevronLeft size={14}/></button>
                <span style={{fontSize:11,color:'#6B7280'}}>Page {rankingPage+1} of {Math.ceil(rankingTotal/5)}</span>
                <button onClick={()=>loadRanking(rankingPage+1)} disabled={rankingPage>=Math.ceil(rankingTotal/5)-1} style={{...S.btn('#F3F4F6','#374151'),padding:'4px 8px'}}><ChevronRight size={14}/></button>
              </div>
            )}
          </div>

          {/* ── Users & Interests ── */}
          <div style={{...S.card,display:'flex',flexDirection:'column',gap:10,flex:1,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontWeight:700,fontSize:13,color:'#7C3AED'}}>
              <Users size={14}/> Users & Interests
              <span style={{marginLeft:'auto',fontSize:11,color:'#6B7280',fontWeight:400}}>{users.length} loaded</span>
            </div>
            <div style={{overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {usersLoading ? <div style={{textAlign:'center',padding:20,color:'#9CA3AF',fontSize:12}}>Loading users...</div>
              : users.length===0 ? <div style={{textAlign:'center',padding:20,color:'#9CA3AF',fontSize:12}}>No users found</div>
              : users.map(u=>(
                <div key={u.userId} onClick={()=>setSelectedUser(selectedUser===u.userId?null:u.userId)}
                  style={{borderRadius:10,padding:'10px 12px',cursor:'pointer',border:'1px solid',transition:'all .15s',
                    background:selectedUser===u.userId?'#EDE9FE':'#F9FAFB',
                    borderColor:selectedUser===u.userId?'#A78BFA':'#E5E7EB'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}}/>
                      : <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#7C3AED,#3B82F6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff',fontWeight:700}}>{(u.userName?.[0]||'U').toUpperCase()}</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.userName}</div>
                      <div style={{fontSize:11,color:'#9CA3AF'}}>{u.interestCount} interests</div>
                    </div>
                    <Eye size={12} color='#9CA3AF'/>
                  </div>
                  {selectedUser===u.userId && (
                    <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:3}}>
                      {(u.topInterests??[]).slice(0,8).map((t:string)=>(
                        <span key={t} style={S.badge('#7C3AED')}>#{t}</span>
                      ))}
                      {(!u.topInterests||u.topInterests.length===0) && <span style={{fontSize:11,color:'#D1D5DB'}}>No interests recorded</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={loadUsers} style={{...S.btn('#F3F4F6','#374151'),justifyContent:'center',fontSize:12}}>
              <RefreshCw size={12}/> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ Assign Modal ══ */}
      {assignModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
          <div style={{...S.card,width:'100%',maxWidth:420,boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:15,color:'#111827'}}>Assign "{assignModal.groupName}"</div>
              <button onClick={()=>{setAssignModal(null);setAssignUserIds('');}} style={{border:'none',background:'none',cursor:'pointer',color:'#6B7280'}}><X size={18}/></button>
            </div>
            <p style={{fontSize:12,color:'#6B7280',marginBottom:12}}>Enter user IDs (comma-separated). Tags from this group will be resolved into each user's interests.</p>
            <input value={assignUserIds} onChange={e=>setAssignUserIds(e.target.value)} placeholder="e.g. 1, 2, 3, 45" style={{...S.input,marginBottom:12}}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={handleAssign} style={{...S.btn(),flex:1,justifyContent:'center'}}>Assign</button>
              <button onClick={()=>{setAssignModal(null);setAssignUserIds('');}} style={S.btn('#F3F4F6','#374151')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Preview Modal ══ */}
      {preview && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
          <div style={{...S.card,width:'100%',maxWidth:560,maxHeight:'80vh',overflowY:'auto',boxShadow:'0 20px 40px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{fontWeight:700,fontSize:16,color:'#111827',display:'flex',alignItems:'center',gap:8}}><ScanSearch size={18} color='#3B82F6'/> Preview Auto-Generated Group</div>
              <button onClick={()=>setPreview(null)} style={{border:'none',background:'none',cursor:'pointer',color:'#6B7280'}}><X size={18}/></button>
            </div>
            <p style={{fontSize:12,color:'#6B7280',marginBottom:12}}>Review the tags below. Click a tag to remove it before confirming.</p>
            <div style={{marginBottom:8}}>
              <input value={preview.name} onChange={e=>setPreview(p=>p?{...p,name:e.target.value}:p)} style={S.input} placeholder="Group name"/>
            </div>
            <div style={{marginBottom:12}}>
              <input value={preview.description} onChange={e=>setPreview(p=>p?{...p,description:e.target.value}:p)} style={S.input} placeholder="Description"/>
            </div>
            <div style={{background:'#F9FAFB',borderRadius:10,padding:12,border:'1px solid #E5E7EB',marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'#6B7280',marginBottom:8}}>TAGS ({preview.tags.length}/50) — click to remove</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {preview.tags.map(t=>(
                  <span key={t} onClick={()=>setPreview(p=>p?{...p,tags:p.tags.filter(x=>x!==t)}:p)}
                    style={{...S.badge('#EF4444'),cursor:'pointer',userSelect:'none'}}>
                    #{t} <X size={9}/>
                  </span>
                ))}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
                <input type="checkbox" checked={preview.autoAssignable} onChange={e=>setPreview(p=>p?{...p,autoAssignable:e.target.checked}:p)}/> Auto-assignable
              </label>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={handleConfirmPreview} disabled={formLoading||preview.tags.length===0} style={{...S.btn(),flex:1,justifyContent:'center'}}>
                <Check size={13}/>{formLoading?'Creating...':'Confirm & Create'}
              </button>
              <button onClick={()=>setPreview(null)} style={S.btn('#F3F4F6','#374151')}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* ══ Suggestions Modal ══ */}
      {suggestModalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
          <div style={{...S.card,width:'100%',maxWidth:600,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 40px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,flexShrink:0}}>
              <div style={{fontWeight:700,fontSize:16,color:'#111827',display:'flex',alignItems:'center',gap:8}}><Sparkles size={18} color='#F59E0B'/> Suggested Tag Groups</div>
              <button onClick={()=>setSuggestModalOpen(false)} style={{border:'none',background:'none',cursor:'pointer',color:'#6B7280'}}><X size={18}/></button>
            </div>
            <p style={{fontSize:12,color:'#6B7280',marginBottom:12,flexShrink:0}}>System analyzed all posts and grouped tags by common prefixes. Review and remove any tags or groups you don't want before saving. Saving will auto-assign these to relevant users.</p>
            
            <div style={{overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:12,paddingRight:4}}>
              {suggestions.map((g, i) => (
                <div key={i} style={{border:'1px solid #E5E7EB',borderRadius:10,padding:12,background:'#F9FAFB'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#111827'}}>{g.suggestedName} <span style={{fontSize:11,color:'#9CA3AF',fontWeight:400,marginLeft:6}}>({g.tags.length} tags)</span></div>
                    <button onClick={() => removeSuggestionGroup(i)} style={{border:'none',background:'none',cursor:'pointer',color:'#EF4444',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600}}><Trash2 size={12}/> Drop Group</button>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {g.tags.map(t => (
                      <span key={t} onClick={() => removeSuggestionTag(i, t)}
                        style={{...S.badge('#3B82F6'),cursor:'pointer',userSelect:'none',background:'#DBEAFE',color:'#1D4ED8'}}>
                        #{t} <X size={9}/>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && (
                <div style={{textAlign:'center',padding:30,color:'#9CA3AF',fontSize:13}}>No suggestions remaining.</div>
              )}
            </div>
            
            <div style={{display:'flex',gap:8,marginTop:16,flexShrink:0}}>
              <button onClick={handleConfirmSuggestions} disabled={confirmLoading || suggestions.length===0} style={{...S.btn('#10B981'),flex:1,justifyContent:'center',opacity: (confirmLoading||suggestions.length===0)?0.6:1}}>
                {confirmLoading ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> : <Check size={14}/>}
                {confirmLoading ? 'Saving...' : `Confirm & Save All (${suggestions.length})`}
              </button>
              <button onClick={()=>setSuggestModalOpen(false)} style={S.btn('#F3F4F6','#374151')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .three-panel-grid {
          display: grid;
          grid-template-columns: 280px 1fr 280px;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .three-panel-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
