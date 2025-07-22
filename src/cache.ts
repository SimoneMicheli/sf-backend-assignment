import {Redis} from 'ioredis'

// Create a Redis instance.
// By default, it will connect to localhost:6379
const redis = new Redis()

redis.on("connect",()=>{
    console.log("Connected to redis")
})

redis.on("error",(error)=>{
    console.log(error)
})

export default redis