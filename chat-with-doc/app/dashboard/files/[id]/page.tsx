import PdfView from "@/components/PdfView";
import Chat from "@/components/ui/Chat";
import { adminDB } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

async function ChatToFilepage({ params: { id } }: { params: { id: string } }) {
  auth().protect();
  const { userId } = await auth();
  const ref = await adminDB
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(id)
    .get();

  const url = ref.data()?.downloadURL;
  return (
    <div className="grid lg:grid-cols-5 h-full overflow-hidden">
      {/* right */}
      <div className="col-span-5 lg:col-span-2 overflow-y-auto">
        {/* chat */}
        <Chat id={id} />
      </div>

      {/* left */}
      <div className="col-span-5 lg:col-span-3 bg-gray-100 border-r-2 lg:border-indigo-600 lg:-order-1 overflow-auto">
        {/* PDFview */}
        <PdfView url={url} />
      </div>
    </div>
  );
}

export default ChatToFilepage;
