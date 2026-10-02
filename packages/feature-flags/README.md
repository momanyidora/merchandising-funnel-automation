# Feature Flags

`@mms/feature-flags` is a small shared package used by services to gate module routes, consumers, and background workers by deployment phase.

## Configuration

The package exports `isFeatureEnabled(feature: string): boolean`. It reads `config/features.json` from the process working directory’s expected workspace-relative location and returns `true` only when that feature is explicitly set to `true`. If the configuration file is missing, it returns `false`.

Example configuration:

```json
{
  "vendor-management": true,
  "procurement": true,
  "inventory": true
}
```

Keep the feature keys aligned with those used by each service. See the repository root README for the current module-to-flag mapping.

## Build

```bash
npm run build --workspace=@mms/feature-flags
```
