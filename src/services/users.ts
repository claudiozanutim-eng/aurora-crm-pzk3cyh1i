import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  avatar?: string
}

export const getUsers = async () => {
  return pb.collection('users').getFullList<User>({
    sort: 'name',
  })
}
