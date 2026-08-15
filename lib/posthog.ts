import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_POSTHOG_KEY;
const apiHost = import.meta.env.VITE_POSTHOG_HOST;
const isProduction = import.meta.env.PROD;

if (apiKey && apiHost) {
  const initializedPosthog = posthog.init(apiKey, {
    api_host: apiHost,
  });

  // Este proyecto de PostHog es compartido con otros sitios de devsChile (ej. pegas).
  // Se etiqueta cada evento con site='tienda' para poder filtrar sin depender de $host.
  initializedPosthog.register({ site: 'tienda' });

  initializedPosthog.startExceptionAutocapture({
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: false,
  });
} else if (!isProduction) {
  const missingVariable = apiKey ? 'VITE_POSTHOG_HOST' : 'VITE_POSTHOG_KEY';
  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

export default posthog;
