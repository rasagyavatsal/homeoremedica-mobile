# HomeoRemedica Mobile

Standalone Expo application. Remedy data is not bundled in the app; symptom and remedy searches use the server API configured by `EXPO_PUBLIC_API_URL`.

## Development

```sh
cp .env.example .env
npm install
npm start
```

Run checks with `npm run typecheck` and `npm test`.

### Android

Install JDK 17 and the Android SDK, then configure these machine-level environment variables:

- `JAVA_HOME`: the local JDK 17 directory.
- `ANDROID_HOME`: `$HOME/Library/Android/sdk` on macOS or `%LOCALAPPDATA%\Android\Sdk` on Windows.
- `PATH`: include the `bin` directory under `JAVA_HOME` and the `platform-tools` and `emulator` directories under `ANDROID_HOME`.

Create an Android virtual device named `Medium_Phone`, place the ignored development `google-services.json` in the repository root, then run:

```sh
npm run emulator
npm run android
```

## Production

Copy `.env.example` to `.env.local` for development. It targets the isolated `homeoremedica-dev` Firebase project and development App Hosting API. Production Firebase and API values belong only in the owner-controlled EAS production environment. Firebase client values are public identifiers, but signing files and service-account credentials must never be committed.

This repository was extracted from the private HomeoRemedica monorepo with a clean history so private remedy data cannot be recovered from earlier commits.
