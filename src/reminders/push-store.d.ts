import type { ReminderSettings } from '../features/reminders/schema'
export type ReminderBinding = {
  owner: string
  deviceId: string
  revision: number
  enabled: boolean
  settings: ReminderSettings
  lastDay?: string | null
}
export function readReminderBinding(): Promise<ReminderBinding | null>
export function writeReminderBinding(binding: ReminderBinding | null): Promise<void>
export function reminderMayDisplay(binding: unknown, payload: unknown, now: number): boolean
export function consumeReminder(payload: unknown, now?: number): Promise<boolean>
