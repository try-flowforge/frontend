"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.svg";

export default function LogoOnlyHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Show header only when in hero section (first viewport)
      setIsVisible(scrollY < viewportHeight);
      setScrolled(scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`bg-black fixed top-0 left-0 right-0 z-50 w-[90%] mx-auto py-10 flex items-center justify-start transition-all duration-300 ${
        scrolled ? " " : ""
      } ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <Link href="/" aria-label="Go to home">
        <div className="w-30 sm:w-30 h-max">
          <Image
            src={logo}
            alt="Logo"
            width={100}
            height={100}
            className="w-full h-auto"
            priority
          />
        </div>
      </Link>
    </nav>
  );
}

