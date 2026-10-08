import { User as Auth0UserModel } from '@auth0/auth0-spa-js';

import { getData, setData } from '@/utils';
import { type AuthModel } from './_models';

const AUTH_LOCAL_STORAGE_KEY = `${import.meta.env.VITE_APP_NAME}-auth-v${
  import.meta.env.VITE_APP_VERSION
}`;

const getAuth = (): AuthModel | undefined => {
  try {
    const auth = getData(AUTH_LOCAL_STORAGE_KEY) as AuthModel | undefined;

    if (auth) {
      return auth;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('AUTH LOCAL STORAGE PARSE ERROR', error);
  }
};

const setAuth = (auth: AuthModel | Auth0UserModel) => {
  setData(AUTH_LOCAL_STORAGE_KEY, auth);
};

const removeAuth = () => {
  if (!localStorage) {
    return;
  }

  try {
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('AUTH LOCAL STORAGE REMOVE ERROR', error);
  }
};

export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = 'application/json';
  
  // Request Interceptor
  axios.interceptors.request.use(
    (config: any) => {
      const auth = getAuth();

      if (auth?.access_token) {
        config.headers.Authorization = `Bearer ${auth.access_token}`;
      }

      // Store start time for duration calculation
      config.metadata = { startTime: new Date() };

      return config;
    },
    async (err: any) => await Promise.reject(err)
  );

  // Response Interceptor for Logging
  axios.interceptors.response.use(
    (response: any) => {
      const { config, status } = response;
      const method = config.method?.toUpperCase();
      const url = config.url;
      const duration = new Date().getTime() - config.metadata.startTime.getTime();
      const payload = config.data ? `\\nPayload: ${config.data}` : '';

      console.log(
        `[API] ${method} ${url} ${status} [${duration}ms]${payload}`
      );
      
      return response;
    },
    (error: any) => {
      const config = error.config;
      if (config) {
        const method = config.method?.toUpperCase();
        const url = config.url;
        const duration = new Date().getTime() - config.metadata?.startTime?.getTime() || 0;
        const status = error.response?.status || 'ERR';
        const payload = config.data ? `\\nPayload: ${config.data}` : '';

        console.error(
          `[API Error] ${method} ${url} ${status} [${duration}ms]${payload}`,
          error.response?.data || error.message
        );
      } else {
        console.error('[API Error]', error);
      }
      return Promise.reject(error);
    }
  );
}

export { AUTH_LOCAL_STORAGE_KEY, getAuth, removeAuth, setAuth };
