// A small WAV can be sliced in memory. Never put partial (206) responses in Cache.
export function byteRange(value, length) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value)
  if (!match || (!match[1] && !match[2]) || length <= 0) return null
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(Number(match[2]), length - 1) : length - 1
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= length)
    return null
  return { start, end }
}
