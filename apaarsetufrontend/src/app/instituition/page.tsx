
"use client";

import React from "react";
import { useRouter } from "next/navigation";

const roles = [

  { name: "INSTITUITION ADMIN", path: "/institution-login-admin" },
  { name: "INSTITUITION OPERATOR", path: "/institution-login-operator" }
];

export default function OfficialsLogin() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-100 to-white p-6">
      <div className="w-full max-w-7xl rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-3 text-center text-3xl font-bold text-green-900">
          Officials Login
        </h1>

        <p className="mb-10 text-center text-gray-600">
          Select your role to continue
        </p>

        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4">
          {roles.map((role) => (
            <button
              key={role.name}
              type="button"
              onClick={() => router.push(role.path)}
              className="flex min-h-40 min-w-[190px] flex-1 flex-col items-center justify-center rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-100 to-white p-5 text-center font-semibold text-green-900 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="mb-3 text-3xl">👤</span>
              <span className="break-words text-sm">
                {role.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}