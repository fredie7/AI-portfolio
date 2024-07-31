"use server";

import { Message } from "@/components/ui/Chat";
import { adminDB } from "@/firebaseAdmin";
import { generateLangchainCompletion } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server";
import { doc } from "firebase/firestore";
// import { FREE_LIMIT, PRO_LIMIT } from "@/hooks/useSubscription";

const FREE_LIMIT = 2;
const PRO_LIMIT = 20;

export async function askQuestion(id: string, question: string) {
  auth().protect();
  const { userId } = await auth();

  const chatRef = adminDB
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(id)
    .collection("chats");

  // check how many user messages are in the chat
  const chatSnapShot = await chatRef.get();
  const userMessages = chatSnapShot.docs.filter(
    (doc) => doc.data().role === "human"
  );
  // Check membership limits for messages in a document
  const userRef = await adminDB.collection("users").doc(userId!).get();

  //tomorrow, limit the pro/free users

  //   check if user is on FREE plan and has asked more than the FREE number of questions
  if (!userRef.data()?.hasActiveMembership) {
    console.log("Debug 3", userMessages.length, FREE_LIMIT);
    if (userMessages.length >= FREE_LIMIT) {
      return {
        success: false,
        message: `You'll need to upgrade to PRO to ask more than ${FREE_LIMIT} questions! 😢`,
      };
    }
  }

  // check if user is on PRO plan and has asked more than 100 questions
  if (userRef.data()?.hasActiveMembership) {
    console.log("Debug 4", userMessages.length, PRO_LIMIT);
    if (userMessages.length >= PRO_LIMIT) {
      return {
        success: false,
        message: `You've reached the PRO limit of ${PRO_LIMIT} questions per document! 😢`,
      };
    }
  }

  const userMessage: Message = {
    role: "human",
    message: question,
    createdAt: new Date(),
  };
  await chatRef.add(userMessage);

  // Generate AI response
  const reply = await generateLangchainCompletion(id, question);
  console.log("REPLY REPLY REPLY REPLY REPLY REPLY========>>>", reply);
  const aiMessage: Message = {
    role: "ai",
    message: reply,
    createdAt: new Date(),
  };
  await chatRef.add(aiMessage);
  return { success: true, message: null };
}
