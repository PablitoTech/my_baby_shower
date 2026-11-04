import { Controller, Get } from '@nestjs/common';
import type { CategoryDto } from '@mbs/contracts';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(): Promise<CategoryDto[]> {
    return this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, sortOrder: true },
    });
  }
}
