import assert from 'node:assert/strict'
import test from 'node:test'

import sharp from 'sharp'

test('the production Sharp runtime decodes, resizes, and encodes web images', async () => {
  const input = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#ff7a1a"/></svg>',
  )

  const output = await sharp(input, { limitInputPixels: 1_000_000 })
    .resize(12, 12, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()
  const metadata = await sharp(output).metadata()

  assert.equal(metadata.format, 'webp')
  assert.equal(metadata.width, 12)
  assert.equal(metadata.height, 12)
  assert.ok(output.byteLength > 0)
})
