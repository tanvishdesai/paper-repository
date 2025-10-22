"use client";

import { useState, useCallback, useEffect, useRef} from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Database,
  Network,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Layers,
  List,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import * as d3 from "d3";

interface TreeNodeState {
  [key: string]: boolean;
}

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

export default function ExplorePage() {
  const [expandedNodes, setExpandedNodes] = useState<TreeNodeState>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Fetch data
  const subjects = useQuery(api.questions.getSubjects);
  const stats = useQuery(api.questions.getStats);
  const graphData = useQuery(api.questions.getGraphData, {
    limit: 200,
    excludeDiagrams: false,
    subjectFilter: selectedSubject || undefined,
  });
  const subtopicQuestions = useQuery(
    api.questions.getQuestions,
    selectedSubtopic ? { limit: 10000 } : "skip"
  );

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  const filterBySearch = (text: string): boolean => {
    if (!searchTerm) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const getFilteredQuestions = useCallback(() => {
    if (!subtopicQuestions?.questions) return [];
    return subtopicQuestions.questions.filter(
      (q) => q.subtopic === selectedSubtopic
    );
  }, [subtopicQuestions, selectedSubtopic]);

  // D3.js Graph Visualization
  useEffect(() => {
    if (!graphData || !svgRef.current || !gRef.current || graphData.nodes.length === 0)
      return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    g.selectAll("*").remove();

    // Create color scale for node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(["Subject", "Chapter", "Subtopic", "Question"])
      .range(["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]);

    // Calculate node degrees
    const linkCounts = new Map<string, number>();
    graphData.nodes.forEach((node: GraphNode) => {
      linkCounts.set(node.id, 0);
    });

    graphData.links.forEach((link: GraphLink) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      linkCounts.set(sourceId, (linkCounts.get(sourceId) || 0) + 1);
      linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
    });

    // Create size scale
    const maxDegree = d3.max(graphData.nodes, (d: GraphNode) => linkCounts.get(d.id) || 0) || 1;
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxDegree])
      .range([6, 25]);

    const getNodeSize = (d: GraphNode) => {
      const baseDegree = linkCounts.get(d.id) || 0;
      const multiplier =
        d.type === "Subject"
          ? 1.5
          : d.type === "Chapter"
            ? 1.2
            : d.type === "Subtopic"
              ? 1.0
              : 0.7;
      return sizeScale(baseDegree) * multiplier;
    };

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force(
        "link",
        d3.forceLink<GraphNode, GraphLink>(graphData.links)
          .id((d: GraphNode) => d.id)
          .distance((d: GraphLink) => {
            const sourceNode =
              typeof d.source === "object"
                ? d.source
                : graphData.nodes.find((n) => n.id === d.source);
            const targetNode =
              typeof d.target === "object"
                ? d.target
                : graphData.nodes.find((n) => n.id === d.target);
            if (!sourceNode || !targetNode) return 100;

            if (sourceNode.type === "Subject" && targetNode.type === "Chapter") return 120;
            if (sourceNode.type === "Chapter" && targetNode.type === "Subtopic") return 100;
            if (sourceNode.type === "Subtopic" && targetNode.type === "Question") return 80;
            return 100;
          })
          .strength(0.5)
      )
      .force(
        "charge",
        d3.forceManyBody()
          .strength((d) => {
            const node = d as GraphNode;
            return node.type === "Subject"
              ? -600
              : node.type === "Chapter"
                ? -400
                : node.type === "Subtopic"
                  ? -250
                  : -100;
          })
          .distanceMax(300)
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<GraphNode>().radius((d: GraphNode) => getNodeSize(d) + 3)
      );

    simulationRef.current = simulation;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Create links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d: GraphLink) => {
        const sourceNode = typeof d.source === "object" ? d.source : null;
        return sourceNode?.type === "Subject" ? 2.5 : sourceNode?.type === "Chapter" ? 1.5 : 0.8;
      });

    // Create nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(graphData.nodes as GraphNode[])
      .enter()
      .append("circle")
      .attr("r", getNodeSize)
      .attr("fill", (d: GraphNode) => colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation();
        if (d.type === "Subtopic") {
          setSelectedSubtopic(d.subtopic || null);
        }
      })
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on("start", (event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Create node labels
    const nodeLabel = g
      .append("g")
      .attr("class", "node-labels")
      .selectAll("text")
      .data(graphData.nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d: GraphNode) => -(getNodeSize(d) + 3))
      .attr("font-size", (d: GraphNode) => {
        return d.type === "Subject"
          ? "12px"
          : d.type === "Chapter"
            ? "11px"
            : d.type === "Subtopic"
              ? "9px"
              : "7px";
      })
      .attr("font-weight", (d: GraphNode) =>
        d.type === "Subject" || d.type === "Chapter" ? "600" : "500"
      )
      .attr("fill", "#374151")
      .style("pointer-events", "none")
      .text((d: GraphNode) => {
        const maxLength =
          d.type === "Subject"
            ? 15
            : d.type === "Chapter"
              ? 14
              : d.type === "Subtopic"
                ? 12
                : 8;
        return d.label.length > maxLength
          ? d.label.substring(0, maxLength - 2) + ".."
          : d.label;
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: GraphLink) => {
          const source = d.source as GraphNode;
          return source.x ?? 0;
        })
        .attr("y1", (d: GraphLink) => {
          const source = d.source as GraphNode;
          return source.y ?? 0;
        })
        .attr("x2", (d: GraphLink) => {
          const target = d.target as GraphNode;
          return target.x ?? 0;
        })
        .attr("y2", (d: GraphLink) => {
          const target = d.target as GraphNode;
          return target.y ?? 0;
        });

      node.attr("cx", (d: GraphNode) => d.x ?? 0).attr("cy", (d: GraphNode) => d.y ?? 0);

      nodeLabel.attr("x", (d: GraphNode) => d.x ?? 0).attr("y", (d: GraphNode) => d.y ?? 0);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData]);

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.67);
    }
  };

  const handleResetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(10, 10).scale(1));
    }
  };

  if (!subjects || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading database structure...</p>
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
                    Interactive database hierarchy with visual knowledge graph
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium text-muted-foreground">Questions</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">
              {stats.totalQuestions.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Subjects</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.totalSubjects}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Chapters</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.totalChapters}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <List className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Subtopics</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{stats.totalSubtopics}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Hierarchy Tree */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Hierarchy</h2>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Hierarchy Tree */}
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {subjects.map((subject) => {
                  const subjectKey = `subject-${subject.name}`;
                  const isSubjectExpanded = expandedNodes[subjectKey];
                  const showSubject = filterBySearch(subject.name);

                  if (!showSubject) return null;

                  return (
                    <div key={subjectKey} className="space-y-1">
                      {/* Subject Node */}
                      <button
                        onClick={() => {
                          toggleNode(subjectKey);
                          setSelectedSubject(subject.name);
                        }}
                        className={`w-full flex items-center gap-1 px-2 py-1 rounded text-left text-xs transition-colors ${
                          selectedSubject === subject.name
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {isSubjectExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </div>
                        <BookOpen className="h-3 w-3 flex-shrink-0" />
                        <span className="flex-1 truncate font-medium">{subject.name}</span>
                        <span className="text-xs opacity-70">{subject.questionCount}</span>
                      </button>

                      {/* Chapters */}
                      {isSubjectExpanded && (
                        <div className="ml-3 space-y-1 border-l border-muted pl-2">
                          <ChapterList
                            subject={subject.name}
                            expandedNodes={expandedNodes}
                            toggleNode={toggleNode}
                            filterBySearch={filterBySearch}
                            onSelectSubtopic={setSelectedSubtopic}
                            selectedSubtopic={selectedSubtopic}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Middle & Right: Graph + Questions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Knowledge Graph */}
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Knowledge Graph Visualization</h2>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetZoom}
                    className="h-7 w-7 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                  <span>Subject</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#ec4899]"></div>
                  <span>Chapter</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                  <span>Subtopic</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                  <span>Question</span>
                </div>
              </div>

              {/* Graph */}
              <div className="relative bg-gradient-to-br from-muted/20 to-muted/5 rounded border overflow-hidden">
                <svg
                  ref={svgRef}
                  width="100%"
                  height="400"
                  viewBox="0 0 1000 400"
                  className="cursor-grab active:cursor-grabbing w-full"
                  style={{ background: "transparent" }}
                >
                  <g ref={gRef} />
                </svg>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                💡 Drag to pan • Scroll to zoom • Click subtopic nodes to view questions
              </p>
            </Card>

            {/* Questions Panel */}
            {selectedSubtopic && (
              <Card className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" />
                  Questions in &quot;{selectedSubtopic}&quot;
                </h3>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {getFilteredQuestions().length > 0 ? (
                    getFilteredQuestions().map((question, idx) => (
                      <div
                        key={question.questionId}
                        className="p-2 border border-border rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Q{idx + 1}
                          </span>
                          <Badge variant="outline" className="text-xs h-fit">
                            {question.marks}m
                          </Badge>
                          <Badge variant="secondary" className="text-xs h-fit">
                            {question.year}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-foreground line-clamp-2">
                          {question.question_text}
                        </p>
                        <div className="mt-1 flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {question.theoretical_practical}
                          </Badge>
                          {question.has_diagram && (
                            <Badge variant="outline" className="text-xs">
                              📊
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No questions found.</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              How to Use
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Click subjects to expand/filter</li>
              <li>• Explore chapters and subtopics</li>
              <li>• Click subtopic in graph to view questions</li>
              <li>• Use search to filter hierarchy</li>
              <li>• Drag and zoom the graph freely</li>
            </ul>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Structure
            </h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong className="text-primary">Subject</strong> → Chapters</p>
              <p><strong className="text-pink-600 dark:text-pink-400">Chapter</strong> → Subtopics</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Subtopic</strong> → Questions</p>
              <p>Total: <strong>{stats.totalQuestions}</strong> questions across <strong>{stats.totalSubjects}</strong> subjects</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Component to render chapters
function ChapterList({
  subject,
  expandedNodes,
  toggleNode,
  filterBySearch,
  onSelectSubtopic,
  selectedSubtopic,
}: {
  subject: string;
  expandedNodes: TreeNodeState;
  toggleNode: (nodeId: string) => void;
  filterBySearch: (text: string) => boolean;
  onSelectSubtopic: (subtopic: string) => void;
  selectedSubtopic: string | null;
}) {
  const chapters = useQuery(api.questions.getChaptersBySubject, { subject });

  if (!chapters) {
    return <div className="text-xs text-muted-foreground py-1">Loading...</div>;
  }

  return (
    <>
      {chapters.map((chapter) => {
        const chapterKey = `chapter-${subject}-${chapter.name}`;
        const isChapterExpanded = expandedNodes[chapterKey];
        const showChapter = filterBySearch(chapter.name);

        if (!showChapter) return null;

        return (
          <div key={chapterKey} className="space-y-1">
            {/* Chapter Node */}
            <button
              onClick={() => toggleNode(chapterKey)}
              className="w-full flex items-center gap-1 px-2 py-0.5 rounded hover:bg-muted/50 transition-colors text-left text-xs"
            >
              <div className="flex-shrink-0">
                {isChapterExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
              <Layers className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{chapter.name}</span>
              <span className="text-xs opacity-70">{chapter.questionCount}</span>
            </button>

            {/* Subtopics */}
            {isChapterExpanded && (
              <div className="ml-3 space-y-1 border-l border-muted pl-2">
                <SubtopicList
                  chapter={chapter.name}
                  subject={subject}
                  filterBySearch={filterBySearch}
                  onSelectSubtopic={onSelectSubtopic}
                  selectedSubtopic={selectedSubtopic}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Component to render subtopics
function SubtopicList({
  chapter,
  subject,
  filterBySearch,
  onSelectSubtopic,
  selectedSubtopic,
}: {
  chapter: string;
  subject: string;
  filterBySearch: (text: string) => boolean;
  onSelectSubtopic: (subtopic: string) => void;
  selectedSubtopic: string | null;
}) {
  const subtopics = useQuery(api.questions.getSubtopicsByChapter, { chapter });

  if (!subtopics) {
    return <div className="text-xs text-muted-foreground py-1">Loading...</div>;
  }

  return (
    <>
      {subtopics.map((subtopic) => {
        const subtopicKey = `subtopic-${subject}-${chapter}-${subtopic.name}`;
        const showSubtopic = filterBySearch(subtopic.name);
        const isSelected = selectedSubtopic === subtopic.name;

        if (!showSubtopic) return null;

        return (
          <button
            key={subtopicKey}
            onClick={() => onSelectSubtopic(subtopic.name)}
            className={`w-full flex items-center gap-1 px-2 py-0.5 rounded transition-colors text-left text-xs ${
              isSelected
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted/50"
            }`}
          >
            <List className="h-3 w-3 flex-shrink-0" />
            <span className="flex-1 truncate">{subtopic.name}</span>
            <span className="text-xs opacity-70 flex-shrink-0">{subtopic.questionCount}</span>
          </button>
        );
      })}
    </>
  );
}
