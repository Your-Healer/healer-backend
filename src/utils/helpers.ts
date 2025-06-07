export function stringToHex(str: string): string {
  const encoder = new TextEncoder()
  const bytes: Uint8Array = encoder.encode(str)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToString(hex: string): string {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string length must be even')
  }

  const bytes: Uint8Array = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

export function dateToHex(date: Date): string {
  const isoString = date.toISOString()
  const encoder = new TextEncoder()
  const bytes = encoder.encode(isoString)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToDate(hex: string): Date {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string length must be even')
  }

  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
  const decoder = new TextDecoder()
  const isoString = decoder.decode(bytes)
  return new Date(isoString)
}
