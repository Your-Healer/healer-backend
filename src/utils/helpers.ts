import cryptoJs from 'crypto-js'
import { GENDER } from './enum'

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

  const hexPairs = hex.match(/.{1,2}/g)
  if (!hexPairs) {
    throw new Error('Invalid hex string format')
  }

  const bytes: Uint8Array = new Uint8Array(hexPairs.map((byte) => parseInt(byte, 16)))
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

export function dateToHex(date: Date): string {
  const isoString = date.getTime().toString()
  const encoder = new TextEncoder()
  const bytes = encoder.encode(isoString)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToDate(hex: string): string {
  const timestamp = hexToString(hex)
  return timestamp
}

export function encryptString(str: string, key: string): string {
  return cryptoJs.AES.encrypt(str, key).toString()
}

export function decryptString(encryptedStr: string, key: string): string {
  try {
    const bytes = cryptoJs.AES.decrypt(encryptedStr, key)
    return bytes.toString(cryptoJs.enc.Utf8)
  } catch (error) {
    console.error('Failed to decrypt wallet mnemonic:', error)
    throw new Error('Decryption failed. Please check the key and the encrypted string.')
  }
}
