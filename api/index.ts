import { handleApi } from '../server/api.ts'

export default {
  fetch(request: Request) {
    return handleApi(request)
  },
}
