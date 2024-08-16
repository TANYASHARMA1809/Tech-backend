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

export {app}

