'use client';

import DeleteChat from '@/components/DeleteChat';
import { formatTimeDifference } from '@/lib/utils';
import {
  BookOpenText,
  ClockIcon,
  Globe2Icon,
  FileText,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MessageSquarePlus,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  sources: string[];
  files: { fileId: string; name: string }[];
  projectId?: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const NewProjectForm = ({ onCreated }: { onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      setName('');
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white">
        <Plus size={16} /> New Project
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} placeholder="Project name..." className="flex-1 bg-transparent border border-light-200 dark:border-dark-200 rounded-lg px-3 py-1.5 text-sm text-black dark:text-white outline-none" />
      <button onClick={handleCreate} className="p-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black">Create</button>
    </div>
  );
};

const ProjectMenu = ({ project, onRenamed, onDeleted }: { project: Project; onRenamed: () => void; onDeleted: () => void }) => {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);

  const handleRename = async () => {
    if (!name.trim() || name.trim() === project.name) { setRenaming(false); return; }
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
      if (!res.ok) throw new Error('Failed to rename');
      setRenaming(false);
      onRenamed();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setOpen(false);
      onDeleted();
    } catch (err: any) { toast.error(err.message); }
  };

  if (renaming) {
    return (
      <div className="flex items-center gap-1">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }} className="w-24 bg-transparent border border-light-200 dark:border-dark-200 rounded px-1.5 py-0.5 text-xs text-black dark:text-white outline-none" />
        <button onClick={handleRename} className="p-0.5 text-black/50 dark:text-white/50"><Check size={12} /></button>
        <button onClick={() => setRenaming(false)} className="p-0.5 text-black/50 dark:text-white/50"><X size={12} /></button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded-lg text-black/50 dark:text-white/50 hover:bg-light-200 dark:hover:bg-dark-200"><MoreHorizontal size={14} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] rounded-lg border border-light-200 dark:border-dark-200 bg-light-secondary dark:bg-dark-secondary shadow-lg py-1">
            <button onClick={() => { setRenaming(true); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200"><Pencil size={12} /> Rename</button>
            <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-light-200 dark:hover:bg-dark-200"><Trash2 size={12} /> Delete</button>
          </div>
        </>
      )}
    </div>
  );
};

const ChatRow = ({ chat, projects, onMoved }: { chat: Chat; projects: Project[]; onMoved: () => void }) => {
  const sourcesLabel = chat.sources.length === 0 ? null
    : chat.sources.length <= 2 ? chat.sources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
    : `${chat.sources.slice(0, 2).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')} + ${chat.sources.length - 2}`;

  return (
    <div className="group flex flex-col gap-1.5 px-4 py-3 hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/mobile/c/${chat.id}`} className="flex-1 text-sm font-medium text-black dark:text-white leading-snug line-clamp-2">
          {chat.title}
        </Link>
        <DeleteChat chatId={chat.id} onDeleted={onMoved} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-black/50 dark:text-white/50">
        <span className="inline-flex items-center gap-0.5"><ClockIcon size={12} /> {formatTimeDifference(new Date(), chat.createdAt)} ago</span>
        {sourcesLabel && <span className="inline-flex items-center gap-0.5 border border-black/20 dark:border-white/20 rounded-full px-1.5 py-0.5"><Globe2Icon size={10} /> {sourcesLabel}</span>}
        {chat.files.length > 0 && <span className="inline-flex items-center gap-0.5 border border-black/20 dark:border-white/20 rounded-full px-1.5 py-0.5"><FileText size={10} /> {chat.files.length}f</span>}
      </div>
    </div>
  );
};

const Page = () => {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [creatingChatInProject, setCreatingChatInProject] = useState<string | null>(null);

  const handleNewChatInProject = async (projectId: string) => {
    try {
      setCreatingChatInProject(projectId);
      const res = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat', projectId }) });
      if (!res.ok) throw new Error('Failed to create chat');
      const data = await res.json();
      router.push(`/mobile/c/${data.chat.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setCreatingChatInProject(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chatsRes, projectsRes] = await Promise.all([fetch('/api/chats'), fetch('/api/projects')]);
      setChats((await chatsRes.json()).chats ?? []);
      setProjects((await projectsRes.json()).projects ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const uncategorized = chats.filter(c => !c.projectId);
  const getProjectChats = (projectId: string) => chats.filter(c => c.projectId === projectId);
  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg aria-hidden="true" className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z" fill="currentColor" />
          <path d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z" fill="currentFill" />
        </svg>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpenText size={28} />
          <div>
            <h1 className="text-2xl font-normal" style={{ fontFamily: 'PP Editorial, serif' }}>Library</h1>
            <p className="text-[10px] text-black/50 dark:text-white/50">{chats.length} chats, {projects.length} projects</p>
          </div>
        </div>
      </div>

      <NewProjectForm onCreated={fetchData} />

      <div className="mt-4 space-y-4 pb-8">
          {projects.map((project) => {
            const projectChats = getProjectChats(project.id);
            const expanded = expandedProjects.has(project.id);
            return (
              <div key={project.id}>
                <div className="flex items-center gap-2 py-1 group">
                  <button onClick={() => toggleProject(project.id)} className="flex items-center gap-2 flex-1 text-left">
                    {expanded ? <ChevronDown size={16} className="text-black/50 dark:text-white/50" /> : <ChevronRight size={16} className="text-black/50 dark:text-white/50" />}
                    <FolderOpen size={18} className="text-black/70 dark:text-white/70" />
                    <span className="text-sm font-medium text-black dark:text-white">{project.name}</span>
                    <span className="text-[10px] text-black/50 dark:text-white/50">{projectChats.length}</span>
                  </button>
                  <button
                    onClick={() => handleNewChatInProject(project.id)}
                    disabled={creatingChatInProject === project.id}
                    className="p-1 rounded-lg text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-light-200 dark:hover:bg-dark-200 transition-colors disabled:opacity-40"
                  >
                    {creatingChatInProject === project.id ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <MessageSquarePlus size={14} />
                    )}
                  </button>
                  <ProjectMenu project={project} onRenamed={fetchData} onDeleted={fetchData} />
                </div>
              {expanded && projectChats.length > 0 && (
                <div className="ml-6 mt-1 rounded-xl border border-light-200 dark:border-dark-200 overflow-hidden">
                  {projectChats.map(chat => <ChatRow key={chat.id} chat={chat} projects={projects} onMoved={fetchData} />)}
                </div>
              )}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div>
            <div className="flex items-center gap-2 py-1">
              <FolderKanban size={18} className="text-black/50 dark:text-white/50" />
              <span className="text-sm font-medium text-black/60 dark:text-white/60">Uncategorized</span>
              <span className="text-[10px] text-black/50 dark:text-white/50">{uncategorized.length}</span>
            </div>
            <div className="mt-1 rounded-xl border border-light-200 dark:border-dark-200 overflow-hidden">
              {uncategorized.map(chat => <ChatRow key={chat.id} chat={chat} projects={projects} onMoved={fetchData} />)}
            </div>
          </div>
        )}

        {chats.length === 0 && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <p className="text-sm text-black/70 dark:text-white/70">No chats found.</p>
            <Link href="/mobile" className="text-sm text-sky-400 mt-1">Start a new chat</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
