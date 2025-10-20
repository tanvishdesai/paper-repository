import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==================== QUERY FUNCTIONS ====================

// Get all questions with filters and pagination
export const getQuestions = query({
  args: {
    subject: v.optional(v.string()),
    year: v.optional(v.number()),
    marks: v.optional(v.number()),
    type: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get questions with optional subject filter
    let questions;

    if (args.subject) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .collect();
    } else {
      questions = await ctx.db.query("questions").collect();
    }

    // Apply additional filters
    if (args.year) {
      questions = questions.filter(q => q.year === args.year);
    }
    
    if (args.marks) {
      questions = questions.filter(q => q.marks === args.marks);
    }
    
    if (args.type) {
      questions = questions.filter(q => q.theoretical_practical === args.type);
    }

    // Apply text search
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      questions = questions.filter(q => 
        q.question_text.toLowerCase().includes(searchLower) ||
        q.subtopic.toLowerCase().includes(searchLower) ||
        q.chapter.toLowerCase().includes(searchLower)
      );
    }

    // Sort by year (desc) then question_no
    questions.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.question_no.localeCompare(b.question_no);
    });

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 100;
    const paginatedQuestions = questions.slice(offset, offset + limit);

    return {
      questions: paginatedQuestions,
      total: questions.length,
    };
  },
});

// Get question count with filters
export const getQuestionCount = query({
  args: {
    subject: v.optional(v.string()),
    year: v.optional(v.number()),
    marks: v.optional(v.number()),
    type: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get questions with optional subject filter
    let questions;

    if (args.subject) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .collect();
    } else {
      questions = await ctx.db.query("questions").collect();
    }

    // Apply filters
    if (args.year) {
      questions = questions.filter(q => q.year === args.year);
    }
    
    if (args.marks) {
      questions = questions.filter(q => q.marks === args.marks);
    }
    
    if (args.type) {
      questions = questions.filter(q => q.theoretical_practical === args.type);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      questions = questions.filter(q => 
        q.question_text.toLowerCase().includes(searchLower) ||
        q.subtopic.toLowerCase().includes(searchLower) ||
        q.chapter.toLowerCase().includes(searchLower)
      );
    }

    return questions.length;
  },
});

// Get a single question by ID
export const getQuestionById = query({
  args: { questionId: v.string() },
  handler: async (ctx, args) => {
    const question = await ctx.db
      .query("questions")
      .withIndex("by_question_id", (q) => q.eq("questionId", args.questionId))
      .first();
    
    return question;
  },
});

// Get similar questions based on subject, chapter, and subtopic
export const getSimilarQuestions = query({
  args: { 
    questionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get the target question
    const targetQuestion = await ctx.db
      .query("questions")
      .withIndex("by_question_id", (q) => q.eq("questionId", args.questionId))
      .first();

    if (!targetQuestion) return [];

    // Find similar questions
    let allQuestions = await ctx.db.query("questions").collect();

    // Filter out the target question
    allQuestions = allQuestions.filter(q => q.questionId !== args.questionId);

    // Calculate similarity scores
    const scoredQuestions = allQuestions.map(q => {
      let score = 0;
      
      // Same subtopic (highest weight)
      if (q.subtopic === targetQuestion.subtopic) score += 5;
      
      // Same chapter (medium weight)
      if (q.chapter === targetQuestion.chapter) score += 3;
      
      // Same subject (low weight)
      if (q.subject === targetQuestion.subject) score += 1;

      // Recency boost (within 5 years)
      if (Math.abs(q.year - targetQuestion.year) <= 5) score *= 1.2;

      // Same difficulty level (marks)
      if (q.marks === targetQuestion.marks) score *= 1.1;

      return { question: q, score };
    });

    // Sort by score and take top N
    scoredQuestions.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.question.year - a.question.year;
    });

    return scoredQuestions
      .slice(0, limit)
      .map(item => ({
        ...item.question,
        similarityScore: item.score,
        similarityReason: 
          item.question.subtopic === targetQuestion.subtopic ? 'Same subtopic' :
          item.question.chapter === targetQuestion.chapter ? 'Same chapter' :
          item.question.subject === targetQuestion.subject ? 'Same subject' :
          'Related topic'
      }));
  },
});

// Get all subjects
export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const subjects = await ctx.db.query("subjects").collect();
    const chapters = await ctx.db.query("chapters").collect();
    const subtopics = await ctx.db.query("subtopics").collect();

    const years = questions.map(q => q.year);
    const earliestYear = years.length > 0 ? Math.min(...years) : null;
    const latestYear = years.length > 0 ? Math.max(...years) : null;

    return {
      totalQuestions: questions.length,
      totalSubjects: subjects.length,
      totalChapters: chapters.length,
      totalSubtopics: subtopics.length,
      earliestYear,
      latestYear,
    };
  },
});

// Get chapters by subject
export const getChaptersBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .collect();
    
    return chapters;
  },
});

// Get subtopics by chapter
export const getSubtopicsByChapter = query({
  args: { chapter: v.string() },
  handler: async (ctx, args) => {
    const subtopics = await ctx.db
      .query("subtopics")
      .withIndex("by_chapter", (q) => q.eq("chapter", args.chapter))
      .collect();
    
    return subtopics;
  },
});

// ==================== MUTATION FUNCTIONS ====================

