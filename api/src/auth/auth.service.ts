import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

type Account = {
  familyName: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
};

export type PublicAccount = Pick<Account, 'familyName' | 'name' | 'email'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService {
  // Demo only: accounts live in memory and vanish when the server restarts.
  private readonly accounts = new Map<string, Account>();

  constructor() {
    this.addAccount(
      'Famille Dupont',
      'Demo',
      process.env.DEMO_EMAIL ?? 'demo@mamiemedoc.app',
      process.env.DEMO_PASSWORD ?? 'Mamie2026!',
    );
  }

  signup(body: unknown): PublicAccount {
    const familyName = this.requireText(body, 'familyName', 'Family name');
    const name = this.requireText(body, 'name', 'Your name');
    const email = this.requireText(body, 'email', 'Email');
    const password = this.requireText(body, 'password', 'Password', false);

    if (!EMAIL_PATTERN.test(email)) {
      throw new BadRequestException('Please enter a valid email address');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }
    if (this.accounts.has(normalizeEmail(email))) {
      throw new ConflictException('An account with this email already exists');
    }

    return toPublic(this.addAccount(familyName, name, email, password));
  }

  signin(body: unknown): PublicAccount & { token: string } {
    const email = readText(body, 'email');
    const password = readText(body, 'password', false);
    const account = this.accounts.get(normalizeEmail(email));

    if (!account || !passwordMatches(password, account)) {
      throw new UnauthorizedException('Wrong email or password');
    }

    return { ...toPublic(account), token: randomBytes(32).toString('hex') };
  }

  private addAccount(
    familyName: string,
    name: string,
    email: string,
    password: string,
  ): Account {
    const salt = randomBytes(16).toString('hex');
    const account: Account = {
      familyName,
      name,
      email: normalizeEmail(email),
      salt,
      hash: hashPassword(password, salt),
    };
    this.accounts.set(account.email, account);
    return account;
  }

  private requireText(
    body: unknown,
    field: string,
    label: string,
    trim = true,
  ): string {
    const value = readText(body, field, trim);
    if (!value) {
      throw new BadRequestException(`${label} is required`);
    }
    return value;
  }
}

function readText(body: unknown, field: string, trim = true): string {
  if (typeof body !== 'object' || body === null) return '';
  const value = (body as Record<string, unknown>)[field];
  if (typeof value !== 'string') return '';
  return trim ? value.trim() : value;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function passwordMatches(password: string, account: Account): boolean {
  const attempt = Buffer.from(hashPassword(password, account.salt), 'hex');
  return timingSafeEqual(attempt, Buffer.from(account.hash, 'hex'));
}

function toPublic({ familyName, name, email }: Account): PublicAccount {
  return { familyName, name, email };
}
