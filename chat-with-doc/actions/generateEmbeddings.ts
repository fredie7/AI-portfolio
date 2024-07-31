"use server";

import { generateEmbeddingsInPineconeVectorStore } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function generateEmbeddings(docId: string) {
  auth().protect(); // stop unauthorized users

  // turn PDF into lots of embeddings
  await generateEmbeddingsInPineconeVectorStore(docId);

  //whatever is fetched into the dashboard is refetched
  revalidatePath("/dashboard");
  return { completed: true };
}
