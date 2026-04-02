/**
 * Schema 路由 — 根据 DB_TYPE 环境变量选择 SQLite 或 PostgreSQL schema
 * 默认使用 SQLite（向后兼容）
 *
 * 使用 SQLite schema 类型作为规范类型（两种 schema 结构完全一致）
 */

import type * as SqliteSchema from './schema-sqlite.js'

const DB_TYPE = process.env.DB_TYPE || 'sqlite'

const mod = DB_TYPE === 'postgres'
  ? await import('./schema-pg.js')
  : await import('./schema-sqlite.js')

type S = typeof SqliteSchema

export const dramas = mod.dramas as unknown as S['dramas']
export const episodes = mod.episodes as unknown as S['episodes']
export const characters = mod.characters as unknown as S['characters']
export const episodeCharacters = mod.episodeCharacters as unknown as S['episodeCharacters']
export const episodeScenes = mod.episodeScenes as unknown as S['episodeScenes']
export const scenes = mod.scenes as unknown as S['scenes']
export const storyboards = mod.storyboards as unknown as S['storyboards']
export const storyboardCharacters = mod.storyboardCharacters as unknown as S['storyboardCharacters']
export const aiServiceConfigs = mod.aiServiceConfigs as unknown as S['aiServiceConfigs']
export const aiServiceProviders = mod.aiServiceProviders as unknown as S['aiServiceProviders']
export const aiVoices = mod.aiVoices as unknown as S['aiVoices']
export const agentConfigs = mod.agentConfigs as unknown as S['agentConfigs']
export const imageGenerations = mod.imageGenerations as unknown as S['imageGenerations']
export const videoGenerations = mod.videoGenerations as unknown as S['videoGenerations']
export const videoMerges = mod.videoMerges as unknown as S['videoMerges']
export const props = mod.props as unknown as S['props']
export const assets = mod.assets as unknown as S['assets']
