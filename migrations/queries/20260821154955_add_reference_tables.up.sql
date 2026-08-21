CREATE TABLE currencies (
    iso_currency_code   VARCHAR(3)  PRIMARY KEY,
    currency_name       VARCHAR(64) NOT NULL,
    minor_unit_exponent SMALLINT    NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE countries (
    iso_alpha_2_code      VARCHAR(2)   PRIMARY KEY,
    country_name          VARCHAR(128) NOT NULL,
    default_currency_code VARCHAR(3)   NOT NULL REFERENCES currencies (iso_currency_code) ON DELETE RESTRICT,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE country_calling_codes (
    country_iso_alpha_2_code VARCHAR(2)  NOT NULL REFERENCES countries (iso_alpha_2_code) ON DELETE CASCADE,
    calling_code             VARCHAR(4)  NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (country_iso_alpha_2_code, calling_code)
);

INSERT INTO currencies (iso_currency_code, currency_name, minor_unit_exponent)
VALUES ('NGN', 'Nigerian Naira', 2);

INSERT INTO countries (iso_alpha_2_code, country_name, default_currency_code)
VALUES ('NG', 'Nigeria', 'NGN');

INSERT INTO country_calling_codes (country_iso_alpha_2_code, calling_code)
VALUES ('NG', '234');
