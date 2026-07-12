import * as React from 'react';
import { Heart, HeartHandshake, Recycle } from 'lucide-react';
import { motion } from 'motion/react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface Section {
  title: string;
  description: string;
}

const sections: Array<Section> = [
  {
    title: 'Con el Huemul en mente',
    description:
      'Nuestros productos son diseñados por nosotros mismos y su objetivo es acercar tu pertenencia a la comunidad en tu vida diaria.',
  },
  {
    title: 'De la comunidad para la comunidad',
    description:
      'Tu compra nos ayuda a mantener las iniciativas que desarrollamos y queremos realizar en el futuro.',
  },
  {
    title: 'Algo que usaríamos',
    description:
      'Nos interesa reducir el impacto negativo de lo que generamos, por lo que solo vendemos productos que creemos sirven un propósito y nosotros mismos usaríamos.',
  },
];

const iconBySection = (index: number): React.ReactNode | null => {
  switch (index) {
    case 0:
      return <Heart className="h-5 w-5 text-white" />;
    case 1:
      return <HeartHandshake className="h-5 w-5 text-white" />;
    case 2:
      return <Recycle className="h-5 w-5 text-white" />;
    default:
      return null;
  }
};

// Variants reutilizables
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, x: -18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, bounce: 0.3, duration: 0.5 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, bounce: 0.25, duration: 0.5 },
  },
};

export function InfoModal({ open, onOpenChange }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[500px] overflow-y-auto bg-white/90 backdrop-blur-md border-brand-secondary/20">
        <DialogHeader>
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <DialogTitle className="font-mono text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Sobre la Tienda devsChile™
            </DialogTitle>
          </motion.div>
        </DialogHeader>

        <hr className="border-brand-secondary/10" />

        {/* Mobile */}
        <div className="md:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5, delay: 0.1 }}
            className="aspect-video w-full bg-gradient-to-br from-brand-secondary/20 to-brand-primary/20 rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src="/assets/images/default.svg"
              alt="Tienda devsChile™"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div className="space-y-4" initial="hidden" animate="visible" variants={container}>
            {sections.map((section, index) => (
              <motion.div key={index} variants={item} className="flex items-start space-x-3">
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                  {iconBySection(index)}
                </div>
                <div>
                  <h4 className="font-mono font-bold text-devs-text mb-1">{section.title}</h4>
                  <p className="text-devs-text/70 text-sm leading-relaxed">{section.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="text-devs-text p-6 rounded-xl shadow-lg"
          >
            <p className="text-center font-bold text-lg">
              ¡Gracias por apoyar a la comunidad devsChile™! 🦌
            </p>
          </motion.div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex md:gap-8">
          <div className="flex-1 space-y-4">
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={container}
            >
              {sections.map((section, index) => (
                <motion.div key={index} variants={item} className="flex items-start space-x-3">
                  <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                    {iconBySection(index)}
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-devs-text mb-1">{section.title}</h4>
                    <p className="text-devs-text/70 text-sm leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="text-devs-text p-6 rounded-xl mt-6"
            >
              <p className="text-center font-bold text-lg">
                ¡Gracias por apoyar a la comunidad devsChile™! 🦌
              </p>
            </motion.div>
          </div>

          {/* Imagen derecha — entra desde la derecha */}
          <motion.div
            className="w-80 flex-shrink-0"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.6, delay: 0.2 }}
          >
            <div className="aspect-square w-full bg-gradient-to-br from-brand-secondary/20 to-brand-primary/20 rounded-xl overflow-hidden shadow-lg">
              <img
                src="/public/devschile.jpg"
                alt="Tienda devsChile™"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
