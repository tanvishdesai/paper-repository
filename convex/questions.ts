import { v } from "convex/values";
import { query } from "./_generated/server";

// This is a helper to read JSON files
// In production, you'd want to import these into Convex database
// For now, we'll create queries that the API routes can use

export const getSubjectQuestions = query({
  args: {
    subject: v.string(),
    year: v.optional(v.union(v.number(), v.string())),
    marks: v.optional(v.union(v.number(), v.string())),
    type: v.optional(v.string()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Note: This is a placeholder
    // In a real implementation, you would store questions in Convex database
    // For now, we'll use this structure and have the API routes read the JSON files
    
    return {
      subject: args.subject,
      filters: {
        year: args.year,
        marks: args.marks,
        type: args.type,
        search: args.search,
      },
      pagination: {
        limit: args.limit || 100,
        offset: args.offset || 0,
      },
    };
  },
});

export const getAllSubjects = query({
  args: {},
  handler: async () => {
    // Return list of available subjects
    const subjects = [
      "Algorithms",
      "Compiler_Design",
      "Computer_Networks",
      "Computer_Organization_and_Architecture",
      "Databases",
      "Digital_Logic",
      "Engineering_Mathematics",
      "General_Aptitude",
      "Operating_System",
      "Programming_and_Data_Structures",
      "Theory_of_Computation",
    ];
    
    return subjects;
  },
});

