import { handleFailure } from "../helpers/handleResponse";
import { getPermissionByToken } from "../helpers/getUserInfo";

module.exports = async (req, res, next) => {
  try {
    const fUserType = await getPermissionByToken(req.token_payload);
    if (fUserType === "Admin") next();
    else throw { code: 401, msg: "NO_PERMISSION" };
  }
  catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
};