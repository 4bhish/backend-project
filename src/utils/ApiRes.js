class ApiRes {
    constructor(statusCode,data,message="Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = statusCode < 400
        this.message = message
    }
}

export {ApiRes}