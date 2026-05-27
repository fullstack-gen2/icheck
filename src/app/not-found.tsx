import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { CompassIcon } from "lucide-react";

/**
 * App-wide 404. Triggered when a route doesn't exist, or when any server
 * component calls `notFound()` from "next/navigation".
 *
 * Kept as a server component so it renders without JS — even broken bundles
 * still show a sensible page.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight">i-Check</span>
        </div>

        {/* Big 404 */}
        <div className="relative inline-flex items-center justify-center mb-3">
          <span className="text-7xl font-black text-[#273C97]/10 select-none">404</span>
          <CompassIcon className="absolute size-10 text-[#273C97]" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col gap-2">
          <Link href="/dashboard">
            <Button className="w-full bg-[#273C97] hover:bg-[#1e2e7a]">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full text-gray-500">
              Back to Sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
