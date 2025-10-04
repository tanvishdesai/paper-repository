"use client";

import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { subjects } from "@/lib/subjects";
import { BookOpen, Target, TrendingUp, Key, Code, ChevronDown, Sparkles, Zap, Brain, Trophy, CheckCircle2, Users, Star, ArrowRight, BarChart3 } from "lucide-react";
export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              GATE Question Bank
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                Stats
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/api-docs">
                <Code className="h-4 w-4 mr-2" />
                API Docs
              </Link>
            </Button>
            {isSignedIn ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link href="/api-keys">
                    <Key className="h-4 w-4 mr-2" />
                    API Keys
                  </Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  Sign In
                </Button>
              </SignInButton>
            )}
            <ThemeToggle />
          </div>
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
                icon: BookOpen,
                title: 'Comprehensive Coverage',
                description: 'Questions from all major CS subjects with detailed categorization and topic-wise organization'
              },
              {
                icon: Target,
                title: 'Smart Filtering',
                description: 'Filter by year, marks, topic, and difficulty to focus your practice and optimize study time'
              },
              {
                icon: TrendingUp,
                title: 'Track Progress',
                description: 'Organize and sort questions to match your study plan with personalized learning paths'
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
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
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
