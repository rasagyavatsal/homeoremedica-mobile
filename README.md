# HomeoRemedica Mobile

Standalone Expo application. Remedy data is not bundled in the app; symptom and remedy searches use the server API configured by `EXPO_PUBLIC_API_URL`.

## Development

```sh
cp .env.example .env
pnpm install
pnpm start
```

Run checks with `pnpm typecheck` and `pnpm test`. Android development uses `pnpm android` with Java 17.

## Production

Set `EXPO_PUBLIC_API_URL=https://homeoremedica.com/api` in the EAS environment. Firebase client values are public identifiers, but signing files and service-account credentials must never be committed.

This repository was extracted from the private HomeoRemedica monorepo with a clean history so private remedy data cannot be recovered from earlier commits.
