import { auth } from "@clerk/nextjs/server";
import PlaceHolder from "./PlaceHolder";
import { adminDB } from "@/firebaseAdmin";
import Document from "./Document";

async function Documents() {
  auth().protect();
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  const documentsSnapShot = await adminDB
    .collection("users")
    .doc(userId)
    .collection("files")
    .get();

  return (
    <div className="flex flex-wrap p-5 bg-gray-100 justify-center lg:justify-start rounded-sm gap-5 max-w-7xl mx-auto">
      {/* Map through the docuuments */}
      {documentsSnapShot.docs.map((doc) => {
        const { name, size, downloadURL } = doc.data();
        return (
          <Document
            key={doc.id}
            id={doc.id}
            name={name}
            size={size}
            downloadURL={downloadURL}
          />
        );
      })}
      {/* Placeholder Document*/}
      <PlaceHolder />
    </div>
  );
}

export default Documents;
