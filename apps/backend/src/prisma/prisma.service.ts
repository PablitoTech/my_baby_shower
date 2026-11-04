import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { AppEnv } from '../config/env.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<AppEnv, true>) {
    super({
      adapter: new PrismaPg(
        { connectionString: config.get('DATABASE_URL', { infer: true }) },
        { schema: config.get('DB_SCHEMA', { infer: true }) },
      ),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
