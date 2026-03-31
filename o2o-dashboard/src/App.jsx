import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Sparkles, Target, TrendingUp, 
  ShoppingBag, X, Loader2, Edit2, Bot,
  Paperclip, Upload, Calendar,
  Languages, CalendarDays, List, ChevronLeft, ChevronRight, PenTool,
  QrCode, Store, Settings, Zap, ArrowRightLeft, Globe, PlusCircle, Trash2
} from 'lucide-react';

// ─── 🔑 API KEY ───────────────────────────────────────────────────────────────
// Set your Gemini API key here OR use environment variable VITE_GEMINI_API_KEY
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash-exp"; // Stable model name

// ─── i18n ─────────────────────────────────────────────────────────────────────
const i18n = {
  th: {
    appTitle: 'O2O Marketing Dashboard',
    totalDays: 'จำนวนวัน', phases: 'เฟส', completedLabel: 'เสร็จสิ้น', progress: 'คืบหน้า', totalBudget: 'งบประมาณรวม',
    addAdhoc: 'เพิ่มแผนแทรก', genAi: 'วิเคราะห์แผน O2O', campaignProgress: 'Integrated Progress',
    tasksCompleted: 'งานที่เสร็จแล้ว', status: 'สถานะ', all: 'ทั้งหมด', pending: 'รอดำเนินการ', completed: 'เสร็จแล้ว',
    startDate: 'วันเริ่มแคมเปญ:', listView: 'แบบการ์ด', calendarView: 'ปฏิทิน', editTask: 'แก้ไข',
    deleteTask: 'ลบ', day: 'วันที่', aiFormTitle: 'สร้างแผนกลยุทธ์ Online + Offline',
    brandName: 'ชื่อแบรนด์', productName: 'สินค้า/บริการ', usp: 'จุดเด่น (USP)', 
    targetAudience: 'กลุ่มเป้าหมาย', goal: 'เป้าหมายหลัก', tone: 'โทนแบรนด์', 
    budget: 'งบประมาณรวม (บาท)', submitAi: 'สร้างแผนใหม่ทั้งหมด',
    optimizeAi: 'Optimize งานที่เหลือ',
    contentDir: 'กลยุทธ์คอนเทนต์', recChannel: 'ช่องทางขายแนะนำ', applyPlan: 'ยืนยันและนำแผนไปใช้',
    back: 'ย้อนกลับ', loadingAi: 'AI กำลังประมวลผลกลยุทธ์...',
    errorApi: 'การเชื่อมต่อ AI ขัดข้อง — ตรวจสอบ API Key ใน .env',
    errorApiNoKey: 'ยังไม่ได้ตั้งค่า API Key — เพิ่ม VITE_GEMINI_API_KEY ใน .env',
    contentIdeasTitle: '📌 แผนผังคอนเทนต์หลัก (Content Pillars)',
    attachmentTitle: 'Creative Materials & Assets',
    copyBtn: 'คัดลอกข้อความ', uploadBtn: 'อัปโหลดรูป',
    managePlan: 'จัดการแคมเปญ', currentDay: 'ปัจจุบันอยู่วันที่',
    confirmDelete: 'ลบงานนี้?',
  },
  en: {
    appTitle: 'O2O Marketing Dashboard',
    totalDays: 'Days', phases: 'Phases', completedLabel: 'Done', progress: 'Progress', totalBudget: 'Total Budget',
    addAdhoc: 'Add Task', genAi: 'Generate O2O Plan', campaignProgress: 'Integrated Progress',
    tasksCompleted: 'Completed', status: 'Status', all: 'All', pending: 'Pending', completed: 'Done',
    startDate: 'Start Date:', listView: 'List View', calendarView: 'Calendar', editTask: 'Edit',
    deleteTask: 'Delete', day: 'Day', aiFormTitle: 'O2O Strategy Planner',
    brandName: 'Brand Name', productName: 'Product', usp: 'USP', 
    targetAudience: 'Target Audience', goal: 'Goal', tone: 'Tone', 
    budget: 'Budget (THB)', submitAi: 'Regenerate All',
    optimizeAi: 'Optimize Remaining',
    contentDir: 'Creative Direction', recChannel: 'Rec. Channel', applyPlan: 'Apply Plan',
    back: 'Back', loadingAi: 'AI is processing strategy...',
    errorApi: 'AI Connection Error — Check API Key in .env',
    errorApiNoKey: 'API Key not set — add VITE_GEMINI_API_KEY to .env file',
    contentIdeasTitle: '📌 Monthly Content Pillars',
    attachmentTitle: 'Creative Attachments',
    copyBtn: 'Copy Text', uploadBtn: 'Upload Image',
    managePlan: 'Manage Campaign', currentDay: 'Current Day',
    confirmDelete: 'Delete this task?',
  }
};

