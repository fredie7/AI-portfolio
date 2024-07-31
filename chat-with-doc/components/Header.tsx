import { SignedIn, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import UpgradeButton from "./ui/UpgradeButton";
function Header() {
  return (
    <div className="flex justify-between bg-white shadow-sm p-5 border-b">
      <Link href="/dashboard" className="text-2xl">
        Chat to <span className="text-indigo-600">MED-45</span>
      </Link>

      <SignedIn>
        <div className="flex items-center space-x-2">
          <Button asChild variant="link" className="hidden md:flex">
            <Link href="/dashboard/upgrade">Pricing</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/dashboard">My Medical Documents</Link>
          </Button>

          <Button asChild variant="outline" className="border-indigo-600">
            <Link href="/dashboard/upload">
              <FilePlus2 className="text-indigo-600" />
            </Link>
          </Button>

          {/* Upgrade button */}
          <UpgradeButton />
          <UserButton />
        </div>
      </SignedIn>
    </div>
  );
}

export default Header;
