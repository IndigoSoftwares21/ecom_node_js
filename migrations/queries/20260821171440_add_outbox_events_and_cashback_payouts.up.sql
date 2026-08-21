CREATE TABLE outbox_events (
    outbox_event_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name            VARCHAR(64) NOT NULL,
    aggregate_type        VARCHAR(64) NOT NULL,
    aggregate_id          UUID        NOT NULL,
    payload               JSONB       NOT NULL,
    status                VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
    publish_attempt_count INTEGER     NOT NULL DEFAULT 0,
    last_error_message    TEXT,
    published_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX outbox_events_pending_created_at_index
    ON outbox_events (created_at)
    WHERE status = 'PENDING';

CREATE TABLE payout_recipients (
    payout_recipient_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID         NOT NULL REFERENCES app_users (user_id) ON DELETE CASCADE,
    provider                VARCHAR(32)  NOT NULL CHECK (provider IN ('PAYSTACK')),
    currency_code           VARCHAR(3)   NOT NULL REFERENCES currencies (iso_currency_code) ON DELETE RESTRICT,
    bank_code               VARCHAR(16)  NOT NULL,
    bank_account_number     VARCHAR(32)  NOT NULL,
    bank_account_name       VARCHAR(128) NOT NULL,
    provider_recipient_code VARCHAR(128),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    UNIQUE (user_id, provider, currency_code)
);

CREATE UNIQUE INDEX payout_recipients_provider_recipient_code_unique_index
    ON payout_recipients (provider, provider_recipient_code)
    WHERE provider_recipient_code IS NOT NULL;

CREATE TABLE cashback_payouts (
    cashback_payout_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL REFERENCES app_users (user_id) ON DELETE RESTRICT,
    badge_key             VARCHAR(64)  NOT NULL REFERENCES badges (badge_key) ON DELETE RESTRICT,
    amount_in_minor_units BIGINT       NOT NULL CHECK (amount_in_minor_units > 0),
    currency_code         VARCHAR(3)   NOT NULL REFERENCES currencies (iso_currency_code) ON DELETE RESTRICT,
    status                VARCHAR(16)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')),
    provider              VARCHAR(32)  NOT NULL CHECK (provider IN ('PAYSTACK')),
    provider_reference    VARCHAR(128),
    payout_recipient_id   UUID         REFERENCES payout_recipients (payout_recipient_id) ON DELETE RESTRICT,
    attempt_count         INTEGER      NOT NULL DEFAULT 0,
    last_error_message    TEXT,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ,
    UNIQUE (user_id, badge_key)
);

CREATE UNIQUE INDEX cashback_payouts_provider_reference_unique_index
    ON cashback_payouts (provider, provider_reference)
    WHERE provider_reference IS NOT NULL;

CREATE INDEX cashback_payouts_unsettled_created_at_index
    ON cashback_payouts (created_at)
    WHERE status IN ('PENDING', 'PROCESSING');
