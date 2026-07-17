import { forwardRef, Module } from '@nestjs/common';
import { BoxController } from './box.controller';
import { BoxService } from './box.service';
import { BoxRepository } from './box.repository';
import { UserPlantModule } from '../user-plant/user-plant.module';
import { SensorsModule } from '../sensors/sensors.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PhotoModule } from '../photo/photo.module';

@Module({
  imports: [forwardRef(() => UserPlantModule), SensorsModule, WebsocketModule, PhotoModule],
  controllers: [BoxController],
  providers: [BoxService, BoxRepository],
  exports: [BoxService, BoxRepository],
})
export class BoxModule {}