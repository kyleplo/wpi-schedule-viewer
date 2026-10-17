import { handleAsNodeRequest } from "cloudflare:node"

import express from "express"
import mongoose from "mongoose"

import { courseRoutes } from "./courses.js"
import { fetchCourseData } from "./fetchCourseData.js";
import cookieSession from 'cookie-session';
import { authRoutes } from "./auth.js";
import { CourseDBStatus } from "./models.js";

const app: express.Express = express()

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/?ssl=true&replicaSet=atlas-stcr8s-shard-0&authSource=${process.env.DB_USER}`;

// https://mongoosejs.com/docs/index.html

app.use(express.json());
app.use(cookieSession({
  name: 'session',
  //made using randomkeygen.com
  keys: [process.env.SESSION_KEY_1 as string, process.env.SESSION_KEY_2 as string]
}))
authRoutes(app);
courseRoutes(app);

app.listen(3000)

export default {
  async fetch(req: Request, env: Env) {
    if (req.url.includes("/api/")) {
      await mongoose.connect(uri)
      const res = await handleAsNodeRequest(3000, req);
      await mongoose.disconnect();
      return res;
    } else {
      // This shouldn't ever happen because of how Workers handles static asset routing but just in case
      return env.ASSETS.fetch(req);
    }
  },
  async scheduled() {
    await mongoose.connect(uri)
    const courseDbStatus = await CourseDBStatus.findOne() || new CourseDBStatus({
      lastUpdate: 0
    });

    if (Date.now() > courseDbStatus.lastUpdate + 86400000) {
      await fetchCourseData();
      courseDbStatus.lastUpdate = Date.now();
      await courseDbStatus.save();
    }
    await mongoose.disconnect();
  }
}