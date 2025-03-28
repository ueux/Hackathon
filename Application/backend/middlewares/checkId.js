import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

function checkId(req, res, next) {
    if (!isValidObjectId(req.params.id)) {
        throw new ApiError(404,{},`Invalid Object Of : ${req.params.id}`)
    }
    next()
}
export default checkId