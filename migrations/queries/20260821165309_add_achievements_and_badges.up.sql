CREATE TABLE achievement_groups (
    achievement_group_key  VARCHAR(64)  PRIMARY KEY,
    achievement_group_name VARCHAR(128) NOT NULL,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE achievements (
    achievement_key                 VARCHAR(64)  PRIMARY KEY,
    achievement_group_key           VARCHAR(64)  NOT NULL REFERENCES achievement_groups (achievement_group_key) ON DELETE RESTRICT,
    achievement_name                VARCHAR(128) NOT NULL,
    required_product_purchase_count INTEGER      NOT NULL CHECK (required_product_purchase_count > 0),
    created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (achievement_group_key, required_product_purchase_count)
);

CREATE TABLE badges (
    badge_key                  VARCHAR(64)  PRIMARY KEY,
    badge_name                 VARCHAR(128) NOT NULL,
    required_achievement_count INTEGER      NOT NULL UNIQUE CHECK (required_achievement_count > 0),
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE badge_cashback_amounts (
    badge_key             VARCHAR(64) NOT NULL REFERENCES badges (badge_key) ON DELETE CASCADE,
    currency_code         VARCHAR(3)  NOT NULL REFERENCES currencies (iso_currency_code) ON DELETE RESTRICT,
    amount_in_minor_units BIGINT      NOT NULL CHECK (amount_in_minor_units > 0),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (badge_key, currency_code)
);

INSERT INTO achievement_groups (achievement_group_key, achievement_group_name)
VALUES ('PURCHASES', 'Purchases');

INSERT INTO achievements (achievement_key, achievement_group_key, achievement_name, required_product_purchase_count)
VALUES
    ('FIRST_PURCHASE',             'PURCHASES', 'First Purchase', 1),
    ('FIVE_PURCHASES',             'PURCHASES', '5 Purchases',    5),
    ('TEN_PURCHASES',              'PURCHASES', '10 Purchases',   10),
    ('TWENTY_FIVE_PURCHASES',      'PURCHASES', '25 Purchases',   25),
    ('FIFTY_PURCHASES',            'PURCHASES', '50 Purchases',   50),
    ('ONE_HUNDRED_PURCHASES',      'PURCHASES', '100 Purchases',  100),
    ('TWO_HUNDRED_FIFTY_PURCHASES','PURCHASES', '250 Purchases',  250),
    ('FIVE_HUNDRED_PURCHASES',     'PURCHASES', '500 Purchases',  500);

INSERT INTO badges (badge_key, badge_name, required_achievement_count)
VALUES
    ('BEGINNER',     'Beginner',     1),
    ('INTERMEDIATE', 'Intermediate', 4),
    ('ADVANCED',     'Advanced',     8);

INSERT INTO badge_cashback_amounts (badge_key, currency_code, amount_in_minor_units)
VALUES
    ('BEGINNER',     'NGN', 30000),
    ('INTERMEDIATE', 'NGN', 30000),
    ('ADVANCED',     'NGN', 30000);
