const express = require('express')
const knex = require("./db")
const path = require('path')
const app = express()

const ContenedorProductos = require("./contenedor")
const ContendedorMensajes = require("./messages")

const contendProd = new ContenedorProductos()
const contendMensj = new ContendedorMensajes()

// middlewares
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json())
app.use(express.urlencoded({extended:false}))


// Server 
const http = require('http')
const server = http.createServer(app)
const port = process.env.PORT || 8080


// Socket
const { Server, Socket } = require('socket.io');
const io = new Server(server)

// setting
app.set('views', path.join(__dirname, 'views'))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs')

// Routes
app.get('/', async (req, res) => {
    let productos = await contendProd.getAll()
    let mensajes = await contendMensj.getAll()

    res.render('index.html', {productos, mensajes})
})

app.post('/', async(req, res) => {
    req.body.price = Number(req.body.price)
    await contendProd.save(req.body)

    res.redirect('/');
})


// Conexion Socket 
io.on("connection", (socket) => {
    console.log("Client connected")

    // Productos
    socket.on("dataProducto", async(data) => {
        let productos = await contendProd.getAll()
        productos.push(data)
        await contendProd.save(data)

        io.sockets.emit('message_back', productos)
    })

    // Chat
    socket.on('dataMensaje', async(data) => {
        // console.log(data)
        let mensajesAll = await contendMensj.getAll()
        mensajesAll.push(data)
        await contendMensj.save(data)
        console.log(mensajesAll)
        io.sockets.emit('mensaje_enviado_guardado', mensajesAll)
    })
})


// listening the server
server.listen(port, () => {
    console.log("Server running on port", port)
})