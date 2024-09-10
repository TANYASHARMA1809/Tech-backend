import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//data bht tariko se backend pr ayega,kch ka json mai ayega,kch ka data mai ayega,
//for this we use midleware to handle data

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"18kb"}))
app.use(express.static("public"))//to store some files or assests in public folder
app.use(cookieParser())//access cokkies of user from server or operate crud operation to handle secure cookies from server


// import routes
import userRouter from "./routes/user.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration= earlier we were using get method but now we are using middleware so we will handle it by use method

app.use("/api/v1/users",userRouter)
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

//http://localgost:8000/api/v1/users/register











export {app}

