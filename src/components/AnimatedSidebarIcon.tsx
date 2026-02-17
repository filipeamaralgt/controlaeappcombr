import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home, PieChart, Tag, CreditCard, Bell, Settings,
  HelpCircle, Wallet, ShieldCheck, Target, Gauge,
  AlertTriangle, ListChecks, Upload, Download, CloudCog,
  FolderOpen, MessageCircle,
} from 'lucide-react';

type IconComponent = typeof Home;

/** Each icon gets a unique hover animation inspired by Resend's sidebar */
const iconAnimations: Record<string, { hover: Record<string, any>; transition?: Record<string, any> }> = {
  Home: {
    hover: { y: [0, -3, 0] },
    transition: { duration: 0.35, ease: 'easeInOut' },
  },
  MessageCircle: {
    hover: { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] },
    transition: { duration: 0.45 },
  },
  PieChart: {
    hover: { rotate: [0, 90] },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  Tag: {
    hover: { rotate: [0, -15, 15, 0] },
    transition: { duration: 0.4 },
  },
  CreditCard: {
    hover: { x: [0, 3, -3, 0] },
    transition: { duration: 0.35 },
  },
  Bell: {
    hover: { rotate: [0, 12, -12, 8, -8, 0] },
    transition: { duration: 0.5 },
  },
  Settings: {
    hover: { rotate: [0, 180] },
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  Wallet: {
    hover: { y: [0, -2, 0], scale: [1, 1.1, 1] },
    transition: { duration: 0.35 },
  },
  AlertTriangle: {
    hover: { scale: [1, 1.15, 1, 1.1, 1] },
    transition: { duration: 0.4 },
  },
  ListChecks: {
    hover: { x: [0, 2, 0] },
    transition: { duration: 0.3 },
  },
  Target: {
    hover: { scale: [1, 0.85, 1.15, 1] },
    transition: { duration: 0.4 },
  },
  Gauge: {
    hover: { rotate: [0, -20, 20, 0] },
    transition: { duration: 0.4 },
  },
  Upload: {
    hover: { y: [0, -4, 0] },
    transition: { duration: 0.35 },
  },
  Download: {
    hover: { y: [0, 4, 0] },
    transition: { duration: 0.35 },
  },
  CloudCog: {
    hover: { rotate: [0, 15, -15, 0], scale: [1, 1.05, 1] },
    transition: { duration: 0.45 },
  },
  FolderOpen: {
    hover: { scale: [1, 1.15, 1] },
    transition: { duration: 0.3 },
  },
  HelpCircle: {
    hover: { rotate: [0, 15, -15, 0] },
    transition: { duration: 0.4 },
  },
  ShieldCheck: {
    hover: { y: [0, -3, 0], scale: [1, 1.1, 1] },
    transition: { duration: 0.35 },
  },
};

// Default fallback animation
const defaultAnimation = {
  hover: { scale: [1, 1.15, 1] },
  transition: { duration: 0.3 },
};

interface AnimatedSidebarIconProps {
  icon: IconComponent;
  className?: string;
  isHovered?: boolean;
}

export function AnimatedSidebarIcon({ icon: Icon, className, isHovered }: AnimatedSidebarIconProps) {
  const iconName = Icon.displayName || Icon.name || '';
  const anim = iconAnimations[iconName] || defaultAnimation;

  return (
    <motion.div
      className="flex items-center justify-center"
      animate={isHovered ? anim.hover : {}}
      transition={anim.transition}
    >
      <Icon className={className} />
    </motion.div>
  );
}
