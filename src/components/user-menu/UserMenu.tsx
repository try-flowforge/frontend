"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePrivy, useLinkAccount, useCreateWallet, useWallets } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useEnsSubdomain } from '@/hooks/useEnsSubdomain';
import { getAllChains, ChainInfo, getChain } from '@/web3/config/chain-registry';
import { Avatar } from './Avatar';
import { ClaimEnsSubdomainModal } from '../ens/ClaimEnsSubdomainModal';
import { Switch } from './Switch';
import { CopyButton } from '../ui/CopyButton';
import { generateAvatarGradient } from './avatar-generator';
import {
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { BiLinkExternal } from 'react-icons/bi';
import { LuLogOut } from 'react-icons/lu';
import { TbLayoutGrid, TbWorld } from 'react-icons/tb';
import { FaEye } from "react-icons/fa6";
// import { TfiCreditCard } from 'react-icons/tfi';
import { BiLink } from "react-icons/bi";
import { FaWallet, FaPlus } from "react-icons/fa";
import { Button } from '../ui/Button';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface UserProfile {
  id: string;
  address: string;
  email: string;
  safe_wallets?: Record<string, string>;
  remaining_sponsored_txs?: number;
}

export function UserMenu() {
  const { user, logout } = usePrivy();
  const { wallet: embeddedWallet, chainId, walletAddress, getPrivyAccessToken } = usePrivyWallet();
  const { wallets = [], ready: walletsReady } = useWallets();
  const { linkWallet } = useLinkAccount({ onSuccess: () => setIsOpen(false) });
  const { createWallet } = useCreateWallet();

  const hasLinkedWallet = (wallets as { linked?: boolean; walletClientType?: string }[]).filter(
    (w) => w.linked || w.walletClientType === 'privy'
  ).length > 0;
  const { subdomains, listSubdomains, loading: ensLoading } = useEnsSubdomain();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claimEnsOpen, setClaimEnsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Network configurations
  const currentInternalId = getChain(chainId)?.id;

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

  // Only fetch profile and subdomains when user has a linked wallet (backend returns 401 otherwise)
  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchProfile();
      getPrivyAccessToken().then((token) => {
        if (token) listSubdomains(token);
      });
    }
  }, [isOpen, walletAddress, fetchProfile, getPrivyAccessToken, listSubdomains]);

  // Early return AFTER all hooks
  if (!email) return null;

  const handleNetworkSwitch = async (identifier: string | number) => {
    try {
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }

      const targetChain = getChain(identifier);
      if (!targetChain) return;

      if (currentInternalId === targetChain.id) return;

      await embeddedWallet.switchChain(targetChain.chainId);
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
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
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
                {/* Connect wallet when none linked */}
                {!hasLinkedWallet && (
                  <div className="w-full space-y-2 pt-1">
                    <p className="text-xs text-amber-400/90">No wallet linked. Connect one to use Safe and workflows.</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => { linkWallet(); setIsOpen(false); }}
                        disabled={!walletsReady}
                        className="flex-1 gap-2 text-sm"
                      >
                        <FaWallet className="w-3.5 h-3.5" />
                        Connect wallet
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            await createWallet();
                            setIsOpen(false);
                          } catch { /* no-op */ }
                        }}
                        disabled={!walletsReady}
                        className="flex-1 gap-2 text-sm bg-transparent hover:bg-white/5"
                      >
                        <FaPlus className="w-3.5 h-3.5" />
                        Create wallet
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ENS subdomains & Claim */}
          <div className="py-2 border-t border-white/20">
            <div className="px-4 py-2 flex items-center gap-2">
              <TbWorld className="shrink-0 w-4 h-4 text-white/30" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">ENS</span>
            </div>
            {ensLoading ? (
              <div className="px-4 py-2 text-xs text-white/50">Loading…</div>
            ) : subdomains.length > 0 ? (
              <div className="px-4 py-2 space-y-1">
                {subdomains.slice(0, 3).map((s) => (
                  <div key={s.id} className="text-xs text-white/70 truncate" title={s.ens_name}>
                    {s.active ? (
                      <span className="text-green-400/90">{s.ens_name}</span>
                    ) : (
                      <span className="text-white/50">{s.ens_name} (expired)</span>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="px-2 pt-1">
              <Button
                onClick={() => { setClaimEnsOpen(true); setIsOpen(false); }}
                className="w-full text-sm"
              >
                Claim subdomain
              </Button>
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

            {/* Dynamic Network Selector */}
            {getAllChains().map((chain: ChainInfo) => {
              const safeAddress = profile?.safe_wallets?.[String(chain.chainId)];

              return (
                <div key={chain.id} className="w-full px-4 py-2 space-y-1">
                  <div className="flex items-center gap-3 text-sm font-medium text-white/70">
                    <span className="flex-1">{chain.name}</span>
                    <Switch
                      checked={currentInternalId === chain.id}
                      onCheckedChange={(checked) => {
                        if (checked) handleNetworkSwitch(chain.id);
                      }}
                      gradient={gradient}
                    />
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <div className="text-[10px] font-mono text-white/30 truncate flex-1">
                      {safeAddress ? (
                        <span className="flex items-center gap-1">
                          <HiOutlineShieldCheck className="w-3 h-3 text-white/20" />
                          {safeAddress}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 opacity-50">
                          <HiOutlineShieldCheck className="w-3 h-3" />
                          -
                        </span>
                      )}
                    </div>
                    {safeAddress && (
                      <CopyButton text={safeAddress} size="sm" />
                    )}
                  </div>
                </div>
              );
            })}
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
        </div >
      )
      }

      <ClaimEnsSubdomainModal
        open={claimEnsOpen}
        onClose={() => setClaimEnsOpen(false)}
        onSuccess={() => {
          getPrivyAccessToken().then((token) => {
            if (token) listSubdomains(token);
          });
          fetchProfile();
        }}
      />
    </div >
  );
}