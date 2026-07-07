'use client';

import DeleteChat from '@/components/DeleteChat';
import { formatTimeDifference } from '@/lib/utils';
import {
  BookOpenText,
  ClockIcon,
  FileText,
  Globe2Icon,
  Plus,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  FolderOpen,
  MessageSquarePlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  sources: string[];
  files: { fileId: string; name: string }[];
  projectId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const NewProjectForm = ({
  onCreated,
}: {
  onCreated: () => void;
}) => {
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
      >
        <Plus size={16} />
        New Project
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Project name..."
        className="flex-1 bg-transparent border border-light-200 dark:border-dark-200 rounded-lg px-3 py-1.5 text-sm text-black dark:text-white outline-none focus:border-black/30 dark:focus:border-white/30"
      />
      <button
        onClick={handleCreate}
        className="p-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity"
      >
        <Check size={14} />
      </button>
      <button
        onClick={() => setOpen(false)}
        className="p-1.5 rounded-lg text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ProjectMenu = ({
  project,
  onRenamed,
  onDeleted,
}: {
  project: Project;
  onRenamed: () => void;
  onDeleted: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);

  const handleRename = async () => {
    if (!name.trim() || name.trim() === project.name) {
      setRenaming(false);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      setRenaming(false);
      onRenamed();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setOpen(false);
      onDeleted();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (renaming) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setRenaming(false);
          }}
          className="flex-1 bg-transparent border border-light-200 dark:border-dark-200 rounded-lg px-2 py-1 text-sm text-black dark:text-white outline-none focus:border-black/30 dark:focus:border-white/30"
        />
        <button onClick={handleRename} className="p-1 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white">
          <Check size={14} />
        </button>
        <button onClick={() => setRenaming(false)} className="p-1 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 text-black/50 dark:text-white/50 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-lg border border-light-200 dark:border-dark-200 bg-light-secondary dark:bg-dark-secondary shadow-lg py-1">
            <button
              onClick={() => {
                setRenaming(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              <Pencil size={14} />
              Rename
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const MoveToProjectDropdown = ({
  chatId,
  currentProjectId,
  projects,
  onMoved,
}: {
  chatId: string;
  currentProjectId?: string | null;
  projects: Project[];
  onMoved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMove = async (projectId: string | null) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error('Failed to move chat');
      setOpen(false);
      onMoved();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={(e) => {
          e.preventDefault();
          if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom + 4, left: rect.left });
          }
          setOpen(!open);
        }}
        className="inline-flex items-center gap-1 text-xs text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-light-200 dark:hover:bg-dark-200"
        title="Move to project"
      >
        <FolderKanban size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 min-w-[160px] rounded-lg border border-light-200 dark:border-dark-200 bg-light-secondary dark:bg-dark-secondary shadow-lg py-1"
            style={{ top: position.top, left: position.left }}
          >
            <button
              onClick={() => handleMove(null)}
              className="w-full text-left px-3 py-1.5 text-sm text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              No project
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleMove(p.id)}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-light-200 dark:hover:bg-dark-200 ${
                  p.id === currentProjectId
                    ? 'text-[#24A0ED]'
                    : 'text-black/70 dark:text-white/70'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Page = () => {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [creatingChatInProject, setCreatingChatInProject] = useState<string | null>(null);

  const handleNewChatInProject = async (projectId: string) => {
    try {
      setCreatingChatInProject(projectId);
      const project = projects.find((p) => p.id === projectId);
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', projectId }),
      });
      if (!res.ok) throw new Error('Failed to create chat');
      const data = await res.json();
      router.push(`/c/${data.chat.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setCreatingChatInProject(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chatsRes, projectsRes] = await Promise.all([
        fetch('/api/chats'),
        fetch('/api/projects'),
      ]);
      const chatsData = chatsRes.ok ? await chatsRes.json() : { chats: [] };
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };
      setChats(chatsData.chats ?? []);
      setProjects(projectsData.projects ?? []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uncategorized = chats.filter((c) => !c.projectId);
  const getProjectChats = (projectId: string) =>
    chats.filter((c) => c.projectId === projectId);

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chatCount = chats.length;

  return (
    <div>
      <div className="flex flex-col pt-10 border-b border-light-200/20 dark:border-dark-200/20 pb-6 px-2">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div className="flex items-center justify-center">
            <BookOpenText size={45} className="mb-2.5" />
            <div className="flex flex-col">
              <h1
                className="text-5xl font-normal p-2 pb-0"
                style={{ fontFamily: 'PP Editorial, serif' }}
              >
                Library
              </h1>
              <div className="px-2 text-sm text-black/60 dark:text-white/60 text-center lg:text-left">
                Past chats, sources, and uploads.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end gap-2 text-xs text-black/60 dark:text-white/60">
            <span className="inline-flex items-center gap-1 rounded-full border border-black/20 dark:border-white/20 px-2 py-0.5">
              <BookOpenText size={14} />
              {loading
                ? 'Loading…'
                : `${chatCount} ${chatCount === 1 ? 'chat' : 'chats'}`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-black/20 dark:border-white/20 px-2 py-0.5">
              <FolderKanban size={14} />
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 px-2">
        <NewProjectForm onCreated={fetchData} />
      </div>

      {loading ? (
        <div className="flex flex-row items-center justify-center min-h-[60vh]">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      ) : (
        <div className="pt-6 pb-28 px-2 space-y-6">
          {/* Project sections — always visible when projects exist */}
          {projects.map((project) => {
            const projectChats = getProjectChats(project.id);
            const expanded = expandedProjects.has(project.id);

            return (
              <div key={project.id}>
                <div className="flex items-center gap-2 mb-2 group">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {expanded ? (
                      <ChevronDown size={18} className="text-black/50 dark:text-white/50" />
                    ) : (
                      <ChevronRight size={18} className="text-black/50 dark:text-white/50" />
                    )}
                    <FolderOpen size={20} className="text-black/70 dark:text-white/70" />
                    <h2 className="text-lg font-medium text-black dark:text-white">
                      {project.name}
                    </h2>
                    <span className="text-xs text-black/50 dark:text-white/50">
                      {projectChats.length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleNewChatInProject(project.id)}
                    disabled={creatingChatInProject === project.id}
                    className="p-1 rounded-lg text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-light-200 dark:hover:bg-dark-200 transition-colors disabled:opacity-40"
                    title="New chat in this project"
                  >
                    {creatingChatInProject === project.id ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <MessageSquarePlus size={16} />
                    )}
                  </button>
                  <ProjectMenu project={project} onRenamed={fetchData} onDeleted={fetchData} />
                </div>

                {expanded && projectChats.length > 0 && (
                  <div className="rounded-2xl border border-light-200 dark:border-dark-200 overflow-hidden bg-light-primary dark:bg-dark-primary">
                    {projectChats.map((chat, index) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        index={index}
                        total={projectChats.length}
                        projects={projects}
                        onMoved={fetchData}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized section */}
          {uncategorized.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban size={20} className="text-black/50 dark:text-white/50" />
                <h2 className="text-lg font-medium text-black/60 dark:text-white/60">
                  Uncategorized
                </h2>
                <span className="text-xs text-black/50 dark:text-white/50">
                  {uncategorized.length}
                </span>
              </div>
              <div className="rounded-2xl border border-light-200 dark:border-dark-200 overflow-hidden bg-light-primary dark:bg-dark-primary">
                {uncategorized.map((chat, index) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    index={index}
                    total={uncategorized.length}
                    projects={projects}
                    onMoved={fetchData}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state — only when no chats and no projects */}
          {chatCount === 0 && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] px-2 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl border border-light-200 dark:border-dark-200 bg-light-secondary dark:bg-dark-secondary">
                <BookOpenText className="text-black/70 dark:text-white/70" />
              </div>
              <p className="mt-2 text-black/70 dark:text-white/70 text-sm">
                No chats found.
              </p>
              <p className="mt-1 text-black/70 dark:text-white/70 text-sm">
                <Link href="/" className="text-sky-400">
                  Start a new chat
                </Link>{' '}
                to see it listed here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChatRow = ({
  chat,
  index,
  total,
  projects,
  onMoved,
}: {
  chat: Chat;
  index: number;
  total: number;
  projects: Project[];
  onMoved: () => void;
}) => {
  const sourcesLabel =
    chat.sources.length === 0
      ? null
      : chat.sources.length <= 2
        ? chat.sources
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(', ')
        : `${chat.sources
            .slice(0, 2)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(', ')} + ${chat.sources.length - 2}`;

  return (
    <div
      className={
        'group flex flex-col gap-2 p-4 hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors duration-200 ' +
        (index !== total - 1
          ? 'border-b border-light-200 dark:border-dark-200'
          : '')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/c/${chat.id}`}
          className="flex-1 text-black dark:text-white text-base lg:text-lg font-medium leading-snug line-clamp-2 group-hover:text-[#24A0ED] transition duration-200"
          title={chat.title}
        >
          {chat.title}
        </Link>
        <div className="flex items-center gap-1 pt-0.5 shrink-0">
          {projects.length > 0 && (
            <MoveToProjectDropdown
              chatId={chat.id}
              currentProjectId={chat.projectId}
              projects={projects}
              onMoved={onMoved}
            />
          )}
          <DeleteChat
            chatId={chat.id}
            onDeleted={onMoved}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-black/70 dark:text-white/70">
        <span className="inline-flex items-center gap-1 text-xs">
          <ClockIcon size={14} />
          {formatTimeDifference(new Date(), chat.createdAt)} Ago
        </span>

        {sourcesLabel && (
          <span className="inline-flex items-center gap-1 text-xs border border-black/20 dark:border-white/20 rounded-full px-2 py-0.5">
            <Globe2Icon size={14} />
            {sourcesLabel}
          </span>
        )}
        {chat.files.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs border border-black/20 dark:border-white/20 rounded-full px-2 py-0.5">
            <FileText size={14} />
            {chat.files.length}{' '}
            {chat.files.length === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>
    </div>
  );
};

export default Page;