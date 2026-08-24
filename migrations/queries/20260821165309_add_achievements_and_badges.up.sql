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

-- 'First Purchase' (1) and '5 Purchases' (5) are named by the brief. The rest
-- extend that same convention, and the ladder stops at 8 because the badge
-- below needs 8 achievements: a sparser ladder would put the only badge, and
-- therefore the whole cashback path, hundreds of purchases out of reach.
INSERT INTO achievements (achievement_key, achievement_group_key, achievement_name, required_product_purchase_count)
VALUES
    ('FIRST_PURCHASE', 'PURCHASES', 'First Purchase', 1),
    ('TWO_PURCHASES',  'PURCHASES', '2 Purchases',    2),
    ('THREE_PURCHASES','PURCHASES', '3 Purchases',    3),
    ('FOUR_PURCHASES', 'PURCHASES', '4 Purchases',    4),
    ('FIVE_PURCHASES', 'PURCHASES', '5 Purchases',    5),
    ('SIX_PURCHASES',  'PURCHASES', '6 Purchases',    6),
    ('SEVEN_PURCHASES','PURCHASES', '7 Purchases',    7),
    ('EIGHT_PURCHASES','PURCHASES', '8 Purchases',    8);

-- 'Advanced' is the only badge the brief names, and its own example pins it at
-- 8 achievements ("unlocked 5 ... must unlock an additional 3"). Further tiers
-- are configuration: one row here plus one in badge_cashback_amounts.
INSERT INTO badges (badge_key, badge_name, required_achievement_count)
VALUES ('ADVANCED', 'Advanced', 8);

INSERT INTO badge_cashback_amounts (badge_key, currency_code, amount_in_minor_units)
VALUES ('ADVANCED', 'NGN', 30000);
