// Modal de información mejorado
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, HeartHandshake, Recycle, Scissors, Sparkles } from 'lucide-react';

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections: Array<{ title: string; description: string }> = [
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

export function InfoModal({ open, onOpenChange }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[500px] overflow-y-auto bg-gradient-to-br bg-white backdrop-blur-md border-brand-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Sobre la Tienda devsChile
          </DialogTitle>
        </DialogHeader>

        {/* Mobile layout - stacked */}
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
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                  {index === 0 && <Heart className="h-5 w-5 text-white" />}
                  {index === 1 && <HeartHandshake className="h-5 w-5 text-white" />}
                  {index === 2 && <Recycle className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-brand-text mb-1">{section.title}</h4>
                  <p className="text-brand-text/70 text-sm leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-6 rounded-xl shadow-lg">
            <p className="text-center font-bold text-lg">
              ¡Gracias por apoyar a la comunidad devsChile! 🦌
            </p>
          </div>
        </div>

        {/* Desktop layout - side by side */}
        <div className="hidden md:flex md:gap-8">
          {/* Left column - Text content */}
          <div className="flex-1 space-y-4">
            {sections.map((section, index) => (
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                  {index === 0 && <Heart className="h-5 w-5 text-white" />}
                  {index === 1 && <HeartHandshake className="h-5 w-5 text-white" />}
                  {index === 2 && <Recycle className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-brand-text mb-1">{section.title}</h4>
                  <p className="text-brand-text/70 text-sm leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-6 rounded-xl shadow-lg mt-6">
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
