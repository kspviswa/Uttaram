'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import Loader from '@/components/ui/Loader';
import { toast } from 'sonner';

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

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

interface SankeyData {
  nodes: { id: string; name: string }[];
  links: { source: string; target: string; value: number }[];
}

interface RadarData {
  dimension: string;
  value: number;
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
  heatmap: HeatmapCell[][];
  treemap: TreemapNode[];
  sankey: SankeyData;
  radar: RadarData[];
  metrics: AnalyticsMetrics;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function KnowledgeGraph({ data }: { data: AnalyticsData }) {
  if (data.graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-black/50 dark:text-white/50">
        No data available. Add some chats to see the knowledge graph.
      </div>
    );
  }

  const clusterColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ];

  const nodesByCluster = data.graph.clusters.map((cluster) => ({
    name: `Topic ${cluster.id + 1}`,
    count: cluster.chatIds.length,
    color: clusterColors[cluster.id % clusterColors.length],
  }));

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={nodesByCluster} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            width={80}
          />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {nodesByCluster.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CuriosityHeatmap({ data }: { data: AnalyticsData }) {
  const heatmapData: { day: string; hour: string; count: number }[] = [];

  data.heatmap.forEach((day, dayIndex) => {
    day.forEach((cell) => {
      heatmapData.push({
        day: DAYS[dayIndex],
        hour: `${cell.hour}:00`,
        count: cell.count,
      });
    });
  });

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  return (
    <div className="h-[300px] overflow-auto">
      <div className="grid grid-cols-24 gap-0.5 min-w-[600px]">
        {DAYS.map((day) =>
          Array.from({ length: 24 }, (_, hour) => {
            const cell = heatmapData.find(
              (d) => d.day === day && d.hour === `${hour}:00`,
            );
            const count = cell?.count || 0;
            const intensity = count / maxCount;

            return (
              <div
                key={`${day}-${hour}`}
                className="w-6 h-6 rounded-sm"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                }}
                title={`${day} ${hour}:00 - ${count} chats`}
              />
            );
          }),
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-black/50 dark:text-white/50">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

function TopicRadar({ data }: { data: AnalyticsData }) {
  if (data.radar.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-black/50 dark:text-white/50">
        No topic data available
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data.radar}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Radar
            name="Interest"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function InsightMetrics({ data }: { data: AnalyticsData }) {
  const { metrics } = data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
        <div className="text-2xl font-bold text-black/90 dark:text-white/90">
          {metrics.totalChats}
        </div>
        <div className="text-xs text-black/50 dark:text-white/50">
          Total Chats
        </div>
      </div>
      <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
        <div className="text-2xl font-bold text-black/90 dark:text-white/90">
          {metrics.totalMessages}
        </div>
        <div className="text-xs text-black/50 dark:text-white/50">
          Total Messages
        </div>
      </div>
      <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
        <div className="text-2xl font-bold text-black/90 dark:text-white/90">
          {metrics.totalEdges}
        </div>
        <div className="text-xs text-black/50 dark:text-white/50">
          Connections
        </div>
      </div>
      <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
        <div className="text-2xl font-bold text-black/90 dark:text-white/90">
          {(metrics.clusteringCoefficient * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-black/50 dark:text-white/50">
          Cluster Density
        </div>
      </div>
    </div>
  );
}

function HubNodes({ data }: { data: AnalyticsData }) {
  if (data.metrics.hubNodes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
      <h4 className="text-sm font-medium text-black/90 dark:text-white/90 mb-3">
        Most Connected Chats
      </h4>
      <div className="space-y-2">
        {data.metrics.hubNodes.map((node) => (
          <div
            key={node.id}
            className="flex justify-between items-center text-xs"
          >
            <span className="text-black/70 dark:text-white/70 truncate">
              {node.title}
            </span>
            <span className="text-black/50 dark:text-white/50 ml-2">
              {node.connections} connections
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load analytics');
          toast.error('Failed to load analytics data');
        }
      } catch (err) {
        setError('Failed to fetch analytics');
        toast.error('Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-black/50 dark:text-white/50">No data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black/90 dark:text-white/90">
          Curiosity Map
        </h1>
        <p className="text-sm text-black/50 dark:text-white/50 mt-1">
          Explore your learning patterns and topic connections
        </p>
      </div>

      <InsightMetrics data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
          <h3 className="text-sm font-medium text-black/90 dark:text-white/90 mb-4">
            Topic Distribution
          </h3>
          <KnowledgeGraph data={data} />
        </div>

        <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
          <h3 className="text-sm font-medium text-black/90 dark:text-white/90 mb-4">
            Interest Radar
          </h3>
          <TopicRadar data={data} />
        </div>
      </div>

      <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
        <h3 className="text-sm font-medium text-black/90 dark:text-white/90 mb-4">
          Curiosity Heatmap
        </h3>
        <CuriosityHeatmap data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HubNodes data={data} />
        </div>

        <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4">
          <h4 className="text-sm font-medium text-black/90 dark:text-white/90 mb-3">
            Topic Clusters
          </h4>
          <div className="space-y-2">
            {data.graph.clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="flex justify-between items-center text-xs"
              >
                <span className="text-black/70 dark:text-white/70">
                  Topic {cluster.id + 1}
                </span>
                <span className="text-black/50 dark:text-white/50">
                  {cluster.chatIds.length} chats
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}