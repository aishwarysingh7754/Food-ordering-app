require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const expressLayout = require('express-ejs-layouts')
const path =  require('path')
const PORT = process.env.PORT || 3000
const mongoose=require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore=require('connect-mongo')
const passport = require('passport')
const Emitter = require('events')
//Database connection

const url='mongodb://localhost/foodorder';

mongoose.connect(url);

const connection=mongoose.connection;
connection.on('error', console.error.bind(console,'Connection Error'));

//Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    store: MongoDbStore.create({
        mongoUrl:url,
        // dbName:foodorder,
        collectionName:'sessions',
    }),
}));

// //session config
// app.use(session({
//     secret: process.env.COOKIE_SE
// }))

//Passport config
const passportInit = require('./app/config/passport')
const { Server } = require('http')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

//Session Store
// Assets
app.use(flash());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false}))
app.use(express.json())

//Global Middleware
app.use((req,res,next) => {
      res.locals.session = req.session
      res.locals.user = req.user
      next()
})
// set Template engine
app.use(expressLayout)
app.set('views',path.join(__dirname,'/resources/views'))
app.set('view engine','ejs')

require('./routes/web')(app);


const server = app.listen(PORT , () => {
    console.log(`Listening on port ${PORT}`)
})

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
// Join

socket.on('join', (orderId) => {
    console.log(socket.id,"hye")
socket.join(orderId)
})
})

eventEmitter.on('orderUpdated', (data) => {
    console.log(data,"order updated")
io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced',data)
})