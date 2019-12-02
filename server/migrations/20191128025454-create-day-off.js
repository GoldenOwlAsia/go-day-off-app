'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('dayOffs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fUserId: {
        type: Sequelize.STRING(10)
      },
      fYear: {
        type: Sequelize.INTEGER
      },
      fYearTotal: {
        type: Sequelize.FLOAT
      },
      fYearUsed: {
        type: Sequelize.FLOAT
      },
      fYearRemaining: {
        type: Sequelize.FLOAT
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('dayOffs');
  }
};