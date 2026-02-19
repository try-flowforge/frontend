"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { BiLogInCircle, BiRocket } from "react-icons/bi";
import { UserMenu } from "../user-menu/UserMenu";
import { Button } from "../ui/Button";
import { OnboardingProgressIndicator } from "@/onboarding/components/OnboardingProgressIndicator";
import Image from "next/image";
import logo from "@/assets/logo.svg";

export default function NavBar() {
  const { ready, authenticated, login } = usePrivy();
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Show navbar only when in hero section (first viewport)
      setIsVisible(scrollY < viewportHeight);
      setScrolled(scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 w-[90%] mx-auto py-10 flex items-center justify-between transition-all duration-300 ${scrolled ? " " : "bg-transparent"
        } ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {/* Logo - Left Side */}
      <Link href="/">
        <div className="w-30 sm:w-30 h-max">
          <Image
            src={logo}
            alt="Logo"
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </div>
      </Link>

      {/* Right Side - Navigation & Button */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Agent Onboarding */}
        <Link href="/agent-onboarding" className="hidden sm:block">
          <Button border borderColor="#fb923c">
            Agent
          </Button>
        </Link>

        {/* Start Creating Button */}
        <Link href="/automation-builder" className="hidden sm:block">
          <Button>
            <BiRocket className="w-4 h-4" />
            Start Creating
          </Button>
        </Link>

        {/* Login/Auth Button */}
        {ready && (
          <>
            {authenticated ? (
              <div className="flex items-center gap-3">
                <OnboardingProgressIndicator />
                <UserMenu />
              </div>
            ) : (
              <Button onClick={() => login({ loginMethods: ['email'] })}>
                <BiLogInCircle className="w-4 h-4" />
                <span>Sign In</span>
              </Button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
