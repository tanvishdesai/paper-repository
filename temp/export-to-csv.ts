/**
 * Export Questions to CSV
 * 
 * This script:
 * 1. Fetches all questions from the Convex database
 * 2. Extracts specific fields: _id, chapter, questionId, question_text, subject, subtopic, year
 * 3. Converts the data to CSV format
 * 4. Saves the CSV file to the temp directory
 * 
 * Run with: npx tsx temp/export-to-csv.ts
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Get Convex URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

interface QuestionRow {
  _id: string;
  chapter: string;
  questionId: string;
  question_text: string;
  subject: string;
  subtopic: string;
  year: number;
}

interface Question {
  _id: string;
  chapter: string;
  questionId: string;
  question_text: string;
  subject: string;
  subtopic: string;
  year: number;
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert array of objects to CSV format
 */
function convertToCSV(data: QuestionRow[]): string {
  if (data.length === 0) {
    return ""; // Return empty if no data
  }

  // Create header row
  const headers = ["_id", "chapter", "questionId", "question_text", "subject", "subtopic", "year"];
  const headerRow = headers.map(escapeCSVValue).join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return headers.map((header) => escapeCSVValue(row[header as keyof QuestionRow])).join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Main export function
 */
async function exportQuestionsToCsv(): Promise<void> {
  console.log("🔄 Starting CSV export process...\n");

  try {
    // Fetch all questions from database
    console.log("📥 Fetching all questions from Convex database...");
    const allQuestions = await convex.query(api.questions.getQuestions, {
      limit: 100000, // High limit to fetch all questions
    });

    console.log(`✅ Retrieved ${allQuestions.questions.length} questions\n`);

    // Extract required fields
    console.log("📝 Extracting required fields...");
    const exportData: QuestionRow[] = allQuestions.questions.map((question: Question) => ({
      _id: question._id || "",
      chapter: question.chapter || "",
      questionId: question.questionId || "",
      question_text: question.question_text || "",
      subject: question.subject || "",
      subtopic: question.subtopic || "",
      year: question.year || 0,
    }));

    console.log(`✅ Extracted data for ${exportData.length} questions\n`);

    // Convert to CSV
    console.log("🔄 Converting to CSV format...");
    const csvContent = convertToCSV(exportData);
    console.log("✅ CSV conversion complete\n");

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`📁 Created temp directory at ${tempDir}\n`);
    }

    // Save to CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const filename = `questions_export_${timestamp}.csv`;
    const filepath = path.join(tempDir, filename);

    fs.writeFileSync(filepath, csvContent, "utf-8");
    console.log(`✅ CSV file saved successfully!\n`);
    console.log(`📄 File: ${filepath}`);
    console.log(`📊 Records: ${exportData.length}`);
    console.log(`💾 Size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB\n`);

    console.log("🎉 Export completed successfully!");
  } catch (error) {
    console.error("❌ Error during export:", error);
    process.exit(1);
  }
}

// Run the export
exportQuestionsToCsv()
  .then(() => {
    console.log("\n✅ Process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Process failed:", error);
    process.exit(1);
  });
