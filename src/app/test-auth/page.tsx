"use client";

import { initiateCozeAuth } from "@/lib/coze";

export default function TestAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-6">Coze 授权测试</h1>
        <button
          onClick={() => initiateCozeAuth()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          开始 Coze 授权
        </button>
      </div>
    </div>
  );
} 