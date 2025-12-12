"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
export default function NotFound() {
  return (
    <div className="flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Details Card */}
        <Image
          src="/404.png"
          alt="404 Not Found"
          width={400}
          height={400}
          className="mx-auto mb-0"
        />

        {/* Message */}
        <div className="mb-8">
          <p className="text-lg md:text-xl text-gray-400">
            The page you are looking for does not exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 min-w-[200px]">
              <ArrowLeft className="w-4 h-4" />
              Back to app
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
