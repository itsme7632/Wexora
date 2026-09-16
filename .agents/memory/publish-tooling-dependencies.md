---
name: Publish tooling dependencies
description: Publish installs every workspace package, so code-generation-only tools can block unrelated runtime artifacts.
---

Keep publish-time workspace dependencies limited to packages needed to build or run the deployable artifacts. Generated API clients are committed, so code-generation tooling that the package firewall rejects must not be part of the publish install closure.

**Why:** Publishing failed before the build because a dev-only Orval tarball was fetched for the API-spec package even though VaultX consumed already-generated output.

**How to apply:** When a publish install fails on a tooling package unrelated to the deployed artifact, isolate that tooling package from the workspace install rather than changing runtime code or bypassing the firewall.