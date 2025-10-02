"use client";

import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { subjects } from "@/lib/subjects";
import { BookOpen, Target, TrendingUp, Key, Code } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">GATE Question Bank</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/api-docs">
                <Code className="h-4 w-4 mr-2" />
                API Docs
              </Link>
            </Button>
            {isSignedIn ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/api-keys">
                    <Key className="h-4 w-4 mr-2" />
                    API Keys
                  </Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <Button size="sm">Sign In</Button>
              </SignInButton>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            Master Your <span className="text-primary">GATE</span> Preparation
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive question bank with thousands of previous year questions across all Computer Science subjects
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="#subjects">
                Start Practicing
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Comprehensive Coverage</CardTitle>
              <CardDescription>
                Questions from all major CS subjects with detailed categorization
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-primary/20">
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Filtering</CardTitle>
              <CardDescription>
                Filter by year, marks, topic, and difficulty to focus your practice
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-primary/20">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Organize and sort questions to match your study plan
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Choose Your Subject
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Link key={subject.name} href={`/questions/${encodeURIComponent(subject.fileName.replace('.json', ''))}`}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] cursor-pointer">
                  <CardHeader>
                    <div className="text-4xl mb-2">{subject.icon}</div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Questions
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 GATE Question Bank. Practice smart, excel in your exams.</p>
        </div>
      </footer>
    </div>
  );
}
