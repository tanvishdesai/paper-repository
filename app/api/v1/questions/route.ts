import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import fs from "fs";
import path from "path";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Hash the API key to match stored hash
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify API key
async function verifyApiKey(apiKey: string) {
  const keyHash = await hashApiKey(apiKey);
  const result = await convex.query(api.apiKeys.verify, { keyHash });
  return result;
}

// Log API usage
async function logApiUsage(apiKeyId: string) {
  // In production, you'd want to use a Convex mutation here
  // For now, we'll just update the last used timestamp
  try {
    await convex.mutation(api.apiKeys.updateLastUsed, { keyId: apiKeyId as Id<"apiKeys"> });
  } catch (error) {
    console.error("Failed to log API usage:", error);
  }
}

// Get all questions from all subjects
export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("X-API-Key") || request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Include X-API-Key header or Authorization: Bearer <key>" },
        { status: 401 }
      );
    }

    // Verify API key
    const keyData = await verifyApiKey(apiKey);
    if (!keyData) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const year = searchParams.get("year");
    const marks = searchParams.get("marks");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sort") || "year-desc";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Read questions data
    const dataDir = path.join(process.cwd(), "public", "data");
    let allQuestions: Record<string, unknown>[] = [];

    if (subject) {
      // Get specific subject
      const filePath = path.join(dataDir, `${subject}.json`);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        allQuestions = JSON.parse(fileContent);
      } else {
        return NextResponse.json(
          { error: `Subject '${subject}' not found` },
          { status: 404 }
        );
      }
    } else {
      // Get all subjects
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(dataDir, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const questions = JSON.parse(fileContent);
          allQuestions = allQuestions.concat(questions);
        }
      }
    }

    // Apply filters
    const filteredQuestions = allQuestions.filter((q: Record<string, unknown>) => {
      const matchesYear = !year || q.year?.toString() === year;
      const matchesMarks = !marks || q.marks?.toString() === marks;
      const matchesType = !type || q.theoretical_practical === type;
      const matchesSearch = !search ||
        (q.question_text as string).toLowerCase().includes(search.toLowerCase()) ||
        (q.subtopic as string).toLowerCase().includes(search.toLowerCase()) ||
        (q.chapter as string).toLowerCase().includes(search.toLowerCase());

      return matchesYear && matchesMarks && matchesType && matchesSearch;
    });

    // Sort questions
    filteredQuestions.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      switch (sortBy) {
        case "year-desc":
          return (b.year as number ?? 0) - (a.year as number ?? 0);
        case "year-asc":
          return (a.year as number ?? 0) - (b.year as number ?? 0);
        case "marks-desc":
          return (b.marks as number ?? 0) - (a.marks as number ?? 0);
        case "marks-asc":
          return (a.marks as number ?? 0) - (b.marks as number ?? 0);
        default:
          return 0;
      }
    });

    // Paginate
    const total = filteredQuestions.length;
    const paginatedQuestions = filteredQuestions.slice(offset, offset + limit);

    // Log usage
    await logApiUsage(keyData.id);

    // Return response
    return NextResponse.json({
      success: true,
      data: paginatedQuestions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        subject,
        year,
        marks,
        type,
        search,
        sortBy,
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

