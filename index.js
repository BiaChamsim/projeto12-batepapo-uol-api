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
    const {to, text, type} = req.body;
    const {User: from} = req.header;

    
    try{        
        const messageSchema = joi.object({
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.valid('message','private_message').required(),
            from: joi.string().required()    
        });

        const {error} = messageSchema.validate({to, text, type, from}, {abortEarly: false});
    
        if(error){
            const errorDescription = error.details.map(item => item.message)
            res.status(422).send(errorDescription);
            console.log(errorDescription)
            return
        }

        users = await db.collection("users").find().toArray();
        usersArray = users.find(users => users.name === from)
         if(!usersArray){
            res.status(422).send();
            return
         }
        
        /*const existentUser = await db.collection("users").findOne({name:from})
        if(existentUser){
            res.status(409).send('Este usuário já existe')
            return 
        }*/

       
        await db.collection("message").insertOne({to, text, type, from, time:dayjs().format('HH:mm:ss')})
        
        res.status(201).send();
    }catch(error){
        console.log(error)
        res.status(500).send();
    }

})










app.listen(5000, () => {
    console.log('Servidor funfando')
});