"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Database, Network, Loader2, Info, Zap, TrendingUp, Filter, Search, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import * as d3 from "d3";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: "Subject" | "Chapter" | "Subtopic" | "Question";
  questionCount?: number;
  subject?: string;
  chapter?: string;
  subtopic?: string;
  year?: number;
  marks?: number;
  has_diagram?: boolean;
  question_text?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface SimulatedGraphNode extends GraphNode {
  x: number;
  y: number;
}

interface SimulatedGraphLink extends GraphLink {
  source: SimulatedGraphNode;
  target: SimulatedGraphNode;
}


interface GraphFilters {
  showSubjects: boolean;
  showChapters: boolean;
  showSubtopics: boolean;
  showQuestions: boolean;
  searchTerm: string;
  excludeDiagrams: boolean;
  subjectFilter: string;
  questionLimit: number;
}

export default function ExplorePage() {
  const [filters, setFilters] = useState<GraphFilters>({
    showSubjects: true,
    showChapters: true,
    showSubtopics: true,
    showQuestions: true,
    searchTerm: "",
    excludeDiagrams: false,
    subjectFilter: "",
    questionLimit: 100,
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Fetch data from Convex
  const graphData = useQuery(api.questions.getGraphData, {
    limit: filters.questionLimit,
    excludeDiagrams: filters.excludeDiagrams,
    subjectFilter: filters.subjectFilter || undefined,
  });

  const stats = useQuery(api.questions.getStats);
  const subjects = useQuery(api.questions.getSubjects);

  // Compute filtered data (client-side filtering based on UI filters)
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    const filteredNodes = graphData.nodes.filter((node: GraphNode) => {
      // Filter by node type visibility
      if (node.type === 'Subject' && !filters.showSubjects) return false;
      if (node.type === 'Chapter' && !filters.showChapters) return false;
      if (node.type === 'Subtopic' && !filters.showSubtopics) return false;
      if (node.type === 'Question' && !filters.showQuestions) return false;

      // Filter by search term
      if (filters.searchTerm && !node.label.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Get all node IDs that passed filtering
    const filteredNodeIds = new Set(filteredNodes.map((node: GraphNode) => node.id));

    // Filter links to only include those between filtered nodes
    const filteredLinks = graphData.links.filter((link: GraphLink) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filters.showSubjects, filters.showChapters, filters.showSubtopics, filters.showQuestions, filters.searchTerm]);

  // D3.js Graph Visualization
  useEffect(() => {
    if (!filteredData || !svgRef.current || !gRef.current || filteredData.nodes.length === 0) return;

    console.log("Rendering graph with data:", filteredData);

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const width = 1000;
    const height = 700;

    // Clear previous content
    g.selectAll("*").remove();

    // Create color scale for node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Subject', 'Chapter', 'Subtopic', 'Question'])
      .range(['#8b5cf6', '#ec4899', '#f59e0b', '#10b981']);

    // Calculate node degrees (number of connections)
    const linkCounts = new Map<string, number>();
    filteredData.nodes.forEach((node: GraphNode) => {
      linkCounts.set(node.id, 0);
    });

    filteredData.links.forEach((link: GraphLink) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      linkCounts.set(sourceId, (linkCounts.get(sourceId) || 0) + 1);
      linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
    });

    // Create size scale based on node degree and type
    const maxDegree = d3.max(filteredData.nodes, (d: GraphNode) => linkCounts.get(d.id) || 0) || 1;
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxDegree])
      .range([8, 30]);

    const getNodeSize = (d: GraphNode) => {
      const baseDegree = linkCounts.get(d.id) || 0;
      // Make subjects and chapters larger
      const multiplier = d.type === 'Subject' ? 1.5 : d.type === 'Chapter' ? 1.2 : d.type === 'Subtopic' ? 1.0 : 0.7;
      return sizeScale(baseDegree) * multiplier;
    };

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(filteredData.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(filteredData.links)
        .id((d: GraphNode) => d.id)
        .distance((d: GraphLink) => {
          // Shorter distances for hierarchical connections
          const sourceNode = typeof d.source === 'object' ? d.source : filteredData.nodes.find(n => n.id === d.source);
          const targetNode = typeof d.target === 'object' ? d.target : filteredData.nodes.find(n => n.id === d.target);
          if (!sourceNode || !targetNode) return 100;
          
          // Hierarchical distances
          if (sourceNode.type === 'Subject' && targetNode.type === 'Chapter') return 120;
          if (sourceNode.type === 'Chapter' && targetNode.type === 'Subtopic') return 100;
          if (sourceNode.type === 'Subtopic' && targetNode.type === 'Question') return 80;
          return 100;
        })
        .strength(0.5))
      .force("charge", d3.forceManyBody()
        .strength((d) => {
          // Stronger repulsion for larger nodes
          const node = d as GraphNode;
          return node.type === 'Subject' ? -800 : node.type === 'Chapter' ? -500 : node.type === 'Subtopic' ? -300 : -150;
        })
        .distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>()
        .radius((d: GraphNode) => getNodeSize(d) + 5));

    simulationRef.current = simulation;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    // Set initial zoom
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    zoomRef.current = zoom;
    svg.call(zoom);

    // Create links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredData.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: GraphLink) => {
        // Thicker lines for higher-level connections
        const sourceNode = typeof d.source === 'object' ? d.source : null;
        return sourceNode?.type === 'Subject' ? 3 : sourceNode?.type === 'Chapter' ? 2 : 1;
      });

    // Create nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(filteredData.nodes as GraphNode[])
      .enter().append("circle")
      .attr("r", getNodeSize)
      .attr("fill", (d: GraphNode) => colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        // Highlight connected nodes and links
        const connectedNodeIds = new Set<string>();
        filteredData.links.forEach((link: GraphLink) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (sourceId === d.id || targetId === d.id) {
            connectedNodeIds.add(sourceId);
            connectedNodeIds.add(targetId);
          }
        });

        node.attr("opacity", (n: GraphNode) => connectedNodeIds.has(n.id) ? 1 : 0.2);
        link.attr("opacity", (l: GraphLink) => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sourceId === d.id || targetId === d.id) ? 1 : 0.1;
        });
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        node.attr("opacity", 1);
        link.attr("opacity", 0.6);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(selectedNode?.id === d.id ? null : d);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Create node labels
    const nodeLabel = g.append("g")
      .attr("class", "node-labels")
      .selectAll("text")
      .data(filteredData.nodes)
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d: GraphNode) => -(getNodeSize(d) + 5))
      .attr("font-size", (d: GraphNode) => {
        return d.type === 'Subject' ? "14px" : d.type === 'Chapter' ? "12px" : d.type === 'Subtopic' ? "10px" : "8px";
      })
      .attr("font-weight", (d: GraphNode) => d.type === 'Subject' || d.type === 'Chapter' ? "600" : "500")
      .attr("fill", "#374151")
      .style("pointer-events", "none")
      .text((d: GraphNode) => {
        const maxLength = d.type === 'Subject' ? 20 : d.type === 'Chapter' ? 18 : d.type === 'Subtopic' ? 15 : 10;
        return d.label.length > maxLength ? d.label.substring(0, maxLength - 3) + "..." : d.label;
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d as unknown as SimulatedGraphLink).source.x)
        .attr("y1", (d) => (d as unknown as SimulatedGraphLink).source.y)
        .attr("x2", (d) => (d as unknown as SimulatedGraphLink).target.x)
        .attr("y2", (d) => (d as unknown as SimulatedGraphLink).target.y);

      node
        .attr("cx", (d) => (d as unknown as SimulatedGraphNode).x)
        .attr("cy", (d) => (d as unknown as SimulatedGraphNode).y);

      nodeLabel
        .attr("x", (d) => (d as unknown as SimulatedGraphNode).x)
        .attr("y", (d) => (d as unknown as SimulatedGraphNode).y);
    });

    // Handle background click to deselect
    svg.on("click", () => setSelectedNode(null));

    // Cleanup
    return () => {
      simulation.stop();
      svg.on("click", null);
    };
  }, [filteredData, selectedNode]);

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.scaleBy, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.scaleBy, 0.67
      );
    }
  };

  const handleResetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    }
  };

  const handleRestartSimulation = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  if (!graphData || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading graph data from Convex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Database className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Knowledge Graph Explorer</h1>
                  <p className="text-xs text-muted-foreground">
                    Powered by Convex Database
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Questions</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">{stats.totalQuestions.toLocaleString()}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Subjects</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{stats.totalSubjects}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Chapters</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.totalChapters}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Subtopics</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.totalSubtopics}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">First Year</span>
              </div>
              <p className="text-2xl font-bold text-indigo-500">{stats.earliestYear}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Latest Year</span>
              </div>
              <p className="text-2xl font-bold text-pink-500">{stats.latestYear}</p>
            </Card>
          </div>
        )}

        {/* Graph Visualization */}
        <Card className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-2">Hierarchical Knowledge Graph</h2>
                <p className="text-sm text-muted-foreground">
                  Subject → Chapter → Subtopic → Question hierarchy visualization
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="p-4 mb-4 bg-muted/30">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search nodes..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="flex-1 px-3 py-1 text-sm border border-border rounded-md bg-background"
                    />
                  </div>

                  {/* Subject Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Subject:</label>
                    <select
                      value={filters.subjectFilter}
                      onChange={(e) => setFilters(prev => ({ ...prev, subjectFilter: e.target.value }))}
                      className="flex-1 px-3 py-1 text-sm border border-border rounded-md bg-background"
                    >
                      <option value="">All Subjects</option>
                      {subjects?.map((subject) => (
                        <option key={subject.name} value={subject.name}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Limit */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Question Limit:</label>
                    <select
                      value={filters.questionLimit}
                      onChange={(e) => setFilters(prev => ({ ...prev, questionLimit: parseInt(e.target.value) }))}
                      className="flex-1 px-3 py-1 text-sm border border-border rounded-md bg-background"
                    >
                      <option value="50">50 Questions</option>
                      <option value="100">100 Questions</option>
                      <option value="200">200 Questions</option>
                      <option value="500">500 Questions</option>
                    </select>
                  </div>

                  {/* Node Type Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showSubjects}
                        onChange={(e) => setFilters(prev => ({ ...prev, showSubjects: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                      Subjects
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showChapters}
                        onChange={(e) => setFilters(prev => ({ ...prev, showChapters: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#ec4899]"></div>
                      Chapters
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showSubtopics}
                        onChange={(e) => setFilters(prev => ({ ...prev, showSubtopics: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                      Subtopics
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showQuestions}
                        onChange={(e) => setFilters(prev => ({ ...prev, showQuestions: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                      Questions
                    </label>
                  </div>

                  {/* Additional Filters */}
                  <div className="pt-3 border-t border-border">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.excludeDiagrams}
                        onChange={(e) => setFilters(prev => ({ ...prev, excludeDiagrams: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Exclude questions with diagrams</span>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-xs text-muted-foreground">Subject</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ec4899]"></div>
                <span className="text-xs text-muted-foreground">Chapter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <span className="text-xs text-muted-foreground">Subtopic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-muted-foreground">Question</span>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg overflow-hidden border" style={{ height: "700px" }}>
            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
              <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetZoom} className="h-8 w-8 p-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRestartSimulation} className="h-8 w-8 p-0">
                <Network className="h-4 w-4" />
              </Button>
            </div>

            <svg
              ref={svgRef}
              width="1000"
              height="700"
              viewBox="0 0 1000 700"
              className="cursor-grab active:cursor-grabbing w-full"
            >
              <g ref={gRef} />
            </svg>

            {/* Node Info Panel */}
            {(selectedNode || hoveredNode) && (
              <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 max-w-xs shadow-lg">
                <Badge className="mb-2">{(selectedNode || hoveredNode)?.type}</Badge>
                <h3 className="font-semibold text-sm mb-1">{(selectedNode || hoveredNode)?.label}</h3>
                
                {(selectedNode || hoveredNode)?.questionCount !== undefined && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Questions: {(selectedNode || hoveredNode)?.questionCount}
                  </p>
                )}
                
                {(selectedNode || hoveredNode)?.year !== undefined && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Year: {(selectedNode || hoveredNode)?.year} | Marks: {(selectedNode || hoveredNode)?.marks}
                  </p>
                )}
                
                {(selectedNode || hoveredNode)?.has_diagram !== undefined && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Has diagram: {(selectedNode || hoveredNode)?.has_diagram ? 'Yes' : 'No'}
                  </p>
                )}
                
                {(selectedNode || hoveredNode)?.question_text && (
                  <p className="text-xs text-muted-foreground mb-2 italic">
                    {(selectedNode || hoveredNode)?.question_text}...
                  </p>
                )}
                
                {selectedNode && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Click to deselect • Drag to move
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stats overlay */}
            {filteredData && (
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Nodes: {filteredData.nodes.length}</div>
                  <div>Links: {filteredData.links.length}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Tips:</strong> Drag to pan • Scroll to zoom • Click nodes to select • Hover to highlight connections • Drag nodes to reposition • Use filters to focus on specific content
            </p>
          </div>
        </Card>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Convex Database Benefits
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Real-time sync:</strong> Data updates automatically across all clients</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Type-safe queries:</strong> Full TypeScript support for all database operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Built-in indexing:</strong> Fast queries on subjects, chapters, and subtopics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Scalable:</strong> Efficiently handles thousands of questions and metadata</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Hierarchy Structure
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Subjects</strong> → HAS_CHAPTER → <strong>Chapters</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Chapters</strong> → HAS_SUBTOPIC → <strong>Subtopics</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Subtopics</strong> → HAS_QUESTION → <strong>Questions</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Clear hierarchy:</strong> Easy navigation from high-level topics to specific questions</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
