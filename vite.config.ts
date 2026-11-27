import { env as processEnv } from 'node:process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = (name: string) =>
    JSON.stringify(processEnv[name] ?? fileEnv[name] ?? '');

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'REACT_APP_', 'API_BASE_URL'],
    define: {
      'process.env.API_BASE_URL': apiBaseUrl('API_BASE_URL'),
      'process.env.VITE_API_BASE_URL': apiBaseUrl('VITE_API_BASE_URL'),
      'process.env.REACT_APP_API_BASE_URL': apiBaseUrl('REACT_APP_API_BASE_URL'),
    },
    server: {
      host: processEnv.HOST || '127.0.0.1',
      port: Number(processEnv.PORT) || 5173,
    },
  };
});
