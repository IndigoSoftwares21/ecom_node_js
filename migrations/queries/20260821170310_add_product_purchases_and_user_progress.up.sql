CREATE TABLE product_purchases (
    product_purchase_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL REFERENCES app_users (user_id) ON DELETE RESTRICT,
    amount_in_minor_units BIGINT      NOT NULL CHECK (amount_in_minor_units > 0),
    currency_code         VARCHAR(3)  NOT NULL REFERENCES currencies (iso_currency_code) ON DELETE RESTRICT,
    status                VARCHAR(16) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'REFUNDED', 'CANCELLED')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX product_purchases_completed_user_id_index
    ON product_purchases (user_id)
    WHERE status = 'COMPLETED';

CREATE TABLE app_user_achievements (
    user_id         UUID        NOT NULL REFERENCES app_users (user_id) ON DELETE CASCADE,
    achievement_key VARCHAR(64) NOT NULL REFERENCES achievements (achievement_key) ON DELETE RESTRICT,
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_key)
);

CREATE TABLE app_user_badges (
    user_id     UUID        NOT NULL REFERENCES app_users (user_id) ON DELETE CASCADE,
    badge_key   VARCHAR(64) NOT NULL REFERENCES badges (badge_key) ON DELETE RESTRICT,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_key)
);
