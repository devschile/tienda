import * as React from 'react';
import { Heart, HeartHandshake, Recycle } from 'lucide-react';

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
    title: 'Con el huemul en mente',
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

export function InfoModal({ open, onOpenChange }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[500px] overflow-y-auto bg-white/80 backdrop-blur-md border-brand-secondary/20">
        <DialogHeader>
          <DialogTitle className="font-mono text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Sobre la Tienda devsChile
          </DialogTitle>
        </DialogHeader>

        <div className="md:hidden space-y-6">
          <div className="aspect-video w-full bg-gradient-to-br from-brand-secondary/20 to-brand-primary/20 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/assets/images/default.svg"
              alt="Tienda devsChile"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                  {iconBySection(index)}
                </div>
                <div>
                  <h4 className="font-mono font-bold text-devs-text mb-1">{section.title}</h4>
                  <p className="text-devs-text/70 text-sm leading-relaxed">{section.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-devs-text p-6 rounded-xl shadow-lg">
            <p className="text-center font-bold text-lg">
              ¡Gracias por apoyar a la comunidad devsChile! 🦌
            </p>
          </div>
        </div>

        <div className="hidden md:flex md:gap-8">
          <div className="flex-1 space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                  {iconBySection(index)}
                </div>
                <div>
                  <h4 className="font-mono font-bold text-devs-text mb-1">{section.title}</h4>
                  <p className="text-devs-text/70 text-sm leading-relaxed">{section.description}</p>
                </div>
              </div>
            ))}
            <div className="text-devs-text p-6 rounded-xl mt-6">
              <p className="text-center font-bold text-lg">
                ¡Gracias por apoyar a la comunidad devsChile! 🦌
              </p>
            </div>
          </div>

          {/* Right column - Image */}
          <div className="w-80 flex-shrink-0">
            <div className="aspect-square w-full bg-gradient-to-br from-brand-secondary/20 to-brand-primary/20 rounded-xl overflow-hidden shadow-lg">
              <img
                src="/assets/images/default.svg"
                alt="Tienda devsChile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
