import { Injectable } from '@nestjs/common';
import { Role } from '../common/decorators/roles.decorator';
import { AuthQueryService } from './services/auth-query.service';
import { AuthCommandService } from './services/auth-command.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly queryService: AuthQueryService,
    private readonly commandService: AuthCommandService,
  ) {}

  // Command Methods
  async signIn(email: string, password: string) {
    return this.commandService.signIn(email, password);
  }

  async signUp(email: string, password: string, organizationId: string, role: Role = Role.EMPLOYEE) {
    return this.commandService.signUp(email, password, organizationId, role);
  }

  async signOut(token: string) {
    return this.commandService.signOut(token);
  }

  async resetPassword(email: string) {
    return this.commandService.resetPassword(email);
  }

  async updatePassword(newPassword: string) {
    return this.commandService.updatePassword(newPassword);
  }

  // Query Methods
  async refreshSession() {
    return this.queryService.refreshSession();
  }

  async verifySession(token: string) {
    return this.queryService.verifySession(token);
  }

  async getUserProfile(userId: string) {
    return this.queryService.getUserProfile(userId);
  }
}
