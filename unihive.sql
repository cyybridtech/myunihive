-- ============================================================
-- UniHive Consolidated Database Dump for Local Development (XAMPP)
-- Compatible with MySQL 5.7+, MySQL 8.0+, and MariaDB (XAMPP / phpMyAdmin)
-- Generated from TiDB Cloud Export
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Create database if it does not exist and use it
CREATE DATABASE IF NOT EXISTS `unihive` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `unihive`;

-- ------------------------------------------------------------
-- Table: `universities`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `universities`;
CREATE TABLE `universities` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  PRIMARY KEY (`id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `universities`
INSERT INTO `universities` VALUES
('u17781278782068010','USTED','Kumasi','Ghana','2026-05-07 04:24:38',NULL,NULL),
('u1781284890975510','LEGON','Accra ','Ghana','2026-06-12 17:21:31',NULL,NULL),
('u17816132580455310','UPSA','Accra','Ghana','2026-06-16 12:34:18',NULL,NULL),
('u17842400032586910','KNUST','Kumasi','Ghana','2026-07-16 22:13:23',NULL,NULL);

-- ------------------------------------------------------------
-- Table: `users`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'male',
  `id_photo` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `university_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('student','admin','manager','hostel_manager') COLLATE utf8mb4_general_ci DEFAULT 'student',
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `avatar` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `referral_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `otp_code` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `otp_expires` datetime DEFAULT NULL,
  `last_ip` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_device` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ghana_card_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) ,
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1170065;

