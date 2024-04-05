import { ApiProperty, PickType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

import { UserEntity } from "~user/entities/user.entity";

export class RegisterDto extends PickType(UserEntity, ["email", "username", "password"]) {
  @ApiProperty({ example: "Bob" })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Transform(({ value }) => value.toLowerCase())
  readonly username: string;

  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;
}