'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import Loader from '@/components/ui/Loader';
import { toast } from 'sonner';
import { Brain, BarChart3, Clock, Lightbulb, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

interface GraphNode {
  id: string;
  title: string;
  cluster: number;
  createdAt: string;
  messageCount: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'explicit' | 'implicit';
}

interface Cluster {
  id: number;
  label: string;
  chatIds: string[];
}

interface AnalyticsMetrics {
  totalChats: number;
  totalMessages: number;
  totalEdges: number;
  density: number;
  orphanRatio: number;
  clusteringCoefficient: number;
  hubNodes: { id: string; title: string; connections: number }[];
  bridgeTopics: string[];
}

interface AnalyticsData {
  chats: GraphNode[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    clusters: Cluster[];
  };
  heatmap: { day: number; hour: number; count: number }[][];
  radar: { dimension: string; value: number }[];
  metrics: AnalyticsMetrics;
  mixedEmbeddingInfo: {
    hasMixed: boolean;
    dimensions: Record<number, number>;
    totalChats: number;
    embeddedChats: number;
    excludedChats: number;
  };
}

function generateCuriosityProfile(data: AnalyticsData) {
  const { metrics, graph } = data;
  const totalClusters = graph.clusters.length;
  const avgClusterSize = metrics.totalChats / totalClusters;
  let profileType = 'Explorer';
  let description = 'You explore diverse topics with curiosity and breadth.';
  let explorationStyle = 'Broad & Diverse';
  if (metrics.density > 0.3 && metrics.clusteringCoefficient > 0.4) {
    profileType = 'Deep Diver';
    description = 'You go deep into topics, building rich connections.';
    explorationStyle = 'Deep & Connected';
  } else if (metrics.orphanRatio > 0.6) {
    profileType = 'Curious Wanderer';
    description = 'You explore many independent topics freely.';
    explorationStyle = 'Independent & Curious';
  } else if (avgClusterSize > 5) {
    profileType = 'Topic Master';
    description = 'You focus intensely on a few key areas.';
    explorationStyle = 'Focused & Systematic';
  }
  const topInterests = graph.clusters
    .filter(c => c.chatIds.length > 0)
    .sort((a, b) => b.chatIds.length - a.chatIds.length)
    .slice(0, 3)
    .map(c => c.label);
  return { type: profileType, description, topInterests, explorationStyle };
}

function CompactMetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-black/50 dark:text-white/50">{label}</p>
        <p className="text-sm font-semibold text-black/90 dark:text-white/90">{value}</p>
      </div>
    </div>
  );
}

