import { TimeOfDay } from '@prisma/client';
export declare const PATIENT_TIMEZONE = "Europe/Paris";
export declare const DEFAULT_SLOT_TIMES: Record<TimeOfDay, string>;
export declare function localDateKey(date?: Date): string;
export declare function addDays(dateKey: string, days: number): string;
export declare function weekdayIndex(dateKey: string): number;
export declare function localDateTime(dateKey: string, time: string): Date;
