-- MySQL Script generated by MySQL Workbench
-- Fri Feb 15 23:11:33 2019
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema leavingForm
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `leavingForm` ;

-- -----------------------------------------------------
-- Schema leavingForm
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `leavingForm` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
USE `leavingForm` ;

-- -----------------------------------------------------
-- Table `leavingForm`.`positions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`positions` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`positions` (
  `fId` VARCHAR(5) NOT NULL,
  `fPosName` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE INDEX `fId_UNIQUE` (`fId` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`userPermission`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`userPermission` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`userPermission` (
  `fId` VARCHAR(5) NOT NULL,
  `fUserType` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE INDEX `fId_UNIQUE` (`fId` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`teams`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`teams` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`teams` (
  `fId` VARCHAR(5) NOT NULL,
  `fTeamName` VARCHAR(45) NOT NULL,
  `fTeamLead` VARCHAR(10) NOT NULL,
  `users_fId` VARCHAR(10) NULL DEFAULT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE INDEX `fId_UNIQUE` (`fId` ASC) VISIBLE,
  INDEX `fk_teams_users1_idx` (`users_fId` ASC) VISIBLE,
  CONSTRAINT `fk_teams_users1`
    FOREIGN KEY (`users_fId`)
    REFERENCES `leavingForm`.`users` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`users` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`users` (
  `fId` VARCHAR(10) NOT NULL,
  `fFirstName` VARCHAR(30) NOT NULL,
  `fLastName` VARCHAR(30) NOT NULL,
  `fBday` DATETIME NOT NULL,
  `fPosition` VARCHAR(5) NOT NULL,
  `fAddress` VARCHAR(100) NOT NULL,
  `fPhone` VARCHAR(10) NOT NULL,
  `fTeamId` VARCHAR(5) NULL,
  `fTypeId` VARCHAR(5) NOT NULL,
  `fEmail` VARCHAR(45) NOT NULL,
  `fPassword` VARCHAR(64) NOT NULL,
  `fUsername` VARCHAR(45) NOT NULL,
  `positions_fId` VARCHAR(5) NULL DEFAULT NULL,
  `userPermission_fId` VARCHAR(5) NULL DEFAULT NULL,
  `teams_fId` VARCHAR(5) NULL DEFAULT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE INDEX `fId_UNIQUE` (`fId` ASC) VISIBLE,
  INDEX `fk_users_positions1_idx` (`positions_fId` ASC) VISIBLE,
  INDEX `fk_users_userPermission1_idx` (`userPermission_fId` ASC) VISIBLE,
  INDEX `fk_users_teams1_idx` (`teams_fId` ASC) VISIBLE,
  CONSTRAINT `fk_users_positions1`
    FOREIGN KEY (`positions_fId`)
    REFERENCES `leavingForm`.`positions` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_userPermission1`
    FOREIGN KEY (`userPermission_fId`)
    REFERENCES `leavingForm`.`userPermission` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_teams1`
    FOREIGN KEY (`teams_fId`)
    REFERENCES `leavingForm`.`teams` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`absenceTypes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`absenceTypes` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`absenceTypes` (
  `fId` INT NOT NULL,
  `fAbsenceTypeName` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`fId`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`leaveLetters`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`leaveLetters` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`leaveLetters` (
  `fId` VARCHAR(10) NOT NULL,
  `fRdt` DATETIME NOT NULL,
  `fFromDT` DATETIME NOT NULL,
  `fToDT` DATETIME NOT NULL,
  `fAbsenceType` INT NOT NULL,
  `fSubstituteId` VARCHAR(10) NULL,
  `fUserId` VARCHAR(45) NOT NULL,
  `users_fId` VARCHAR(10) NOT NULL,
  `users_fId1` VARCHAR(10) NOT NULL,
  `absenceTypes_fId` INT NOT NULL,
  `fStatus` INT NOT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE INDEX `fId_UNIQUE` (`fId` ASC) VISIBLE,
  INDEX `fk_leaveLetters_users_idx` (`users_fId` ASC) VISIBLE,
  INDEX `fk_leaveLetters_users1_idx` (`users_fId1` ASC) VISIBLE,
  INDEX `fk_leaveLetters_absenceTypes1_idx` (`absenceTypes_fId` ASC) VISIBLE,
  CONSTRAINT `fk_leaveLetters_users`
    FOREIGN KEY (`users_fId`)
    REFERENCES `leavingForm`.`users` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_leaveLetters_users1`
    FOREIGN KEY (`users_fId1`)
    REFERENCES `leavingForm`.`users` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_leaveLetters_absenceTypes1`
    FOREIGN KEY (`absenceTypes_fId`)
    REFERENCES `leavingForm`.`absenceTypes` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`userRefToken`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`userRefToken` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`userRefToken` (
  `fUserId` VARCHAR(10) NOT NULL,
  `fRefToken` VARCHAR(20) NOT NULL,
  `fRdt` DATETIME NOT NULL,
  `users_fId` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`fUserId`),
  UNIQUE INDEX `fUserId_UNIQUE` (`fUserId` ASC) VISIBLE,
  INDEX `fk_userRefToken_users1_idx` (`users_fId` ASC) VISIBLE,
  CONSTRAINT `fk_userRefToken_users1`
    FOREIGN KEY (`users_fId`)
    REFERENCES `leavingForm`.`users` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `leavingForm`.`rejectedLetterDetail`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `leavingForm`.`rejectedLetterDetail` ;

CREATE TABLE IF NOT EXISTS `leavingForm`.`rejectedLetterDetail` (
  `fLetterId` VARCHAR(10) NOT NULL,
  `fReason` VARCHAR(45) NOT NULL,
  `fRejectType` INT NOT NULL,
  `leaveLetters_fId` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`fLetterId`),
  INDEX `fk_rejectedLetterDetail_leaveLetters1_idx` (`leaveLetters_fId` ASC) VISIBLE,
  CONSTRAINT `fk_rejectedLetterDetail_leaveLetters1`
    FOREIGN KEY (`leaveLetters_fId`)
    REFERENCES `leavingForm`.`leaveLetters` (`fId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- Insert data for Position
INSERT INTO `positions` (`fId`,`fPosName`) VALUES ("U4d4k","Software Engineer (SE)"),("wHK7p","Project Manager (PM)"),("mXLNt","Project Assistant (PA)"),("ir0gE","Team Leader"),("cpvd7","Intern/Fresher"),("s8l4h","Designer"),("B4QIq","Tech Lead"),("MYPyH","Software Tester"),("psS14","Human Resouces (HR)"),("1qRly","Accountant"),("JVh4R","Business Analyst (BA)"),("Kebva","Digital Marketer"),("Sz0d1","CEO"),("hGKx5","COO"),("8mCqq","CTO");

-- Insert data for userPermission
INSERT INTO `userPermission` (`fId`,`fUserType`) VALUES ("gbAiv","Administration"),("NH6Bs","HR"),("3sVfP","Personnel");

-- Insert data for absenceTypes
INSERT INTO `absenceTypes` (`fId`,`fAbsenceTypeName`) VALUES ("1","Việc riêng"),("2","Nghỉ phép năm"),("3","Nghỉ ốm"),("4","Nghỉ chế độ");


-- Insert data for users: 4TCgb, FfI2V, 1LwZq
INSERT INTO `users` (`fId`,`fFirstName`,`fLastName`,`fBday`,`fPosition`,`fAddress`,`fPhone`,`fTeamId`,`fTypeId`,`fUsername`,`fPassword`,`fEmail`) 
VALUES ("i53FItHeMK","Daphne","Zachery","1982-03-05 04:26:11","U4d4k","P.O. Box 489, 2016 Risus. Av.","0157694180",null,"gbAiv","user","5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8","augue.Sed.molestie@congueInscelerisque.org"),
				("MytsQhUPQG","Amanda","Amos","1993-11-22 10:18:26","wHK7p","5253 Nulla Road","0986209274",null,"NH6Bs","admin","5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8","habitant.morbi.tristique@estvitaesodales.net"),
                ("H8UIAdsy7T","Adena","Justin","1972-07-04 01:45:20","mXLNt","Ap #157-9686 Quisque Avenue","0778329121",null,"3sVfP","hr","5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8","nulla.Integer@Aliquam.net");


-- Insert data for teams
INSERT INTO `teams` (`fId`,`fTeamName`,`fTeamLead`) VALUES ("4TCgb","Ruby/Ruby on Rails","i53FItHeMK"),("FfI2V","Javascript","i53FItHeMK"),("1LwZq","PHP","i53FItHeMK"),("5eMvD","Design","i53FItHeMK"),("Gg6sG","QA","i53FItHeMK"),("kTW7B","PA","i53FItHeMK"),("G81cf","Leaders","i53FItHeMK"),("A91fa","Khác","i53FItHeMK");

-- Insert data for rejectedLetterDetail
-- --> Tam thoi bo qua

-- Insert data for userRefToken

-- Insert data for leaveLetters


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;