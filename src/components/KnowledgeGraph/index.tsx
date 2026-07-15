'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  cluster: number;
  messageCount: number;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
}

const CLUSTER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

function getNodeColor(cluster: number): string {
  if (cluster < 0) return '#6b7280';
  return CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
}

function getNodeRadius(messageCount: number): number {
  return Math.max(8, Math.min(20, 6 + messageCount * 2));
}

function truncateTitle(title: string, maxLength: number = 30): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
}

export default function KnowledgeGraph({ nodes, edges, onNodeClick }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [simulationNodes, setSimulationNodes] = useState<GraphNode[]>([]);
  const simulationRef = useRef<any>(null);

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(selectedNode);
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
      if (sourceId === selectedNode) connected.add(targetId);
      if (targetId === selectedNode) connected.add(sourceId);
    });
    return connected;
  }, [selectedNode, edges]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;

    const nodesCopy = nodes.map(n => ({
      ...n,
      x: n.x || dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: n.y || dimensions.height / 2 + (Math.random() - 0.5) * 200,
    }));

    const links = edges.map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));

    const simulation = forceSimulation(nodesCopy as SimulationNodeDatum[])
      .force('link', forceLink(links as any)
        .id((d: any) => d.id)
        .distance(100)
        .strength((d: any) => d.weight * 0.5))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide().radius((d: any) => getNodeRadius(d.messageCount) + 10))
      .on('tick', () => {
        setSimulationNodes([...nodesCopy] as GraphNode[]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale * delta)),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'circle') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = simulationNodes.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    }
  }, [simulationNodes]);

  const handleNodeDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    const node = simulationNodes.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      node.fx = (e.clientX - rect.left - transform.x) / transform.scale;
      node.fy = (e.clientY - rect.top - transform.y) / transform.scale;
    }
  }, [simulationNodes, transform]);

  const handleNodeDragEnd = useCallback((nodeId: string) => {
    const node = simulationNodes.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      simulationRef.current.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    }
  }, [simulationNodes]);

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
    onNodeClick?.(simulationNodes.find(n => n.id === nodeId)!);
  }, [simulationNodes, onNodeClick]);

  const getNodePosition = (nodeId: string) => {
    const node = simulationNodes.find(n => n.id === nodeId);
    return node ? { x: node.x || 0, y: node.y || 0 } : { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-[500px] rounded-xl border border-light-200 dark:border-dark-200 overflow-hidden bg-gradient-to-br from-light-primary to-light-secondary dark:from-dark-primary dark:to-dark-secondary">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="text-xs text-black/50 dark:text-white/50">
          {nodes.length} chats • {edges.length} connections
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
          className="w-7 h-7 rounded-lg bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 flex items-center justify-center text-black/60 dark:text-white/60 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale * 0.8) }))}
          className="w-7 h-7 rounded-lg bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 flex items-center justify-center text-black/60 dark:text-white/60 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-7 h-7 rounded-lg bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 flex items-center justify-center text-black/60 dark:text-white/60 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors text-xs"
        >
          ⟳
        </button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {edges.map((edge, i) => {
            const sourcePos = getNodePosition(typeof edge.source === 'string' ? edge.source : (edge.source as any).id);
            const targetPos = getNodePosition(typeof edge.target === 'string' ? edge.target : (edge.target as any).id);
            const isHighlighted = selectedNode && (
              (typeof edge.source === 'string' ? edge.source : (edge.source as any).id) === selectedNode ||
              (typeof edge.target === 'string' ? edge.target : (edge.target as any).id) === selectedNode
            );
            const opacity = selectedNode ? (isHighlighted ? 0.8 : 0.1) : 0.3;

            return (
              <line
                key={`edge-${i}`}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={opacity}
                strokeDasharray={isHighlighted ? 'none' : '4 2'}
              />
            );
          })}

          {simulationNodes.map(node => {
            const radius = getNodeRadius(node.messageCount);
            const color = getNodeColor(node.cluster);
            const isSelected = selectedNode === node.id;
            const isConnected = connectedNodes.has(node.id);
            const isDimmed = selectedNode && !isConnected;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x || 0}, ${node.y || 0})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                onMouseMove={(e) => handleNodeDrag(node.id, e)}
                onMouseUp={() => handleNodeDragEnd(node.id)}
                onClick={(e) => handleNodeClick(node.id, e)}
              >
                <circle
                  r={radius}
                  fill={color}
                  fillOpacity={isDimmed ? 0.2 : isSelected ? 1 : 0.8}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                  className="transition-all duration-200"
                />

                {(hoveredNode === node.id || isSelected) && (
                  <g>
                    <rect
                      x={-60}
                      y={radius + 8}
                      width={120}
                      height={24}
                      rx={4}
                      fill="rgba(0,0,0,0.8)"
                      className="pointer-events-none"
                    />
                    <text
                      x={0}
                      y={radius + 24}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      className="pointer-events-none select-none"
                    >
                      {truncateTitle(node.title, 20)}
                    </text>
                  </g>
                )}

                {isSelected && (
                  <g>
                    <rect
                      x={-70}
                      y={-radius - 32}
                      width={140}
                      height={24}
                      rx={4}
                      fill="rgba(59,130,246,0.9)"
                      className="pointer-events-none"
                    />
                    <text
                      x={0}
                      y={-radius - 16}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {node.messageCount} messages
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-lg bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-black/80 dark:text-white/80 truncate">
                {simulationNodes.find(n => n.id === selectedNode)?.title}
              </p>
              <p className="text-[10px] text-black/50 dark:text-white/50 mt-1">
                {edges.filter(e =>
                  (typeof e.source === 'string' ? e.source : (e.source as any).id) === selectedNode ||
                  (typeof e.target === 'string' ? e.target : (e.target as any).id) === selectedNode
                ).length} connections
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-black/50 dark:text-white/50 font-medium">Related chats:</p>
            {edges
              .filter(e =>
                (typeof e.source === 'string' ? e.source : (e.source as any).id) === selectedNode ||
                (typeof e.target === 'string' ? e.target : (e.target as any).id) === selectedNode
              )
              .slice(0, 3)
              .map((edge, i) => {
                const relatedId = (typeof edge.source === 'string' ? edge.source : (edge.source as any).id) === selectedNode
                  ? (typeof edge.target === 'string' ? edge.target : (edge.target as any).id)
                  : (typeof edge.source === 'string' ? edge.source : (edge.source as any).id);
                const relatedNode = simulationNodes.find(n => n.id === relatedId);
                return (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-black/60 dark:text-white/60 truncate">
                      {truncateTitle(relatedNode?.title || '', 25)}
                    </span>
                    <span className="text-black/40 dark:text-white/40 ml-2">
                      {Math.round(edge.weight * 100)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
