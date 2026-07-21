import { Module } from '@nestjs/common';
import { AutomaticControlService } from './automatic-control.service';
import { WeatherModule } from 'src/weather/weather.module';

@Module({
  imports: [WeatherModule],
  providers: [AutomaticControlService],
  exports: [AutomaticControlService],
})
export class AutomaticControlModule {}
