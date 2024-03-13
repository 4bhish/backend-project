const asynHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch(e => next(e))
    }
}

export {asynHandler}

// const asynHandler = (fn) => async(rq,res,next ) => {
//     try{
//         await fn(req,res,next)
//     }
//     catch(e){
//         res.status(e.code || 500).json({
//             success:true,
//             message:e.message
//         })
//     }
// }