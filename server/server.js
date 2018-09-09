var express = require("express")
var mongoose = require("mongoose")
var bodyParser = require("body-parser")

var app = express()
var http = require("http").Server(app)
var io = require("socket.io")(http)
var cors = require('cors')
app.use(cors())
var conString = "mongodb://127.0.0.1:27017/whiteBoardDb";
app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

mongoose.Promise = Promise

var Boards = mongoose.model("whiteboards", {
    name: String,
    board: String
})

mongoose.connect(conString, { useMongoClient: true }, (err) => {
    console.log("Database connection", err)
})


app.post("/board", async (req, res) => {
    try {
        var board = new Boards(req.body)
        var query = {'name':req.body.name};
        Boards.findOne(query, function(err, board) {
            if(!err) {
                if(!board) {
                    var board = new Boards()
                    board.name = req.body.name;
                }
                board.board = req.body.board;
                board.save(function(err) {
                    if(!err) {
                        console.log("board updated");
                    }
                    else {
                        console.log("Error: could not save image " + board.name);
                    }
                });
            }
        });

        res.send({'success':true});
    } catch (error) {
        res.sendStatus(500)
        console.error(error)
    }
})

app.get("/board", (req, res) => {
    Boards.find({'name':'whiteboard'}, (error, boards) => {
        res.send(boards)
    })
})

io.on("connection", (socket) => {
    console.log("Socket is connected...")
    socket.on('message', (m) => {
        console.log('[server:node](message): %s', JSON.stringify(m));
        io.emit('message', m);
    });
    socket.on('draw', (m) => {

        console.log('[server:node](draw): %s', JSON.stringify(m));
        io.emit('draw', m);
    });
    socket.on('color', (m) => {

        console.log('[server:node](color): %s', JSON.stringify(m));
        io.emit('color', m);
    });

    socket.on('clear', () => {

        console.log('[server:node](clear)');
        io.emit('clear');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
})

var server = http.listen(3020, () => {
    console.log("Well done, now I am listening on ", server.address().port)
})
