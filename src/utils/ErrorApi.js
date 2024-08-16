//Api Error in node js
class ErrorApi extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.success=false
        this.message=message
        this.errors=errors
        //providing instance in stack trace
        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ErrorApi}