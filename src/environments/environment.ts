import { Environment } from './environment.model';
export const environment: Environment = {
  /*  production: false,
  apiOrdenes: 'http://localhost:8081',
  apiAgenda: 'http://localhost:8082',*/

  production: true,
  apiOrdenes: 'https://ordenes-service-production.up.railway.app',
  apiAgenda: 'https://agenda-service-production-196b4c6d.up.railway.app',
};
