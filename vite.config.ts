import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Radio stream has no CORS headers, so Web Audio's AnalyserNode would get
// tainted (silent) data if we hit it cross-origin. We proxy it through the
// dev server to make it same-origin. In production, put an equivalent proxy
// (e.g. a Cloudflare Worker) in front and point STREAM_PATH at it.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/stream': {
        target: 'https://0nlineradio.radioho.st',
        changeOrigin: true,
        secure: true,
        // The entry endpoint 302-redirects to a rotating, signed stream host
        // that sends NO CORS headers. Follow the redirect server-side so the
        // browser only ever talks to same-origin localhost -> analyser data
        // stays untainted.
        followRedirects: true,
        rewrite: (path) =>
          path.replace(
            /^\/stream/,
            '/lounge-ibiza-chillout-lounge?ref=rb26',
          ),
      },
    },
  },
});
