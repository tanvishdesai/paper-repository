/**
 * Migration Script: Import JSON Data to Convex
 * 
 * This script reads all JSON files from public/data and imports them into Convex database.
 * Run with: npx ts-node scripts/migrate-to-convex.ts
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Get Convex URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

interface Question {
  year: number;
  paper_code: string;
  question_no: string;
  question_text: string;
  options: string[] | null;
  subject: string;
  chapter: string;
  subtopic: string;
  theoretical_practical: string;
  marks: number;
  provenance: string;
  confidence: number;
  correct_answer: string;
  has_diagram: boolean;
}

// Generate unique question ID
function generateQuestionId(q: Question): string {
  return `${q.year}-${q.paper_code}-${q.question_no}`.replace(/\s+/g, '-');
}

// Read all JSON files from data directory
function readAllDataFiles(dataDir: string): Question[] {
  const allQuestions: Question[] = [];
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Found ${files.length} JSON files in ${dataDir}`);
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`📖 Reading ${file}...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (Array.isArray(data)) {
        allQuestions.push(...data);
        console.log(`  ✅ Loaded ${data.length} questions from ${file}`);
      } else {
        console.log(`  ⚠️  Warning: ${file} does not contain an array`);
      }
    } catch (error) {
      console.error(`  ❌ Error reading ${file}:`, error);
    }
  }
  
  return allQuestions;
}

// Calculate statistics from questions
function calculateStatistics(questions: Question[]) {
  const subjectsMap = new Map<string, number>();
  const chaptersMap = new Map<string, { subject: string; count: number }>();
  const subtopicsMap = new Map<string, { chapter: string; subject: string; count: number }>();
  
  for (const q of questions) {
    // Count subjects
    subjectsMap.set(q.subject, (subjectsMap.get(q.subject) || 0) + 1);
    
    // Count chapters
    const chapterKey = `${q.subject}::${q.chapter}`;
    if (!chaptersMap.has(chapterKey)) {
      chaptersMap.set(chapterKey, { subject: q.subject, count: 0 });
    }
    chaptersMap.get(chapterKey)!.count++;
    
    // Count subtopics
    const subtopicKey = `${q.subject}::${q.chapter}::${q.subtopic}`;
    if (!subtopicsMap.has(subtopicKey)) {
      subtopicsMap.set(subtopicKey, { 
        chapter: q.chapter, 
        subject: q.subject, 
        count: 0 
      });
    }
    subtopicsMap.get(subtopicKey)!.count++;
  }
  
  return { subjectsMap, chaptersMap, subtopicsMap };
}

// Subject metadata
const subjectMetadata: Record<string, { description: string; icon: string }> = {
  "Algorithms": {
    description: "Algorithmic techniques, complexity analysis, and data structures",
    icon: "🔄"
  },
  "Compiler Design": {
    description: "Lexical analysis, parsing, code generation, and optimization",
    icon: "🔨"
  },
  "Computer Networks": {
    description: "Network protocols, layers, routing, and communication",
    icon: "🌐"
  },
  "Computer Organization and Architecture": {
    description: "CPU design, memory hierarchy, and system architecture",
    icon: "💾"
  },
  "Databases": {
    description: "SQL, NoSQL, transactions, normalization, and indexing",
    icon: "🗄️"
  },
  "Digital Logic": {
    description: "Boolean algebra, logic gates, and circuit design",
    icon: "⚡"
  },
  "Engineering Mathematics": {
    description: "Discrete mathematics, probability, and linear algebra",
    icon: "📐"
  },
  "General Aptitude": {
    description: "Quantitative and verbal reasoning questions",
    icon: "🧠"
  },
  "Operating System": {
    description: "Process management, memory, file systems, and concurrency",
    icon: "💻"
  },
  "Programming and Data Structures": {
    description: "Programming concepts, data structures, and algorithms",
    icon: "📝"
  },
  "Theory of Computation": {
    description: "Automata, formal languages, and computability",
    icon: "🤖"
  },
};

async function main() {
  console.log('🚀 Starting migration to Convex...\n');
  
  // Read data files
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const questions = readAllDataFiles(dataDir);
  
  console.log(`\n📊 Total questions loaded: ${questions.length}\n`);
  
  if (questions.length === 0) {
    console.error('❌ No questions found. Exiting.');
    process.exit(1);
  }
  
  // Calculate statistics
  console.log('📈 Calculating statistics...');
  const { subjectsMap, chaptersMap, subtopicsMap } = calculateStatistics(questions);
  
  console.log(`  - ${subjectsMap.size} unique subjects`);
  console.log(`  - ${chaptersMap.size} unique chapters`);
  console.log(`  - ${subtopicsMap.size} unique subtopics\n`);
  
  // Step 1: Insert subjects
  console.log('📚 Inserting subjects...');
  for (const [subjectName, count] of subjectsMap.entries()) {
    const metadata = subjectMetadata[subjectName] || {
      description: `Questions in ${subjectName}`,
      icon: '📚'
    };
    
    try {
      await convex.mutation(api.questions.upsertSubject, {
        name: subjectName,
        questionCount: count,
        description: metadata.description,
        icon: metadata.icon,
      });
      console.log(`  ✅ ${subjectName}: ${count} questions`);
    } catch (error) {
      console.error(`  ❌ Error inserting subject ${subjectName}:`, error);
    }
  }
  
  // Step 2: Insert chapters
  console.log('\n📖 Inserting chapters...');
  for (const [key, data] of chaptersMap.entries()) {
    const chapterName = key.split('::')[1];
    
    try {
      await convex.mutation(api.questions.upsertChapter, {
        name: chapterName,
        subject: data.subject,
        questionCount: data.count,
      });
      console.log(`  ✅ ${chapterName} (${data.subject}): ${data.count} questions`);
    } catch (error) {
      console.error(`  ❌ Error inserting chapter ${chapterName}:`, error);
    }
  }
  
  // Step 3: Insert subtopics
  console.log('\n📑 Inserting subtopics...');
  let subtopicCount = 0;
  for (const [key, data] of subtopicsMap.entries()) {
    const subtopicName = key.split('::')[2];
    
    try {
      await convex.mutation(api.questions.upsertSubtopic, {
        name: subtopicName,
        chapter: data.chapter,
        subject: data.subject,
        questionCount: data.count,
      });
      subtopicCount++;
      if (subtopicCount % 10 === 0) {
        console.log(`  ✅ Inserted ${subtopicCount}/${subtopicsMap.size} subtopics...`);
      }
    } catch (error) {
      console.error(`  ❌ Error inserting subtopic ${subtopicName}:`, error);
    }
  }
  console.log(`  ✅ Completed: ${subtopicCount} subtopics inserted`);
  
  // Step 4: Insert questions in batches
  console.log('\n❓ Inserting questions...');
  const BATCH_SIZE = 100; // Convex has size limits, so we batch
  const batches = [];
  
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`  📦 Processing ${batches.length} batches of ${BATCH_SIZE} questions each`);
  
  let totalInserted = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const formattedBatch = batch.map(q => ({
      questionId: generateQuestionId(q),
      question_no: q.question_no,
      question_text: q.question_text,
      year: q.year,
      paper_code: q.paper_code,
      subject: q.subject,
      chapter: q.chapter,
      subtopic: q.subtopic,
      marks: q.marks,
      theoretical_practical: q.theoretical_practical,
      provenance: q.provenance,
      confidence: q.confidence,
      correct_answer: q.correct_answer,
      has_diagram: q.has_diagram,
      options: q.options || undefined, // Convert null to undefined for optional field
    }));
    
    try {
      const result = await convex.mutation(api.questions.insertQuestions, {
        questions: formattedBatch,
      });
      totalInserted += result.inserted;
      console.log(`  ✅ Batch ${i + 1}/${batches.length}: Inserted ${result.inserted} questions (Total: ${totalInserted})`);
    } catch (error) {
      console.error(`  ❌ Error inserting batch ${i + 1}:`, error);
      console.error(`     Details:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Summary:`);
  console.log(`  - Questions inserted: ${totalInserted}/${questions.length}`);
  console.log(`  - Subjects: ${subjectsMap.size}`);
  console.log(`  - Chapters: ${chaptersMap.size}`);
  console.log(`  - Subtopics: ${subtopicsMap.size}`);
  console.log(`\n🎉 All data has been migrated to Convex successfully!`);
}

// Run the migration
main()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

