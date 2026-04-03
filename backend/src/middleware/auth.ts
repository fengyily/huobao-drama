import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'huobao-drama-secret-key-change-in-production'

export interface AuthUser {
  id: number
  email: string
  username: string
  role: string
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ code: 401, message: '未登录' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const user = verifyToken(token)
    c.set('user', user)
    await next()
  } catch {
    return c.json({ code: 401, message: '登录已过期，请重新登录' }, 401)
  }
}

export function getUser(c: Context): AuthUser {
  return c.get('user') as AuthUser
}
