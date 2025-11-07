import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 50)
  username: string;

  @IsString()
  @Length(6, 80)
  password: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean = true;
}
