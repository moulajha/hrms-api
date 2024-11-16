import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommonModule } from '../common/common.module';
import {
  AuthBaseService,
  AuthQueryService,
  AuthCommandService,
} from './services';

@Module({
  imports: [CommonModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthBaseService,
    AuthQueryService,
    AuthCommandService,
  ],
  exports: [AuthService]
})
export class AuthModule {}
