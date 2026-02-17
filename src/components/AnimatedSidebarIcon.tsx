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
    hover: { rotate: [0, -10, 10, -5, 5, 0] },
    transition: { duration: 0.5 },
  },
  PieChart: {
    hover: { rotate: [0, 360] },
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  Tag: {
    hover: { rotate: [0, -20, 20, -10, 0] },
    transition: { duration: 0.45 },
  },
  CreditCard: {
    hover: { x: [0, 3, -3, 2, -2, 0] },
    transition: { duration: 0.4 },
  },
  Bell: {
    hover: { rotate: [0, 14, -14, 10, -10, 4, -4, 0] },
    transition: { duration: 0.6 },
  },
  Settings: {
    hover: { rotate: [0, 180] },
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  Wallet: {
    hover: { y: [0, -2, 0, -1, 0] },
    transition: { duration: 0.4 },
  },
  AlertTriangle: {
    hover: { x: [0, -2, 2, -2, 2, 0] },
    transition: { duration: 0.4 },
  },
  ListChecks: {
    hover: { x: [0, 2, 0, 1, 0] },
    transition: { duration: 0.35 },
  },
  Target: {
    hover: { rotate: [0, 90] },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  Gauge: {
    hover: { rotate: [0, -25, 25, -15, 0] },
    transition: { duration: 0.5 },
  },
  Upload: {
    hover: { y: [0, -4, 0, -2, 0] },
    transition: { duration: 0.4 },
  },
  Download: {
    hover: { y: [0, 4, 0, 2, 0] },
    transition: { duration: 0.4 },
  },
  CloudCog: {
    hover: { rotate: [0, 15, -15, 10, -10, 0] },
    transition: { duration: 0.5 },
  },
  FolderOpen: {
    hover: { rotateX: [0, -25, 0] },
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
  HelpCircle: {
    hover: { rotate: [0, 20, -20, 10, 0] },
    transition: { duration: 0.45 },
  },
  ShieldCheck: {
    hover: { y: [0, -3, 0] },
    transition: { duration: 0.35 },
  },
};

const defaultAnimation = {
  hover: { rotate: [0, -10, 10, 0] },
  transition: { duration: 0.4 },
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
