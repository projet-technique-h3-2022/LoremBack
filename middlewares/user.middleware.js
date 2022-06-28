// Import models + enums
const { User } = require("../database/models/User.model");
const { Role } = require("../database/enum");
const ObjectID = require("mongoose").Types.ObjectId;

module.exports.validEditor = async (req, res, next) => {
  const params = req.params;
  let id = params.id;

  // Verification
  if (ObjectID.isValid(id)) {
    const user = await User.findById(id);

    if (user) {
      if (user.role === Role.EDITOR) next();
      else res.status(400).json({ error: "The user must be an editor !" });
    } else res.status(400).json({ error: "Id must exists !" });
  }

  // Else
  else {
    res.status(400).json({ error: "Id must exists !" });
  }
};