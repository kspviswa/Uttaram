'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Brain, Network, BarChart3, Clock, Lightbulb, Sparkles } from 'lucide-react';
import KnowledgeGraph from '@/components/KnowledgeGraph';

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
}

interface CuriosityProfile {
  type: string;
  description: string;
  topInterests: string[];
  explorationStyle: string;
}

function generateCuriosityProfile(data: AnalyticsData): CuriosityProfile {
  const { metrics, graph, chats } = data;

  const totalClusters = graph.clusters.length;
  const avgClusterSize = metrics.totalChats / totalClusters;

  let profileType = 'Explorer';
  let description = 'You explore diverse topics with curiosity and breadth.';
  let explorationStyle = 'Broad & Diverse';

  if (metrics.density > 0.3 && metrics.clusteringCoefficient > 0.4) {
    profileType = 'Deep Diver';
    description = 'You go deep into topics, building rich connections between related ideas.';
    explorationStyle = 'Deep & Connected';
  } else if (metrics.orphanRatio > 0.6) {
    profileType = 'Curious Wanderer';
    description = 'You explore many independent topics, following your curiosity freely.';
    explorationStyle = 'Independent & Curious';
  } else if (avgClusterSize > 5) {
    profileType = 'Topic Master';
    description = 'You focus intensely on a few key areas, building expertise.';
    explorationStyle = 'Focused & Systematic';
  }

  const topInterests = graph.clusters
    .filter(c => c.chatIds.length > 0)
    .sort((a, b) => b.chatIds.length - a.chatIds.length)
    .slice(0, 3)
    .map(c => c.label);

  return {
    type: profileType,
    description,
    topInterests,
    explorationStyle,
  };
}

