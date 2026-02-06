"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useSafeWalletContext } from '@/context/SafeWalletContext';
import { isTestnet, getTargetChainId } from '@/web3/chains';
import { Avatar } from './Avatar';
import { Switch } from './Switch';
import { CopyButton } from '../ui/CopyButton';
import { generateAvatarGradient } from './avatar-generator';
import {
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { BiLinkExternal } from 'react-icons/bi';
import { LuLogOut } from 'react-icons/lu';
import { TbLayoutGrid } from 'react-icons/tb';
import { FaEye } from "react-icons/fa6";
// import { TfiCreditCard } from 'react-icons/tfi';
import { BiLink } from "react-icons/bi";
import { Button } from '../ui/Button';

export function UserMenu() {
  const { user, logout } = usePrivy();
  const { wallet: embeddedWallet, chainId } = usePrivyWallet();
  const { selection } = useSafeWalletContext();
  // Safely get safe address - wait for loading to complete and ensure array has items
  const safeAddress = selection.isLoading
    ? null
    : (selection.selectedSafe || (selection.safeWallets?.length > 0 ? selection.safeWallets[0] : null) || null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Network configurations
  const currentChainId = chainId;
  const isTestnetMode = isTestnet(currentChainId);

  // Get email (may be undefined)
  const email = user?.email?.address;

  // Generate gradient (use fallback if no email)
  const gradient = email ? generateAvatarGradient(email) : 'linear-gradient(135deg, #6366f1, #a855f7)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Early return AFTER all hooks
  if (!email) return null;

  const handleTestnetToggle = async (checked: boolean) => {
    try {
      const targetChainId = getTargetChainId(checked);

      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }

      await embeddedWallet.switchChain(targetChainId);
    } catch {
      // console.error('Failed to switch chain:', error);
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-full transition-all duration-300 group cursor-pointer"
      >
        <Avatar email={email} gradient={gradient} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-white/20">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar email={email} gradient={gradient} style={{ width: '5rem', height: '5rem', fontSize: '1.25rem' }} />
                <div className="absolute -bottom-1 -right-1 bg-amber-600 p-1.5 rounded-full border-4 border-black">
                  <HiOutlineShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Email & Wallet Info */}
              <div className="w-full space-y-2">
                {/* Email Row */}
                <div className="w-full items-center justify-between px-2 py-2 bg-white/10 rounded-lg text-sm text-white/70 truncate">
                  {email}
                </div>

                {/* Safe Wallet Row */}
                {embeddedWallet?.address && safeAddress && (
                  <div className="w-full flex items-center gap-2 text-sm text-white/70">
                    <div className="flex-1 px-2 py-2 font-mono truncate bg-white/10 rounded-lg">
                      {safeAddress.slice(0, 6)}...{safeAddress.slice(-4)}
                    </div>
                    <div className="px-2 py-1.5 flex items-center justify-center bg-white/10 rounded-lg">
                      <CopyButton text={safeAddress} size="md" />
                    </div>
                  </div>
                )}
              </div>

              {/* Get a Plan Button */}
              {/* <Button
                onClick={() => { }}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  Get a plan
                </span>
              </Button> */}
            </div>
          </div>

          {/* Plan & Billing */}
          {/* <div className="py-2">
            <button
              onClick={() => { }}
              className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-200 text-left cursor-pointer text-white/70 hover:text-white hover:translate-x-1"
            >
              <TfiCreditCard className="shrink-0 w-5 h-5" />
              <span className="flex-1">Plan & billing</span>
              <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/50">Free</span>
              <BiLinkExternal className="w-4 h-4" />
            </button>
          </div> */}

          {/* Divider */}
          <div className="border-t border-white/20" />

          {/* Network Selector */}
          <div className="py-2">
            <div className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-white/70">
              <BiLink className="shrink-0 w-5 h-5" />
              <span className="flex-1">Network</span>
              <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/50">
                {isTestnetMode ? 'Arbitrum Sepolia' : 'Arbitrum One'}
              </span>
              <Switch
                checked={isTestnetMode}
                onCheckedChange={handleTestnetToggle}
                disabled={false}
                gradient={gradient}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20" />

          {/* Navigation Items */}
          <div className="py-2">
            <Link
              href="/workflows"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-200 text-left cursor-pointer text-white/70 hover:text-white hover:bg-amber-800/10 hover:translate-x-1"
            >
              <TbLayoutGrid className="shrink-0 w-5 h-5" />
              <span className="flex-1">My Workflows</span>
              <BiLinkExternal className="w-4 h-4" />
            </Link>
            <Link
              href="/public-workflows"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-200 text-left cursor-pointer text-white/70 hover:text-white hover:bg-amber-800/10 hover:translate-x-1"
            >
              <FaEye className="shrink-0 w-5 h-5" />
              <span className="flex-1">Public Workflows</span>
              <BiLinkExternal className="w-4 h-4" />
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20" />

          {/* Footer Actions */}
          <div className="p-2">
            <Button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              variant="delete"
              border
              className="w-full"
            >
              <LuLogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}