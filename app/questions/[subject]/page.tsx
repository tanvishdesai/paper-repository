"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Question } from "@/types/question";
import { subjects } from "@/lib/subjects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, BookOpen, Search, Filter, SortAsc } from "lucide-react";

export default function QuestionsPage() {
  const params = useParams();
  const subjectParam = params.subject as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [marksFilter, setMarksFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("year-desc");

  const subject = subjects.find(
    (s) => s.fileName.replace(".json", "") === decodeURIComponent(subjectParam)
  );

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fileName = subject?.fileName || `${subjectParam}.json`;
        const response = await fetch(`/data/${fileName}`);
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [subject, subjectParam]);

  // Extract unique values for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(questions.map((q) => q.year).filter((y) => y != null))].sort((a, b) => b - a);
    return uniqueYears;
  }, [questions]);

  const marks = useMemo(() => {
    const uniqueMarks = [...new Set(questions.map((q) => q.marks).filter((m) => m != null))].sort((a, b) => a - b);
    return uniqueMarks;
  }, [questions]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let filtered = questions.filter((q) => {
      const matchesSearch =
        searchQuery === "" ||
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subtopic.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesYear = yearFilter === "all" || q.year?.toString() === yearFilter;
      const matchesMarks = marksFilter === "all" || q.marks?.toString() === marksFilter;
      const matchesType =
        typeFilter === "all" || q.theoretical_practical === typeFilter;

      return matchesSearch && matchesYear && matchesMarks && matchesType;
    });

    // Sort questions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "year-desc":
          return (b.year ?? 0) - (a.year ?? 0);
        case "year-asc":
          return (a.year ?? 0) - (b.year ?? 0);
        case "marks-desc":
          return (b.marks ?? 0) - (a.marks ?? 0);
        case "marks-asc":
          return (a.marks ?? 0) - (b.marks ?? 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [questions, searchQuery, yearFilter, marksFilter, typeFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading questions...</p>
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
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-xl">{subject?.icon || "📚"}</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">
                    {subject?.name || decodeURIComponent(subjectParam)}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {filteredQuestions.length} questions
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Year
              </label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Marks
              </label>
              <Select value={marksFilter} onValueChange={setMarksFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marks</SelectItem>
                  {marks.map((mark) => (
                    <SelectItem key={mark} value={mark.toString()}>
                      {mark} Mark{mark !== 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="theoretical">Theoretical</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year-desc">Year (Newest)</SelectItem>
                  <SelectItem value="year-asc">Year (Oldest)</SelectItem>
                  <SelectItem value="marks-desc">Marks (High to Low)</SelectItem>
                  <SelectItem value="marks-asc">Marks (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || yearFilter !== "all" || marksFilter !== "all" || typeFilter !== "all") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                </Badge>
              )}
              {yearFilter !== "all" && (
                <Badge variant="secondary">Year: {yearFilter}</Badge>
              )}
              {marksFilter !== "all" && (
                <Badge variant="secondary">Marks: {marksFilter}</Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary">Type: {typeFilter}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setYearFilter("all");
                  setMarksFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No questions found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {question.year && <Badge variant="outline">{question.year}</Badge>}
                        {question.marks != null && <Badge variant="default">{question.marks} Mark{question.marks !== 1 ? "s" : ""}</Badge>}
                        <Badge variant="secondary">
                          {question.theoretical_practical}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {question.question_no}
                        </span>
                      </div>
                      <CardTitle className="text-base font-normal leading-relaxed">
                        {question.question_text}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-medium">Topic:</span> {question.subtopic}
                    </div>
                    {question.provenance && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Source:</span> {question.provenance}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