// ─── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'o2o_dashboard_v3';

export default function App() {
  const [lang, setLang] = useState('th');
  const t = i18n[lang];
  const [viewMode, setViewMode] = useState('list');
  const [campaignStartDate, setCampaignStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentCalMonth, setCurrentCalMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  
  const [tasks, setTasks] = useState([]);
  const [campaignBudget, setCampaignBudget] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState('form'); 
  const [formData, setFormData] = useState({ brandName: '', product: '', usp: '', target: '', goal: 'Sales', tone: 'Professional', budget: '' });
  const [draftTasks, setDraftTasks] = useState([]);
  const [draftBudget, setDraftBudget] = useState(0);
  const [aiStrategyReport, setAiStrategyReport] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [selectedDateTasks, setSelectedDateTasks] = useState(null);
  const [apiError, setApiError] = useState(null);

  // ─── Persist to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTasks(data.tasks || []);
        setCampaignBudget(data.budget || 0);
        setCampaignStartDate(data.startDate || new Date().toISOString().split('T')[0]);
        if (data.formData) setFormData(data.formData);
      }
    } catch (e) {
      console.warn('Could not restore saved data:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, budget: campaignBudget, startDate: campaignStartDate, formData }));
    } catch (e) {
      console.warn('Could not save data:', e);
    }
  }, [tasks, campaignBudget, campaignStartDate, formData]);

  // ─── Current campaign day ─────────────────────────────────────────────────
  const currentDayInCampaign = useMemo(() => {
    const start = new Date(campaignStartDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - start) / 86400000) + 1;
    return Math.max(1, Math.min(30, diffDays));
  }, [campaignStartDate]);

  // ─── Gemini API call with retry ───────────────────────────────────────────
  const callGemini = async (payload, retries = 3, delay = 1000) => {
    const key = API_KEY;
    if (!key) throw new Error('NO_API_KEY');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    if (!res.ok) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return callGemini(payload, retries - 1, delay * 2);
      }
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }
    return res.json();
  };

  // ─── AI Plan Generation ───────────────────────────────────────────────────
  const handleGenerateAI = async (mode = 'NEW') => {
    setAiStep('loading');
    setApiError(null);

    const systemPrompt = `You are an expert O2O Marketing Strategist. Create a detailed 30-day plan.
IMPORTANT: Every task title must be specific. Details must have 3-4 bullet points.
DETECT BUSINESS TYPE: For physical goods (Soap), focus on E-commerce/Packaging/Offline pop-ups. For Digital (Courses), focus on Authority/Funnel.

Response must be ONLY valid JSON with NO markdown code fences:
{
  "tasks": [{"day": 1, "title": "Specific Title", "platform": "Platform Name", "category": "Category", "details": ["Point 1", "Point 2", "Point 3"], "channelType": "Online|Offline|Omnichannel", "reasoning": "Strategy explanation", "budget": "Amount or Organic", "objective": "Awareness|Lead|Conversion"}],
  "report": {"framework": "Strategy Name", "logic": "Explanatory Paragraph", "focus": "Main Focus", "recommendedChannel": "Detailed recommendation", "contentGuideline": "Detailed guide", "contentIdeas": ["Idea 1", "Idea 2", "Idea 3"]}
}
All content in ${lang === 'th' ? 'Thai' : 'English'}. Return exactly 15 tasks. NO markdown, pure JSON only.`;

    const userPrompt = `Brand: ${formData.brandName}, Product: ${formData.product}, USP: ${formData.usp}, Target: ${formData.target}, Goal: ${formData.goal}, Total Budget: ${formData.budget || 'Minimal'}. Mode: ${mode}. Current Day: ${currentDayInCampaign}.`;

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      const result = await callGemini(payload);
      let rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Strip any accidental markdown code fences
      rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      
      const data = JSON.parse(rawText);
      const processedTasks = (data.tasks || []).map(task => {
        const phase = task.day > 20 ? 3 : (task.day > 10 ? 2 : 1);
        const existing = tasks.find(t => t.day === task.day);
        return { ...task, id: crypto.randomUUID(), phase, completed: existing?.completed || false, attachments: existing?.attachments || [] };
      });

      setDraftTasks(processedTasks.sort((a, b) => a.day - b.day));
      setAiStrategyReport(data.report);
      setDraftBudget(parseInt(formData.budget) || 0);
      setAiStep('edit');
    } catch (error) {
      console.error('AI Error:', error);
      setApiError(error.message === 'NO_API_KEY' ? t.errorApiNoKey : `${t.errorApi}: ${error.message}`);
      setAiStep('form');
    }
  };

  const handleApplyPlan = () => {
    setTasks(draftTasks);
    setCampaignBudget(draftBudget);
    setIsAiModalOpen(false);
    setAiStep('form');
  };

  // ─── Task CRUD ────────────────────────────────────────────────────────────
  const toggleTaskStatus = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const openNewTaskModal = () => setEditingTask({
    id: crypto.randomUUID(), day: 1, phase: 1, title: '', platform: 'Social Media',
    details: [], channelType: 'Omnichannel', objective: 'Awareness',
    budget: 'Organic', completed: false, attachments: []
  });

  const deleteTask = (id) => {
    if (window.confirm(t.confirmDelete)) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const saveTask = () => {
    const phase = editingTask.day > 20 ? 3 : (editingTask.day > 10 ? 2 : 1);
    const task = { ...editingTask, phase };
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, task].sort((a, b) => a.day - b.day);
    });
    setEditingTask(null);
  };

  // ─── Attachment helpers ───────────────────────────────────────────────────
  const handleAttachmentClick = async (att) => {
    if (att.type === 'image') {
      setPreviewImage(att.content);
    } else if (att.type === 'link') {
      window.open(att.content, '_blank', 'noopener,noreferrer');
    } else {
      try {
        await navigator.clipboard.writeText(att.content);
        setShowCopiedAlert(true);
        setTimeout(() => setShowCopiedAlert(false), 2000);
      } catch {
        // Fallback for older browsers
        const el = document.createElement('textarea');
        el.value = att.content;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setShowCopiedAlert(true);
        setTimeout(() => setShowCopiedAlert(false), 2000);
      }
    }
  };

  const handleImageUpload = (e, attId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingTask(prev => ({
        ...prev,
        attachments: prev.attachments.map(a => a.id === attId ? { ...a, content: reader.result } : a)
      }));
    };
    reader.readAsDataURL(file);
  };

  // ─── Calendar helpers ─────────────────────────────────────────────────────
  const changeCalMonth = (offset) =>
    setCurrentCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));

  // FIX: Don't mutate the date argument
  const getTasksForDate = (date) => {
    const start = new Date(campaignStartDate);
    start.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = Math.floor((d - start) / 86400000) + 1;
    return tasks.filter(t => t.day === day);
  };

  // ─── Derived stats ────────────────────────────────────────────────────────
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  // FIX: Use unique filter keys to avoid collision with i18n
  const filteredTasks = tasks.filter(t => {
    if (filter === 'COMPLETED') return t.completed;
    if (filter === 'PENDING') return !t.completed;
    return true;
  });

  const filterLabels = { ALL: t.all, PENDING: t.pending, COMPLETED: t.completed };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-5 border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
              <Zap size={14}/> <span>Strategic Hub</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t.appTitle}</h1>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                <Calendar size={12} className="text-indigo-400"/>
                <input
                  type="date"
                  value={campaignStartDate}
                  onChange={e => setCampaignStartDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none uppercase text-indigo-50 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/10 text-[10px] font-bold uppercase text-indigo-300">
                {t.currentDay}: {currentDayInCampaign}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}
              className="bg-white/5 hover:bg-white/10 p-2 px-3 rounded-lg border border-white/10 text-[10px] font-bold uppercase transition-all"
            >
              {lang}
            </button>
            <button
              onClick={openNewTaskModal}
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 shadow-md"
            >
              <PlusCircle size={14}/> {t.addAdhoc}
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-600 px-5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
            >
              <Settings size={14}/> {tasks.length > 0 ? t.managePlan : t.genAi}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 border-t border-white/5 pt-4">
          {[
            { label: t.totalDays, val: tasks.length > 0 ? 30 : 0 },
            { label: t.phases, val: 3 },
            { label: t.completedLabel, val: completedCount },
            { label: t.progress, val: `${progress}%`, color: 'text-indigo-400' },
            { label: t.totalBudget, val: `฿${campaignBudget.toLocaleString()}`, color: 'text-emerald-400', span: 'col-span-2 md:col-span-1' }
          ].map((s, idx) => (
            <div key={idx} className={s.span || ''}>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className={`text-lg font-bold ${s.color || 'text-white'}`}>{s.val}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">

        {/* View / Filter nav */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-4">
          <div className="flex gap-1">
            {[['list', <List size={16}/>, t.listView], ['calendar', <CalendarDays size={16}/>, t.calendarView]].map(([mode, icon, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${viewMode === mode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="flex bg-slate-50 p-1 rounded-xl border">
            {['ALL', 'PENDING', 'COMPLETED'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* List view */}
        {viewMode === 'list' ? (
          <div className="space-y-12">
            {[1, 2, 3].map(p => {
              const phaseTasks = filteredTasks.filter(t => t.phase === p);
              if (phaseTasks.length === 0) return null;
              const colors = {
                border: ['border-indigo-500', 'border-purple-500', 'border-rose-500'][p - 1],
                bg: ['bg-indigo-500', 'bg-purple-500', 'bg-rose-500'][p - 1],
              };
              return (
                <div key={p} className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-4 mb-6">
                    <span className={`${colors.bg} text-white px-5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md`}>Phase {p}</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {phaseTasks.map(task => (
                      <div key={task.id} className={`bg-white rounded-2xl p-6 border-t-4 ${colors.border} shadow-sm hover:shadow-md transition-all ${task.completed ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-slate-900 text-white w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg">
                            <span className="text-[7px] font-bold uppercase opacity-60">Day</span>
                            <span className="text-lg font-bold leading-none">{String(task.day).padStart(2, '0')}</span>
                          </div>
                          <button onClick={() => toggleTaskStatus(task.id)} className="text-slate-200 hover:text-indigo-500 transition-colors">
                            {task.completed ? <CheckCircle2 size={28} className="text-emerald-500"/> : <Circle size={28}/>}
                          </button>
                        </div>
                        <div className="mb-4">
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">{task.platform}</span>
                          <h3 className="font-bold text-base text-slate-800 leading-tight">{task.title}</h3>
                        </div>
                        <div className="space-y-4 mb-6">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[8px] font-bold uppercase">{task.objective}</span>
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[8px] font-bold border border-indigo-100 flex items-center gap-1">
                              {task.channelType === 'Online' ? <Globe size={10}/> : task.channelType === 'Offline' ? <Store size={10}/> : <QrCode size={10}/>}
                              {task.channelType?.toUpperCase()}
                            </span>
                          </div>
                          <ul className="space-y-2 min-h-[40px]">
                            {task.details?.map((d, i) => (
                              <li key={i} className="text-[11px] text-slate-500 flex gap-2">
                                <span className="text-indigo-400 mt-1.5 w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span> {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Attachments */}
                        {task.attachments?.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {task.attachments.map(att => (
                              <button key={att.id} onClick={() => handleAttachmentClick(att)}
                                className="w-full flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2 text-[9px] font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                <Paperclip size={10}/> {att.name}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{task.budget}</span>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingTask(task)} className="bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white p-2 rounded-lg transition-all"><Edit2 size={12}/></button>
                            <button onClick={() => deleteTask(task.id)} className="bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-24 text-slate-400">
                <QrCode size={48} className="mx-auto mb-4 opacity-20"/>
                <p className="font-bold text-sm">{tasks.length === 0 ? (lang === 'th' ? 'เริ่มต้นโดยกด "วิเคราะห์แผน O2O"' : 'Click "Generate O2O Plan" to start') : (lang === 'th' ? 'ไม่มีงานในหมวดนี้' : 'No tasks in this filter')}</p>
              </div>
            )}
          </div>
        ) : (
          /* Calendar view */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {currentCalMonth.toLocaleString(lang === 'th' ? 'th-TH' : 'default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => changeCalMonth(-1)} className="p-2 bg-white/5 hover:bg-indigo-500 rounded-lg transition-all"><ChevronLeft size={18}/></button>
                <button onClick={() => changeCalMonth(1)} className="p-2 bg-white/5 hover:bg-indigo-500 rounded-lg transition-all"><ChevronRight size={18}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b bg-slate-50/50">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="py-3 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-slate-100 gap-px">
              {(() => {
                const year = currentCalMonth.getFullYear(), month = currentCalMonth.getMonth();
                const startDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} className="bg-slate-50/50 min-h-[120px]"/>);
                for (let i = 1; i <= daysInMonth; i++) {
                  const date = new Date(year, month, i);
                  const dayTasks = getTasksForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  cells.push(
                    <div key={i} onClick={() => dayTasks.length > 0 && setSelectedDateTasks({ date, tasks: dayTasks })}
                      className="bg-white min-h-[120px] p-2 hover:bg-slate-50 cursor-pointer">
                      <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-300'}`}>{i}</span>
                      <div className="mt-2 space-y-1">
                        {dayTasks.map(tk => (
                          <div key={tk.id} className="text-[7px] font-bold truncate px-1.5 py-0.5 rounded-md border bg-indigo-50 border-indigo-100 text-indigo-900">{tk.title}</div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        )}
      </main>

      {/* ── AI Modal ──────────────────────────────────────────────────────── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[95vh] border">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-indigo-400 p-2.5 rounded-xl"><QrCode size={20}/></div>
                <h3 className="font-bold text-lg">{t.aiFormTitle}</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-full hover:bg-slate-200 transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
              {aiStep === 'form' ? (
                <div className="space-y-6">
                  {/* API Key warning */}
                  {!API_KEY && (
                    <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-start gap-3">
                      <div className="bg-red-500 text-white p-2 rounded-xl shrink-0"><Zap size={16}/></div>
                      <div>
                        <p className="font-bold text-sm text-red-800">API Key Required</p>
                        <p className="text-[11px] text-red-600 mt-1">
                          Add <code className="bg-red-100 px-1 rounded font-mono">VITE_GEMINI_API_KEY=your_key</code> to your <code className="bg-red-100 px-1 rounded font-mono">.env</code> file, then restart the dev server.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error banner */}
                  {apiError && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-[11px] text-red-700 font-semibold">
                      ⚠️ {apiError}
                    </div>
                  )}

                  {/* Optimize banner */}
                  {tasks.length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-2xl flex items-center gap-5 shadow-sm">
                      <div className="bg-amber-500 text-white p-3 rounded-xl shadow-md"><ArrowRightLeft size={20}/></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-amber-900">{lang === 'th' ? 'Optimize กลางทาง' : 'Optimize Campaign'}</h4>
                        <p className="text-[10px] text-amber-700/80 leading-snug">{lang === 'th' ? `วิเคราะห์งานที่เหลือตั้งแต่วันที่ ${currentDayInCampaign}` : `Optimize remaining budget from Day ${currentDayInCampaign}`}</p>
                      </div>
                      <button onClick={() => handleGenerateAI('OPTIMIZE')}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-indigo-600 transition-all flex items-center gap-2 uppercase tracking-widest">
                        <Zap size={12}/> {t.optimizeAi}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.brandName}</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none" value={formData.brandName} onChange={e => setFormData(f => ({ ...f, brandName: e.target.value }))}/></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.productName}</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none" value={formData.product} onChange={e => setFormData(f => ({ ...f, product: e.target.value }))}/></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.usp}</label><textarea required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none h-24 resize-none" value={formData.usp} onChange={e => setFormData(f => ({ ...f, usp: e.target.value }))}/></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.targetAudience}</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none" value={formData.target} onChange={e => setFormData(f => ({ ...f, target: e.target.value }))}/></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.budget}</label><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none" value={formData.budget} onChange={e => setFormData(f => ({ ...f, budget: e.target.value }))}/></div>
                  </div>
                  <button onClick={() => handleGenerateAI('NEW')} disabled={!formData.brandName || !formData.product}
                    className="w-full bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-3 transform active:scale-95">
                    <Sparkles size={18}/> {t.submitAi}
                  </button>
                </div>
              ) : aiStep === 'loading' ? (
                <div className="flex flex-col items-center justify-center py-20 gap-8">
                  <Loader2 size={60} className="text-indigo-500 animate-spin"/>
                  <h4 className="font-bold text-lg">{t.loadingAi}</h4>
                </div>
              ) : (
                <div className="space-y-8 pb-10 animate-in fade-in">
                  {/* Strategy Report */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 border border-white/10">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                      <div className="bg-indigo-500 p-2.5 rounded-xl"><Bot size={20}/></div>
                      <h4 className="font-bold text-lg">{aiStrategyReport?.framework}</h4>
                    </div>
                    <div className="py-6 space-y-6">
                      <p className="text-xs text-indigo-100 italic leading-relaxed">"{aiStrategyReport?.logic}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-2"><ShoppingBag size={12}/> {t.recChannel}</p>
                          <p className="text-sm font-bold text-white leading-tight">{aiStrategyReport?.recommendedChannel}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-bold text-rose-400 uppercase mb-2 flex items-center gap-2"><PenTool size={12}/> {t.contentDir}</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{aiStrategyReport?.contentGuideline}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Draft tasks preview */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest ml-1">Proposed Roadmap (30 Days)</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {draftTasks.map((tk) => (
                        <div key={tk.id} className="bg-white border-2 border-slate-50 p-4 rounded-2xl flex gap-4 items-center shadow-sm hover:border-indigo-400 transition-all">
                          <div className="bg-slate-900 text-white w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-[7px] font-bold uppercase opacity-50">Day</span>
                            <span className="text-lg font-bold leading-tight">{tk.day}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-sm text-slate-800 leading-snug">{tk.title}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-slate-400 uppercase font-black">{tk.platform}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="text-[9px] text-indigo-500 uppercase font-black">{tk.channelType}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 shrink-0">{tk.budget}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {aiStep === 'edit' && (
              <div className="p-6 bg-white border-t flex gap-4 sticky bottom-0 z-50">
                <button onClick={() => setAiStep('form')} className="flex-1 py-3.5 border-2 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">{t.back}</button>
                <button onClick={handleApplyPlan} className="flex-[2] py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-lg text-xs uppercase tracking-widest transition-all active:scale-95">{t.applyPlan}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Task Editor ───────────────────────────────────────────────────── */}
      {editingTask && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col my-10 border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-indigo-400 p-2 rounded-xl"><Edit2 size={18}/></div>
                <h3 className="font-bold text-lg">{lang === 'th' ? 'แก้ไขงาน' : 'Edit Task'}</h3>
              </div>
              <button onClick={() => setEditingTask(null)}><X size={20}/></button>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto bg-white max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Day</label>
                  <input type="number" min="1" max="30" className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500"
                    value={editingTask.day} onChange={e => setEditingTask(prev => ({ ...prev, day: parseInt(e.target.value) || 1 }))}/>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Title</label>
                  <input className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500"
                    value={editingTask.title} onChange={e => setEditingTask(prev => ({ ...prev, title: e.target.value }))}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Platform</label>
                  <input className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500"
                    value={editingTask.platform} onChange={e => setEditingTask(prev => ({ ...prev, platform: e.target.value }))}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Type</label>
                  <select className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold outline-none bg-white"
                    value={editingTask.channelType} onChange={e => setEditingTask(prev => ({ ...prev, channelType: e.target.value }))}>
                    <option value="Online">Online Focus</option>
                    <option value="Offline">Physical Touch</option>
                    <option value="Omnichannel">Seamless O2O</option>
                  </select>
                </div>
              </div>
              {/* Attachments */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2"><Paperclip size={14}/> {t.attachmentTitle}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTask(prev => ({ ...prev, attachments: [...prev.attachments, { id: crypto.randomUUID(), type: 'copy', name: 'Content', content: '' }] }))}
                      className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[9px] font-bold border border-indigo-100 hover:bg-indigo-500 hover:text-white transition-all">
                      + Content
                    </button>
                    <button onClick={() => setEditingTask(prev => ({ ...prev, attachments: [...prev.attachments, { id: crypto.randomUUID(), type: 'image', name: 'Graphic', content: '' }] }))}
                      className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[9px] font-bold border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                      + Image
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {editingTask.attachments?.map((att, idx) => (
                    <div key={att.id} className="bg-slate-50 p-4 rounded-2xl border flex gap-4 items-start relative">
                      <div className="flex-1 space-y-3">
                        <input className="w-full bg-transparent border-b text-[10px] font-bold outline-none focus:border-indigo-500 pb-1"
                          value={att.name} placeholder="Asset Label"
                          onChange={e => setEditingTask(prev => ({ ...prev, attachments: prev.attachments.map((a, i) => i === idx ? { ...a, name: e.target.value } : a) }))}/>
                        {att.type === 'copy' ? (
                          <textarea className="w-full bg-white border rounded-xl p-3 text-[10px] font-medium h-20 outline-none" placeholder="Post Content..."
                            value={att.content}
                            onChange={e => setEditingTask(prev => ({ ...prev, attachments: prev.attachments.map((a, i) => i === idx ? { ...a, content: e.target.value } : a) }))}/>
                        ) : (
                          <div className="flex gap-2">
                            <input className="flex-1 bg-white border rounded-xl p-2 px-3 text-[10px] font-medium outline-none"
                              value={att.content?.startsWith('data:image') ? '(Image uploaded)' : att.content} placeholder="Image URL"
                              onChange={e => setEditingTask(prev => ({ ...prev, attachments: prev.attachments.map((a, i) => i === idx ? { ...a, content: e.target.value } : a) }))}/>
                            <label className="bg-slate-900 text-white p-2 px-3 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer hover:bg-indigo-500 transition-all shrink-0 shadow-md">
                              <Upload size={12}/> {t.uploadBtn}
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, att.id)}/>
                            </label>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setEditingTask(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== att.id) }))}
                        className="bg-white p-1 rounded-full shadow text-slate-300 hover:text-red-500 transition-all">
                        <X size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setEditingTask(null)} className="flex-1 py-3 border rounded-xl font-bold text-slate-400 hover:bg-white text-xs uppercase transition-all">Discard</button>
              <button onClick={saveTask} className="flex-[2] py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-600 text-xs uppercase tracking-widest transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar date popup ───────────────────────────────────────────── */}
      {selectedDateTasks && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedDateTasks(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-white/5">
              <h4 className="font-bold text-sm">
                {selectedDateTasks.date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { weekday: 'long', day: 'numeric' })}
              </h4>
              <button onClick={() => setSelectedDateTasks(null)} className="text-white/40 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
              {selectedDateTasks.tasks.map(tk => (
                <div key={tk.id} className="bg-white p-5 rounded-2xl shadow border border-slate-100">
                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">{tk.platform}</span>
                  <h5 className="font-bold text-slate-800 mb-4 text-sm leading-tight">{tk.title}</h5>
                  <button onClick={() => { setSelectedDateTasks(null); setEditingTask(tk); }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all uppercase tracking-widest">
                    <Edit2 size={12}/> View & Edit Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Copied alert ──────────────────────────────────────────────────── */}
      {showCopiedAlert && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-2xl animate-in border border-white/10 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-500"/>
          <span className="text-[10px] font-bold uppercase tracking-widest">{t.copyBtn} ✓</span>
        </div>
      )}

      {/* ── Image preview ─────────────────────────────────────────────────── */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/98 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white bg-white/10 p-2 rounded-full hover:bg-indigo-500 transition-all"><X size={28}/></button>
            <img src={previewImage} alt="Strategic Asset" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white/5 object-contain"/>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
