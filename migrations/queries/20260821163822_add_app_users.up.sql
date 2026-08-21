CREATE TABLE app_users (
    user_id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email_address VARCHAR(255) NOT NULL,
    first_name    VARCHAR(80)  NOT NULL,
    middle_name   VARCHAR(80),
    last_name     VARCHAR(80)  NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX app_users_email_address_unique_index
    ON app_users (lower(email_address));
