import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PostLoginService } from './post-login.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: MailService, useValue: {} },
        { provide: PostLoginService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('prevents ADMIN from deleting another ADMIN', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: UserRole.ADMIN, companyId: 'c1' })
      .mockResolvedValueOnce({ id: 'admin-2', role: UserRole.ADMIN, companyId: 'c1' });

    await expect(service.deleteTeamMember('admin-1', 'admin-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('prevents OWNER self deletion without transfer', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'owner-1',
      role: UserRole.OWNER,
      companyId: 'c1',
    });

    await expect(service.deleteTeamMember('owner-1', 'owner-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('prevents changing OWNER role directly', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'owner-1', role: UserRole.OWNER, companyId: 'c1' })
      .mockResolvedValueOnce({
        id: 'owner-2',
        role: UserRole.OWNER,
        companyId: 'c1',
        deletedAt: null,
      });

    await expect(
      service.updateMemberRole('owner-1', 'owner-2', UserRole.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
