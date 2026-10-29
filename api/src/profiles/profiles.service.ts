import { BadRequestException, Injectable } from '@nestjs/common';
import type { FamilyMember, Patient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type Profile = {
  key: string;
  type: 'patient' | 'family';
  firstName: string;
  role: string;
  avatarUrl: string | null;
};

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(patient: Patient): Promise<Profile[]> {
    const members = await this.prisma.familyMember.findMany({
      where: { patientId: patient.id },
      orderBy: [{ callOrder: 'asc' }, { id: 'asc' }],
    });
    return [patientProfile(patient), ...members.map(memberProfile)];
  }

  async addFamilyMember(patient: Patient, body: unknown): Promise<Profile> {
    const firstName = requireText(body, 'firstName', 'First name');
    const relation = requireText(body, 'relation', 'Relation');
    const phone = requireText(body, 'phone', 'Phone');

    // The key (lowercase first name) identifies a profile, so it must be unique.
    const existing = await this.list(patient);
    if (existing.some((profile) => profile.key === profileKey(firstName))) {
      throw new BadRequestException(
        `A profile called ${firstName} already exists`,
      );
    }

    const last = await this.prisma.familyMember.aggregate({
      where: { patientId: patient.id },
      _max: { callOrder: true },
    });
    const member = await this.prisma.familyMember.create({
      data: {
        patientId: patient.id,
        firstName,
        relation,
        phone,
        callOrder: (last._max.callOrder ?? 0) + 1,
      },
    });
    return memberProfile(member);
  }
}

function profileKey(firstName: string): string {
  return firstName.trim().toLowerCase();
}

function patientProfile(patient: Patient): Profile {
  return {
    key: profileKey(patient.firstName),
    type: 'patient',
    firstName: patient.firstName,
    role: 'Mamie',
    avatarUrl: patient.avatarUrl,
  };
}

function memberProfile(member: FamilyMember): Profile {
  return {
    key: profileKey(member.firstName),
    type: 'family',
    firstName: member.firstName,
    role: member.relation,
    avatarUrl: member.avatarUrl,
  };
}

function requireText(body: unknown, field: string, label: string): string {
  const value =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)[field]
      : undefined;
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new BadRequestException(`${label} is required`);
  }
  return text;
}