function CuriosityProfileCard({ data }: { data: AnalyticsData }) {
  const profile = useMemo(() => generateCuriosityProfile(data), [data]);

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-black/90 dark:text-white/90">Your Curiosity Profile</h2>
          <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">{profile.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{profile.type}</span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{profile.explorationStyle}</span>
          </div>
          {profile.topInterests.length > 0 && (
            <p className="text-[10px] text-black/50 dark:text-white/50 mt-2">
              Top interests: <span className="text-black/70 dark:text-white/70">{profile.topInterests.join(' • ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InterestBreakdown({ data }: { data: AnalyticsData }) {
  const barData = useMemo(() => {
    return data.graph.clusters
      .filter(c => c.chatIds.length > 0)
      .map(cluster => ({ name: cluster.label, chats: cluster.chatIds.length }))
      .sort((a, b) => b.chats - a.chats)
      .slice(0, 8);
  }, [data.graph.clusters]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (barData.length === 0) {
    return (
      <div className="rounded-xl border border-light-200 dark:border-dark-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Interest Breakdown</h3>
        </div>
        <p className="text-xs text-black/40 dark:text-white/40 text-center py-6">No interests mapped yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Interest Breakdown</h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="chats" radius={[0, 4, 4, 0]}>
              {barData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ActivityRhythm({ data }: { data: AnalyticsData }) {
  const dayData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => ({
      day,
      chats: data.heatmap[i]?.reduce((sum, cell) => sum + cell.count, 0) || 0,
    }));
  }, [data.heatmap]);

  const maxChats = Math.max(...dayData.map(d => d.chats), 1);

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Activity Rhythm</h3>
      </div>
      <div className="space-y-1.5">
        {dayData.map((item) => (
          <div key={item.day} className="flex items-center gap-2">
            <span className="w-7 text-[10px] text-black/50 dark:text-white/50">{item.day}</span>
            <div className="flex-1 h-5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.chats / maxChats) * 100}%`,
                  backgroundColor: `hsl(${(item.chats / maxChats) * 60}, 80%, 50%)`,
                }}
              />
            </div>
            <span className="w-6 text-[10px] text-right text-black/40 dark:text-white/40">{item.chats}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsSection({ data }: { data: AnalyticsData }) {
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const { clusters, edges } = data.graph;
    const singleChatTopics = clusters.filter(c => c.chatIds.length === 1);
    if (singleChatTopics.length > 0) {
      recs.push(`You have ${singleChatTopics.length} topic${singleChatTopics.length > 1 ? 's' : ''} with only one chat. Explore more to deepen your understanding.`);
    }
    const deepTopics = clusters.filter(c => c.chatIds.length >= 5);
    if (deepTopics.length > 0) {
      recs.push(`You have deep knowledge in ${deepTopics.map(c => c.label).join(', ')}. Try connecting with other topics.`);
    }
    if (data.metrics.density < 0.1) {
      recs.push('Your knowledge graph is sparse. Try linking related chats.');
    }
    if (recs.length === 0) {
      recs.push('Your curiosity is well-balanced! Keep exploring.');
    }
    return recs;
  }, [data]);

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">What's Next?</h3>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30">
            <p className="text-xs text-cyan-700 dark:text-cyan-300">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LLMCommentary({ data }: { data: AnalyticsData }) {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateCommentary = async () => {
    setIsLoading(true);
    try {
      const profile = generateCuriosityProfile(data);
      setCommentary(
        `Based on your search patterns, you exhibit the characteristics of a ${profile.type.toLowerCase()}. ` +
        `Your ${profile.explorationStyle.toLowerCase()} approach has created a knowledge graph with ${data.metrics.totalChats} nodes and ${data.metrics.totalEdges} connections. ` +
        `The clustering coefficient of ${data.metrics.clusteringCoefficient.toFixed(2)} suggests your knowledge is ${data.metrics.clusteringCoefficient > 0.3 ? 'well-connected' : 'diverse but loosely connected'}.`
      );
    } catch {
      setCommentary('Unable to generate commentary at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
        <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">AI Commentary</h3>
      </div>
      {!commentary ? (
        <button
          onClick={generateCommentary}
          disabled={isLoading}
          className="w-full p-3 rounded-lg border border-dashed border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 text-xs hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Generate AI Insights'}
        </button>
      ) : (
        <div className="p-3 rounded-lg bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30">
          <p className="text-xs text-pink-700 dark:text-pink-300 leading-relaxed">{commentary}</p>
        </div>
      )}
    </div>
  );
}

function MixedEmbeddingBanner({ info, onReEmbedComplete }: { info: AnalyticsData['mixedEmbeddingInfo']; onReEmbedComplete: () => void }) {
  const [isReEmbedding, setIsReEmbedding] = useState(false);
  const [phase, setPhase] = useState<'chats' | 'messages'>('chats');
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<{ chats: { embedded: number; errors: number }; messages: { embedded: number; errors: number } } | null>(null);

  const handleReEmbed = useCallback(async () => {
    setIsReEmbedding(true);
    setDone(0);
    setTotal(0);
    setResult(null);
    try {
      const res = await fetch('/api/embeddings/reembed', { method: 'POST' });
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done: doneReading, value } = await reader.read();
        if (doneReading) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine?.startsWith('data: ')) {
              const data = JSON.parse(dataLine.slice(6));
              if (eventType === 'progress') { setPhase(data.phase); setDone(data.done); setTotal(data.total); }
              else if (eventType === 'complete') { setResult(data); onReEmbedComplete(); }
              else if (eventType === 'error') { toast.error(data.message || 'Re-embedding failed'); }
            }
          }
        }
      }
    } catch { toast.error('Failed to start re-embedding'); }
    finally { setIsReEmbedding(false); }
  }, [onReEmbedComplete]);

  const dimensions = Object.entries(info.dimensions).map(([dim, count]) => `${count}× ${dim}d`).join(', ');
  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-200">Incomplete Analytics</h3>
          <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">{info.excludedChats} chat{info.excludedChats !== 1 ? 's' : ''} excluded ({dimensions}). Re-embed to get a complete picture.</p>
          {isReEmbedding && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-400 mb-0.5"><span>{phase === 'chats' ? 'Re-embedding chats...' : 'Re-embedding messages...'}</span><span>{done}/{total}</span></div>
              <div className="h-1.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          {result && <p className="text-[10px] text-green-700 dark:text-green-300 mt-1">Done! Embedded {result.chats.embedded} chats and {result.messages.embedded} messages.</p>}
          {!isReEmbedding && (
            <button onClick={handleReEmbed} className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-[10px] font-medium text-amber-800 dark:text-amber-200">
              <RefreshCw className="w-3 h-3" /> Re-embed All Chats
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MobileAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    fetch('/api/analytics')
      .then(r => r.json())
      .then(result => {
        if (result.success) setData(result.data);
        else toast.error('Failed to load analytics');
      })
      .catch(() => toast.error('Failed to fetch analytics'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-black/50 dark:text-white/50 text-sm">
        No data available
      </div>
    );
  }

  const metrics = data.metrics;

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-black/90 dark:text-white/90">Curiosity Map</h1>
        <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">Your learning patterns and usage habits</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CompactMetricCard label="Total Chats" value={metrics.totalChats} icon={Brain} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <CompactMetricCard label="Connections" value={metrics.totalEdges} icon={BarChart3} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <CompactMetricCard label="Density" value={`${(metrics.density * 100).toFixed(1)}%`} icon={BarChart3} color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" />
        <CompactMetricCard label="Clusters" value={data.graph.clusters.length} icon={BarChart3} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
      </div>

      {data.mixedEmbeddingInfo.hasMixed && (
        <MixedEmbeddingBanner info={data.mixedEmbeddingInfo} onReEmbedComplete={fetchData} />
      )}

      <CuriosityProfileCard data={data} />

      <InterestBreakdown data={data} />
      <ActivityRhythm data={data} />
      <RecommendationsSection data={data} />
      <LLMCommentary data={data} />
    </div>
  );
}
