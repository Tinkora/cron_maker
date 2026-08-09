# Release Checklist

[简体中文](./RELEASE_CHECKLIST.zh-CN.md)

Use this checklist for every cron_maker release. It defines gates; it does not assert that the target repository, a deployment, a tag, or a Release already exists. Record evidence for each checked item in the release pull request or tracking issue.

## Release Record

- Version: `vX.Y.Z`
- Target commit:
- Release owner:
- Reviewer:
- Planned date:
- Tracking issue or pull request:

## 1. Scope and Contract

- [ ] Every described capability is implemented and tested; proposed work is not presented as available.
- [ ] Changes fit [Product Scope](./PRODUCT_SCOPE.md), or a reviewed scope decision is linked.
- [ ] [Product Contract](./CONTRACT.md) matches Rust, WASM, and browser behavior.
- [ ] [Maturity](./MATURITY.md) reports experimental areas and limitations honestly.
- [ ] English and Simplified Chinese documents have equivalent meaning.
- [ ] `CHANGELOG.md` records user-visible changes, fixes, security notes, and migrations under the intended version.
- [ ] Public text contains no previous organization, account, domain, internal history, private path, credential, or unsupported capability claim.
- [ ] Six- and seven-field cron, `L`, `W`, `#`, `+`, and `?` remain explicitly outside the contract.
- [ ] Code comments and commits are English; Markdown contains no emoji.

## 2. Version and Repository State

- [ ] The working tree is clean and the exact release commit has been reviewed.
- [ ] `Cargo.toml`, crate manifests, and `Cargo.lock` agree on the intended version and Rust 1.85 baseline.
- [ ] Repository, homepage, license, description, and documentation URLs use `https://github.com/Tinkora/cron_maker`.
- [ ] The target repository URL is accessible before publishing links that depend on it.
- [ ] The intended tag and GitHub Release do not already exist.
- [ ] Maintainer ownership, release authority, and a continuity contact are recorded in [Maintainers](./MAINTAINERS.md).
- [ ] Required reviews and branch-protection checks are satisfied.

## 3. Rust and WebAssembly Verification

Run with the declared toolchain, including Rust 1.85 for MSRV evidence:

```bash
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
rustup target add wasm32-unknown-unknown
cargo check -p cron_maker_core --target wasm32-unknown-unknown
cargo check -p cron_maker_web --target wasm32-unknown-unknown

cd crates/cron_maker_web
npm ci
npx playwright install chromium
npm run test:browser:local
```

- [ ] Formatting passes.
- [ ] All workspace tests pass.
- [ ] Strict Clippy passes without broad lint suppression.
- [ ] Both crates compile for `wasm32-unknown-unknown`.
- [ ] `wasm-pack` builds the web package from the locked dependency graph.
- [ ] The Playwright suite passes at all four configured viewport widths.
- [ ] Boundary tests cover 256 UTF-8 bytes, 50 occurrences, invalid field counts, rejected modifiers, invalid zones, and invalid timestamps.
- [ ] Fixed-timestamp tests cover at least one DST gap and one DST overlap.
- [ ] Fixed-timestamp tests cover regions changed by the bundled IANA release's `NEWS` entries.

## 4. Browser Verification

Build and serve the exact candidate:

```bash
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

- [ ] The app loads with no console error or warning and the WASM request succeeds.
- [ ] No unexpected external runtime request occurs and entered expressions are not transmitted.
- [ ] English is the default; the Simplified Chinese switch updates visible and accessible text.
- [ ] Visual editing, raw editing, supported aliases, presets, validation, descriptions, and copy work.
- [ ] Six- and seven-field expressions and each rejected modifier show a useful error.
- [ ] A valid IANA time zone renders selected-zone time from the bundled database and UTC consistently.
- [ ] An invalid IANA identifier fails without retaining a misleading schedule.
- [ ] Occurrence choices 5, 10, 20, and 50 render the requested number of rows.
- [ ] Occurrences refresh at a minute boundary and after visibility or focus resumes.
- [ ] The footer and WASM API report the same bundled IANA release.
- [ ] Keyboard tab behavior, focus order, labels, and live status announcements work.
- [ ] At 375, 768, 1024, 1280, 1281, and 1440 pixels, there is no horizontal overflow, clipping, or incoherent overlap.
- [ ] Reduced-motion behavior and visible focus are preserved.

## 5. Security and Supply Chain

- [ ] GitHub private vulnerability reporting is enabled at the target repository and opens a private advisory form.
- [ ] No unresolved high- or critical-severity advisory blocks release.
- [ ] Dependency, license, and vulnerability checks required by repository policy pass.
- [ ] `npm run check:lockfile` confirms every resolved package uses HTTPS from the official npm registry.
- [ ] The manually dispatched Supply chain workflow confirms that the bundled tzdb equals IANA's current release.
- [ ] GitHub Actions are pinned according to repository policy and use least-privilege permissions.
- [ ] Workflows do not pipe unauthenticated network content into a shell or expose secrets to untrusted pull requests.
- [ ] Release artifacts include required checksums, provenance, or attestations.
- [ ] Secret scanning finds no credentials or sensitive schedule examples.

## 6. Publish

- [ ] Merge the release change only after all gates pass.
- [ ] Create a signed or repository-policy-compliant annotated tag from the verified commit.
- [ ] Build release artifacts from the tag; do not upload unverified local artifacts.
- [ ] Publish release notes derived from the changelog with all compatibility warnings.
- [ ] Confirm source links, license files, artifacts, and any checksums or attestations are downloadable.
- [ ] Verify documentation and community links only after the target repository is available.

## 7. Post-Release

- [ ] Open the published application in a clean browser session and validate one common expression in UTC and one DST-observing IANA zone.
- [ ] Confirm README links and private security reporting resolve; verify Issues and Discussions remain disabled and no public document exposes a disabled contribution link.
- [ ] Confirm release and deployment automation is green on the exact published commit.
- [ ] Announce only capabilities present in the released contract.
- [ ] Create owned follow-up issues for deferred work; do not leave unsupported claims in public text.

## Stop Conditions

Do not publish if a required check fails, browser-local privacy is violated, a high- or critical-severity vulnerability is unresolved, bilingual documents disagree materially, the target repository or security channel is unavailable, maintainer ownership is unclear, or the candidate cannot be rebuilt from the target commit.
