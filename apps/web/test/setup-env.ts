import { testDatabaseUrls } from './test-db';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrls().test,
  JWT_ACCESS_SECRET: 'secreto-de-pruebas-con-mas-de-32-caracteres-123',
  RATE_LIMIT_DISABLED: 'true',
  APP_URL: 'http://localhost:3000',
});
