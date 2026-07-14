import logo from '@/images/devschile2026.png';

const LAST_UPDATED = '10 de julio de 2026';
const SITE_URL = 'https://tienda.devschile.cl';
const CONTACT_EMAIL = 'huemul@devschile.cl';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-brand-background font-sans">
      {/* Header */}
      <header className="border-b border-brand-secondary/10 py-4 px-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <a href="/" className="flex items-center gap-2 w-fit">
          <img src={logo} alt="devsChile" className="h-8 w-8 object-contain" />
          <span className="font-mono font-bold text-brand-secondary">Tienda devsChile</span>
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-mono text-3xl font-bold text-brand-secondary mb-2">
          Términos y Condiciones
        </h1>
        <p className="text-sm text-devs-muted mb-10">Última actualización: {LAST_UPDATED}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-devs-text">
          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              1. Identificación
            </h2>
            <p className="text-devs-muted leading-relaxed">
              La Tienda devsChile ({SITE_URL}) es operada por la comunidad devsChile, una comunidad
              de desarrolladores de software de Chile. Para consultas puedes contactarnos a{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              2. Productos y precios
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Todos los productos son diseñados y comercializados por la comunidad devsChile. Los
              precios están expresados en Pesos Chilenos (CLP) e incluyen IVA cuando corresponde.
              Nos reservamos el derecho de modificar precios sin previo aviso. El precio vigente al
              momento de confirmar la compra es el que aplica a la transacción.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              3. Proceso de compra
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Al hacer clic en &ldquo;Pagar con MercadoPago&rdquo; aceptas estos Términos y
              Condiciones y declaras que los datos ingresados en el formulario son verídicos. La
              compra se formaliza una vez que MercadoPago confirme el pago exitoso. Recibirás un
              email de confirmación con el resumen de tu pedido.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              4. Medios de pago
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Los pagos se procesan a través de MercadoPago, plataforma certificada PCI DSS.
              Aceptamos tarjetas de crédito y débito, transferencias bancarias y otros medios
              disponibles en MercadoPago para Chile. devsChile no almacena datos de tarjetas.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              5. Envío y entrega
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Los detalles de envío se coordinan directamente con el comprador una vez confirmado el
              pago. Los plazos y costos de despacho se informan al momento de la coordinación. Para
              retiros presenciales o puntos de entrega, se notificará por email.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              6. Cambios y devoluciones
            </h2>
            <p className="text-devs-muted leading-relaxed">
              De acuerdo con la Ley 19.496 de Protección al Consumidor de Chile, tienes derecho a
              retracto dentro de los 10 días hábiles siguientes a la recepción del producto, siempre
              que no haya sido usado y se encuentre en su embalaje original. Para iniciar un cambio
              o devolución, contáctanos a{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              7. Privacidad de datos
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Los datos personales (nombre, email, dirección) se utilizan exclusivamente para
              procesar tu pedido y, si lo autorizaste, enviarte novedades de la tienda. No
              compartimos tus datos con terceros salvo MercadoPago para procesar el pago. Puedes
              solicitar la eliminación de tus datos escribiendo a{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              8. Propiedad intelectual
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Todos los diseños, imágenes y marca de los productos son propiedad de la comunidad
              devsChile. Queda prohibida su reproducción o uso comercial sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-brand-secondary mb-3">
              9. Ley aplicable
            </h2>
            <p className="text-devs-muted leading-relaxed">
              Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa se
              someterá a los tribunales competentes de la ciudad de Santiago.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-secondary/10 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-brand-primary hover:text-brand-secondary transition-colors font-medium"
          >
            ← Volver a la tienda
          </a>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-brand-secondary/10 mt-4">
        <p className="text-xs text-devs-muted">
          © {new Date().getFullYear()} Tienda devsChile · {SITE_URL}
        </p>
      </footer>
    </div>
  );
}
