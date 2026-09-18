import { COUNTRIES, countryLabel } from '../data/countries';
import type { Lang } from '../data/localeDict';
import './locale-controls.css';

type Props = {
  value: string;
  onChange: (countryCode: string) => void;
  lang: Lang;
  label: string;
};

export function CountrySelect({ value, onChange, lang, label }: Props) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="flag-select">
        <select value={value} onChange={(e) => onChange(e.target.value)} required>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {countryLabel(c.code, lang)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type PhoneProps = {
  countryCode: string;
  nationalNumber: string;
  onCountryChange: (countryCode: string) => void;
  onNumberChange: (national: string) => void;
  lang: Lang;
  label: string;
  hint?: string;
};

export function PhoneField({
  countryCode,
  nationalNumber,
  onCountryChange,
  onNumberChange,
  lang,
  label,
  hint,
}: PhoneProps) {
  const current = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  return (
    <div className="field">
      <label>{label}</label>
      <div className="phone-row">
        <select
          className="phone-dial"
          value={countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          aria-label="Country code"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.dial} · {countryLabel(c.code, lang)}
            </option>
          ))}
        </select>
        <input
          className="phone-input"
          required
          inputMode="tel"
          placeholder="50 123 45 67"
          value={nationalNumber}
          onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s-]/g, ''))}
        />
      </div>
      <span className="field-hint">
        {current.flag} {current.dial} · {hint}
      </span>
    </div>
  );
}

type PrefProps = {
  lang: Lang;
  currency: string;
  onLang: (l: Lang) => void;
  onCurrency: (c: string) => void;
  langLabel: string;
  currencyLabel: string;
  langs: { code: Lang; label: string; flag: string }[];
  currencies: { code: string; label: string }[];
};

export function LocaleCurrencyBar({
  lang,
  currency,
  onLang,
  onCurrency,
  langLabel,
  currencyLabel,
  langs,
  currencies,
}: PrefProps) {
  return (
    <div className="locale-bar" aria-label="Language and currency">
      <label className="locale-pill">
        <span className="sr-only">{langLabel}</span>
        <select value={lang} onChange={(e) => onLang(e.target.value as Lang)} title={langLabel}>
          {langs.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="locale-pill">
        <span className="sr-only">{currencyLabel}</span>
        <select value={currency} onChange={(e) => onCurrency(e.target.value)} title={currencyLabel}>
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
