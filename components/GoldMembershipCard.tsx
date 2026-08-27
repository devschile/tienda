import { motion } from 'motion/react';
import { Crown, ExternalLink } from 'lucide-react';

import { SOY_URL } from '@/actions/soyAuth';
import posthog from '@/lib/posthog';

const GOLD_URL = `${SOY_URL}/gold`;

export function GoldMembershipCard() {
  return (
    <motion.a
      href={GOLD_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => posthog.capture('gold_membership_card_clicked')}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
      className="group mb-8 flex flex-col gap-2 rounded-2xl border border-brand-accent/40 bg-gradient-to-r from-brand-surface via-brand-surface/90 to-brand-accent/20 px-5 py-4 shadow-sm transition-all hover:border-brand-accent/70 hover:shadow-md sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Crown className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-devs-text">membresía gold devsChile</p>
          <p className="truncate text-xs text-devs-muted">
            Ayúdanos a mantener nuestros bots y comunidad.
          </p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-brand-secondary/30 bg-white/60 px-3 py-1.5 text-xs font-semibold text-brand-secondary transition-colors group-hover:bg-brand-secondary/5 sm:self-auto">
        Ver beneficios
        <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </motion.a>
  );
}
