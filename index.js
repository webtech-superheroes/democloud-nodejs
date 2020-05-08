const express = require("express")
const Sequelize = require('sequelize')
const axios = require("axios")
let sequelize

if(process.env.MYSQLCONNSTR_localdb) {
    let result = process.env.MYSQLCONNSTR_localdb.split(";")
    
    sequelize = new Sequelize(result[0].split("=")[1], result[2].split("=")[1], result[3].split("=")[1], {
        dialect: "mysql",
        host: result[1].split("=")[1].split(":")[0],
        port: result[1].split("=")[1].split(":")[1]
    })
} else {
    sequelize = new Sequelize('profile', 'root', 'password', {
        dialect: "mysql",
        host: "aatty9p2au0i0u.chzq885goq4p.us-east-1.rds.amazonaws.com",
        port: 3306
    })
}

sequelize.authenticate().then(() => {
    console.log("Connected to database")
}).catch(() => {
    console.log("Unable to connect to database")
})

const Messages = sequelize.define('messages', {
    subject: Sequelize.STRING,
    name: Sequelize.STRING,
    message: Sequelize.TEXT
})

const app = express()

app.use('/', express.static('frontend'))

//definesc un endpoint de tip GET /hello
app.get('/hello', (request, response) => {
   response.status(200).json({hello: process.env})
})

app.post('/github/:code', async (req, res) => {
    const code = req.params.code
    try {
        let auth = await axios({
            url: 'https://github.com/login/oauth/access_token',
            method: 'POST',
            data: {
                client_id: '78ee08dd6f900a5e9a47',
                client_secret: '8c5a5340527a6fe3c6345bfcf30cb3475d4959a8',
                code: code,
            },
            headers: {
                'Accept': 'application/json' 
            }
        })
        res.status(200).json(auth['data'])
    } catch(err) {
        res.status(500).json(err)
    }
})

app.get('/createdb', (request, response) => {
    sequelize.sync({force:true}).then(() => {
        response.status(200).send('tables created')
    }).catch((err) => {
        console.log(err)
        response.status(200).send('could not create tables')
    })
})

app.use(express.json())
app.use(express.urlencoded())

//definire endpoint POST /messages
app.post('/messages', (request, response) => {
    Messages.create(request.body).then((result) => {
        response.status(201).json(result)
    }).catch((err) => {
        response.status(500).send("resource not created")
    })
})

app.get('/messages', (request, response) => {
    Messages.findAll().then((results) => {
        response.status(200).json(results)
    })
})

app.get('/messages/:id', (request, response) => {
    Messages.findByPk(request.params.id).then((result) => {
        if(result) {
            response.status(200).json(result)
        } else {
            response.status(404).send('resource not found')
        }
    }).catch((err) => {
        console.log(err)
        response.status(500).send('database error')
    })
})

app.put('/messages/:id', (request, response) => {
    Messages.findByPk(request.params.id).then((message) => {
        if(message) {
            message.update(request.body).then((result) => {
                response.status(201).json(result)
            }).catch((err) => {
                console.log(err)
                response.status(500).send('database error')
            })
        } else {
            response.status(404).send('resource not found')
        }
    }).catch((err) => {
        console.log(err)
        response.status(500).send('database error')
    })
})

app.delete('/messages/:id', (request, response) => {
    Messages.findByPk(request.params.id).then((message) => {
        if(message) {
            message.destroy().then((result) => {
                response.status(204).send()
            }).catch((err) => {
                console.log(err)
                response.status(500).send('database error')
            })
        } else {
            response.status(404).send('resource not found')
        }
    }).catch((err) => {
        console.log(err)
        response.status(500).send('database error')
    })
})

app.listen(process.env.PORT||8080)