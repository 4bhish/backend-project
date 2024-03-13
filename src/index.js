import dotenv from 'dotenv'
import connectDB from './db/db.js';
import { app } from './app.js';

dotenv.config({
    path:'./env'
})




connectDB()
.then(() => {
    app.on("Error : ",(Error)=> {
        console.log("Error : ",Error);
        throw Error
    })
    app.listen(process.env.PORT || 8000,()=> {
        console.log(`Listening app on port ${process.env.PORT}`);
    })
})
.catch((e) => {
    console.error("MONGODB Connection failed: ",e);
}) 
