"use client";
import { useEffect, useState } from "react";

export interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function AssetModal({ isOpen, onClose, children }: AssetModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 60);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="el-dialog">
      <dialog
        id="asset-dialog"
        aria-labelledby="asset-dialog-title"
        className="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent z-50"
        open={isVisible}
      >
        <div
          className={`el-dialog-backdrop fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        <div className="flex min-h-full items-end justify-center p-4 text-center focus:outline-none sm:items-center sm:p-0">
          <div
            className={`el-dialog-panel relative transform overflow-hidden rounded-lg bg-gray-800 text-left sm:my-8 sm:w-full sm:max-w-2xl ${
              isAnimating
                ? "opacity-100 translate-y-0 sm:scale-100"
                : "opacity-0 translate-y-4 sm:scale-95"
            }`}
          >
            {/* Content */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #0a0118 0%, #0f1020 30%, #1a1b3d 60%, #1e2a5e 100%)",
              }}
              className="px-4 pb-4 sm:p-6"
            >
              {children}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
