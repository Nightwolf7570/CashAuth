import { createHash, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

const FALLBACK_SALT = 'cashauth-admin-salt'
const FALLBACK_HASH_HEX = '9a3708f63da8f54facd593c6bfb5e246dc756eec1d13307a4b50e1f8da9b790b'

const getSalt = () => process.env.ADMIN_PASSWORD_SALT?.trim() || FALLBACK_SALT

const getExpectedHash = (): Buffer => {
  const configuredHashHex = process.env.ADMIN_PASSWORD_HASH?.trim()

  const hashHex = configuredHashHex && /^[a-f0-9]+$/i.test(configuredHashHex)
    ? configuredHashHex
    : FALLBACK_HASH_HEX

  try {
    return Buffer.from(hashHex, 'hex')
  } catch (error) {
    console.error('Failed to parse configured admin password hash:', error)
    return Buffer.from(FALLBACK_HASH_HEX, 'hex')
  }
}

const hashPassword = (value: string, salt: string) =>
  createHash('sha256').update(`${value}${salt}`).digest()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const suppliedPassword = typeof body?.password === 'string' ? body.password : ''

    const salt = getSalt()
    const expectedHash = getExpectedHash()
    const suppliedHash = hashPassword(suppliedPassword, salt)

    const hashesMatch =
      expectedHash.length === suppliedHash.length &&
      timingSafeEqual(suppliedHash, expectedHash)

    if (hashesMatch) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 },
    )
  } catch (error) {
    console.error('Failed to process admin login request:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid request payload' },
      { status: 400 },
    )
  }
}

