import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  avatar?: string
  email?: string
  ativo?: boolean
  perfil?: 'Admin' | 'Usuário'
}

export const getAllUsers = async () => {
  return pb.collection('users').getFullList<User>({
    sort: 'name',
  })
}

export const getUsers = async () => {
  return pb.collection('users').getFullList<User>({
    filter: 'ativo = true',
    sort: 'name',
  })
}

export const updateUserStatus = async (id: string, ativo: boolean) => {
  return pb.collection('users').update(id, { ativo })
}

export const createUser = async (
  data: Partial<User> & { password?: string; passwordConfirm?: string },
) => {
  return pb.collection('users').create<User>({ ...data, emailVisibility: true })
}

export const updateUser = async (
  id: string,
  data: Partial<User> & { password?: string; passwordConfirm?: string },
) => {
  return pb.collection('users').update<User>(id, data)
}
