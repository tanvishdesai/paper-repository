/**
 * Update Vector Embeddings from CSV
 * 
 * This script:
 * 1. Reads the CSV file with vector embeddings
 * 2. Carefully parses CSV handling multiline fields in quoted cells
 * 3. Matches each _id to the corresponding question in Convex
 * 4. Updates the vector_embedding field with the values from CSV
 * 5. Validates all 965 questions are updated
 * 
 * Run with: npx tsx temp/update-embeddings.ts
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


/**
 * Parse CSV file handling quoted multiline fields
 */
function parseCSVWithMultiline(csvContent: string): Map<string, number[]> {
  const embeddings = new Map<string, number[]>();
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let isFirstRow = true;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // End of row
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
      }
      if (currentRow.length > 0 && currentRow[0]) {
        // Skip header row
        if (isFirstRow) {
          isFirstRow = false;
        } else {
          const _id = currentRow[0].trim();
          const vectorStr = currentRow[currentRow.length - 1]?.trim();
          if (_id && vectorStr) {
            try {
              const vector = JSON.parse(vectorStr);
              if (Array.isArray(vector)) {
                embeddings.set(_id, vector);
              }
            } catch {
              // Skip invalid rows
            }
          }
        }
        currentRow = [];
      }
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // Add last field and row if not empty
  if (currentField) {
    currentRow.push(currentField);
  }
  if (currentRow.length > 0 && currentRow[0] && !isFirstRow) {
    const _id = currentRow[0].trim();
    const vectorStr = currentRow[currentRow.length - 1]?.trim();
    if (_id && vectorStr) {
      try {
        const vector = JSON.parse(vectorStr);
        if (Array.isArray(vector)) {
          embeddings.set(_id, vector);
        }
      } catch {
        // Skip invalid rows
      }
    }
  }

  return embeddings;
}

/**
 * Update database with embeddings
 */
async function updateEmbeddings(): Promise<void> {
  console.log("🔄 Starting vector embedding update...\n");

  try {
    // Read CSV file
    console.log("📖 Reading CSV file with embeddings...");
    const csvPath = path.join(process.cwd(), "temp", "questions_with_embeddings.csv");

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    console.log(`✅ CSV file read (${(csvContent.length / 1024 / 1024).toFixed(2)} MB)\n`);

    // Parse CSV and extract embeddings
    console.log("🔍 Parsing CSV with multiline field handling...");
    const embeddings = parseCSVWithMultiline(csvContent);
    console.log(`✅ Extracted ${embeddings.size} embeddings from CSV\n`);

    // Fetch all questions from database
    console.log("📥 Fetching all questions from Convex database...");
    const allQuestions = await convex.query(api.questions.getQuestions, {
      limit: 100000,
    });

    console.log(`✅ Retrieved ${allQuestions.questions.length} questions\n`);

    // Update database
    console.log("🔄 Updating database with embeddings...");
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let idx = 0; idx < allQuestions.questions.length; idx++) {
      const question = allQuestions.questions[idx];
      const embedding = embeddings.get(question._id);

      if (!embedding) {
        console.warn(`⚠️  No embedding found for _id: ${question._id}`);
        skippedCount++;
        continue;
      }

      try {
        // Update the question with vector_embedding
        await convex.mutation(api.questions.updateQuestionEmbedding, {
          _id: question._id,
          vectorEmbedding: embedding,
        });

        updatedCount++;

        // Progress log every 100 updates
        if ((updatedCount + skippedCount) % 100 === 0) {
          console.log(
            `  ⏳ Progress: ${updatedCount + skippedCount}/${allQuestions.questions.length} processed`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error updating _id ${question._id}: ${error instanceof Error ? error.message : error}`
        );
        errorCount++;
      }
    }

    console.log(`\n✨ Update complete!\n`);
    console.log(`📊 Results:`);
    console.log(`  ✅ Updated: ${updatedCount}`);
    console.log(`  ⚠️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📈 Total: ${allQuestions.questions.length}\n`);

    if (updatedCount === allQuestions.questions.length) {
      console.log("🎉 All questions successfully updated with embeddings!");
    } else if (updatedCount + skippedCount === allQuestions.questions.length) {
      console.log("⚠️  Update completed with some skipped (missing embeddings)");
    } else {
      console.warn(`⚠️  Update completed with errors. Check details above.`);
    }
  } catch (error) {
    console.error("❌ Error during update:", error);
    process.exit(1);
  }
}

// Run the update
updateEmbeddings()
  .then(() => {
    console.log("\n✅ Process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Process failed:", error);
    process.exit(1);
  });
