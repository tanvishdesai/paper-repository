"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { subjects } from "@/lib/subjects";
import { BookOpen, Target, TrendingUp, Key, Code, ChevronDown, Sparkles, Zap, Brain, Trophy, CheckCircle2, Users, Star, ArrowRight, BarChart3, Filter, Menu, X, GraduationCap } from "lucide-react";
export default function Home() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  GATE
                </h1>
                <span className="text-xs text-muted-foreground font-medium -mt-1">
                  Question Bank
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="relative px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
              >
                <Link href="/explore" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Explore Graph</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="relative px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
              >
                <Link href="/stats" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Analytics</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="relative px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
              >
                <Link href="/api-docs" className="flex items-center gap-2">
                  <Code className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>API Docs</span>
                </Link>
              </Button>
              {isSignedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="relative px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
                >
                  <Link href="/api-keys" className="flex items-center gap-2">
                    <Key className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>API Keys</span>
                  </Link>
                </Button>
              )}
            </nav>

            {/* Desktop Auth & Theme */}
            <div className="hidden md:flex items-center gap-3">
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <div className="h-6 w-px bg-border"></div>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9"
                      }
                    }}
                  />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              )}
              <div className="h-6 w-px bg-border"></div>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 hover:bg-primary/10 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
              <div className="px-4 py-4 space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full justify-start px-4 py-3 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/stats" className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full justify-start px-4 py-3 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/api-docs" className="flex items-center gap-3">
                    <Code className="h-4 w-4" />
                    <span>API Docs</span>
                  </Link>
                </Button>
                {isSignedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-full justify-start px-4 py-3 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/api-keys" className="flex items-center gap-3">
                      <Key className="h-4 w-4" />
                      <span>API Keys</span>
                    </Link>
                  </Button>
                )}

                <div className="border-t border-border/50 pt-3 mt-4">
                  <div className="flex items-center justify-between">
                    {isSignedIn ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Account</span>
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "h-8 w-8"
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <SignInButton mode="modal">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign In
                        </Button>
                      </SignInButton>
                    )}
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto text-center space-y-10">
          {/* Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Star className="h-4 w-4 fill-current" />
              <span>Trusted by 10,000+ students</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1]">
              <span className="text-foreground">
                Master Your
              </span>
              <br />
              <span className="text-primary">
                GATE
              </span>
              <br />
              <span className="text-foreground">
                Preparation
              </span>
            </h2>
            <div>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Comprehensive question bank with <span className="text-foreground font-semibold">thousands of previous year questions</span> across all Computer Science subjects.
              </p>
              <p className="text-lg md:text-xl text-primary font-semibold mt-3 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Practice smart, excel in your exams.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" asChild className="h-14 px-8 bg-primary text-primary-foreground text-lg font-semibold">
              <Link href="#subjects" className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Start Practicing Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 border-2 text-lg">
              <Link href="#features" className="flex items-center gap-2">
                Learn More
                <ChevronDown className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-5xl mx-auto">
            {[
              { value: '10+', label: 'CS Subjects', icon: BookOpen },
              { value: '1000+', label: 'Questions', icon: Target },
              { value: '24/7', label: 'Access', icon: Zap },
              { value: '10K+', label: 'Students', icon: Users },
            ].map((stat, index) => (
              <Card key={index} className="text-center p-6 border-border bg-card">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-4xl md:text-5xl font-black text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Features</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-foreground">
              Why Choose Us?
            </h3>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Everything you need to ace your GATE examination in one comprehensive platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Filter,
                title: 'Advanced Smart Filtering',
                description: 'Filter questions by year, marks, subtopic, and question type. Search through thousands of questions instantly to focus on specific topics and difficulty levels.',
                highlights: ['Year-wise filtering', 'Marks-based sorting', 'Subtopic categorization', 'Real-time search']
              },
              {
                icon: Brain,
                title: 'AI-Powered Assistance',
                description: 'Get instant help with any question through our integrated AI chat. Ask for explanations, hints, or step-by-step solutions powered by Google Gemini.',
                highlights: ['Instant explanations', 'Step-by-step solutions', 'Concept clarification', '24/7 availability']
              },
              {
                icon: BarChart3,
                title: 'Comprehensive Analytics',
                description: 'Track your progress with detailed statistics and visualizations. Analyze question patterns, subject distribution, and performance trends across years.',
                highlights: ['Performance tracking', 'Visual analytics', 'Pattern analysis', 'Progress insights']
              }
            ].map((feature, index) => (
              <Card key={index} className="h-full border-border bg-card">
                <CardHeader className="text-center space-y-6 p-8">
                  <div className="w-20 h-20 mx-auto bg-primary rounded-3xl flex items-center justify-center">
                    <feature.icon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground mb-6">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Showcase */}
      <section className="container mx-auto px-4 py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                  <Brain className="h-4 w-4" />
                  <span>AI-Powered Learning</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-foreground">
                  Get Instant Help with
                  <br />
                  <span className="text-primary">Any Question</span>
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stuck on a tough problem? Our AI assistant powered by Google Gemini is here to help.
                  Get step-by-step explanations, hints, and detailed solutions instantly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Click the AI Help Button</h4>
                    <p className="text-sm text-muted-foreground">Find the brain icon next to any question</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Ask Your Question</h4>
                    <p className="text-sm text-muted-foreground">Describe what you need help with or ask for a hint</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Get Instant Response</h4>
                    <p className="text-sm text-muted-foreground">Receive detailed explanations and step-by-step solutions</p>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild className="bg-primary text-primary-foreground">
                <Link href="#subjects" className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Try AI Help Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <Card className="border-border bg-card shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI Assistant</CardTitle>
                      <CardDescription>Ready to help with your GATE questions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">
                      <strong>You:</strong> Can you explain the concept of dynamic programming with an example?
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-primary">
                      <strong>AI:</strong> Dynamic programming is a method for solving complex problems by breaking them down into simpler subproblems... Heres an example with the Fibonacci sequence...
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">
                      <strong>You:</strong> How does this apply to GATE questions?
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-primary">
                      <strong>AI:</strong> In GATE, DP questions often appear in algorithms and data structures. Common patterns include knapsack problems, longest common subsequence, matrix chain multiplication...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Showcase */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                  <BarChart3 className="h-4 w-4" />
                  <span>Advanced Analytics</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-foreground">
                  Understand Your
                  <br />
                  <span className="text-primary">Progress & Patterns</span>
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Dive deep into comprehensive statistics and visualizations. Track question patterns,
                  analyze subject distribution, and identify your strengths and weaknesses across all GATE subjects.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Year-wise Analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Subject Distribution</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Marks Breakdown</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Subtopic Insights</span>
                  </div>
                </div>
              </div>

              <Button size="lg" variant="outline" asChild className="border-2">
                <Link href="/stats" className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  View Analytics Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <Card className="border-border bg-card shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                        <CardDescription>Comprehensive GATE statistics</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/stats">View Full →</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">1000+</div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">18</div>
                      <div className="text-xs text-muted-foreground">Years</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Algorithms</span>
                      <span className="font-semibold">245</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '35%'}}></div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Data Structures</span>
                      <span className="font-semibold">198</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '28%'}}></div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Operating Systems</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '22%'}}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Updated with latest 2025 questions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Filtering Showcase */}
      <section className="container mx-auto px-4 py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Filter className="h-4 w-4" />
              <span>Smart Filtering</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-foreground">
              Find Exactly What You Need
            </h3>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light">
              Powerful filtering options to customize your practice sessions and focus on specific topics,
              difficulty levels, and question types.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center p-6 border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">Year Filter</h4>
              <p className="text-sm text-muted-foreground">Practice questions from specific years (2007-2025) or focus on recent papers</p>
            </Card>

            <Card className="text-center p-6 border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">Marks Filter</h4>
              <p className="text-sm text-muted-foreground">Filter by question marks (1-5 marks) to match exam patterns and difficulty</p>
            </Card>

            <Card className="text-center p-6 border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">Subtopic Filter</h4>
              <p className="text-sm text-muted-foreground">Drill down to specific subtopics like Binary Trees, Process Scheduling, or TCP/IP</p>
            </Card>

            <Card className="text-center p-6 border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">Search</h4>
              <p className="text-sm text-muted-foreground">Instant search through question text and subtopics to find relevant problems</p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild className="bg-primary text-primary-foreground">
              <Link href="#subjects" className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Start Filtering Questions
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
              <Brain className="h-4 w-4" />
              <span>Subjects</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-foreground">
              Choose Your Subject
            </h3>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Select from our comprehensive collection of Computer Science subjects
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Link
                key={subject.name}
                href={`/questions/${encodeURIComponent(subject.fileName.replace('.json', ''))}`}
              >
                <Card className="h-full border-border bg-card cursor-pointer">
                  <CardHeader className="text-center pb-4">
                    <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-3xl flex items-center justify-center text-5xl">
                      {subject.icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground mb-2">
                      {subject.name}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      className="w-full border-border font-semibold"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      View Questions
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <Card className="border-border bg-card">
            <CardHeader className="space-y-6 py-12">
              <div className="w-20 h-20 mx-auto bg-primary rounded-3xl flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-black text-foreground">
                Ready to Ace Your GATE?
              </CardTitle>
              <CardDescription className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                Join <span className="text-primary font-bold">10,000+ students</span> who trust our platform for their GATE preparation.
                Start your journey towards success today.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-12">
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild className="h-14 px-8 bg-primary text-primary-foreground text-lg font-semibold">
                  <Link href="#subjects" className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Get Started Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Instant Access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-muted/20">
        <div className="container mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              GATE Question Bank
            </span>
          </div>
          <p className="text-muted-foreground mb-2">
            © 2025 GATE Question Bank. All rights reserved.
          </p>
          <p className="text-primary font-semibold">
            Practice smart, excel in your exams.
          </p>
        </div>
      </footer>
    </div>
  );
}
