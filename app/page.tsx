"use client";

import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { subjects } from "@/lib/subjects";
import { BookOpen, Target, TrendingUp, Key, Code, ChevronDown, Sparkles, Zap, Brain, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
// import anime from "animejs";

export default function Home() {
  const { isSignedIn } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll-triggered animations using CSS classes
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === featuresRef.current) {
            // Add animation classes to feature cards
            const featureCards = document.querySelectorAll('.feature-card');
            featureCards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-fade-in');
              }, index * 200);
            });
          } else if (entry.target === subjectsRef.current) {
            // Add animation classes to subject cards
            const subjectCards = document.querySelectorAll('.subject-card');
            subjectCards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-scale-in');
              }, index * 100);
            });
          }
        }
      });
    }, observerOptions);

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (subjectsRef.current) observer.observe(subjectsRef.current);

    // Also trigger animations immediately for better UX
    setTimeout(() => {
      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('animate-fade-in');
        }, index * 200);
      });

      const subjectCards = document.querySelectorAll('.subject-card');
      subjectCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('animate-scale-in');
        }, index * 100);
      });
    }, 500);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              GATE Question Bank
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href="/api-docs">
                <Code className="h-4 w-4 mr-2" />
                API Docs
              </Link>
            </Button>
            {isSignedIn ? (
              <>
                <Button variant="outline" size="sm" asChild className="hidden md:flex">
                  <Link href="/api-keys">
                    <Key className="h-4 w-4 mr-2" />
                    API Keys
                  </Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  Sign In
                </Button>
              </SignInButton>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        <div ref={heroRef} className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="hero-title animate-fade-in">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Master Your
                <br />
                <span className="text-primary relative">
                  GATE
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
                </span>
                <br />
                Preparation
              </h2>
            </div>
            <div className="hero-subtitle animate-slide-up">
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Comprehensive question bank with thousands of previous year questions across all Computer Science subjects.
                <span className="text-primary font-semibold"> Practice smart, excel in your exams.</span>
              </p>
            </div>
          </div>
          <div className="hero-buttons animate-fade-in flex flex-wrap gap-4 justify-center pt-6">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="#subjects" className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Start Practicing
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-2 hover:border-primary/50 hover:bg-primary/5">
              <Link href="#features" className="flex items-center gap-2">
                Learn More
                <ChevronDown className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">10+</div>
              <div className="text-sm text-muted-foreground">CS Subjects</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Access</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">Free</div>
              <div className="text-sm text-muted-foreground">Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-4xl md:text-5xl font-bold">Why Choose Us?</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to ace your GATE examination in one comprehensive platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="feature-card border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Comprehensive Coverage</CardTitle>
                <CardDescription className="text-base">
                  Questions from all major CS subjects with detailed categorization and topic-wise organization
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="feature-card border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Smart Filtering</CardTitle>
                <CardDescription className="text-base">
                  Filter by year, marks, topic, and difficulty to focus your practice and optimize study time
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="feature-card border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Track Progress</CardTitle>
                <CardDescription className="text-base">
                  Organize and sort questions to match your study plan with personalized learning paths
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" ref={subjectsRef} className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-4xl md:text-5xl font-bold">Choose Your Subject</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select from our comprehensive collection of Computer Science subjects
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject, index) => (
              <Link
                key={subject.name}
                href={`/questions/${encodeURIComponent(subject.fileName.replace('.json', ''))}`}
                className="group"
              >
                <Card className="subject-card h-full bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:scale-105 cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-all duration-300 group-hover:rotate-6">
                      {subject.icon}
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {subject.name}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      className="w-full border-primary/30 hover:border-primary hover:bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
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
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/30 shadow-2xl">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center">
                <Trophy className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-3xl md:text-4xl">Ready to Ace Your GATE?</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Join thousands of students who trust our platform for their GATE preparation.
                Start your journey towards success today.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl">
                <Link href="#subjects" className="flex items-center gap-2 text-lg px-8 py-3">
                  <Zap className="h-5 w-5" />
                  Get Started Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            © 2025 GATE Question Bank.
            <span className="text-primary font-semibold">Practice smart, excel in your exams.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
