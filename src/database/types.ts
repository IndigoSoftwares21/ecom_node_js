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
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  achievements: {
    achievementKey: ColumnType<string>;
    achievementGroupKey: ColumnType<string>;
    achievementName: ColumnType<string>;
    requiredProductPurchaseCount: ColumnType<number>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  appUserAchievements: {
    userId: ColumnType<string>;
    achievementKey: ColumnType<string>;
    unlockedAt: ColumnType<Date, Date | undefined, Date>;
  };

  appUserBadges: {
    userId: ColumnType<string>;
    badgeKey: ColumnType<string>;
    unlockedAt: ColumnType<Date, Date | undefined, Date>;
  };

  appUsers: {
    userId: ColumnType<string, string | undefined, string>;
    emailAddress: ColumnType<string>;
    firstName: ColumnType<string>;
    middleName: ColumnType<string | null, string | null | undefined, string | null>;
    lastName: ColumnType<string>;
    isActive: ColumnType<boolean, boolean | undefined, boolean>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
    updatedAt: ColumnType<Date | null, Date | null | undefined, Date | null>;
  };

  badgeCashbackAmounts: {
    badgeKey: ColumnType<string>;
    currencyCode: ColumnType<string>;
    amountInMinorUnits: ColumnType<number>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  badges: {
    badgeKey: ColumnType<string>;
    badgeName: ColumnType<string>;
    requiredAchievementCount: ColumnType<number>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  cashbackPayouts: {
    cashbackPayoutId: ColumnType<string, string | undefined, string>;
    userId: ColumnType<string>;
    badgeKey: ColumnType<string>;
    amountInMinorUnits: ColumnType<number>;
    currencyCode: ColumnType<string>;
    status: ColumnType<string, string | undefined, string>;
    provider: ColumnType<string>;
    providerReference: ColumnType<string | null, string | null | undefined, string | null>;
    payoutRecipientId: ColumnType<string | null, string | null | undefined, string | null>;
    attemptCount: ColumnType<number, number | undefined, number>;
    lastErrorMessage: ColumnType<string | null, string | null | undefined, string | null>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
    updatedAt: ColumnType<Date | null, Date | null | undefined, Date | null>;
  };

  countries: {
    isoAlpha2Code: ColumnType<string>;
    countryName: ColumnType<string>;
    defaultCurrencyCode: ColumnType<string>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  countryCallingCodes: {
    countryIsoAlpha2Code: ColumnType<string>;
    callingCode: ColumnType<string>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  currencies: {
    isoCurrencyCode: ColumnType<string>;
    currencyName: ColumnType<string>;
    minorUnitExponent: ColumnType<number>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  knexMigrations: {
    id: ColumnType<number, number | undefined, number>;
    name: ColumnType<string | null, string | null | undefined, string | null>;
    batch: ColumnType<number | null, number | null | undefined, number | null>;
    migrationTime: ColumnType<Date | null, Date | null | undefined, Date | null>;
  };

  knexMigrationsLock: {
    index: ColumnType<number, number | undefined, number>;
    isLocked: ColumnType<number | null, number | null | undefined, number | null>;
  };

  outboxEvents: {
    outboxEventId: ColumnType<string, string | undefined, string>;
    eventName: ColumnType<string>;
    aggregateType: ColumnType<string>;
    aggregateId: ColumnType<string>;
    payload: ColumnType<unknown>;
    status: ColumnType<string, string | undefined, string>;
    publishAttemptCount: ColumnType<number, number | undefined, number>;
    lastErrorMessage: ColumnType<string | null, string | null | undefined, string | null>;
    publishedAt: ColumnType<Date | null, Date | null | undefined, Date | null>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

  payoutRecipients: {
    payoutRecipientId: ColumnType<string, string | undefined, string>;
    userId: ColumnType<string>;
    provider: ColumnType<string>;
    currencyCode: ColumnType<string>;
    bankCode: ColumnType<string>;
    bankAccountNumber: ColumnType<string>;
    bankAccountName: ColumnType<string>;
    providerRecipientCode: ColumnType<string | null, string | null | undefined, string | null>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
    updatedAt: ColumnType<Date | null, Date | null | undefined, Date | null>;
  };

  productPurchases: {
    productPurchaseId: ColumnType<string, string | undefined, string>;
    userId: ColumnType<string>;
    amountInMinorUnits: ColumnType<number>;
    currencyCode: ColumnType<string>;
    status: ColumnType<string>;
    createdAt: ColumnType<Date, Date | undefined, Date>;
  };

}

// Utility types for better type safety
export type Row<Table extends keyof Database> = Selectable<Database[Table]>;
export type InsertRow<Table extends keyof Database> = Insertable<Database[Table]>;
export type UpdateRow<Table extends keyof Database> = Updateable<Database[Table]>;
