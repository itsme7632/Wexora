/**
 * Stub for @google-cloud/storage in the serverless bundle.
 *
 * The real client only works on Replit (it authenticates against the local
 * sidecar at 127.0.0.1:1106). This deployment does not run on Replit, so the
 * dependency is stubbed with explicit, honest errors: constructing the client
 * is allowed (routes create services at module load), but every operation
 * fails loudly at request time with a clear message instead of opaque
 * module-resolution errors.
 *
 * Restoring real object storage = install a storage backend and swap this
 * stub for a genuine client (see artifacts/api-server/src/lib/objectStorage.ts).
 */
const STUB_MSG =
  "Object storage is not configured on this deployment (Replit-only storage client stubbed out).";

export class Storage {
  constructor() {}
  bucket() {
    throw new Error(STUB_MSG);
  }
}

export class File {
  constructor() {}
}

export default { Storage, File };
