import {asyncHandler} from "../utils/asyncHandler.js"
import { ResponseApi } from "../utils/ResponseApi.js"


const healthcheck = asyncHandler(async (req, res) => {
    // build a healthcheck response that simply returns the OK status as json with a message

    return res.status(200).json(
        new ResponseApi(200,{message : "Everything is OK"}, "Ok")
    )
})

export { healthcheck }
    