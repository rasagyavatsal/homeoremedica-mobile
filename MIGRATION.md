# Migration record

Extracted from private monorepo commit `08bfbc0e429ff51557f9463dc22460a373b3c4c3` on 2026-07-12. The original private monorepo remains the history archive.

Old `apps/mobile` content became this standalone repository. Code previously retained in
the internal workspace package now lives in the app's root `lib` and `types` modules.
The bundled production database was removed and searches now use the web API.
