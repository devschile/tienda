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
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-md border-orange-100">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
            Sobre Amigurumis de Inés
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="aspect-video w-full bg-gradient-to-br from-orange-100 to-rose-100 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/assets/images/default.svg"
              alt="Amigurumis de Inés"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-2 rounded-lg flex-shrink-0">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Hecho con Amor</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Cada pieza es creada con amor y dedicación. Mis amigurumis son únicos y especiales, 
                  perfectos para regalar o decorar tu hogar con calidez.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-2 rounded-lg flex-shrink-0">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Técnica Artesanal</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Utilizo técnicas tradicionales de crochet con materiales de alta calidad 
                  para garantizar productos duraderos y hermosos que perdurarán en el tiempo.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-2 rounded-lg flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Piezas Únicas</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Cada creación tiene pequeñas variaciones que la hacen única. 
                  No encontrarás dos amigurumis exactamente iguales, ¡eso es parte de su magia!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white p-6 rounded-xl shadow-lg">
            <p className="text-center font-bold text-lg">
              ¡Gracias por apoyar el arte hecho a mano! 💕
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
