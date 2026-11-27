type RuntimeEnvironment = {
  API_BASE_URL?: string;
  REACT_APP_API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
};

const runtimeEnvironment: RuntimeEnvironment =
  typeof process === 'undefined'
    ? {}
    : {
        API_BASE_URL: process.env.API_BASE_URL,
        REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
      };

export function getApiBaseUrl(): string {
  const configuredUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    import.meta.env.API_BASE_URL ||
    runtimeEnvironment.VITE_API_BASE_URL ||
    runtimeEnvironment.REACT_APP_API_BASE_URL ||
    runtimeEnvironment.API_BASE_URL ||
    'http://127.0.0.1:8000';

  return configuredUrl.replace(/\/+$/, '');
}
