# Graduation_project

## Internationalization (i18n)

- **Add a key:** Add the key and English text in `src/lib/i18n/en.ts`, then add its Arabic translation in `src/lib/i18n/ar.ts` (enforced by TypeScript).
- **Add a language:** Create `src/lib/i18n/[lang].ts` typed with `Record<TranslationKey, string>`, add `[lang]` to `Language` in `src/lib/i18n/index.tsx`, and add a switch button in `LanguageSwitch.tsx`.
