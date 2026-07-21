import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from 'src/shared/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateUserDto } from './user.dto';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  async getUser(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.userService.getMe(user.uid);
    return { message: 'Perfil obtenido', data };
  }

  @Patch('user')
  async updateUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.userService.updateMe(user.uid, dto);
    return { message: 'Perfil actualizado', data };
  }
}
