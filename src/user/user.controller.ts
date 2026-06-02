import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';
import { GetUserUseCase } from './usecases/get-user.usecase';
import { UpdateUserUseCase } from './usecases/update-user.usecase';
import { UpdateUserDto } from './user.dto';
@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(
    private readonly getUserUseCase:    GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}
  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.getUserUseCase.execute(user.uid);
    return { message: 'Perfil obtenido', data };
  }
  @Patch('me')
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.updateUserUseCase.execute(user.uid, dto);
    return { message: 'Perfil actualizado', data };
  }
}
