"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDisplaySubtopic } from "@/lib/subtopicNormalization";
import { BookOpen, TrendingUp, BarChart3, Activity, Target, ArrowLeft, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from 'recharts';

interface Question {
  year: number;
  paper_code: string;
  question_no: string;
  subject: string;
  chapter: string;
  subtopic: string;
  marks: number;
  theoretical_practical: string;
  confidence: number;
}

interface StatsData {
  totalQuestions: number;
  yearDistribution: { year: string; count: number }[];
  subjectDistribution: { subject: string; count: number }[];
  marksDistribution: { marks: string; count: number }[];
  theoryPracticalDistribution: { type: string; count: number }[];
  chapterDistribution: { chapter: string; count: number }[];
  topSubtopics: { subtopic: string; count: number }[];
  subjectComparisonData: { year: string; subject: string; subtopic?: string; count: number }[];
  allSubjects: string[];
  allSubtopics: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function StatsPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subject comparison state
  const [subject1, setSubject1] = useState<string>('');
  const [subject2, setSubject2] = useState<string>('');
  const [selectedSubtopic1, setSelectedSubtopic1] = useState<string>('all');
  const [selectedSubtopic2, setSelectedSubtopic2] = useState<string>('all');

  useEffect(() => {
    loadStatsData();
  }, []);

  // Reset selected subtopics when subjects change
  useEffect(() => {
    if (statsData) {
      if (subject1) {
        const availableSubtopics1 = getAvailableSubtopicsForSubject(subject1);
        if (selectedSubtopic1 !== 'all' && !availableSubtopics1.includes(selectedSubtopic1)) {
          setSelectedSubtopic1('all');
        }
      }
      if (subject2) {
        const availableSubtopics2 = getAvailableSubtopicsForSubject(subject2);
        if (selectedSubtopic2 !== 'all' && !availableSubtopics2.includes(selectedSubtopic2)) {
          setSelectedSubtopic2('all');
        }
      }
    }
  }, [subject1, subject2, statsData]);

  const loadStatsData = async () => {
    try {
      setLoading(true);

      // List of all data files
      const dataFiles = [
        '2007.json', '2008.json', '2009.json', '2010.json', '2012.json',
        '2013.json', '2014.json', '2015.json', '2016.json', '2017.json',
        '2018.json', '2019.json', '2020.json', '2021-1.json', '2022.json',
        '2023.json', '2024-1.json', '2024-2.json', '2025-1.json', '2025-2.json'
      ];

      const allQuestions: Question[] = [];

      // Load all data files
      for (const file of dataFiles) {
        try {
          const response = await fetch(`/data/${file}`);
          if (response.ok) {
            const data = await response.json();
            allQuestions.push(...data);
          }
        } catch (err) {
          console.warn(`Failed to load ${file}:`, err);
        }
      }

      // Process the data
      const processedData = processStatsData(allQuestions);
      setStatsData(processedData);
    } catch (err) {
      setError('Failed to load statistics data');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const processStatsData = (questions: Question[]): StatsData => {
    const totalQuestions = questions.length;

    // Year distribution
    const yearMap = new Map<string, number>();
    questions.forEach(q => {
      const year = q.year.toString();
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });
    const yearDistribution = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // Subject distribution
    const subjectMap = new Map<string, number>();
    questions.forEach(q => {
      subjectMap.set(q.subject, (subjectMap.get(q.subject) || 0) + 1);
    });
    const subjectDistribution = Array.from(subjectMap.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 subjects

    // Marks distribution
    const marksMap = new Map<string, number>();
    questions.forEach(q => {
      const marks = q.marks.toString();
      marksMap.set(marks, (marksMap.get(marks) || 0) + 1);
    });
    const marksDistribution = Array.from(marksMap.entries())
      .map(([marks, count]) => ({ marks: `${marks} Mark${marks === '1' ? '' : 's'}`, count }))
      .sort((a, b) => parseInt(a.marks) - parseInt(b.marks));


    // Theory vs Practical
    const theoryPracticalMap = new Map<string, number>();
    questions.forEach(q => {
      const type = q.theoretical_practical === 'theoretical' ? 'Theoretical' :
                   q.theoretical_practical === 'practical' ? 'Practical' : 'Other';
      theoryPracticalMap.set(type, (theoryPracticalMap.get(type) || 0) + 1);
    });
    const theoryPracticalDistribution = Array.from(theoryPracticalMap.entries())
      .map(([type, count]) => ({ type, count }));

    // Chapter distribution
    const chapterMap = new Map<string, number>();
    questions.forEach(q => {
      chapterMap.set(q.chapter, (chapterMap.get(q.chapter) || 0) + 1);
    });
    const chapterDistribution = Array.from(chapterMap.entries())
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 chapters


    // Top subtopics
    const subtopicMap = new Map<string, number>();
    questions.forEach(q => {
      const normalizedSubtopic = getDisplaySubtopic(q.subtopic);
      if (normalizedSubtopic) {
        subtopicMap.set(normalizedSubtopic, (subtopicMap.get(normalizedSubtopic) || 0) + 1);
      }
    });
    const topSubtopics = Array.from(subtopicMap.entries())
      .map(([subtopic, count]) => ({ subtopic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 subtopics

    // Subject comparison data
    const subjectComparisonMap = new Map<string, number>();
    const allSubjectsSet = new Set<string>();
    const allSubtopicsSet = new Set<string>();

    questions.forEach(q => {
      const year = q.year.toString();
      const subject = q.subject;
      const normalizedSubtopic = getDisplaySubtopic(q.subtopic);

      allSubjectsSet.add(subject);
      if (normalizedSubtopic) {
        allSubtopicsSet.add(normalizedSubtopic);
      }

      // Store data for year-subject combinations
      const key = `${year}-${subject}`;
      subjectComparisonMap.set(key, (subjectComparisonMap.get(key) || 0) + 1);

      // Also store data for year-subject-subtopic combinations
      if (normalizedSubtopic) {
        const subtopicKey = `${year}-${subject}-${normalizedSubtopic}`;
        subjectComparisonMap.set(subtopicKey, (subjectComparisonMap.get(subtopicKey) || 0) + 1);
      }
    });

    const subjectComparisonData: { year: string; subject: string; subtopic?: string; count: number }[] = [];
    const allSubjects = Array.from(allSubjectsSet).sort();
    const allSubtopics = Array.from(allSubtopicsSet).sort();

    // Process the data for subject comparison
    subjectComparisonMap.forEach((count, key) => {
      const parts = key.split('-');
      if (parts.length === 2) {
        // year-subject combination
        const [year, subject] = parts;
        subjectComparisonData.push({ year, subject, count });
      } else if (parts.length >= 3) {
        // year-subject-subtopic combination (may have dashes in subtopic name)
        const year = parts[0];
        const subject = parts[1];
        const subtopic = parts.slice(2).join('-');
        subjectComparisonData.push({ year, subject, subtopic, count });
      }
    });

    return {
      totalQuestions,
      yearDistribution,
      subjectDistribution,
      marksDistribution,
      theoryPracticalDistribution,
      chapterDistribution,
      topSubtopics,
      subjectComparisonData,
      allSubjects,
      allSubtopics
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadStatsData}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!statsData) return null;

  // Get subtopics for a specific subject
  const getAvailableSubtopicsForSubject = (subject: string) => {
    if (!subject || !statsData) return [];

    const subtopics = new Set<string>();
    statsData.subjectComparisonData.forEach(item => {
      if (item.subject === subject && item.subtopic) {
        subtopics.add(item.subtopic);
      }
    });
    return Array.from(subtopics).sort();
  };

  // Process comparison data for the selected subjects and subtopic
  const getComparisonChartData = () => {
    if (!subject1 || !subject2) return [];

    const filteredData = statsData.subjectComparisonData.filter(item => {
      if (item.subject === subject1) {
        // For subject1, check if it matches the selected subtopic for subject1
        const matchesSubtopic1 = selectedSubtopic1 === 'all' || item.subtopic === selectedSubtopic1;
        return matchesSubtopic1;
      } else if (item.subject === subject2) {
        // For subject2, check if it matches the selected subtopic for subject2
        const matchesSubtopic2 = selectedSubtopic2 === 'all' || item.subtopic === selectedSubtopic2;
        return matchesSubtopic2;
      }
      return false; // Only include data for the two selected subjects
    });

    // Group by year and subject
    const yearSubjectMap = new Map<string, { [subject: string]: number }>();

    filteredData.forEach(item => {
      const key = item.year;
      if (!yearSubjectMap.has(key)) {
        yearSubjectMap.set(key, {});
      }
      const yearData = yearSubjectMap.get(key)!;
      yearData[item.subject] = (yearData[item.subject] || 0) + item.count;
    });

    // Convert to chart data format
    return Array.from(yearSubjectMap.entries())
      .map(([year, subjects]) => ({
        year: parseInt(year),
        [subject1]: subjects[subject1] || 0,
        [subject2]: subjects[subject2] || 0
      }))
      .sort((a, b) => a.year - b.year);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="flex items-center gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Statistics Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {statsData.totalQuestions.toLocaleString()} Questions
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.totalQuestions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all years</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Years Covered</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.yearDistribution.length}</div>
              <p className="text-xs text-muted-foreground">2007 - 2025</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.subjectDistribution.length}</div>
              <p className="text-xs text-muted-foreground">Computer Science topics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Questions/Year</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statsData.totalQuestions / statsData.yearDistribution.length)}
              </div>
              <p className="text-xs text-muted-foreground">Per examination year</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Year Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Questions by Year</CardTitle>
              <CardDescription>Distribution of questions across examination years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={statsData.yearDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Questions by Subject</CardTitle>
              <CardDescription>Top 10 subjects by question count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData.subjectDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Marks Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Marks Distribution</CardTitle>
              <CardDescription>1-mark vs 2-mark questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statsData.marksDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statsData.marksDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Theory vs Practical */}
          <Card>
            <CardHeader>
              <CardTitle>Theoretical vs Practical</CardTitle>
              <CardDescription>Question type distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statsData.theoryPracticalDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statsData.theoryPracticalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Subject Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Comparison</CardTitle>
            <CardDescription>Compare question counts between two subjects over time</CardDescription>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subject 1</label>
                <Select value={subject1} onValueChange={setSubject1}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select subject 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {statsData.allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subject 2</label>
                <Select value={subject2} onValueChange={setSubject2}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select subject 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {statsData.allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subtopic for {subject1 || 'Subject 1'}</label>
                <Select
                  value={selectedSubtopic1}
                  onValueChange={setSelectedSubtopic1}
                  disabled={!subject1}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subtopics</SelectItem>
                    {getAvailableSubtopicsForSubject(subject1).map((subtopic) => (
                      <SelectItem key={subtopic} value={subtopic}>
                        {subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subtopic for {subject2 || 'Subject 2'}</label>
                <Select
                  value={selectedSubtopic2}
                  onValueChange={setSelectedSubtopic2}
                  disabled={!subject2}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subtopics</SelectItem>
                    {getAvailableSubtopicsForSubject(subject2).map((subtopic) => (
                      <SelectItem key={subtopic} value={subtopic}>
                        {subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subject1 && subject2 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getComparisonChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={subject1}
                    stroke="#8884d8"
                    strokeWidth={2}
                    name={`${subject1}${selectedSubtopic1 !== 'all' ? ` (${selectedSubtopic1})` : ''}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={subject2}
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name={`${subject2}${selectedSubtopic2 !== 'all' ? ` (${selectedSubtopic2})` : ''}`}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Please select two subjects to compare
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Chapters and Subtopics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Top Chapters</CardTitle>
              <CardDescription>Most frequent chapters by question count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsData.chapterDistribution.slice(0, 10).map((chapter, index) => (
                  <div key={chapter.chapter} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{chapter.chapter}</span>
                    </div>
                    <Badge variant="secondary">{chapter.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Subtopics</CardTitle>
              <CardDescription>Most frequent subtopics by question count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsData.topSubtopics.slice(0, 10).map((subtopic, index) => (
                  <div key={subtopic.subtopic} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{subtopic.subtopic}</span>
                    </div>
                    <Badge variant="secondary">{subtopic.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
