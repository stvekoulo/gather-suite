# Publishing a version

Releases go through the Openship workflow `.openship/workflows/gather-release.yml`, on the VPS (GitHub Actions cannot be used).

1. Bump the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`, then in `lib/site.ts` of the `gather-landing` repository.
2. Push to `main`, then run the workflow in Openship.

The workflow cleans up what Gather left behind, limits the container to 2.2 GB of RAM to protect the server's other services, then builds Linux, Windows and macOS one after another. Each platform is published as soon as it is ready, so one failing does not stop the others. Openship keeps 8 MB of log per job: the job only shows key lines and the end, and the full log is in `/home/ubuntu/gather-release.log` on the VPS.

## Openship secrets and variables

| Name | Purpose |
| --- | --- |
| `RELEASE_GITHUB_TOKEN` | Cloning the repository and publishing |
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/gather-updater.key`. Without it, no automatic updates |
| `RELEASE_REPO` | Repository that receives the installers. Defaults to `stvekoulo/gather-suite` |

The `gather-suite` repository is public: the app and the landing page (private `gather-landing` repository) point to its releases. If it goes private again, downloads and updates stop working.

The private update key must never enter the repository. Losing it would make it impossible to update existing installations.

## macOS

The VPS builds macOS (Apple Silicon and Intel) with `osxcross`, mounted from the host. The workflow looks for it in the `OSXCROSS_ROOT` variable, then in the usual locations, and prints the path it picks. Without `osxcross`, macOS is skipped and Linux and Windows are still published.

`clang` 14 and 15 wrongly evaluate the `exclave*` tests in the 14.5 SDK's `TargetConditionals.h`, so macOS is never enabled. After installing `osxcross`, disable them once on the VPS:

```sh
sudo sed -i -E 's/\(__is_target_vendor\(apple\) && __is_target_environment\(exclave(core|kit)\)\)/(0)/' /home/ubuntu/osxcross/target/SDK/MacOSX14.5.sdk/usr/include/TargetConditionals.h
```

The workflow's `RELEASE_PLATFORMS` variable limits a build to one family (`linux`, `windows` or `macos`).

`scripts/vps-release.mjs` assembles the `.app`, because Tauri's bundler only does so on a Mac. The app is neither signed with an Apple Developer account nor notarized, so macOS blocks the first launch as coming from an unidentified developer (`xattr -cr /Applications/Gather.app` unblocks it). Lifting this requires an Apple Developer account.
