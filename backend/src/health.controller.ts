import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Проверить состояние API' })
  check() { return { status: 'ok', service: 'seriq-api', timestamp: new Date().toISOString() }; }
}
