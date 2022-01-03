const express = require('express')
const knex = require("./db")
const path = require('path')
const session = require('express-session')
const mongoStore = require("connect-mongo");

const app = express()

const ContenedorProductos = require("./contenedor")
const ContendedorMensajes = require("./messages")

const contendProd = new ContenedorProductos()
const contendMensj = new ContendedorMensajes()

// middlewares
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json())
app.use(express.urlencoded({extended:false}))

//mongodb
app.use(
    session({
      store: mongoStore.create({
        mongoUrl:
          "mongodb+srv://Esteban:esteban343@coderdesafio.zqmpx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
      }),
      secret: "misecreto",
      saveUninitialized: true,
      resave: true,
    })
  );


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


// Router - session
app.get("/login", (req, res) => {
    res.render('login.html')
});

app.post("/login", async(req, res) => {
    const user = req.body;
    if (user.username != "") {
      let username = user.username  
      console.log(user.username);
      let msjbienvenida = `Bienvenido ${user.username}`
      req.session.user = user.username;
        
      let productos = await contendProd.getAll()
      let mensajes = await contendMensj.getAll()
  
      res.render('index.html', {productos, mensajes, msjbienvenida, username})
    //   res.redirect('/')
      return;
    }
    res.redirect("/login");
  });

  app.get('/logout', (req, res) => {
    const username = req.session.username
    if (username) {
        req.session.destroy(err => {
            if (!err) {
                res.render('logout.html', { username })
            } else {
                res.redirect('/login')
            }
        })
    } else {
        res.redirect('/login')
    }
  })

// Routes
app.get('/', async (req, res) => {
    let productos = await contendProd.getAll()
    let mensajes = await contendMensj.getAll()

    let msjbienvenida = `Bienvenido`
    let username = ''

    res.render('index.html', {productos, mensajes, msjbienvenida, username})
})

app.post('/', async(req, res) => {
    req.body.price = Number(req.body.price)
    await contendProd.save(req.body)

    res.redirect('/');
})

// Actualizar
app.put('/update/:id', async(req, res) => {
    await knex("products")
        .where({id: req.params.id})
        .update({title: req.body.title, price: req.body.price, thumbnail: req.body.thumbnail})
        .then((json) => {
            res.send({data:json})
        })
        .catch((err) => {
            res.send("Error al actualizar usuario")
        })
})

// Delete
app.delete('/delete/:id', async (req, res) => {
    await knex("products")
        .where({id: req.params.id})
        .del()
        .then((json) => {
            res.send({data: "Producto eliminado"})
        })
        .catch((err) => {
            res.send("Error al eliminar producto")
        })
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