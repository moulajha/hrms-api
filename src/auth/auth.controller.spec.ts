import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, ResetPasswordDto, UpdatePasswordDto } from './dto/auth.dto';
import { Role } from '../common/decorators/roles.decorator';
import { SupabaseService } from '../common/services/supabase.service';
import { RequestContextService } from '../common/services/request-context.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    refreshSession: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(),
    createClient: jest.fn(),
  };

  const mockRequestContextService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: RequestContextService,
          useValue: mockRequestContextService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'Password123!',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      role: Role.EMPLOYEE,
    };

    const mockResponse = {
      user: {
        id: 'user-uuid',
        email: 'test@example.com',
        role: Role.EMPLOYEE,
      },
      session: {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
      },
    };

    it('should create a new user account', async () => {
      mockAuthService.signUp.mockResolvedValue(mockResponse);

      const result = await controller.signUp(signUpDto);

      expect(service.signUp).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.password,
        signUpDto.organizationId,
        signUpDto.role,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockResponse = {
      user: {
        id: 'user-uuid',
        email: 'test@example.com',
        roles: [Role.EMPLOYEE],
        permissions: ['VIEW_PROFILE', 'REQUEST_LEAVE'],
      },
      session: {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
      },
    };

    it('should authenticate user and return token', async () => {
      mockAuthService.signIn.mockResolvedValue(mockResponse);

      const result = await controller.signIn(signInDto);

      expect(service.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('signOut', () => {
    const mockToken = 'mock-token';
    const mockResponse = { message: 'Successfully signed out' };

    it('should sign out user and invalidate token', async () => {
      mockAuthService.signOut.mockResolvedValue(mockResponse);

      const result = await controller.signOut(mockToken);

      expect(service.signOut).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      email: 'test@example.com',
    };

    const mockResponse = { message: 'Password reset email sent' };

    it('should send password reset email', async () => {
      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(service.resetPassword).toHaveBeenCalledWith(resetPasswordDto.email);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto: UpdatePasswordDto = {
      newPassword: 'NewPassword123!',
    };

    const mockResponse = { message: 'Password updated successfully' };

    it('should update user password', async () => {
      mockAuthService.updatePassword.mockResolvedValue(mockResponse);

      const result = await controller.updatePassword(updatePasswordDto);

      expect(service.updatePassword).toHaveBeenCalledWith(updatePasswordDto.newPassword);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refresh', () => {
    const mockResponse = {
      session: {
        access_token: 'new-mock-token',
        token_type: 'bearer',
        expires_in: 3600,
      },
    };

    it('should refresh authentication token', async () => {
      mockAuthService.refreshSession.mockResolvedValue(mockResponse);

      const result = await controller.refresh();

      expect(service.refreshSession).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('me', () => {
    const mockUser = {
      id: 'user-uuid',
      email: 'test@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      roles: [Role.EMPLOYEE],
      permissions: ['VIEW_PROFILE'],
      organization: {
        id: 'org-uuid',
        name: 'Test Org',
        slug: 'test-org',
      },
    };

    it('should return current user profile', async () => {
      const result = await controller.me(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
