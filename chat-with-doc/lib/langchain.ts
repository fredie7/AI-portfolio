import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDB } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

const model = new ChatOpenAI({
  apiKey: process.env.OPEN_API_KEY,
  modelName: "gpt-4o",
});

export const indexName = "lex";
// Index type
// RecordMetadata argument

async function fetchmessagesFromDB(docId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }
  console.log(
    "=================Fetching messages or chat history from the database================"
  );
  const chats = await adminDB
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .collection("chats")
    .orderBy("createdAt", "desc")
    .get();
  // .limit(LIMIT fig)
  // console.log("CHATS====>>>", chats.docs);
  //convert into an array of human and AI messages
  const chatHistory = chats.docs.map((doc) => {
    return doc.data().role === "human"
      ? new HumanMessage(doc.data().message)
      : new AIMessage(doc.data().message);
  });

  console.log(
    `=============Fetched last ${chatHistory.length} messages successfully===============`
  );

  console.log(
    "CHAT HISTORY=====>>>>",
    chatHistory.map((msg) => msg.content.toString())
  );

  return chatHistory;
}

export async function generateDocs(docId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  console.log("--- Fetching the download URL from firebase... ---");
  const firebaseRef = await adminDB
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .get();

  const downloadURL = firebaseRef.data()?.downloadURL;
  if (!downloadURL) {
    throw new Error("Download URL not found in firebase");
  }
  console.log(`--- Downloading URL fetched successfully: ${downloadURL} ---`);

  //   Fetch the PDF from the specified URL
  const response = await fetch(downloadURL);

  // Load the PDF into a PDF document object
  const data = await response.blob();

  // Load the PDF from the specified path
  console.log("--- Loading PDF document ---");
  const loader = new PDFLoader(data);
  const docs = await loader.load();

  // Split the document into smaller chunks for faster processing
  console.log("--- Splitting the document into smaller chunks ---");
  const splitter = new RecursiveCharacterTextSplitter();

  const splitDocs = await splitter.splitDocuments(docs);
  console.log(`--- Splitting into ${splitDocs.length} chunks ---`);

  return splitDocs;
}

async function nameSpaceExists(
  index: Index<RecordMetadata>,
  namespace: string
) {
  if (namespace === null) {
    throw new Error("No namespace value provided");
    const { namespaces } = await index.describeIndexStats();
    return namespaces?.[namespace] !== undefined;
  }
}

export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }
  let pineConeVectorStore;

  // Generate embeddings (numerical representations) from the split documents
  console.log("--- Generating embeddings for the split documents.... ---");
  const embeddings = new OpenAIEmbeddings();

  const index = await pineconeClient.index(indexName);
  const namespaceAlreadyExists = await nameSpaceExists(index, docId);
  // namespaee = ID of the file
  if (namespaceAlreadyExists) {
    console.log(
      `--- Namespace ${docId} already exists, reusing existing embeddings... ---`
    );

    pineConeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: docId,
    });

    return pineConeVectorStore;
  } else {
    // If the namespace doesn't exist download the PDF from the firestore via the stored Download URl,
    // and generate the embeddings and store them in the Pinecone vector store
    const splitDocs = await generateDocs(docId);

    console.log(
      `---Storing the embeddings in namespace ${docId} in the ${indexName} Pinecone vector store... ---`
    );
    pineConeVectorStore = await PineconeStore.fromDocuments(
      splitDocs,
      embeddings,
      { pineconeIndex: index, namespace: docId }
    );
    return pineConeVectorStore;
  }
}
const generateLangchainCompletion = async (docId: string, question: string) => {
  let pineConeVectorStore;

  pineConeVectorStore = await generateEmbeddingsInPineconeVectorStore(docId);
  if (!pineConeVectorStore) {
    throw new Error("Pinecone Vector Store not found");
  }

  // create a retriever  to search through the vector store
  console.log("================= Creating a retriever =================");
  const retriever = pineConeVectorStore.asRetriever();

  //Fetch a chat history from the database
  const chatHistory = await fetchmessagesFromDB(docId);

  // Define a prompt template for generating search queries based on conversation history
  console.log("==========Defining a prompt template==========");
  const historyAwarePrompt = ChatPromptTemplate.fromMessages([
    ...chatHistory,
    ["user", "{input}"],
    [
      "user",
      "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
    ],
  ]);

  // Create a history aware conversation chain that uses the model, retriever and prompt
  console.log("========== Create a history aware retriever chain ==========");
  const historyAwareRetrieverChain = await createHistoryAwareRetriever({
    llm: model,
    retriever,
    rephrasePrompt: historyAwarePrompt,
  });

  //Define  prompt template for answering questions based on retrieved context
  console.log(
    "========== Defining a prompt template for answering questions =========="
  );
  const historyAwareRetrieverPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer the user's Question based on the below context:\n\n{context}",
    ],

    ...chatHistory,

    ["user", "{input}"],
  ]);

  // Create a chain to combine the retrieved documents into a coherent response
  console.log("========== Createing a document combining chain ==========");
  const historyAwareCombineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt: historyAwareRetrieverPrompt,
  });

  // Create the main retrieval chain that combines the history aware retriever and the document combining chains
  console.log("========== Create the main retrieval chain ==========");
  const conversationRetrievalChain = await createRetrievalChain({
    retriever: historyAwareRetrieverChain,
    combineDocsChain: historyAwareCombineDocsChain,
  });

  console.log(
    "==========Running the chain with sample a conversation...=========="
  );
  const reply = await conversationRetrievalChain.invoke({
    chat_history: chatHistory,
    input: question,
  });

  //Print the result tot tht console
  console.log(reply.answer);
  return reply.answer;
};

// Export the model and run function
export { model, generateLangchainCompletion };