// Bulk insert questions
export const insertQuestions = mutation({
  args: { 
    questions: v.array(v.object({
      questionId: v.string(),
      question_no: v.string(),
      question_text: v.string(),
      year: v.number(),
      paper_code: v.string(),
      subject: v.string(),
      chapter: v.string(),
      subtopic: v.string(),
      marks: v.number(),
      theoretical_practical: v.string(),
      provenance: v.string(),
      confidence: v.number(),
      correct_answer: v.string(),
      has_diagram: v.boolean(),
      options: v.optional(v.array(v.string())),
    }))
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    
    for (const question of args.questions) {
      // Check if question already exists
      const existing = await ctx.db
        .query("questions")
        .withIndex("by_question_id", (q) => q.eq("questionId", question.questionId))
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("questions", question);
        insertedIds.push(id);
      }
    }
    
    return { inserted: insertedIds.length };
  },
});

// Insert or update subject
export const upsertSubject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        questionCount: args.questionCount,
        description: args.description,
        icon: args.icon,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("subjects", args);
    }
  },
});

// Insert or update chapter
export const upsertChapter = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        questionCount: args.questionCount,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("chapters", args);
    }
  },
});

// Insert or update subtopic
export const upsertSubtopic = mutation({
  args: {
    name: v.string(),
    chapter: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subtopics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        questionCount: args.questionCount,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("subtopics", args);
    }
  },
});

// Clear all questions (for testing/re-migration)
export const clearAllQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }
    return { deleted: questions.length };
  },
});

// Clear all metadata tables
export const clearAllMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    const chapters = await ctx.db.query("chapters").collect();
    const subtopics = await ctx.db.query("subtopics").collect();
    
    for (const subject of subjects) await ctx.db.delete(subject._id);
    for (const chapter of chapters) await ctx.db.delete(chapter._id);
    for (const subtopic of subtopics) await ctx.db.delete(subtopic._id);
    
    return {
      deleted: {
        subjects: subjects.length,
        chapters: chapters.length,
        subtopics: subtopics.length,
      }
    };
  },
});

// Get graph data for visualization
export const getGraphData = query({
  args: {
    limit: v.optional(v.number()),
    excludeDiagrams: v.optional(v.boolean()),
    subjectFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const excludeDiagrams = args.excludeDiagrams || false;
    
    // Fetch all metadata
    let subjects = await ctx.db.query("subjects").collect();
    let chapters = await ctx.db.query("chapters").collect();
    let subtopics = await ctx.db.query("subtopics").collect();
    
    // Filter by subject if provided
    if (args.subjectFilter) {
      subjects = subjects.filter(s => s.name === args.subjectFilter);
      chapters = chapters.filter(c => c.subject === args.subjectFilter);
      subtopics = subtopics.filter(st => st.subject === args.subjectFilter);
    }
    
    // Get sample questions (limited)
    let questions = await ctx.db.query("questions").take(limit);
    
    // Apply filters
    if (excludeDiagrams) {
      questions = questions.filter(q => !q.has_diagram);
    }
    
    if (args.subjectFilter) {
      questions = questions.filter(q => q.subject === args.subjectFilter);
    }
    
    // Build nodes and links
    const nodes = [];
    const links = [];
    
    // Add subject nodes
    for (const subject of subjects) {
      nodes.push({
        id: `subject-${subject.name}`,
        label: subject.name,
        type: 'Subject' as const,
        questionCount: subject.questionCount,
      });
    }
    
    // Add chapter nodes and links to subjects
    for (const chapter of chapters) {
      const nodeId = `chapter-${chapter.name}`;
      nodes.push({
        id: nodeId,
        label: chapter.name,
        type: 'Chapter' as const,
        subject: chapter.subject,
        questionCount: chapter.questionCount,
      });
      
      // Link chapter to subject
      links.push({
        source: `subject-${chapter.subject}`,
        target: nodeId,
        type: 'HAS_CHAPTER',
      });
    }
    
    // Add subtopic nodes and links to chapters
    for (const subtopic of subtopics) {
      const nodeId = `subtopic-${subtopic.name}`;
      nodes.push({
        id: nodeId,
        label: subtopic.name,
        type: 'Subtopic' as const,
        chapter: subtopic.chapter,
        subject: subtopic.subject,
        questionCount: subtopic.questionCount,
      });
      
      // Link subtopic to chapter
      links.push({
        source: `chapter-${subtopic.chapter}`,
        target: nodeId,
        type: 'HAS_SUBTOPIC',
      });
    }
    
    // Add question nodes and links to subtopics
    for (const question of questions) {
      const nodeId = `question-${question.questionId}`;
      nodes.push({
        id: nodeId,
        label: question.question_no,
        type: 'Question' as const,
        subject: question.subject,
        chapter: question.chapter,
        subtopic: question.subtopic,
        year: question.year,
        marks: question.marks,
        has_diagram: question.has_diagram,
        question_text: question.question_text.substring(0, 100),
      });
      
      // Link question to subtopic
      links.push({
        source: `subtopic-${question.subtopic}`,
        target: nodeId,
        type: 'HAS_QUESTION',
      });
    }
    
    return {
      nodes,
      links,
      totalQuestions: questions.length,
    };
  },
});

// Get detailed statistics for the analytics page
export const getDetailedStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();

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

    // Subtopic distribution
    const subtopicMap = new Map<string, number>();
    questions.forEach(q => {
      subtopicMap.set(q.subtopic, (subtopicMap.get(q.subtopic) || 0) + 1);
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
      const subtopic = q.subtopic;

      allSubjectsSet.add(subject);
      allSubtopicsSet.add(subtopic);

      // Store data for year-subject combinations
      const key = `${year}-${subject}`;
      subjectComparisonMap.set(key, (subjectComparisonMap.get(key) || 0) + 1);

      // Also store data for year-subject-subtopic combinations
      const subtopicKey = `${year}-${subject}-${subtopic}`;
      subjectComparisonMap.set(subtopicKey, (subjectComparisonMap.get(subtopicKey) || 0) + 1);
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
      totalQuestions: questions.length,
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
  },
});