function CuriosityProfileCard({ data }: { data: AnalyticsData }) {
  const profile = useMemo(() => generateCuriosityProfile(data), [data]);

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-black/90 dark:text-white/90">
            Your Curiosity Profile
          </h2>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">
            {profile.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {profile.type}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {profile.explorationStyle}
            </span>
          </div>
          {profile.topInterests.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-black/50 dark:text-white/50">Top interests: </span>
              <span className="text-xs text-black/70 dark:text-white/70">
                {profile.topInterests.join(' • ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KnowledgeMapSection({ data }: { data: AnalyticsData }) {
  const handleNodeClick = (node: any) => {
    // Could navigate to chat or show details
    console.log('Clicked node:', node);
  };

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Network className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Knowledge Graph</h3>
          <p className="text-xs text-black/50 dark:text-white/50">Your connected topics and clusters</p>
        </div>
      </div>

      <KnowledgeGraph
        nodes={data.graph.nodes}
        edges={data.graph.edges.map(e => ({
          source: e.source,
          target: e.target,
          weight: e.weight,
        }))}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}

function InterestBreakdown({ data }: { data: AnalyticsData }) {
  const barData = useMemo(() => {
    return data.graph.clusters
      .filter(c => c.chatIds.length > 0)
      .map(cluster => ({
        name: cluster.label,
        chats: cluster.chatIds.length,
      }))
      .sort((a, b) => b.chats - a.chats)
      .slice(0, 10);
  }, [data.graph.clusters]);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  if (barData.length === 0) {
    return (
      <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Interest Breakdown</h3>
            <p className="text-xs text-black/50 dark:text-white/50">Where your curiosity lives</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
          No interests mapped yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
          <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Interest Breakdown</h3>
          <p className="text-xs text-black/50 dark:text-white/50">Where your curiosity lives</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 10 }}
            />
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
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">Activity Rhythm</h3>
          <p className="text-xs text-black/50 dark:text-white/50">When you explore</p>
        </div>
      </div>

      <div className="space-y-2">
        {dayData.map((item) => (
          <div key={item.day} className="flex items-center gap-3">
            <span className="w-8 text-xs text-black/50 dark:text-white/50">{item.day}</span>
            <div className="flex-1 h-6 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.chats / maxChats) * 100}%`,
                  backgroundColor: `hsl(${(item.chats / maxChats) * 60}, 80%, 50%)`,
                }}
              />
            </div>
            <span className="w-8 text-xs text-right text-black/40 dark:text-white/40">
              {item.chats}
            </span>
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

    const smallClusters = clusters.filter(c => c.chatIds.length === 1 && c.chatIds.length > 0);
    if (smallClusters.length > 0) {
      recs.push(`You have ${smallClusters.length} topic${smallClusters.length > 1 ? 's' : ''} with only one chat. Consider exploring more to deepen your understanding.`);
    }

    const largeClusters = clusters.filter(c => c.chatIds.length >= 5);
    if (largeClusters.length > 0) {
      const clusterLabels = largeClusters.map(c => c.label).join(', ');
      recs.push(`You have deep knowledge in ${clusterLabels}. Consider connecting these areas with other topics.`);
    }

    if (data.metrics.density < 0.1) {
      recs.push('Your knowledge graph is sparse. Try linking related chats to discover hidden connections.');
    }

    if (recs.length === 0) {
      recs.push('Your curiosity is well-balanced! Keep exploring diverse topics to expand your knowledge graph.');
    }

    return recs;
  }, [data]);

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
          <Lightbulb className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">What's Next?</h3>
          <p className="text-xs text-black/50 dark:text-white/50">Recommendations for your learning journey</p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30"
          >
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
  const metrics = data.metrics;

  const generateCommentary = async () => {
    setIsLoading(true);
    try {
      const profile = generateCuriosityProfile(data);
      const summary = `
        You are a ${profile.type} with a ${profile.explorationStyle} style.
        You have ${data.metrics.totalChats} chats across ${data.graph.clusters.length} topics with ${data.metrics.totalEdges} connections.
        Your top interests are: ${profile.topInterests.join(', ')}.
        Your knowledge density is ${(data.metrics.density * 100).toFixed(1)}%.
        Provide a brief, insightful commentary about this curiosity pattern.
      `;
      setCommentary(
        `Based on your search patterns, you exhibit the characteristics of a ${profile.type.toLowerCase()}. ` +
        `Your ${profile.explorationStyle.toLowerCase()} approach has created a knowledge graph with ${data.metrics.totalChats} nodes and ${data.metrics.totalEdges} connections. ` +
        `The clustering coefficient of ${metrics.clusteringCoefficient.toFixed(2)} suggests your knowledge is ${data.metrics.clusteringCoefficient > 0.3 ? 'well-connected' : 'diverse but loosely connected'}. ` +
        `Consider ${data.metrics.density < 0.2 ? 'adding more connections between related topics' : 'maintaining your rich knowledge network'}.`
      );
    } catch {
      setCommentary('Unable to generate commentary at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-light-200 dark:border-dark-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
          <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">AI Commentary</h3>
          <p className="text-xs text-black/50 dark:text-white/50">Insights about your curiosity patterns</p>
        </div>
      </div>

      {!commentary ? (
        <button
          onClick={generateCommentary}
          disabled={isLoading}
          className="w-full p-3 rounded-lg border border-dashed border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Analyzing your curiosity...' : 'Generate AI Insights'}
        </button>
      ) : (
        <div className="p-4 rounded-lg bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30">
          <p className="text-sm text-pink-700 dark:text-pink-300 leading-relaxed">{commentary}</p>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(result => {
        if (result.success) setData(result.data);
        else toast.error('Failed to load analytics');
      })
      .catch(() => toast.error('Failed to fetch analytics'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-black/50 dark:text-white/50">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black/90 dark:text-white/90">Curiosity Map</h1>
        <p className="text-sm text-black/50 dark:text-white/50 mt-1">
          Your learning patterns, topic connections, and usage habits
        </p>
      </div>

      <CuriosityProfileCard data={data} />

      <KnowledgeMapSection data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InterestBreakdown data={data} />
        <ActivityRhythm data={data} />
      </div>

      <RecommendationsSection data={data} />

      <LLMCommentary data={data} />
    </div>
  );
}
