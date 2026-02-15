import { Hono } from 'hono'
import projectsRouter from './projects'
import modelsRouter from './models'

const apiRouter = new Hono()

apiRouter.route('/projects', projectsRouter)
apiRouter.route('/models', modelsRouter)

export default apiRouter
