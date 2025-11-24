import { Hono } from 'hono'
import projectsRouter from './projects'

const apiRouter = new Hono()

apiRouter.route('/projects', projectsRouter)

export default apiRouter
