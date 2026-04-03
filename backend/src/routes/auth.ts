import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { success, badRequest, now } from '../utils/response.js'
import { signToken, authMiddleware, getUser } from '../middleware/auth.js'

const app = new Hono()

// POST /auth/register
app.post('/register', async (c) => {
  const { email, username, password } = await c.req.json()

  if (!email || !username || !password) {
    return badRequest(c, '邮箱、用户名和密码不能为空')
  }

  if (password.length < 6) {
    return badRequest(c, '密码至少6位')
  }

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email))
  if (existing) {
    return badRequest(c, '该邮箱已注册')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const ts = now()
  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      username,
      passwordHash,
      role: 'user',
      createdAt: ts,
      updatedAt: ts,
    })
    .returning()

  const token = signToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  })

  return success(c, {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
    },
  })
})

// POST /auth/login
app.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return badRequest(c, '邮箱和密码不能为空')
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email))
  if (!user) {
    return badRequest(c, '邮箱或密码错误')
  }

  if (!user.isActive) {
    return badRequest(c, '账号已被禁用')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return badRequest(c, '邮箱或密码错误')
  }

  await db.update(schema.users).set({ lastLoginAt: now() }).where(eq(schema.users.id, user.id))

  const token = signToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  })

  return success(c, {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
    },
  })
})

// GET /auth/me (protected)
app.get('/me', authMiddleware, async (c) => {
  const authUser = getUser(c)
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, authUser.id))
  if (!user) {
    return c.json({ code: 401, message: '用户不存在' }, 401)
  }
  return success(c, {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    role: user.role,
    created_at: user.createdAt,
  })
})

// PUT /auth/profile (protected)
app.put('/profile', authMiddleware, async (c) => {
  const authUser = getUser(c)
  const body = await c.req.json()
  const updates: Record<string, unknown> = { updatedAt: now() }
  if (body.username) updates.username = body.username
  if (body.avatar) updates.avatar = body.avatar
  await db.update(schema.users).set(updates).where(eq(schema.users.id, authUser.id))
  return success(c)
})

// PUT /auth/password (protected)
app.put('/password', authMiddleware, async (c) => {
  const authUser = getUser(c)
  const { old_password, new_password } = await c.req.json()

  if (!old_password || !new_password) {
    return badRequest(c, '旧密码和新密码不能为空')
  }
  if (new_password.length < 6) {
    return badRequest(c, '新密码至少6位')
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, authUser.id))

  if (!user) {
    return c.json({ code: 401, message: '用户不存在' }, 401)
  }

  const valid = await bcrypt.compare(old_password, user.passwordHash)
  if (!valid) {
    return badRequest(c, '旧密码错误')
  }

  const passwordHash = await bcrypt.hash(new_password, 10)
  await db
    .update(schema.users)
    .set({ passwordHash, updatedAt: now() })
    .where(eq(schema.users.id, authUser.id))

  return success(c)
})

export default app
