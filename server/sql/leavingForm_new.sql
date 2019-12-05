-- MySQL dump 10.13  Distrib 5.7.28, for Linux (x86_64)
--
-- Host: localhost    Database: leavingForm
-- ------------------------------------------------------
-- Server version	5.7.28-0ubuntu0.18.04.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES ('20190904041603-create-booking.js'),('20191127085054-create-day-off.js'),('20191128025454-create-day-off.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `absenceTypes`
--

DROP TABLE IF EXISTS `absenceTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `absenceTypes` (
  `fId` int(11) NOT NULL,
  `fAbsenceTypeName` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `absenceTypes`
--

LOCK TABLES `absenceTypes` WRITE;
/*!40000 ALTER TABLE `absenceTypes` DISABLE KEYS */;
INSERT INTO `absenceTypes` VALUES (1,'Việc riêng'),(2,'Nghỉ phép năm'),(3,'Nghỉ ốm'),(4,'Nghỉ chế độ');
/*!40000 ALTER TABLE `absenceTypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fBookingName` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `fBookingDate` datetime NOT NULL,
  `fStartTime` datetime NOT NULL,
  `fEndTime` datetime NOT NULL,
  `users_fId` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dayOffs`
--

DROP TABLE IF EXISTS `dayOffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dayOffs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fUserId` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fYear` int(11) DEFAULT NULL,
  `fYearTotal` float DEFAULT NULL,
  `fYearUsed` float DEFAULT NULL,
  `fYearRemaining` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dayOffs`
--

LOCK TABLES `dayOffs` WRITE;
/*!40000 ALTER TABLE `dayOffs` DISABLE KEYS */;
INSERT INTO `dayOffs` VALUES (2,'5g3bqeTgu6',2019,15,0,15);
/*!40000 ALTER TABLE `dayOffs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leaveLetters`
--

DROP TABLE IF EXISTS `leaveLetters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leaveLetters` (
  `fId` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `fRdt` datetime NOT NULL,
  `fFromDT` datetime NOT NULL,
  `fToDT` datetime NOT NULL,
  `fAbsenceType` int(11) NOT NULL,
  `fSubstituteId` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fUserId` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `users_fId` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `users_fId1` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `absenceTypes_fId` int(11) DEFAULT NULL,
  `approver_fId` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fStatus` int(11) NOT NULL DEFAULT '1',
  `fReason` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fApprover` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `fFromOpt` enum('allday','morning','afternoon') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'allday',
  `fToOpt` enum('allday','morning','afternoon') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'allday',
  PRIMARY KEY (`fId`),
  UNIQUE KEY `fId_UNIQUE` (`fId`),
  KEY `fk_leaveLetters_absenceTypes_idx` (`absenceTypes_fId`) USING BTREE,
  KEY `fk_leaveLetters_users1_idx` (`users_fId1`) USING BTREE,
  KEY `fk_leaveLetters_users2` (`approver_fId`) USING BTREE,
  KEY `fk_leaveLetters_users_idx` (`users_fId`) USING BTREE,
  CONSTRAINT `fk_leaveLetters_absenceTypes` FOREIGN KEY (`absenceTypes_fId`) REFERENCES `absenceTypes` (`fId`),
  CONSTRAINT `fk_leaveLetters_users` FOREIGN KEY (`users_fId`) REFERENCES `users` (`fId`),
  CONSTRAINT `fk_leaveLetters_users1` FOREIGN KEY (`users_fId1`) REFERENCES `users` (`fId`),
  CONSTRAINT `fk_leaveLetters_users2` FOREIGN KEY (`approver_fId`) REFERENCES `users` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leaveLetters`
--

LOCK TABLES `leaveLetters` WRITE;
/*!40000 ALTER TABLE `leaveLetters` DISABLE KEYS */;
/*!40000 ALTER TABLE `leaveLetters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `positions` (
  `fId` varchar(5) COLLATE utf8_unicode_ci NOT NULL,
  `fPosName` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE KEY `fId_UNIQUE` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES ('0a3eb','Chief Executive Officer'),('4b6e2','Intern'),('7e069','Staff'),('99722','Tech Lead'),('a3bbb','Vice Leader'),('e4fc4','Chief Technology Officer'),('fbd79','Leader');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rejectedLetterDetail`
--

DROP TABLE IF EXISTS `rejectedLetterDetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rejectedLetterDetail` (
  `fLetterId` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `fReason` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `fRejectType` int(11) NOT NULL,
  `leaveLetters_fId` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`fLetterId`),
  KEY `fk_rejectedLetterDetail_leaveLetters1_idx` (`leaveLetters_fId`) USING BTREE,
  CONSTRAINT `fk_rejectedLetterDetail_leaveLetters1` FOREIGN KEY (`leaveLetters_fId`) REFERENCES `leaveLetters` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rejectedLetterDetail`
--

LOCK TABLES `rejectedLetterDetail` WRITE;
/*!40000 ALTER TABLE `rejectedLetterDetail` DISABLE KEYS */;
/*!40000 ALTER TABLE `rejectedLetterDetail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `fName` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `fValue` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`fName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('email','golden_owl@gmail.com'),('maxDayOff','15'),('password','password');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teams` (
  `fId` varchar(5) COLLATE utf8_unicode_ci NOT NULL,
  `fTeamName` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE KEY `fId_UNIQUE` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES ('1d702','Designer'),('2d61d','Admin'),('4c839','Human Resource'),('4de42','Ruby on Rails'),('5237b','Quality Control'),('acafd','Project Coordinator'),('ae0cb','JavaScript'),('afa28','Marketing'),('da2f5','PHP'),('e3f38','Board Of Directors');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userPermission`
--

DROP TABLE IF EXISTS `userPermission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userPermission` (
  `fId` varchar(5) COLLATE utf8_unicode_ci NOT NULL,
  `fUserType` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE KEY `fId_UNIQUE` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userPermission`
--

LOCK TABLES `userPermission` WRITE;
/*!40000 ALTER TABLE `userPermission` DISABLE KEYS */;
INSERT INTO `userPermission` VALUES ('1J85n','Admin'),('3sVfP','Personnel'),('CdkR0','Supper Admin'),('NH6Bs','Human Resource');
/*!40000 ALTER TABLE `userPermission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userRefToken`
--

DROP TABLE IF EXISTS `userRefToken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userRefToken` (
  `fUserId` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `fRefToken` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `fRdt` datetime NOT NULL,
  `users_fId` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`fUserId`),
  UNIQUE KEY `fUserId_UNIQUE` (`fUserId`),
  KEY `fk_userRefToken_users1_idx` (`users_fId`) USING BTREE,
  CONSTRAINT `fk_userRefToken_users1` FOREIGN KEY (`users_fId`) REFERENCES `users` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userRefToken`
--

LOCK TABLES `userRefToken` WRITE;
/*!40000 ALTER TABLE `userRefToken` DISABLE KEYS */;
INSERT INTO `userRefToken` VALUES ('5g3bqeTgu6','VgxuWYKlCoD5OsLOW3UCEKLi0XZXGXKPZ0hhLJ6djlLHA2iN3vY2IZKEhJ9NrNjWFAhqYtpVfIo8kZQq','2019-11-29 02:19:13',NULL);
/*!40000 ALTER TABLE `userRefToken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `fId` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `fFirstName` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `fLastName` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `fPosition` varchar(5) COLLATE utf8_unicode_ci NOT NULL,
  `fPhone` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `fTeamId` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fTypeId` varchar(5) COLLATE utf8_unicode_ci NOT NULL,
  `fEmail` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `fGender` int(11) NOT NULL DEFAULT '3',
  `fPassword` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `fUsername` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `positions_fId` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `userPermission_fId` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `teams_fId` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`fId`),
  UNIQUE KEY `fEmail` (`fEmail`),
  UNIQUE KEY `fId_UNIQUE` (`fId`),
  UNIQUE KEY `fUsername` (`fUsername`),
  KEY `fk_users_positions1_idx` (`positions_fId`) USING BTREE,
  KEY `fk_users_teams1_idx` (`teams_fId`) USING BTREE,
  KEY `fk_users_userPermission1_idx` (`userPermission_fId`) USING BTREE,
  CONSTRAINT `fk_users_positions1` FOREIGN KEY (`positions_fId`) REFERENCES `positions` (`fId`),
  CONSTRAINT `fk_users_teams1` FOREIGN KEY (`teams_fId`) REFERENCES `teams` (`fId`),
  CONSTRAINT `fk_users_userPermission1` FOREIGN KEY (`userPermission_fId`) REFERENCES `userPermission` (`fId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('5g3bqeTgu6','Admin','GO','fbd79','0123456789','2d61d','1J85n','admin@goldenowl.asia',2,'5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8','admin@goldenowl.asia',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-12-02  9:30:52
