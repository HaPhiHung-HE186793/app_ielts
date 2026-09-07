import { describe, expect, it } from 'vitest'
import { byteRange } from './range.js'

describe('cached audio ranges', () => {
  it('serves bounded, open, suffix and clamped ranges', () => {
    expect(byteRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 })
    expect(byteRange('bytes=80-', 100)).toEqual({ start: 80, end: 99 })
    expect(byteRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 })
    expect(byteRange('bytes=-200', 100)).toEqual({ start: 0, end: 99 })
    expect(byteRange('bytes=80-200', 100)).toEqual({ start: 80, end: 99 })
  })
  it('rejects unsatisfiable, invalid and multiple ranges without leaking full data', () => {
    for (const header of [
      'bytes=100-',
      'bytes=8-2',
      'bytes=-0',
      'bytes=-',
      'bytes=0-1,3-4',
      'items=0-4',
      'bytes=NaN-',
      'bytes=9007199254740992-',
    ])
      expect(byteRange(header, 100)).toBeNull()
    expect(byteRange('bytes=0-', 0)).toBeNull()
  })
})
