import EventEmitter from "events";

const event = new EventEmitter({
  captureRejections:false
})

event.on("test",async() => {
  await new Promise<void>((done) => {
    setTimeout(() => {
      console.log(1)
      done()
    },1000)
  })
})
event.on("test",async() => {
  console.log(2)
})
event.emit("test")
