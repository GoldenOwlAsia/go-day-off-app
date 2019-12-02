'use strict';
export default (sequelize, DataTypes) => {
  const dayOff = sequelize.define('dayOff', {
    fUserId: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    fYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fYearTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    fYearUsed: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    fYearRemaining: {
      type: DataTypes.FLOAT,
      allowNull: false,
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: "dayOffs",
    classMethod: {
      associate: (model) => {
        dayOff.belongsTo(model.User, {
          foreignKey: users_fId
        })
      }
    }
  });

  dayOff.add = (record) =>
  new Promise(async (resolve, reject) => {
    try {
      const dOff = await dayOff.create(record);
      resolve(dOff);
    } catch (err) {
      if (!err.code) err.code = 500;
      if (!err.msg) err.msg = "DB_QUERY_ERROR";
      reject(err);
    }
  });

  dayOff.loadAll = (attributes = [], queryWhere = {}) => 
    new Promise(async (resolve, reject) => {
      try {
        let dOff = null;
        if (attributes.length < 1)
        dOff = await dayOff.findAll({
          ...queryWhere
        });
      else
        dOff = await dayOff.findAll({
          attributes,
          ...queryWhere
        });
      resolve(dOff);
      } catch (err) {
        err.code = 500;
        err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

    dayOff.modify = (attributes = {}, queryWhere = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        const affected = await dayOff.update(attributes, queryWhere);
        resolve(affected);
      } catch (err) {
        if (!err.code) err.code = 500;
        if (!err.msg) err.msg = "DB_QUERY_ERROR";
        reject(err);
      }
    });

  return dayOff;
};