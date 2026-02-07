"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { CHAIN_IDS, USE_TESTNET_ONLY } from '@/web3/chains';
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
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface UserProfile {
  id: string;
  address: string;
  email: string;
  safe_wallet_address_testnet: string | null;
  safe_wallet_address_mainnet: string | null;
  safe_wallet_address_eth_sepolia: string | null;
}

export function UserMenu() {
  const { user, logout } = usePrivy();
  const { wallet: embeddedWallet, chainId } = usePrivyWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getPrivyAccessToken } = usePrivyWallet();

  // Network configurations
  const currentChainId = chainId;

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

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getPrivyAccessToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS.ME), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProfile(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, [getPrivyAccessToken]);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  // Early return AFTER all hooks
  if (!email) return null;

  const handleNetworkSwitch = async (targetChainId: number) => {
    try {
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }

      if (currentChainId === targetChainId) return;

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
                <div className="w-full items-center justify-between px-3 py-2 bg-white/10 rounded-lg text-sm text-white/70 truncate">
                  {email}
                </div>
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
            <div className="px-4 py-2 flex items-center gap-2">
              <BiLink className="shrink-0 w-4 h-4 text-white/30" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Networks</span>
            </div>

            {/* Arbitrum One */}
            {!USE_TESTNET_ONLY && (
              <div className="w-full px-4 py-2 space-y-1">
                <div className="flex items-center gap-3 text-sm font-medium text-white/70">
                  <span className="flex-1">Arbitrum One</span>
                  <Switch
                    checked={currentChainId === CHAIN_IDS.ARBITRUM_MAINNET}
                    onCheckedChange={() => handleNetworkSwitch(CHAIN_IDS.ARBITRUM_MAINNET)}
                    gradient={gradient}
                  />
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <div className="text-[10px] font-mono text-white/30 truncate flex-1">
                    {profile?.safe_wallet_address_mainnet ? (
                      <span className="flex items-center gap-1">
                        <HiOutlineShieldCheck className="w-3 h-3 text-white/20" />
                        {profile.safe_wallet_address_mainnet}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 opacity-50">
                        <HiOutlineShieldCheck className="w-3 h-3" />
                        -
                      </span>
                    )}
                  </div>
                  {profile?.safe_wallet_address_mainnet && (
                    <CopyButton text={profile.safe_wallet_address_mainnet} size="sm" />
                  )}
                </div>
              </div>
            )}

            {/* Arbitrum Sepolia */}
            <div className="w-full px-4 py-2 space-y-1">
              <div className="flex items-center gap-3 text-sm font-medium text-white/70">
                <span className="flex-1">Arbitrum Sepolia</span>
                <Switch
                  checked={currentChainId === CHAIN_IDS.ARBITRUM_SEPOLIA}
                  onCheckedChange={() => handleNetworkSwitch(CHAIN_IDS.ARBITRUM_SEPOLIA)}
                  gradient={gradient}
                />
              </div>
              <div className="flex items-center gap-2 pl-1">
                <div className="text-[10px] font-mono text-white/30 truncate flex-1">
                  {profile?.safe_wallet_address_testnet ? (
                    <span className="flex items-center gap-1">
                      <HiOutlineShieldCheck className="w-3 h-3 text-white/20" />
                      {profile.safe_wallet_address_testnet}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 opacity-50">
                      <HiOutlineShieldCheck className="w-3 h-3" />
                      -
                    </span>
                  )}
                </div>
                {profile?.safe_wallet_address_testnet && (
                  <CopyButton text={profile.safe_wallet_address_testnet} size="sm" />
                )}
              </div>
            </div>

            {/* Ethereum Sepolia */}
            <div className="w-full px-4 py-2 space-y-1">
              <div className="flex items-center gap-3 text-sm font-medium text-white/70">
                <span className="flex-1">Ethereum Sepolia</span>
                <Switch
                  checked={currentChainId === CHAIN_IDS.ETHEREUM_SEPOLIA}
                  onCheckedChange={() => handleNetworkSwitch(CHAIN_IDS.ETHEREUM_SEPOLIA)}
                  gradient={gradient}
                />
              </div>
              <div className="flex items-center gap-2 pl-1">
                <div className="text-[10px] font-mono text-white/30 truncate flex-1">
                  {profile?.safe_wallet_address_eth_sepolia ? (
                    <span className="flex items-center gap-1">
                      <HiOutlineShieldCheck className="w-3 h-3 text-white/20" />
                      {profile.safe_wallet_address_eth_sepolia}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 opacity-50">
                      <HiOutlineShieldCheck className="w-3 h-3" />
                      -
                    </span>
                  )}
                </div>
                {profile?.safe_wallet_address_eth_sepolia && (
                  <CopyButton text={profile.safe_wallet_address_eth_sepolia} size="sm" />
                )}
              </div>
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