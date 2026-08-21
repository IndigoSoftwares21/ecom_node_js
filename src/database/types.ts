/**
 * This file was automatically generated.
 * DO NOT MODIFY IT MANUALLY.
 */

import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

// Database interface with auto-generated fields marked as optional
export interface Database {
  achievementGroups: {
    achievementGroupKey: ColumnType<string>;
    achievementGroupName: ColumnType<string>;
    createdAt?: ColumnType<Date>;
  };

  achievements: {
    achievementKey: ColumnType<string>;
    achievementGroupKey: ColumnType<string>;
    achievementName: ColumnType<string>;
    requiredProductPurchaseCount: ColumnType<number>;
    createdAt?: ColumnType<Date>;
  };

  appUserAchievements: {
    userId: ColumnType<string>;
    achievementKey: ColumnType<string>;
    unlockedAt?: ColumnType<Date>;
  };

  appUserBadges: {
    userId: ColumnType<string>;
    badgeKey: ColumnType<string>;
    unlockedAt?: ColumnType<Date>;
  };

  appUsers: {
    userId?: ColumnType<string>;
    emailAddress: ColumnType<string>;
    firstName: ColumnType<string>;
    middleName?: ColumnType<string | null>;
    lastName: ColumnType<string>;
    isActive?: ColumnType<boolean>;
    createdAt?: ColumnType<Date>;
    updatedAt?: ColumnType<Date | null>;
  };

  badgeCashbackAmounts: {
    badgeKey: ColumnType<string>;
    currencyCode: ColumnType<string>;
    amountInMinorUnits: ColumnType<number>;
    createdAt?: ColumnType<Date>;
  };

  badges: {
    badgeKey: ColumnType<string>;
    badgeName: ColumnType<string>;
    requiredAchievementCount: ColumnType<number>;
    createdAt?: ColumnType<Date>;
  };

  cashbackPayouts: {
    cashbackPayoutId?: ColumnType<string>;
    userId: ColumnType<string>;
    badgeKey: ColumnType<string>;
    amountInMinorUnits: ColumnType<number>;
    currencyCode: ColumnType<string>;
    status?: ColumnType<string>;
    provider: ColumnType<string>;
    providerReference?: ColumnType<string | null>;
    payoutRecipientId?: ColumnType<string | null>;
    attemptCount?: ColumnType<number>;
    lastErrorMessage?: ColumnType<string | null>;
    createdAt?: ColumnType<Date>;
    updatedAt?: ColumnType<Date | null>;
  };

  countries: {
    isoAlpha2Code: ColumnType<string>;
    countryName: ColumnType<string>;
    defaultCurrencyCode: ColumnType<string>;
    createdAt?: ColumnType<Date>;
  };

  countryCallingCodes: {
    countryIsoAlpha2Code: ColumnType<string>;
    callingCode: ColumnType<string>;
    createdAt?: ColumnType<Date>;
  };

  currencies: {
    isoCurrencyCode: ColumnType<string>;
    currencyName: ColumnType<string>;
    minorUnitExponent: ColumnType<number>;
    createdAt?: ColumnType<Date>;
  };

  demo: {
    id?: ColumnType<number>;
    name: ColumnType<string>;
    createdAt?: ColumnType<Date | null>;
  };

  knexMigrations: {
    id?: ColumnType<number>;
    name?: ColumnType<string | null>;
    batch?: ColumnType<number | null>;
    migrationTime?: ColumnType<Date | null>;
  };

  knexMigrationsLock: {
    index?: ColumnType<number>;
    isLocked?: ColumnType<number | null>;
  };

  outboxEvents: {
    outboxEventId?: ColumnType<string>;
    eventName: ColumnType<string>;
    aggregateType: ColumnType<string>;
    aggregateId: ColumnType<string>;
    payload: ColumnType<unknown>;
    status?: ColumnType<string>;
    publishAttemptCount?: ColumnType<number>;
    lastErrorMessage?: ColumnType<string | null>;
    publishedAt?: ColumnType<Date | null>;
    createdAt?: ColumnType<Date>;
  };

  payoutRecipients: {
    payoutRecipientId?: ColumnType<string>;
    userId: ColumnType<string>;
    provider: ColumnType<string>;
    currencyCode: ColumnType<string>;
    bankCode: ColumnType<string>;
    bankAccountNumber: ColumnType<string>;
    bankAccountName: ColumnType<string>;
    providerRecipientCode?: ColumnType<string | null>;
    createdAt?: ColumnType<Date>;
    updatedAt?: ColumnType<Date | null>;
  };

  productPurchases: {
    productPurchaseId?: ColumnType<string>;
    userId: ColumnType<string>;
    amountInMinorUnits: ColumnType<number>;
    currencyCode: ColumnType<string>;
    status: ColumnType<string>;
    createdAt?: ColumnType<Date>;
  };

}

// Utility types for better type safety
export type Row<Table extends keyof Database> = Selectable<Database[Table]>;
export type InsertRow<Table extends keyof Database> = Insertable<Database[Table]>;
export type UpdateRow<Table extends keyof Database> = Updateable<Database[Table]>;
