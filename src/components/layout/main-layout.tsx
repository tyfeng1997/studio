"use client";

import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return <div className="relative flex-1 overflow-auto">{children}</div>;
}
