"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Question } from "@/types/question";
import { subjects } from "@/lib/subjects";
import { normalizeSubtopic, getDisplaySubtopic, getUniqueSubtopics } from "@/lib/subtopicNormalization";
import { Card } from "@/components/ui/card";
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
import { ChatDialog } from "@/components/chat-dialog";
import { SimilarQuestions } from "@/components/similar-questions";
import { ArrowLeft, BookOpen, Search, Filter, SortAsc, Play, X, Check, ChevronRight, HelpCircle, CheckCircle } from "lucide-react";

// Helper function to detect the correct option index based on correct_answer text
function detectCorrectOption(options: string[], correctAnswer?: string): number | null {
  if (!options || !correctAnswer || !correctAnswer.trim()) {
    return null;
  }

  const normalizedOptions = options.map(opt => opt.toLowerCase().trim());
  const normalizedAnswer = correctAnswer.toLowerCase().trim();

  // Direct text match
  const directMatch = normalizedOptions.findIndex(opt => opt === normalizedAnswer);
  if (directMatch !== -1) {
    return directMatch;
  }

  // Letter match (A, B, C, D)
  const letterMatch = correctAnswer.trim().match(/^(?:option\s*)?([A-D])\.?$/i);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
    if (index >= 0 && index < options.length) {
      return index;
    }
  }

  // Number match (1, 2, 3, 4)
  const numberMatch = correctAnswer.trim().match(/^(?:option\s*)?(\d+)$/i);
  if (numberMatch) {
    const index = parseInt(numberMatch[1]) - 1;
    if (index >= 0 && index < options.length) {
      return index;
    }
  }

  return null;
}

