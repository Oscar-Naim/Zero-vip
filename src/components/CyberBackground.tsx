'use client';

import React from 'react';

export default function CyberBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dark Void Base */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Cybernetic Grid Mesh */}
      <div className="absolute inset-0 bg-cyber-grid opacity-35" />

      {/* Cyan Glow - Top Center */}
      <div className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00D9FF] opacity-[0.07] blur-[140px] rounded-full" />

      {/* Electric Blue Glow - Left */}
      <div className="absolute top-[25%] -left-[100px] w-[500px] h-[500px] bg-[#2563FF] opacity-[0.05] blur-[150px] rounded-full" />

      {/* AI Purple Glow - Right Bottom */}
      <div className="absolute bottom-[10%] -right-[150px] w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.06] blur-[160px] rounded-full" />

      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#0e1526,transparent)] opacity-40" />
    </div>
  );
}
