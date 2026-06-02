import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Length,
} from 'class-validator';

export class ValidateCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'El código del dispositivo es obligatorio' })
  @Length(4, 20, { message: 'El código debe tener entre 4 y 20 caracteres' })
  code: string;
}

export class UpdateLocationDto {
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'Latitud inválida' })
  @Max(90, { message: 'Latitud inválida' })
  latitude: number;

  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'Longitud inválida' })
  @Max(180, { message: 'Longitud inválida' })
  longitude: number;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la ubicación es obligatorio' })
  locationName: string;
}

export class RegisterFcmTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'El token FCM es obligatorio' })
  token: string;
}

export class RemoveFcmTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'El token FCM es obligatorio' })
  token: string;
}