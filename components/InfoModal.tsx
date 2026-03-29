// Modal de información mejorado
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, Scissors, Sparkles } from 'lucide-react';

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoModal({ open, onOpenChange }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[500px] overflow-y-auto bg-gradient-to-br from-white to-brand-secondary/5 backdrop-blur-md border-brand-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Sobre Tienda devsChile
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
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text mb-1">Hecho con Amor</h4>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  [xxx]
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text mb-1">Técnica Artesanal</h4>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  Utilizo técnicas tradicionales de crochet con materiales de alta calidad 
                  para garantizar productos duraderos y hermosos que perdurarán en el tiempo.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text mb-1">Piezas Únicas</h4>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  Cada creación tiene pequeñas variaciones que la hacen única. 
                  No encontrarás dos productos exactamente iguales, ¡eso es parte de su magia!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-6 rounded-xl shadow-lg">
            <p className="text-center font-bold text-lg">
              ¡Gracias por apoyar el arte hecho a mano! 💕
            </p>
          </div>
        </div>
        
        {/* Desktop layout - side by side */}
        <div className="hidden md:flex md:gap-8">
          {/* Left column - Text content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text mb-1">Hecho con Amor</h4>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  Cada pieza es creada con amor y dedicación. Mis productos son únicos y especiales, 
                  perfectos para regalar o decorar tu hogar con calidez.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text mb-1">Técnica Artesanal</h4>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  Utilizo técnicas tradicionales de crochet con materiales de alta calidad 
                  para garantizar productos duraderos y hermosos que perdurarán en el tiempo.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-lg flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text mb-1">Piezas Únicas</h4>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  Cada creación tiene pequeñas variaciones que la hacen única. 
                  No encontrarás dos productos exactamente iguales, ¡eso es parte de su magia!
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-6 rounded-xl shadow-lg mt-6">
              <p className="text-center font-bold text-lg">
                ¡Gracias por apoyar el arte hecho a mano! 💕
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
