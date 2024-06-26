import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { instanceToPlain } from "class-transformer";
import { Response } from "express";

import { LoginResponse } from "~auth/response/login.response";
import { UpdateTokenResponse } from "~auth/response/update-token.response";
import { Cookies, UserAgent } from "~common/decorator";
import { TokenService } from "~common/module/tokenModule";
import { UserResponse } from "~user/response/user.response";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const COOKIE_REFRESH_TOKEN_KEY = "RefreshToken";
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @ApiOperation({ summary: "Создание пользователя" })
  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  @UsePipes()
  @UseInterceptors(ClassSerializerInterceptor)
  async register(@Body() registerDto: RegisterDto): Promise<UserResponse> {
    const user = await this.authService.register(registerDto);

    return new UserResponse(user);
  }

  @ApiOperation({ summary: "Логин пользователя" })
  @Post("login")
  async login(
    @Res() res: Response,
    @Body() loginDto: LoginDto,
    @UserAgent() userAgent: string,
    //@ts-ignore(ReturnType): res.cookie().status().json()
  ): Promise<LoginResponse> {
    const user = await this.authService.login(loginDto);

    const { accessToken, refreshTokenData } = await this.tokenService.setUserSessionAfterLogin(
      user,
      userAgent,
    );

    const response = instanceToPlain(
      new LoginResponse({ user: new UserResponse(user), accessToken: accessToken }),
    );

    res
      .cookie(COOKIE_REFRESH_TOKEN_KEY, refreshTokenData.refreshToken, {
        secure: true,
        maxAge: refreshTokenData.expTimeStamp,
        httpOnly: false,
        path: "/",
      })
      .status(HttpStatus.OK)
      .json(response);
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Обновления сессии пользователя",
    description: "В куках должен лежать валидный refreshToken",
  })
  @Get("updateToken")
  async updateToken(
    @Res() res: Response,
    @UserAgent() userAgent: string,
    @Cookies(COOKIE_REFRESH_TOKEN_KEY) refreshToken?: string,
    //@ts-ignore(ReturnType): res.cookie().status().json()
  ): Promise<UpdateTokenResponse> {
    const { accessToken, refreshTokenData } = await this.tokenService.setUserSessionAfterUpdateToken(
      userAgent,
      refreshToken,
    );

    const response = instanceToPlain(new UpdateTokenResponse(accessToken));

    res
      .cookie(COOKIE_REFRESH_TOKEN_KEY, refreshTokenData.refreshToken, {
        secure: true,
        maxAge: refreshTokenData.expTimeStamp,
        httpOnly: false,
        path: "/",
      })
      .status(HttpStatus.OK)
      .json(response);
  }
}
