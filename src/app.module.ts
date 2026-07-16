import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BoxModule } from './box/box.module';
import { PlantModule } from './plant/plant.module';
import { UserPlantModule } from './user-plant/user-plant.module';
import { ReadingModule } from './reading/reading.module';
import { AutomaticControlModule } from './automatic-control/automatic-control.module';
import { AlertModule } from './alert/alert.module';
import { HistoryModule } from './history/history.module';
import { StatisticModule } from './statistic/statistic.module';
import { PhotoModule } from './photo/photo.module';
import { WeatherModule } from './weather/weather.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SensorsModule } from './sensors/sensors.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    BoxModule,
    PlantModule,
    UserPlantModule,
    ReadingModule,
    AutomaticControlModule,
    AlertModule,
    HistoryModule,
    StatisticModule,
    PhotoModule,
    WeatherModule,
    NotificationsModule,
    WebsocketModule,
    SensorsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}