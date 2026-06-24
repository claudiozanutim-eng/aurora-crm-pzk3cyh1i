import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  avatar?: string
  email?: string
  ativo?: boolean
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
