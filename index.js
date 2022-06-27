import express, { json } from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from "mongodb";
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br.js';
import joi from 'joi';


const mongoClient = new MongoClient("mongodb+srv://BiaChamsim:Bia310193@cluster0.9buio.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("banco_teste");
});

const app = express();

app.use(json());
app.use(cors());

app.post('/participants', async (req, res) => {
    const { name } = req.body;
    const userSchema = joi.object({
        name: joi.string().required()
    });
 
    const { error } = userSchema.validate({name});

     if(error){
        const errorDescription = error.details.map(item => item.message)
        res.status(422).send(errorDescription);
        return
     }
    
    try{
        const existentUser = await db.collection("users").findOne({name})
    
        if(existentUser){
            res.status(409).send('Este usuário já existe')
            return 
        }

        const user = await db.collection("users").insertOne({name, lastStatus: Date.now()});
        
        const message = await db.collection("messages").insertOne({
            from: name, 
            to: 'Todos', 
            text: 'entra na sala...', 
            type: 'status', 
            time: dayjs().format('HH:mm:ss')
        })

        res.status(201).send();

    }catch (error){
        res.status(500).send();
    }; 

})

app.get('/participants', async (req, res) => {
    const users = await db.collection("users").find().toArray();
    res.send(users);
})

app.post('/messages', async (req, res) => {
    const body = req.body;
    const { user } = req.headers;
        
    try{        
        const messageSchema = joi.object({
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.valid('message','private_message').required(),
            from: joi.string().required()    
        });


        const {error} = messageSchema.validate({...body, from:user}, {abortEarly: false});      
        if(error){
            const errorDescription = error.details.map(item => item.message)
            res.status(422).send(errorDescription);
            return            
        }        

        const users = await db.collection("users").find().toArray();
        const usersArray = users.find(participant => participant.name === user)

        console.log(usersArray)

        if(!usersArray){
            res.status(422).send("erro aqui");
            return
        }       
      
        await db.collection("message").insertOne({...body, from:user, time:dayjs().format('HH:mm:ss')})        
        res.status(201).send();
        
    }catch(error){
        console.log(error)
        res.status(500).send();
    }

})

app.get('/messages', async (req, res) =>{

    const {limit} = req.query;
    const {user} = req.headers;
    
    try{
        const sendMessage = await db.collection("messages").find({$or:[{to:"Todos"},{to:user},{from:user}]}).toArray()
                
        if(!limit || limit > sendMessage.lenght){
            res.send(sendMessage)
            return
        }else{
            const firstParam = (sendMessage.length) - limit
            const secondparam = sendMessage.length
            const filteredMessages = sendMessage.slice(firstParam, secondparam )
            res.send(filteredMessages)
        }        
    
    }catch(error){
        console.log(error)
        res.status(500).send()
    }
})

app.post('/status', async (req, res) =>{
    const {user} = req.headers;

    try{
        const participants = await db.collection("users")
        const checkParticipant = await participants.findOne({name: user})
        console.log(checkParticipant)

        if(!checkParticipant){
            res.status(404).send();
            return
        }

        await db.collection("participants").updateOne({name:user}, {$set: {lastStatus:Date.now()}})
        console.log(participants)

        res.status(200).send()
    }catch(error){
        console.log(error)
        res.status(500).send()
    }
})


async function automaticRemoval(){
    try{
        const participants = await db.collection("participants").find().toArray();
        const loggedOutUser = participants.filter(status => ((status.lastStatus + 10000) < Date.now()))
    
        if(loggedOutUser){
            loggedOutUser.forEach(status => {
                db.collection("participants").deleteOne({_id: new ObjectId(status._id)})
                db.collection("messages").insertOne({
                    from: status.name,
                    to: "Todos",
                    text: "sai da sala..." ,
                    type: "status",
                    time: dayjs().format("HH:MM:SS")
                })
            })
        }
    }catch(error){
        console.log(error)
        res.status(500).send()
    }
}

setInterval(automaticRemoval, 15000);


app.listen(5000, () => {
    console.log('Servidor funfando')
});