-- Data for table `users`
INSERT INTO `users` VALUES
(3,'UniHive Admin','admin@unihive.com','+233200000000','male',NULL,0,'u1','admin','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,NULL,'2026-04-03','2026-04-03 05:26:40',NULL,NULL,NULL,NULL,NULL),
(14,'morgan freeman','mog@gmail.com','0244522973','male',NULL,0,'u2','student','$2y$10$8TkHkPMlC39ls1HmVt3e3eFc1xA7hB.fz/dRppEWqL0PldSBdv/AK',NULL,'REF-MOG426',NULL,'2026-04-14 21:28:24',NULL,NULL,NULL,NULL,NULL),
(63,'Redoff Manager','manager@unihive.com','0533143634','male',NULL,0,'u17781279225384610','','$2b$10$SmcMEnVBUeBiPvoRK3fZD.C3YEthBdK5jaEzF85l0e7UyTVdLoR62',NULL,NULL,NULL,'2026-05-09 05:49:44',NULL,NULL,NULL,NULL,NULL),
(90066,'Roosevelt Deladem','zanuroosevelt123@gmail.com','+233536404601','male',NULL,0,'u17781278782068010','student','$2b$10$0CBvGfZ7UfR5B0vss..PvuQa2WuxNyC6TJ9S7eMbuK1.Wk9PMTjlu',NULL,NULL,NULL,'2026-05-09 18:46:00',NULL,NULL,NULL,NULL,NULL),
(360065,'Anthony Akosah','antonio1peterp@gmail.com','+233249299128','male',NULL,0,'u17784398506214210','student','$2b$10$pCzGTjnbYpBdY44LXV9uxOHq6sb4dSpqZ2cq0afdp0xVl/MgtX.xO',NULL,NULL,NULL,'2026-05-15 07:31:28',NULL,NULL,NULL,NULL,NULL),
(390065,'Redoff  Oppong ','redoffagyemang00@gmail.com','0533143634','female',NULL,0,'u17784873213082710','student','$2b$10$N7TH.4qgVbiRSkayHmCQpOxOb4mXtevT67LG3kilBvlYuTymqPpDC',NULL,NULL,NULL,'2026-05-15 08:02:53',NULL,NULL,NULL,NULL,NULL),
(420066,'Mansi Junior ','iriemerlina@gmail.com','0549428862','male',NULL,0,'u17781278782068010','student','$2b$10$ie93Ze3mxQojz1HQhK.OCOgfH8/dcqq/UMZ09gNCgMq9nB3qIrOce',NULL,NULL,NULL,'2026-05-15 16:13:00',NULL,NULL,NULL,NULL,NULL),
(450065,'Pavlin  Sarfo','Pavlinasare113@gmail.com','0507995973','male',NULL,0,'u17781278782068010','student','$2b$10$.DqtTRTdecFO44Njb1rbguBlVXwAYJIM4Gl4FnwNGZIg7Y./QT3sK',NULL,NULL,NULL,'2026-05-15 22:33:02',NULL,NULL,NULL,NULL,NULL),
(510065,'Roosevelt Zanu','zanuroosevelt12345@gmail.com','0536404901','male',NULL,0,'u17781278782068010','student','$2b$10$4adu5GiOyfunfIv.poNrSOOhFvP92T4kiaRu5RPYTt89ohvPIhLMS',NULL,NULL,NULL,'2026-05-16 20:12:54',NULL,NULL,NULL,NULL,NULL),
(600065,'h','h@m.c','09876543','male',NULL,0,'u17781278782068010','admin','$2b$10$qAr0hAyAVe92A/1NKCsGCOudo7WKEu/IodXzmaDo1Sn2QPfjvioje',NULL,NULL,NULL,'2026-05-17 00:00:19',NULL,NULL,NULL,NULL,NULL),
(630065,'TEST','test@test.com','09875432','male',NULL,0,'u17781278782068010','manager','$2b$10$KZOfz0Wk/dNxRbps1u/bI.lnBUviTmbVNkueCwzzzWVyujBrgYafW',NULL,NULL,NULL,'2026-05-18 15:14:56',NULL,NULL,NULL,NULL,NULL),
(690065,'Rob','rob@uni.com','0533143634','male',NULL,0,'u17781278782068010','manager','$2b$10$ZALE/U7zTUWnDTuv.hnaDe2wKFhi/Pwv9FUZ3Ir.PucNEfoZZd9IG',NULL,NULL,NULL,'2026-05-20 17:43:47',NULL,NULL,NULL,NULL,NULL),
(750065,'Osei Augustine ','augustineoseidamptey@gmail.com','+233256298277','male',NULL,0,'u17781278782068010','student','$2b$10$yH/WSbqbyk98DXwKXhjdeeoZ5wjIZrFzo/LcB61fLoJd5URKsv74C',NULL,NULL,NULL,'2026-05-23 23:38:26',NULL,NULL,NULL,NULL,NULL),
(780065,'Reddy','test@uni.com','0533143634','male',NULL,0,'u17781278782068010','manager','$2b$10$QTBV5kjvDOoSKWubW6bfs.NSnpf05Hi3vHdOeWXNzg08J49Eqje4S',NULL,NULL,NULL,'2026-05-29 05:39:52',NULL,NULL,NULL,NULL,NULL),
(810065,'Redoff  Cyybrid ','cyybridtechnnology@gmail.com','+233533143634','male',NULL,0,'u17781278782068010','student','$2b$10$I1Q4L8V1COyASIL0OGv3YOgBreZFOsA/xW.aI9uwH9bszStFr1PFi',NULL,NULL,NULL,'2026-06-06 19:30:48',NULL,NULL,NULL,NULL,NULL),
(810066,'Wake Wine','jakewine65@gmail.com','+233533143634','male',NULL,0,'u17781278782068010','student','$2b$10$HUmi8fvw9PCjBPAe14/OguURXxpiWjJpfjwa.8vf9sy6Bxwz9.N/.',NULL,NULL,NULL,'2026-06-06 20:51:43',NULL,NULL,NULL,NULL,NULL),
(840065,'Martin  Takyi ','www.takyimartin11@gmail.com','+233546757049','male',NULL,0,'u17781278782068010','student','$2b$10$qCitQWnGWwHxHIQd.1N5T.vv.6oy.a0Ci6c5jOinGfsUOhPuV6fEu',NULL,NULL,NULL,'2026-06-08 11:32:27',NULL,NULL,NULL,NULL,NULL),
(870065,'Priscilla Amoah','zanurooseveltbuss1@gmail.com','+233536404601','male',NULL,0,'u17781278782068010','student','$2b$10$g/HNQr0f/JXJYRhwm5jVwOyjKOl3pHYI4pSN37DbShsPVgqHadyj6',NULL,NULL,NULL,'2026-06-12 16:40:39',NULL,NULL,NULL,NULL,NULL),
(900065,'Kofi','me@gi.com','0987654','male',NULL,0,'u17781278782068010','manager','$2b$10$lRAcCvMeZSDsxUp5nxrZE.91CHNqUNhBAPDrbeP4CykkUskuCyEpq',NULL,NULL,NULL,'2026-06-16 12:50:20',NULL,NULL,NULL,NULL,NULL),
(930065,'Roselyn Hostel ','rossa@uni.com','0533143634','female',NULL,0,'u17781278782068010','manager','$2b$10$Yv.P/6wESfnbJC28OpLIF..rpS2UXp/zfKxiLzy6mahFonltg4Jhq',NULL,NULL,NULL,'2026-06-18 14:35:57',NULL,NULL,NULL,NULL,NULL),
(960065,'Jake Wine','gatebill354@gmail.com','+233533143634','male',NULL,0,'u17781278782068010','student','$2b$10$hCqBQMx6dDPB0v5/8r1/lO87V0RVal4VqTLVjMXzmSyfzhAX9oyge',NULL,NULL,NULL,'2026-07-02 05:22:55',NULL,NULL,NULL,NULL,NULL),
(990065,'Aaron Dzahene','dzaheneaaron40@gmail.com','+233503171188','male',NULL,0,'u17781278782068010','student','$2b$10$FGpXHLazkolaD0a.hJc39uunLXIku0PORnUAB88IRLWnVkWAFnnsC',NULL,NULL,NULL,'2026-07-07 11:27:18',NULL,NULL,NULL,NULL,NULL),
(1020065,'Hostel manager','my@hostel.com','0533143634','male',NULL,0,'u17781278782068010','manager','$2b$10$dx5h4wrNJtcG43hChD0zQuo6ztliM6D1JoMCxD.C6f649PWisLI2i',NULL,NULL,NULL,'2026-07-18 09:41:10',NULL,NULL,NULL,NULL,NULL),
(1050065,'Kelvin  Adomako ','kelvinadomako666@gmail.com','+233248539714','male',NULL,0,'u17781278782068010','student','$2b$10$Ei.C3Mj0QYvk1l7Y2yz/IO9bxWKkdYB6IJC8E.8yJd2baA2y5tzMm',NULL,NULL,NULL,'2026-07-27 17:17:17',NULL,NULL,NULL,NULL,NULL),
(1050066,'Boyuo John','johnbakobieboyuo@gmail.com','+233596538623','male',NULL,0,'u17781278782068010','student','$2b$10$7PhZKDdzPLwhTc3RGTmd6.uwacDZe.RZd/fNNgfhkK4tK9GFf/sPi',NULL,NULL,NULL,'2026-07-27 17:23:37',NULL,NULL,NULL,NULL,NULL),
(1080065,'evans  frimpong','630babyforeigner@gmail.com','+233548932664','male',NULL,0,'u17781278782068010','student','$2b$10$8ZbbbY/RXVSG7yx/6unwFuGil5zgIHalWVnoudcnp2UWzJtUOUClu',NULL,NULL,NULL,'2026-07-31 17:00:51',NULL,NULL,NULL,NULL,NULL),
(1080066,'Francisca  Acheampong ','franciscaabenaacheamponmaa@gmail.com','+233533971490','female',NULL,0,'u17781278782068010','student','$2b$10$.oVNBF76XTxakGTc8cjw0uA.Qw/FukXPlLBRagjz4w7tF3c4Al86C',NULL,NULL,NULL,'2026-07-31 17:01:55',NULL,NULL,NULL,NULL,NULL),
(1080067,'Prisca  Simpeh ','Priscasimpeh@gmail.com','+233538194891','female',NULL,0,'u17781278782068010','student','$2b$10$Zx2hgupcMALdt2yi7dFfKO6I663Bed.1RTpEvon2lI.wb03YHJk5O',NULL,NULL,NULL,'2026-07-31 17:04:10',NULL,NULL,NULL,NULL,NULL),
(1110065,'Damptey  Augustine Osei ','dampteyoseiaugustine@gmail.com','+233256298277','male',NULL,0,'u17781278782068010','student','$2b$10$nGfYqGyUexuPpG9cTRAFOugn5bK/q2d1DVPF.rdiiSGbKmDHq1jhe',NULL,NULL,NULL,'2026-08-03 15:57:05',NULL,NULL,NULL,NULL,NULL),
(1140065,'Francis Dickson','dicksonfrancis623@gmail.com','+233545735717','male',NULL,0,'u17842400032586910','student','$2b$10$JeDx4jgMq1cLyKVMRubYXebhS7anrh2/8/FNA3OrTWQftsEvf5JWm',NULL,NULL,NULL,'2026-08-11 07:38:04',NULL,NULL,NULL,NULL,NULL);

-- ------------------------------------------------------------
-- Table: `hostels`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `hostels`;
CREATE TABLE `hostels` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `university_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `distance_from_campus` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `price_range` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `main_image` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subaccount_code` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `manager_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gallery` longtext COLLATE utf8mb4_bin DEFAULT NULL,
  `commission_type` enum('split','flat') COLLATE utf8mb4_general_ci DEFAULT 'split',
  `platform_fee` decimal(10,2) DEFAULT '0.00',
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `payment_period` enum('semester','academic_year') COLLATE utf8mb4_general_ci DEFAULT 'semester',
  `facilities` json DEFAULT NULL,
  PRIMARY KEY (`id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `hostels`
INSERT INTO `hostels` VALUES
('h178602711768397100','ONWARD HOSTEL','u17781278782068010','','Comfortable and serene ','2.34','GH₵5000-10000','https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786026999/unihive_uploads/wqyrvndtngduscg6n9ux.jpg',1,'2026-08-06 14:38:38',NULL,'114','Call the manager ',NULL,'[{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786026999/unihive_uploads/wqyrvndtngduscg6n9ux.jpg\",\"desc\":\"\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027002/unihive_uploads/o8rk0tf6k90dyzlvcn8c.jpg\",\"desc\":\"FRONT VIEW\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027004/unihive_uploads/wb1gper6pigzmj9xd3ru.jpg\",\"desc\":\"\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027007/unihive_uploads/ggbys6derjemerwa3dk3.jpg\",\"desc\":\"TELEVISION ROOM\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027010/unihive_uploads/ka2voenvpyv6p0rllqb5.jpg\",\"desc\":\"ONE IN ROOM \"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027012/unihive_uploads/xld0tehqeasqkezh8xhs.jpg\",\"desc\":\"TWO IN ROOM \"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027015/unihive_uploads/ig0baeltebb6u1fjc7d5.jpg\",\"desc\":\"\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027018/unihive_uploads/pn9iayaxu8bitdsefawk.jpg\",\"desc\":\"STUDY ROOM\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027020/unihive_uploads/cnklursuupfdmlsavdih.jpg\",\"desc\":\"\"}]','split',0.00,5,0.473,'semester','[\"Security\", \"study room\", \"television room\", \"etc\"]'),
('h1786027695915428100','ASEMPAFIE','u17781278782068010','Apatrapa road','Comfortable for students ','1.0km','GH₵5000-7000','https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027578/unihive_uploads/aidznnfwsnxubfwrm8st.jpg',1,'2026-08-06 14:48:16',NULL,'MTN','Call manager',NULL,'[{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027578/unihive_uploads/aidznnfwsnxubfwrm8st.jpg\",\"desc\":\"FRONT VIEW\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027580/unihive_uploads/dug2clsjioxkhgbdems3.jpg\",\"desc\":\"TWO IN ROOM\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027584/unihive_uploads/fmst2wxxjcjksxpinlo3.jpg\",\"desc\":\"TWO IN ROOM\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786027587/unihive_uploads/m5rwe1rocecvazvetmuk.jpg\",\"desc\":\"KITCHEN\"}]','split',0.00,5.6304,0.4333,'semester','[\"Wifi\", \"security\", \"study room\", \"television room\"]'),
('h1786028617648794100','Duku Kaakyire','u17781278782068010','','Fun and comfortable ','1.0km','GH₵4500-10000','https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028506/unihive_uploads/y5m8c2ztz8z1ayumu0kg.jpg',1,'2026-08-06 15:03:37',NULL,'MTN','Call manager',NULL,'[{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028506/unihive_uploads/y5m8c2ztz8z1ayumu0kg.jpg\",\"desc\":\"\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028521/unihive_uploads/mmou48fg0ubiuqaxocgf.jpg\",\"desc\":\"FRONT VIEW\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028542/unihive_uploads/i3mwct37mjqapsbnd8ip.jpg\",\"desc\":\"TWO IN ROOM\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028555/unihive_uploads/wb78f1rjrbty8hzlbesf.jpg\",\"desc\":\"KITCHEN\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028576/unihive_uploads/eo70dczswg1tcqer5lmg.jpg\",\"desc\":\"WASH ROOM\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786028599/unihive_uploads/z7vpplqptwfdjywpjkiu.jpg\",\"desc\":\"CORRIDOR\"}]','split',0.00,5.6304,1.754,'semester','[\"Wifi\", \"television\", \"etc\"]'),
('h1786029495157519100','DEBAGEO HOSTEL','u17781278782068010','Apatra road','Good security and comfort ','1.0km','GH₵7000-10000','https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786029088/unihive_uploads/cnaw9n0x97jcjnr41soh.jpg',1,'2026-08-06 15:18:15',NULL,'114','Call manager',NULL,'[{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786029088/unihive_uploads/cnaw9n0x97jcjnr41soh.jpg\",\"desc\":\"FRONT VIEW\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786029091/unihive_uploads/febsd86xke8izxmahgus.jpg\",\"desc\":\"Television room\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786029094/unihive_uploads/efjebcf5wbz7woahmav1.jpg\",\"desc\":\"Study room\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786029097/unihive_uploads/mlrubeeuuce0jtcmeu5x.jpg\",\"desc\":\"Two in room\"},{\"url\":\"https://res.cloudinary.com/dz4m5s7p6/image/upload/v1786029100/unihive_uploads/v2vwkxtq4f1q03ovgto9.jpg\",\"desc\":\"Kitchen\"}]','split',0.00,5.397811110272258,-0.14098515620062813,'semester','[\"Wifi\", \"television in each room\", \"etc\"]');

-- ------------------------------------------------------------
-- Table: `rooms`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `hostel_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `room_number` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `capacity` int DEFAULT '1',
  `price` decimal(10,2) DEFAULT NULL,
  `available` tinyint(1) DEFAULT '1',
  `type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` enum('male','female','mixed') COLLATE utf8mb4_general_ci DEFAULT 'mixed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `manual_occupancy` int DEFAULT '0',
  `gallery` longtext COLLATE utf8mb4_bin DEFAULT NULL,
  `amenities` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) ,
  KEY `hostel_id` (`hostel_id`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Table: `bookings`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `room_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `hostel_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `booking_date` date NOT NULL,
  `status` enum('pending','approved','completed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `payment_status` enum('paid','unpaid') COLLATE utf8mb4_general_ci DEFAULT 'unpaid',
  `reservation_fee` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `auth_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paystack_reference` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) ,
  KEY `user_id` (`user_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=630052;

-- ------------------------------------------------------------
-- Table: `reviews`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `hostel_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `rating` int DEFAULT NULL,
  `comment` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `review_date` date DEFAULT NULL,
  `is_anonymous` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`) ,
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=90003;

-- Data for table `reviews`
INSERT INTO `reviews` VALUES
(60003,14,'h178602711768397100',4,'Nice and serene environment ','2026-08-21',1);

-- ------------------------------------------------------------
-- Table: `roommate_profiles`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `roommate_profiles`;
CREATE TABLE `roommate_profiles` (
  `user_id` varchar(50) NOT NULL,
  `sleep_habit` enum('early_bird','night_owl') NOT NULL,
  `study_habit` enum('silent','background_noise') NOT NULL,
  `cleanliness` enum('neat_freak','moderate','relaxed') NOT NULL,
  `social_level` enum('introvert','extrovert','balanced') NOT NULL,
  `bio` text DEFAULT NULL,
  `contact_info` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data for table `roommate_profiles`
INSERT INTO `roommate_profiles` VALUES
('1080065','night_owl','background_noise','moderate','introvert',NULL,NULL,'2026-07-31 17:37:36'),
('14','night_owl','background_noise','relaxed','balanced',NULL,NULL,'2026-05-25 11:41:16'),
('3','night_owl','background_noise','relaxed','extrovert',NULL,NULL,'2026-05-27 09:21:59'),
('750065','night_owl','silent','neat_freak','introvert',NULL,NULL,'2026-05-25 16:22:24'),
('780065','early_bird','background_noise','moderate','balanced',NULL,NULL,'2026-06-16 13:00:57'),
('810065','early_bird','silent','relaxed','introvert',NULL,NULL,'2026-06-06 19:31:30'),
('840065','early_bird','silent','moderate','balanced',NULL,NULL,'2026-06-08 11:33:43'),
('870065','early_bird','background_noise','moderate','balanced',NULL,NULL,'2026-06-12 16:41:49');

-- ------------------------------------------------------------
-- Table: `messages`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `content` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `read_status` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`) ,
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=150001;

-- Data for table `messages`
INSERT INTO `messages` VALUES
(1,3,630065,'Hello','2026-06-26 23:43:26',0),
(2,780065,3,'Hello sir','2026-06-26 23:44:29',1),
(3,780065,14,'Get out','2026-06-26 23:45:00',1),
(4,14,780065,'Hello how are you doing?','2026-06-26 23:49:27',1),
(30001,780065,3,'Hello sir','2026-06-27 00:33:43',1),
(60001,3,780065,'Sup','2026-06-27 01:10:47',1),
(90001,3,690065,'hello','2026-07-12 22:11:58',0),
(120001,1020065,3,'Hello','2026-07-18 09:46:56',1);

-- ------------------------------------------------------------
-- Table: `notifications`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` enum('booking','payment','hostel','info') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `read_status` tinyint(1) DEFAULT '0',
  `notification_date` date DEFAULT NULL,
  PRIMARY KEY (`id`) ,
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=750085;

-- Data for table `notifications`
INSERT INTO `notifications` VALUES
(30087,63,'New Paid Booking','New paid booking from morgan freeman (male) for room A1 at Cyybrid Hostel. Code: UNH-A0X4PI.','booking',1,'2026-05-09'),
(60085,90066,'Booking Created','Your booking for Cyybrid Hostel (GH₵1.00) has been created. Complete payment to secure your room.','booking',0,'2026-05-09'),
(60086,90066,'Payment Receipt - Booking Confirmed','Payment confirmed for booking #30052. Hostel: Cyybrid Hostel. Room: A1 (Standard). Amount: GH₵1.00. Security Code: UNH-CXIPGR','payment',0,'2026-05-09'),
(60087,63,'New Paid Booking','New paid booking from Roosevelt Deladem (male) for room A1 at Cyybrid Hostel. Code: UNH-CXIPGR.','booking',1,'2026-05-09'),
(120085,420066,'Booking Created','Your booking for Cyybrid Hostel (GH₵2.00) has been created. Complete payment to secure your room.','booking',0,'2026-05-15'),
(150085,450065,'Booking Created','Your booking for Hive (GH₵1.00) has been created. Complete payment to secure your room.','booking',0,'2026-05-15'),
(150086,450065,'Booking Created','Your booking for Hive (GH₵1.00) has been created. Complete payment to secure your room.','booking',0,'2026-05-15'),
(180085,450065,'Approved Booking','Congratulations! Your booking for Hive (Room A1) has been approved.','booking',0,'2026-05-15'),
(180086,450065,'Approved Booking','Congratulations! Your booking for Hive (Room A1) has been approved.','booking',0,'2026-05-15'),
(300085,750065,'Booking Created','Your booking for NFB BH (GH₵3150.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-23'),
(330085,750065,'Booking Created','Your booking for NFB BH (GH₵3150.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-25'),
(330086,750065,'Booking Created','Your booking for NFB BH (GH₵3150.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-25'),
(330087,750065,'Booking Created','Your booking for NFB BH (GH₵2940.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-25'),
(420085,63,'Booking Created','Your booking for NFB BH (GH₵3000.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-27'),
(420086,63,'Booking Created','Your booking for ROB (GH₵4300.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-27'),
(420087,63,'Booking Created','Your booking for ROB (GH₵4300.00) has been created. Complete payment to secure your room.','booking',1,'2026-05-27'),
(510089,780065,'New Paid Booking','New paid booking from UniHive Admin (male) for room A1 at Test. Code: UNH-ZLRH47.','booking',1,'2026-05-29'),
(510092,780065,'New Paid Booking','New paid booking from morgan freeman (male) for room A1 at Test. Code: UNH-HBA86L.','booking',1,'2026-05-29'),
(570085,810065,'Booking Created','Your booking for Test (GH₵2.00) has been created. Complete payment to secure your room.','booking',1,'2026-06-06'),
(570086,810065,'Payment Receipt - Booking Confirmed','Payment confirmed for booking #480052. Hostel: Test. Room: A1 (Standard). Amount: GH₵2.00. Security Code: UNH-CKWWMI','payment',1,'2026-06-06'),
(570087,780065,'New Paid Booking','New paid booking from Redoff  Cyybrid  (male) for room A1 at Test. Code: UNH-CKWWMI.','booking',1,'2026-06-06'),
(570088,810065,'Booking Created','Your booking for NFB BH (GH₵3200.00) has been created. Complete payment to secure your room.','booking',0,'2026-06-06'),
(600085,870065,'Booking Created','Your booking for Test (GH₵2.00) has been created. Complete payment to secure your room.','booking',1,'2026-06-12'),
(600086,870065,'Booking Created','Your booking for Test (GH₵2.00) has been created. Complete payment to secure your room.','booking',1,'2026-06-12'),
(600087,870065,'Payment Receipt - Booking Confirmed','Payment confirmed for booking #510053. Hostel: Test. Room: A1 (Standard). Amount: GH₵2.00. Security Code: UNH-OI85ST','payment',1,'2026-06-12'),
(600088,780065,'New Paid Booking','New paid booking from Priscilla Amoah (male) for room A1 at Test. Code: UNH-OI85ST.','booking',1,'2026-06-12'),
(600089,870065,'Completed Booking','Your booking for Test (Room A1) has been completed.','booking',1,'2026-06-12'),
(630085,810065,'Completed Booking','Your booking for Test (Room A1) has been completed.','booking',0,'2026-06-16'),
(690085,960065,'Booking Created','Your booking for Test (GH₵2.00) has been created. Complete payment to secure your room.','booking',0,'2026-07-02'),
(720085,1020065,'Booking Created','Your booking for My hostel (GH₵3010.00) has been created. Complete payment to secure your room.','booking',1,'2026-07-18');

-- ------------------------------------------------------------
-- Table: `otps`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `otps`;
CREATE TABLE `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) ,
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1620003;

-- Data for table `otps`
INSERT INTO `otps` VALUES
(930003,'johnredoff@gmail.com','506388','2026-05-12 19:09:58','2026-05-12 18:54:58'),
(960003,'wdge@gmail.com','615321','2026-05-13 20:56:14','2026-05-13 20:41:14'),
(1140003,'cyybridtechnnology@gmsil.com','879552','2026-05-19 00:03:37','2026-05-18 23:48:36'),
(1380005,'kelvinadomako66@gmail.com','646268','2026-07-27 17:28:51','2026-07-27 17:13:50'),
(1440004,'franciscaabenaacheampong@gmail.com','912605','2026-07-28 12:39:09','2026-07-28 12:09:42'),
(1560003,'johnbakobieboyuo@gmail.com','355888','2026-08-06 20:32:43','2026-08-06 20:17:43');

-- ------------------------------------------------------------
-- Table: `push_subscriptions`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `push_subscriptions`;
CREATE TABLE `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `p256dh` varchar(200) NOT NULL,
  `auth` varchar(200) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=210001;

-- Data for table `push_subscriptions`
INSERT INTO `push_subscriptions` VALUES
(60001,'720065','https://jmt17.google.com/fcm/send/ehUI8YKeJSM:APA91bEoLyb8AgGlbU9y0u_mho3OClaaPNVcjP5IZnqNM05GeW13UZT0mtTjwhghvlDaq5U_h8kHdFck2g_GpEUmwy1FIGx7LYwien8Wr8oN2TEI9rgCu_UsAg7G1i7MkFebJmz9aG74','BFVg3K5ucN2jK9sHo52IYDzKSJxAxsgo_Vfxwr8VOobEDzlCK8RCZuGfN-9Rc5KZxuQMmZ5Kfh74ZLQ7VKe3dYw','-Jq8SrUn1GGaYnLt4IUx5w','2026-05-23 20:53:52'),
(90001,'63','https://jmt17.google.com/fcm/send/ca6xsQzOQ00:APA91bF20xuxAT7x5U0QtxutkC3HUThJBMbeipHSdxM9RCcPwYA79aHiz3bDvV7rF3MJKh0c7I0Dz7e7W9MPQu9umlZYsSDq5v9GDWdBaZtvofuHSMSyBE1X_mVfheGXnUOn6pAoJ96z','BELwjw6OQiKlMBAo4M6QfyMdohKb4W7EjhMHTN6BM6us22a7IAim8NR8mp9_1nvJRxa_OczZvHnz8-RlpsYj79o','70US2utmeM3IIC8JAenuWA','2026-05-26 14:15:39'),
(120001,'14','https://jmt17.google.com/fcm/send/ca6xsQzOQ00:APA91bF20xuxAT7x5U0QtxutkC3HUThJBMbeipHSdxM9RCcPwYA79aHiz3bDvV7rF3MJKh0c7I0Dz7e7W9MPQu9umlZYsSDq5v9GDWdBaZtvofuHSMSyBE1X_mVfheGXnUOn6pAoJ96z','BELwjw6OQiKlMBAo4M6QfyMdohKb4W7EjhMHTN6BM6us22a7IAim8NR8mp9_1nvJRxa_OczZvHnz8-RlpsYj79o','70US2utmeM3IIC8JAenuWA','2026-05-27 22:05:00'),
(150001,'810065','https://fcm.googleapis.com/fcm/send/e_6slwQB1gI:APA91bHV_5A8uNKjmE8Ydq5KDXOWVlRBGIRffUz7EE5mKc6-72ajU3BI1b6FWMb6Xf7kYATwY1EPjqG_lDUoePN0QKNiDI1Jg1AsWRB0yV2MRG21dGNrpbc3xRJ_1Guc1vcacRdtAnIL','BOZD1I8ctwDM96nqvoc4jJhDVBSwhUug4TPKgUBZqjA1hB71IPtvviLU3oFs-WNUzCUc0TIm9u4pGlzjMseE9ug','DnAdmyHyzaXnElGFyV7RvA','2026-06-06 19:42:55'),
(150002,'810065','https://fcm.googleapis.com/fcm/send/e_6slwQB1gI:APA91bHV_5A8uNKjmE8Ydq5KDXOWVlRBGIRffUz7EE5mKc6-72ajU3BI1b6FWMb6Xf7kYATwY1EPjqG_lDUoePN0QKNiDI1Jg1AsWRB0yV2MRG21dGNrpbc3xRJ_1Guc1vcacRdtAnIL','BOZD1I8ctwDM96nqvoc4jJhDVBSwhUug4TPKgUBZqjA1hB71IPtvviLU3oFs-WNUzCUc0TIm9u4pGlzjMseE9ug','DnAdmyHyzaXnElGFyV7RvA','2026-06-06 19:42:55'),
(180001,'14','https://jmt17.google.com/fcm/send/ca6xsQzOQ00:APA91bF20xuxAT7x5U0QtxutkC3HUThJBMbeipHSdxM9RCcPwYA79aHiz3bDvV7rF3MJKh0c7I0Dz7e7W9MPQu9umlZYsSDq5v9GDWdBaZtvofuHSMSyBE1X_mVfheGXnUOn6pAoJ96z','BELwjw6OQiKlMBAo4M6QfyMdohKb4W7EjhMHTN6BM6us22a7IAim8NR8mp9_1nvJRxa_OczZvHnz8-RlpsYj79o','70US2utmeM3IIC8JAenuWA','2026-06-17 04:31:05');

-- ------------------------------------------------------------
-- Table: `saved_cards`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `saved_cards`;
CREATE TABLE `saved_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `authorization_code` varchar(200) NOT NULL,
  `card_type` varchar(50) DEFAULT NULL,
  `last4` varchar(10) DEFAULT NULL,
  `exp_month` varchar(4) DEFAULT NULL,
  `exp_year` varchar(6) DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) ,
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ------------------------------------------------------------
-- Table: `audit_logs`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET FOREIGN_KEY_CHECKS = 1;
