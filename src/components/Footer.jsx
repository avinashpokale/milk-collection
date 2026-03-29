import React from 'react';
import { MessageCircle, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const myName = "AVINASH POKALE";
  const whatsappNumber = "+919762515501";

  return (
    <footer className="fixed bottom-0 w-full bg-zinc-950 border-t border-zinc-900 py-1.5 px-3 no-print z-[90]">
      <div className="max-w-7xl mx-auto flex flex-row justify-between items-center text-[8px] md:text-[9px] font-black uppercase tracking-tighter">
        
        {/* Left: Rights Reserved */}
        <div className="text-zinc-500 whitespace-nowrap">
          © {currentYear} ALL RIGHTS RESERVED
        </div>

        {/* Center: Created By */}
        <div className="flex items-center gap-1 text-white whitespace-nowrap px-1">
          <span className="text-zinc-600 hidden sm:inline">CREATED BY</span>
          <span className="text-blue-500">{myName}</span>
          <Heart size={8} className="fill-red-500 text-red-500 animate-pulse" />
        </div>

        {/* Right: WhatsApp Link */}
        <div className="flex items-center">
          <a 
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-zinc-400 hover:text-green-500 transition-colors"
          >
            <MessageCircle size={10} />
            <span className="uppercase">HELP</span>
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;