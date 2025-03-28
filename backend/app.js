import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path";
const app = express()
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(cookieParser())
import userRoutes from './routes/user.routes.js'

app.use("/api/v1/users",userRoutes)
app.use('/uploads', express.static('uploads'));

export{app} 