export default function QuestionsPage() {
  const params = useParams();
  const subjectParam = params.subject as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [marksFilter, setMarksFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subtopicFilter, setSubtopicFilter] = useState("all");
  const [sortBy, setSortBy] = useState("year-desc");
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState<Question | null>(null);

  const subject = subjects.find(
    (s) => s.fileName.replace(".json", "") === decodeURIComponent(subjectParam)
  );

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Load from Neo4j via API (fallback to JSON if Neo4j is not configured)
        const subjectName = subject?.name || decodeURIComponent(subjectParam);
        
        try {
          // Try Neo4j first
          const response = await fetch(`/api/internal/questions?subject=${encodeURIComponent(subjectName)}&limit=1000`);
          if (response.ok) {
            const data = await response.json();
            setQuestions(data.data || []);
            return;
          }
        } catch (neo4jError) {
          console.warn("Neo4j not available, falling back to JSON files:", neo4jError);
        }

        // Fallback to JSON files
        const YEAR_FILES = [
          "2007.json", "2008.json", "2009.json", "2010.json", "2012.json",
          "2013.json", "2014.json", "2015.json", "2016.json", "2017.json",
          "2018.json", "2019.json", "2020.json", "2021-1.json", "2022.json",
          "2023.json", "2024-1.json", "2024-2.json", "2025-1.json", "2025-2.json"
        ];
        
        const allQuestions: Question[] = [];
        for (const yearFile of YEAR_FILES) {
          try {
            const response = await fetch(`/data/${yearFile}`);
            if (response.ok) {
              const data = await response.json();
              allQuestions.push(...data);
            }
          } catch (error) {
            console.error(`Error loading ${yearFile}:`, error);
          }
        }

        const filteredBySubject = allQuestions.filter(
          q => q.subject.toLowerCase() === subjectName.toLowerCase()
        );
        
        setQuestions(filteredBySubject);
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

  const subtopics = useMemo(() => {
    const rawSubtopics = questions.map((q) => q.subtopic).filter((s) => s != null && s.trim() !== "");
    return getUniqueSubtopics(rawSubtopics);
  }, [questions]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    const filtered = questions.filter((q) => {
      const matchesSearch =
        searchQuery === "" ||
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subtopic.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesYear = yearFilter === "all" || q.year?.toString() === yearFilter;
      const matchesMarks = marksFilter === "all" || q.marks?.toString() === marksFilter;
      const matchesType =
        typeFilter === "all" || q.theoretical_practical === typeFilter;
      const matchesSubtopic = subtopicFilter === "all" || normalizeSubtopic(q.subtopic) === normalizeSubtopic(subtopicFilter);

      return matchesSearch && matchesYear && matchesMarks && matchesType && matchesSubtopic;
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
  }, [questions, searchQuery, yearFilter, marksFilter, typeFilter, subtopicFilter, sortBy]);

  // Filter questions with options for practice mode
  const practiceQuestions = useMemo(() => {
    return filteredQuestions.filter(q => q.options && q.options.length > 0);
  }, [filteredQuestions]);

  const handleStartPractice = () => {
    if (practiceQuestions.length > 0) {
      setPracticeMode(true);
      setCurrentQuestionIndex(0);
      setUserAnswers(new Map());
      setQuizCompleted(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    // Record the answer
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestionIndex, answer);
    setUserAnswers(newAnswers);

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      handleNextQuestion();
    }, 500);
  };

  const handleExitPractice = () => {
    setPracticeMode(false);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setQuizCompleted(false);
  };

  const handleOpenChat = (question: Question) => {
    setChatQuestion(question);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatQuestion(null);
  };

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

  // Practice Mode View
  if (practiceMode && practiceQuestions.length > 0) {
    // Show results screen if quiz is completed
    if (quizCompleted) {
      const totalQuestions = practiceQuestions.length;
      const answeredQuestions = userAnswers.size;
      const correctAnswers = practiceQuestions.reduce((count, question, index) => {
        const userAnswer = userAnswers.get(index);
        if (!userAnswer || !question.options) return count;

        const correctOptionIndex = detectCorrectOption(question.options, question.correct_answer);
        const isCorrect = correctOptionIndex !== null && question.options[correctOptionIndex] === userAnswer;
        return count + (isCorrect ? 1 : 0);
      }, 0);
      const incorrectAnswers = answeredQuestions - correctAnswers;
      const unansweredQuestions = totalQuestions - answeredQuestions;

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          {/* Results Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleExitPractice}>
                    <X className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-lg font-bold">Quiz Results</h1>
                    <p className="text-xs text-muted-foreground">
                      {subject?.name || decodeURIComponent(subjectParam)}
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Results Summary */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-muted-foreground">
                You answered {answeredQuestions} out of {totalQuestions} questions
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Correct</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</div>
                <div className="text-sm text-red-600 dark:text-red-400">Incorrect</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{unansweredQuestions}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Unanswered</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalQuestions}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
              </div>
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Question Review</h3>
              {practiceQuestions.map((question, index) => {
                const userAnswer = userAnswers.get(index);
                const correctOptionIndex = question.options ? detectCorrectOption(question.options, question.correct_answer) : null;
                const isCorrect = userAnswer && correctOptionIndex !== null && question.options && question.options[correctOptionIndex] === userAnswer;
                const isAnswered = userAnswer !== undefined;

                return (
                  <div key={index} className="p-4 rounded-xl border bg-card">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        !isAnswered
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          : isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}>
                        {!isAnswered ? "?" : isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-2">Question {index + 1}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{question.question_text}</p>
                      </div>
                    </div>

                    {question.options && (
                      <div className="grid gap-2 ml-9">
                        {question.options.map((option, optIndex) => {
                          const isUserChoice = userAnswer === option;
                          const isCorrectOption = correctOptionIndex === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`text-xs p-2 rounded border ${
                                isCorrectOption
                                  ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 text-green-800 dark:text-green-200"
                                  : isUserChoice && !isCorrectOption
                                  ? "bg-red-50 dark:bg-red-950/20 border-red-500/50 text-red-800 dark:text-red-200"
                                  : "bg-muted/30 border-border/30 text-muted-foreground"
                              }`}
                            >
                              <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                              {isUserChoice && <span className="ml-2 text-xs">(Your answer)</span>}
                              {isCorrectOption && <span className="ml-2 text-xs">(Correct)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => handleStartPractice()} variant="outline">
                Retake Quiz
              </Button>
              <Button onClick={handleExitPractice}>
                Back to Questions
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const currentQuestion = practiceQuestions[currentQuestionIndex];
    const selectedAnswer = userAnswers.get(currentQuestionIndex);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Practice Mode Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleExitPractice}>
                  <X className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold">Practice Mode</h1>
                  <p className="text-xs text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {practiceQuestions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChat(currentQuestion)}
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {userAnswers.size} / {practiceQuestions.length} answered
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(userAnswers.size / practiceQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-lg mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
            <div className="relative p-8">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {currentQuestion.year && (
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-primary/20 text-primary font-medium">
                        {currentQuestion.year}
                      </Badge>
                    )}
                    {currentQuestion.marks != null && (
                      <Badge variant="default" className="bg-primary/10 text-primary">
                        {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm">
                      {currentQuestion.theoretical_practical}
                    </Badge>
                    <span className="text-xs text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded-full">
                      #{currentQuestion.question_no}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-xl leading-relaxed text-foreground/90 font-medium m-0">
                      {currentQuestion.question_text}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  Select your answer
                </div>
                <div className="grid gap-3">
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected = selectedAnswer === option;

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={selectedAnswer !== undefined}
                        className={`group/option w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                            : selectedAnswer !== undefined
                            ? "border-border/30 bg-muted/30 cursor-not-allowed opacity-60"
                            : "border-border/50 hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? "border-primary bg-primary shadow-sm"
                                : "border-border group-hover/option:border-primary/50"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className={`flex-1 text-left transition-colors ${
                            isSelected
                              ? "text-primary font-medium"
                              : "text-foreground/80 group-hover/option:text-foreground"
                          }`}>
                            {option}
                          </span>
                          <div className="flex-shrink-0 text-xs font-medium text-primary/60 bg-primary/10 px-2 py-1 rounded-full">
                            {String.fromCharCode(65 + index)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/30">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                    <span className="font-medium">Topic:</span>
                    <span className="text-foreground/70">{getDisplaySubtopic(currentQuestion.subtopic)}</span>
                  </div>
                  {currentQuestion.provenance && (
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                      <span className="font-medium">Source:</span>
                      <span className="text-foreground/70">{currentQuestion.provenance}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {currentQuestionIndex + 1} / {practiceQuestions.length}
              </div>
              {selectedAnswer === undefined && (
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Select an answer to continue
                </div>
              )}
            </div>
            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === undefined || currentQuestionIndex === practiceQuestions.length - 1}
            >
              {currentQuestionIndex === practiceQuestions.length - 1 ? "Finish Quiz" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Chat Dialog */}
        <ChatDialog
          isOpen={chatOpen}
          onClose={handleCloseChat}
          question={chatQuestion}
        />
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
            <div className="flex items-center gap-2">
              {practiceQuestions.length > 0 && (
                <Button onClick={handleStartPractice} className="gap-2">
                  <Play className="h-4 w-4" />
                  Practice Mode
                </Button>
              )}
              <ThemeToggle />
            </div>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <Filter className="h-4 w-4" />
                Subtopic
              </label>
              <Select value={subtopicFilter} onValueChange={setSubtopicFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subtopics</SelectItem>
                  {subtopics.map((subtopic) => (
                    <SelectItem key={subtopic} value={subtopic}>
                      {subtopic}
                    </SelectItem>
                  ))}
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
          {(searchQuery || yearFilter !== "all" || marksFilter !== "all" || typeFilter !== "all" || subtopicFilter !== "all") && (
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
              {subtopicFilter !== "all" && (
                <Badge variant="secondary">Subtopic: {getDisplaySubtopic(subtopicFilter)}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setYearFilter("all");
                  setMarksFilter("all");
                  setTypeFilter("all");
                  setSubtopicFilter("all");
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
          <div className="space-y-6">
            {filteredQuestions.map((question, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        {question.year && (
                          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-primary/20 text-primary font-medium">
                            {question.year}
                          </Badge>
                        )}
                        {question.marks != null && (
                          <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                            {question.marks} Mark{question.marks !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm">
                          {question.theoretical_practical}
                        </Badge>
                        <span className="text-xs text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded-full">
                          #{question.question_no}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-lg leading-relaxed text-foreground/90 font-medium m-0">
                          {question.question_text}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Display Options */}
                  {question.options && question.options.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        Options
                      </div>
                      <div className="grid gap-3">
                        {question.options.map((option, optIndex) => {
                          const correctOptionIndex = detectCorrectOption(question.options!, question.correct_answer);
                          const isCorrect = correctOptionIndex === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`group/option relative p-4 rounded-xl border transition-all duration-300 ${
                                isCorrect
                                  ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 from-green-500/5 to-green-500/10"
                                  : "bg-gradient-to-r from-accent/30 via-accent/20 to-accent/30 border-border/30 hover:border-primary/20 hover:bg-accent/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium transition-colors ${
                                  isCorrect
                                    ? "bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/30"
                                    : "bg-primary/10 border-primary/20 text-primary group-hover/option:bg-primary group-hover/option:text-primary-foreground"
                                }`}>
                                  {isCorrect ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    String.fromCharCode(65 + optIndex)
                                  )}
                                </div>
                                <span className={`text-sm leading-relaxed transition-colors ${
                                  isCorrect
                                    ? "text-green-800 dark:text-green-200 font-medium"
                                    : "text-foreground/80 group-hover/option:text-foreground"
                                }`}>
                                  {option}
                                </span>
                                {isCorrect && (
                                  <div className="flex-shrink-0 ml-auto">
                                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                                      Correct Answer
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/30">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground/80">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                        <span className="font-medium">Topic:</span>
                        <span className="text-foreground/70">{getDisplaySubtopic(question.subtopic)}</span>
                      </div>
                      {question.provenance && (
                        <div className="flex items-center gap-2 text-muted-foreground/80">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                          <span className="font-medium">Source:</span>
                          <span className="text-foreground/70">{question.provenance}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChat(question)}
                      className="gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                    >
                      <HelpCircle className="h-3 w-3" />
                      Get Help
                    </Button>
                  </div>

                  {/* Similar Questions powered by Graph Database */}
                  {question.questionId && (
                    <SimilarQuestions
                      questionId={question.questionId}
                      onQuestionClick={handleOpenChat}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Chat Dialog */}
        <ChatDialog
          isOpen={chatOpen}
          onClose={handleCloseChat}
          question={chatQuestion}
        />
      </div>
    </div>
  );

}
