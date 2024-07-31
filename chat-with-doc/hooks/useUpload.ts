"use client";

import { generateEmbeddings } from "@/actions/generateEmbeddings";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

// create custom hook
export enum StatusText {
  UPLOADING = "Uploading file...",
  UPLOADED = "File uploaded successfully...",
  SAVING = "Saving file to database",
  GENERATING = "Generating AI Embeddings - This will only take a few seconds...",
}

// generate a type
export type Status = StatusText[keyof StatusText];

function useUpload() {
  const [progress, setProgress] = useState<number | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const handleUpload = async (file: File) => {
    if (!file || !user) return;
    // free or pro limitations

    const fileIdToUploadTo = uuidv4();
    // configure location
    const storageRef = ref(
      storage,
      `users/${user.id}/files/${fileIdToUploadTo}`
    );

    // stream uploads (on going)
    const uploadedTask = uploadBytesResumable(storageRef, file);
    // listen to events
    uploadedTask.on(
      "state_changed",
      (snapshot) => {
        // calculate percentge of upload
        const percent =
          Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setStatus(StatusText.UPLOADING);
        setProgress(percent);
      },
      (error) => {
        console.log("Error while uploading the file", error);
      },
      async () => {
        setStatus(StatusText.UPLOADED);
        // getnerate a clickable url for the file to be downloaded
        const downloadURL = await getDownloadURL(uploadedTask.snapshot.ref);
        setStatus(StatusText.SAVING);
        // Now, to the Firestore db that's being listened to on the app
        // override the current location
        await setDoc(doc(db, "users", user.id, "files", fileIdToUploadTo), {
          name: file.name,
          size: file.size,
          type: file.type,
          downloadURL: downloadURL,
          ref: uploadedTask.snapshot.ref.fullPath,
          createdAt: new Date(),
        });

        setStatus(StatusText.GENERATING);
        // Generate AI Embeddings
        await generateEmbeddings(fileIdToUploadTo);

        setFileId(fileIdToUploadTo);
      }
    );
  };
  return { handleUpload, progress, status, fileId };
}

export default useUpload;
