import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponseDto } from 'src/dto/response.dto';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  async getSummary() {
    const data = await this.dashboardService.getSummary();
    return new ResponseDto(data, 'Dashboard summary fetched successfully.');
  }
}
