import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SignInDto,
  SignUpDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Public } from '../common/decorators/user.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Trace } from '../common/decorators/trace.decorator';
import { Role, Auth } from '../common/decorators/roles.decorator';

@ApiTags('Authentication')
@Controller('auth')
@ApiExtraModels(AuthResponseDto)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @ApiOperation({
    summary: 'Create a new user account',
    description: 'Register a new user and return JWT token with user information'
  })
  @ApiBody({
    type: SignUpDto,
    description: 'User registration details',
    examples: {
      userRegistration: {
        value: {
          email: "user@example.com",
          password: "Password123!",
          organizationId: "123e4567-e89b-12d3-a456-426614174000",
          role: "EMPLOYEE"
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    schema: {
      example: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          role: "EMPLOYEE"
        },
        session: {
          access_token: "eyJhbGciOiJIUzI1...",
          token_type: "bearer",
          expires_in: 3600
        }
      }
    }
  })
  @Trace({ name: 'auth.signup' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(
      signUpDto.email, 
      signUpDto.password,
      signUpDto.organizationId,
      signUpDto.role
    );
  }

  @Post('create-super-admin')
  @UseGuards(AuthGuard)
  @Auth([Role.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Create a new super admin user',
    description: 'Create a new super admin user (requires SUPER_ADMIN role)'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    type: CreateSuperAdminDto,
    description: 'Super admin creation details',
  })
  @ApiCreatedResponse({
    description: 'Super admin successfully created',
    schema: {
      example: {
        user: {
          id: "user-uuid",
          email: "admin@example.com",
          role: "SUPER_ADMIN"
        },
        session: {
          access_token: "eyJhbGciOiJIUzI1...",
          token_type: "bearer",
          expires_in: 3600
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires SUPER_ADMIN role' })
  @Trace({ name: 'auth.createSuperAdmin' })
  async createSuperAdmin(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return await this.authService.signUp(
      createSuperAdminDto.email,
      createSuperAdminDto.password,
      createSuperAdminDto.organizationId,
      Role.SUPER_ADMIN
    );
  }

  @Post('signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with email and password',
    description: 'Authenticate user and return JWT token with user information'
  })
  @ApiBody({
    type: SignInDto,
    description: 'User credentials',
    examples: {
      userCredentials: {
        value: {
          email: "user@example.com",
          password: "Password123!"
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Successfully signed in',
    schema: {
      example: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          roles: ["EMPLOYEE"],
          permissions: ["VIEW_PROFILE", "REQUEST_LEAVE"]
        },
        session: {
          access_token: "eyJhbGciOiJIUzI1...",
          token_type: "bearer",
          expires_in: 3600
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: "Invalid credentials",
        error: "Unauthorized"
      }
    }
  })
  @Trace({ name: 'auth.signin' })
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('signout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Sign out current user',
    description: 'Invalidate the current session token'
  })
  @ApiOkResponse({
    description: 'Successfully signed out',
    schema: {
      example: {
        message: "Successfully signed out"
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token',
    schema: {
      example: {
        statusCode: 401,
        message: "Invalid token",
        error: "Unauthorized"
      }
    }
  })
  @Trace({ name: 'auth.signout' })
  async signOut(@CurrentUser('token') token: string) {
    return await this.authService.signOut(token);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email',
    description: 'Send a password reset link to the specified email address'
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Email address for password reset',
    examples: {
      resetPassword: {
        value: {
          email: "user@example.com"
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Password reset email sent',
    schema: {
      example: {
        message: "Password reset email sent"
      }
    }
  })
  @Trace({ name: 'auth.resetPassword' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto.email);
  }

  @Post('update-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user password',
    description: 'Update the password for the authenticated user'
  })
  @ApiBody({
    type: UpdatePasswordDto,
    description: 'New password',
    examples: {
      updatePassword: {
        value: {
          newPassword: "NewPassword123!"
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Password successfully updated',
    schema: {
      example: {
        message: "Password updated successfully"
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token'
  })
  @Trace({ name: 'auth.updatePassword' })
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return await this.authService.updatePassword(updatePasswordDto.newPassword);
  }

  @Get('refresh')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Refresh authentication token',
    description: 'Get a new access token using the refresh token'
  })
  @ApiOkResponse({
    description: 'Token successfully refreshed',
    schema: {
      example: {
        session: {
          access_token: "eyJhbGciOiJIUzI1...",
          token_type: "bearer",
          expires_in: 3600
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token'
  })
  @Trace({ name: 'auth.refresh' })
  async refresh() {
    return await this.authService.refreshSession();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the authenticated user'
  })
  @ApiOkResponse({
    description: 'Current user profile',
    schema: {
      example: {
        id: "user-uuid",
        email: "user@example.com",
        profile: {
          firstName: "John",
          lastName: "Doe",
          avatarUrl: "https://example.com/avatar.jpg"
        },
        roles: ["EMPLOYEE"],
        permissions: ["VIEW_PROFILE", "REQUEST_LEAVE"],
        organization: {
          id: "org-uuid",
          name: "Acme Corp",
          slug: "acme-corp"
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token'
  })
  @Trace({ name: 'auth.me' })
  async me(@CurrentUser() user: any) {
    return user;
  }
}
