import {
  Controller,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import express from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PostLoginService } from './post-login.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import * as jwtPayloadInterface from './interfaces/jwt-payload.interface';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly postLoginService: PostLoginService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      await this.authService.verifyEmail(token);
      // Redirect to the new frontend page with a success status
      return res.redirect(`${frontendUrl}/email-verified?status=success`);
    } catch (error) {
      // Redirect to the new frontend page with an error status
      return res.redirect(`${frontendUrl}/email-verified?status=error`);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Injection du Refresh Token dans un cookie sécurisé
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    return {
      access_token: result.accessToken,
      user: result.user,
      redirect: result.redirect,
      onboardingComplete: result.onboardingComplete,
      hasFinancialData: result.hasFinancialData,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req?.cookies?.['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token introuvable dans les cookies.',
      );
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: tokens.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @CurrentUser() user: jwtPayloadInterface.JwtPayload,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    // Invalidate the refresh token in the database
    await this.authService.logout(user.userId);
    res.clearCookie('refresh_token');
    return { message: 'Déconnexion réussie.' };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: jwtPayloadInterface.JwtPayload,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.changePassword(
      user.userId,
      currentPassword,
      newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: jwtPayloadInterface.JwtPayload) {
    const postLoginInfo = await this.postLoginService.getRedirectInfo(
      user.companyId,
    );
    return {
      message: 'Accès autorisé à la route protégée',
      user: user,
      redirect: postLoginInfo.redirect,
      onboardingComplete: postLoginInfo.onboardingComplete,
      hasFinancialData: postLoginInfo.hasFinancialData,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-only')
  getAdminData(@CurrentUser() user: jwtPayloadInterface.JwtPayload) {
    return {
      message: 'Accès autorisé : Vous êtes bien un administrateur.',
      companyId: user.companyId,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('invite')
  async inviteMember(
    @CurrentUser() admin: jwtPayloadInterface.JwtPayload,
    @Body('email') email: string,
    @Body('role') role: UserRole,
  ) {
    return await this.authService.inviteMember(admin.userId, email, role);
  }

  @HttpCode(HttpStatus.OK)
  @Post('accept-invite')
  async acceptInvite(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
  ) {
    return await this.authService.acceptInvite(
      token,
      password,
      firstName,
      lastName,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('team')
  async getTeamMembers(@CurrentUser() admin: jwtPayloadInterface.JwtPayload) {
    return await this.authService.getTeamMembers(admin.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('team/:id')
  @HttpCode(HttpStatus.OK)
  async deleteTeamMember(
    @CurrentUser() admin: jwtPayloadInterface.JwtPayload,
    @Param('id') userIdToDelete: string,
  ) {
    return await this.authService.deleteTeamMember(
      admin.userId,
      userIdToDelete,
    );
  }
}
