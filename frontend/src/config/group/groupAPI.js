import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const groupAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

groupAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

export const createGroup = (data) => {
  return groupAPI.post('/groups', data)
}

export const getMyGroups = () => {
  return groupAPI.get('/groups')
}

export const getGroup = (groupId) => {
  return groupAPI.get(`/groups/${groupId}`)
}

export const updateGroup = (groupId, data) => {
  return groupAPI.patch(`/groups/${groupId}`, data)
}

export const addMember = (groupId, data) => {
  return groupAPI.post(`/groups/${groupId}/members`, data)
}

export const updateMemberRole = (groupId, memberId, data) => {
  return groupAPI.patch(
    `/groups/${groupId}/members/${memberId}/role`,
    data
  )
}

export const removeMember = (groupId, memberId) => {
  return groupAPI.delete(
    `/groups/${groupId}/members/${memberId}`
  )
}

export const archiveGroup = (groupId) => {
  return groupAPI.patch(`/groups/${groupId}/archive`)
}

export const listGroups = getMyGroups
export const getGroupById = getGroup
export const toggleArchive = archiveGroup

export default groupAPI
