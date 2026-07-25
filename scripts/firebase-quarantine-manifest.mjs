// Hash-only, frozen-export manifest for references whose target was proven
// absent from Firebase Auth and every Firestore document during cutover audit.
// Adding a new row requires a fresh source audit and an explicit migration.

const QUARANTINED_FIRESTORE_REFERENCE_MANIFEST = new Set([
  'conversations\0' +
    '77ab9b2d9589ea474bf82d972e3719e0290d65feafb14a1bb2ecb829a5a81a9d\0' +
    'participant_ref\0' +
    '8dfa913fcf0b4badb981d3e8891f5ef0692bab1960685ca77b400f31d3de202d\0' +
    '8e05cb003c445e3b5bd3bbd5336f0bb2d6b71aec8ebaaa6196b85d2588e1b274',
  'jobs\0' +
    'e7825afd4dba4f8fa840c305377165b2e3cc73d900219eda610ddcd93abf05cc\0' +
    'company_ref\0' +
    '3a339982067713c0bdf5632501aaa6018c387411409261f8ba9e970fa9ff71d9\0' +
    'd85d4a82a8444e8c27328ad9c02cdb7af185b603b06f5398c3985a46b44c14e8',
  'partnerships\0' +
    '8f74d8eb6bd64d4e823757bdecff2fbe245673f3c79edb092baef88396eb02e0\0' +
    'partner_ref\0' +
    '5316111208004eecb4bdc272095c3d52fb0566183ffcc8c6092da87c625ccd08\0' +
    'd85d4a82a8444e8c27328ad9c02cdb7af185b603b06f5398c3985a46b44c14e8',
])

function quarantinedFirestoreManifestKey(
  sourceCollection,
  sourceIdSha256,
  sourceField,
  sourceHash,
  targetRefSha256,
) {
  return `${sourceCollection}\0${sourceIdSha256}\0${sourceField}\0${sourceHash}\0${targetRefSha256}`
}

function isApprovedQuarantinedFirestoreReference(
  sourceCollection,
  sourceIdSha256,
  sourceField,
  sourceHash,
  targetRefSha256,
) {
  return QUARANTINED_FIRESTORE_REFERENCE_MANIFEST.has(quarantinedFirestoreManifestKey(
    sourceCollection,
    sourceIdSha256,
    sourceField,
    sourceHash,
    targetRefSha256,
  ))
}

export {
  QUARANTINED_FIRESTORE_REFERENCE_MANIFEST,
  isApprovedQuarantinedFirestoreReference,
  quarantinedFirestoreManifestKey,
}
