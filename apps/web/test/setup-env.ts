import { loadTestEnv } from './test-env';

loadTestEnv();
Object.assign(process.env, { NODE_ENV: 'test', APP_ENV: 'test', RATE_LIMIT_DISABLED: 'true' });
