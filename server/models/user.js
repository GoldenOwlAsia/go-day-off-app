import sha256 from "sha256";

/**
 * Helpers
 */
import arrToObj from "../helpers/arrayToObject";

/**
 * Constants
 */
import { USER_GENDER_VALUES } from "../configs/constants";

export default (sequelize, DataTypes) => {
  const User = sequelize.define("users",
    {
      fId: {
        primaryKey: true,
        type: DataTypes.STRING(10)
      },
      fFirstName: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      fLastName: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      fNickName: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      fPosition: {
        type: DataTypes.STRING(5),
        allowNull: false
      },
      fPhone: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      fTeamId: {
        type: DataTypes.STRING(5),
        allowNull: true
      },
      fTypeId: {
        type: DataTypes.STRING(5),
        allowNull: false
      },
      fEmail: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      fPassword: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      fUsername: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      fGender: {
        type: DataTypes.ENUM,
        values: USER_GENDER_VALUES,
        allowNull: false,
        defaultValue: 3
      },
      fActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      userPermission_fId: {
        type: DataTypes.STRING(5)
      },
      teams_fId: {
        type: DataTypes.STRING(5)
      },
      positions_fId: {
        type: DataTypes.STRING(5)
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "users",
      classMethods: {
        associate: models => {
          User.belongsTo(models.userPermission, {
            foreignKey: "userPermission_fId"
          });
          User.belongsTo(models.teams, {
            foreignKey: "teams_fId"
          });
          User.belongsTo(models.positions, {
            foreignKey: "positions_fId"
          });
        }
      }
    });

  const permittedFields = [
    "fEmail",
    "fFirstName",
    "fPassword",
    "fLastName",
    "fNickName",
    "fPhone",
    "fPosition",
    "fTeamId",
    "fTypeId",
    "fUsername",
    "fGender",
    "fActive",
  ];
  const publicFields = permittedFields.filter(field => field === "fPassword");

  User.loadAll = (attributes = [], queryWhere = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        let users = null;
        if (attributes.length < 1)
          users = await User.findAll({
            ...queryWhere
          });
        else
          users = await User.findAll({
            attributes,
            ...queryWhere
          });
        resolve(users);
      } catch (err) {
        err.code = 500;
        err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

  User.modify = (attributes = {}, queryWhere = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        const affected = await User.update(attributes, queryWhere);
        resolve(affected);
      } catch (err) {
        if (!err.code) err.code = 500;
        if (!err.msg) err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

  User.add = ({ fRawPwd, ...others }) =>
    new Promise(async (resolve, reject) => {
      try {
        const entity = {
          fPassword: sha256(fRawPwd),
          ...others
        };
        const user = await User.create(entity);
        delete user.fPassword;
        resolve(user);
      } catch (err) {
        if (!err.code) err.code = 500;
        if (!err.msg) err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

  User.login = ({ fUsername, rawPwd }) =>
    new Promise(async (resolve, reject) => {
      try {
        const user = await User.findOne({
          where: {
            fUsername,
            fPassword: sha256(rawPwd)
          }
        });
        resolve(user);
      } catch (err) {
        err.code = 500;
        err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

  User.countAll = (attributes = [], queryWhere = {}, ...options) =>
    new Promise(async (resolve, reject) => {
      try {
        let result = null;
        if (attributes.length < 1)
          result = await User.findAndCountAll({
            ...queryWhere,
            ...arrToObj(options)
          });
        else
          result = await User.findAndCountAll({
            attributes,
            ...queryWhere,
            ...arrToObj(options)
          });

        const { rows: rawUsers, count } = result;
        resolve({ rawUsers, count });
      } catch (err) {
        err.code = 500;
        err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

  return User;
};
