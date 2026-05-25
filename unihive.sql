-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
-
-- Host: 127.0.0.1
-- Generation Time: May 01, 2026 at 01:16 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `unihive`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` varchar(50) NOT NULL,
  `hostel_id` varchar(50) NOT NULL,
  `booking_date` date NOT NULL,
  `status` enum('pending','approved','completed','cancelled') DEFAULT 'pending',
  `payment_status` enum('paid','unpaid') DEFAULT 'unpaid',
  `reservation_fee` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `auth_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hostels`
--

CREATE TABLE `hostels` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `university_id` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `distance_from_campus` varchar(20) DEFAULT NULL,
  `price_range` varchar(50) DEFAULT NULL,
  `main_image` varchar(500) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `subaccount_code` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `manager_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hostels`
--

INSERT INTO `hostels` (`id`, `name`, `university_id`, `address`, `description`, `distance_from_campus`, `price_range`, `main_image`, `verified`, `created_at`, `subaccount_code`, `bank_name`, `account_number`, `manager_id`) VALUES
('h1777328670182', 'Roselyn', 'u177620961952', 'Off the Apatrapa road, behind the USTED west gate.', 'A nice furnished hostel', '0.3 km', '3000 - 10000', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 1, '2026-04-27 22:24:30', 'ACCT_fonblax59i6833u', 'MTN', '0533143634', '44'),
('h1777333311397', 'Green Hostel', 'u177620961952', 'few meters behind the ceci chopbar', 'dscsdc', '2 km', '3300 - 12000', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 1, '2026-04-27 23:41:51', NULL, '014', '1441005100386', '45'),
('h1777435910620', 'red', 'u177620961952', 'sdfghj', 'dfghj', '6km', '9000', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 1, '2026-04-29 04:11:50', 'ACCT_gtth5ksym698dxn', 'MTN', '0244522973', '47');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `read_status` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `type` enum('booking','payment','hostel','info') DEFAULT NULL,
  `read_status` tinyint(1) DEFAULT 0,
  `notification_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `read_status`, `notification_date`) VALUES
(1, 3, 'Booking Created', 'Your booking for Cyybrid (GH₵6,000.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(2, 3, 'Booking Created', 'Your booking for hello (GH₵1.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(3, 3, 'Booking Created', 'Your booking for hello (GH₵3.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(4, 14, 'Booking Created', 'Your booking for YRT (GH₵5.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(5, 14, 'Booking Created', 'Your booking for YRT (GH₵5.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(6, 14, 'Booking Created', 'Your booking for YRT (GH₵5.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(7, 14, 'Booking Created', 'Your booking for YRT (GH₵5.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(8, 3, 'Approved Booking', 'Congratulations! Your booking for hello (Room sd) has been approved.', 'booking', 0, '2026-04-15'),
(9, 3, 'Approved Booking', 'Congratulations! Your booking for hello (Room sd) has been approved.', 'booking', 0, '2026-04-15'),
(10, 3, 'Rejected Booking', 'Your booking for hello (Room SDD) has been rejected.', 'booking', 0, '2026-04-15'),
(11, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-15'),
(12, 3, 'Booking Created', 'Your booking for hello (GH₵0.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(13, 3, 'Booking Created', 'Your booking for hello (GH₵1.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(14, 3, 'Booking Created', 'Your booking for hello (GH₵1.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(15, 3, 'Payment Successful!', 'Payment of GH₵1.00 for hello confirmed. Awaiting admin approval.', 'payment', 0, '2026-04-15'),
(16, 3, 'Booking Created', 'Your booking for hello (GH₵0.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(17, 3, 'Booking Created', 'Your booking for hello (GH₵3.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-15'),
(18, 17, 'Booking Created', 'Your booking for hello (GH₵3.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-17'),
(19, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-17'),
(20, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-17'),
(21, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-17'),
(22, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-17'),
(23, 3, 'Rejected Booking', 'Your booking for hello (Room re) has been rejected.', 'booking', 0, '2026-04-17'),
(24, 3, 'Rejected Booking', 'Your booking for hello (Room SDD) has been rejected.', 'booking', 0, '2026-04-17'),
(25, 3, 'Rejected Booking', 'Your booking for hello (Room SDD) has been rejected.', 'booking', 0, '2026-04-17'),
(26, 3, 'Rejected Booking', 'Your booking for hello (Room re) has been rejected.', 'booking', 0, '2026-04-17'),
(27, 3, 'Rejected Booking', 'Your booking for hello (Room SDD) has been rejected.', 'booking', 0, '2026-04-17'),
(28, 3, 'Rejected Booking', 'Your booking for Cyybrid (Room a1) has been rejected.', 'booking', 0, '2026-04-17'),
(29, 3, 'Rejected Booking', 'Your booking for hello (Room SDD) has been rejected.', 'booking', 0, '2026-04-17'),
(30, 3, 'Rejected Booking', 'Your booking for YRT (Room W) has been rejected.', 'booking', 0, '2026-04-17'),
(31, 3, 'Rejected Booking', 'Your booking for hello (Room SDD) has been rejected.', 'booking', 0, '2026-04-17'),
(32, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-17'),
(33, 3, 'Rejected Booking', 'Your booking for hello (Room sd) has been rejected.', 'booking', 0, '2026-04-17'),
(34, 17, 'Booking Created', 'Your booking for sun (GH₵1.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-17'),
(35, 17, 'Booking Created', 'Your booking for sun (GH₵1.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-17'),
(36, 3, 'Booking Created', 'Your booking for kelvin (GH₵2.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-19'),
(37, 3, 'Booking Confirmed! ????', 'Booking Confirmed! Room: A1 (single room) at kelvin. Your Security Code: UNH-C7B627', 'payment', 0, '2026-04-19'),
(38, 3, 'Approved Booking', 'Congratulations! Your booking for kelvin (Room A1) has been approved.', 'booking', 0, '2026-04-19'),
(39, 3, 'Approved Booking', 'Congratulations! Your booking for kelvin (Room A1) has been approved.', 'booking', 0, '2026-04-19'),
(40, 3, 'Booking Created', 'Your booking for B-block (GH₵3,000.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-27'),
(41, 3, 'Rejected Booking', 'Your booking for B-block (Room 1q) has been rejected.', 'booking', 0, '2026-04-27'),
(42, 3, 'Rejected Booking', 'Your booking for B-block (Room 1q) has been rejected.', 'booking', 0, '2026-04-27'),
(43, 3, 'Booking Created', 'Your booking for kelvin (GH₵2.00) has been created. Complete payment to secure your room.', 'booking', 0, '2026-04-27'),
(44, 3, 'Rejected Booking', 'Your booking for kelvin (Room A1) has been rejected.', 'booking', 0, '2026-04-27'),
(45, 3, 'Approved Booking', 'Congratulations! Your booking for kelvin (Room A1) has been approved.', 'booking', 0, '2026-04-27'),
(46, 3, 'Rejected Booking', 'Your booking for kelvin (Room A1) has been rejected.', 'booking', 0, '2026-04-27'),
(47, 3, 'Rejected Booking', 'Your booking for kelvin (Room A1) has been rejected.', 'booking', 0, '2026-04-27'),
(48, 3, 'Rejected Booking', 'Your booking for kelvin (Room A1) has been rejected.', 'booking', 0, '2026-04-27'),
(49, 3, 'Rejected Booking', 'Your booking for kelvin (Room A1) has been rejected.', 'booking', 0, '2026-04-27'),
(50, 3, 'Approved Booking', 'Congratulations! Your booking for kelvin (Room A1) has been approved.', 'booking', 0, '2026-04-27'),
(51, 3, 'Approved Booking', 'Congratulations! Your booking for kelvin (Room A1) has been approved.', 'booking', 0, '2026-04-27'),
(52, 3, 'Approved Booking', 'Congratulations! Your booking for kelvin (Room A1) has been approved.', 'booking', 0, '2026-04-27'),
(53, 3, 'Rejected Booking', 'Your booking for kelvin (Room A1) has been rejected.', 'booking', 0, '2026-04-27'),
(54, 17, 'Rejected Booking', 'Your booking for hostel (Room ) has been rejected.', 'booking', 0, '2026-04-27'),
(55, 17, 'Rejected Booking', 'Your booking for hostel (Room ) has been rejected.', 'booking', 0, '2026-04-27');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hostel_id` varchar(50) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `review_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` varchar(50) NOT NULL,
  `hostel_id` varchar(50) DEFAULT NULL,
  `room_number` varchar(20) DEFAULT NULL,
  `capacity` int(11) DEFAULT 1,
  `price` decimal(10,2) DEFAULT NULL,
  `available` tinyint(1) DEFAULT 1,
  `type` varchar(50) DEFAULT NULL,
  `gender` enum('male','female','mixed') DEFAULT 'mixed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `hostel_id`, `room_number`, `capacity`, `price`, `available`, `type`, `gender`, `created_at`, `image`) VALUES
('r1777329083544', 'h1777328670182', 'A1', 2, 1.50, 1, 'Single', 'male', '2026-04-27 22:31:23', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'),
('r1777333395972', 'h1777333311397', '1', 1, 6000.00, 1, 'single', 'male', '2026-04-27 23:43:15', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'),
('r1777435952305', 'h1777435910620', 'w3', 1, 1.00, 1, 'single', 'male', '2026-04-29 04:12:32', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80');

-- --------------------------------------------------------

--
-- Table structure for table `universities`
--

CREATE TABLE `universities` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `universities`
--

INSERT INTO `universities` (`id`, `name`, `city`, `country`, `created_at`) VALUES
('u177620961952', 'USTED', 'Kumasi', 'Ghana', '2026-04-14 23:33:39'),
('u177660879382', 'UPSA', 'Accra', 'Ghana', '2026-04-19 14:26:33'),
('u177726605558', 'KNUST', 'Kumasii', 'Ghana', '2026-04-27 05:00:55');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('male','female') NOT NULL DEFAULT 'male',
  `id_photo` varchar(500) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `university_id` varchar(50) DEFAULT NULL,
  `role` enum('student','admin') DEFAULT 'student',
  `password` varchar(255) NOT NULL,
  `avatar` varchar(10) DEFAULT NULL,
  `credits` int(11) DEFAULT 0,
  `join_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `gender`, `id_photo`, `verified`, `university_id`, `role`, `password`, `avatar`, `credits`, `join_date`, `created_at`) VALUES
(1, 'Redof', 'redof@gmail.com', NULL, 'male', NULL, 0, NULL, 'student', '$2y$10$5Qv4H6Z6oKqV3jY8nPqZ.eYq3pL5mN7oR8tU9vW0xY1zA2bC3dE', NULL, 0, NULL, '2026-04-03 04:35:28'),
(2, 'John', 'jj@gmail.com', NULL, 'male', NULL, 0, NULL, 'student', '$2y$10$54j2wri0D/KAeUmQkS4J4uF4EneZe8t9MCTEbPTz57wS7FBzR6ELu', NULL, 0, NULL, '2026-04-03 05:01:44'),
(3, 'UniHive Admin', 'admin@unihive.com', '+233200000000', 'male', NULL, 0, 'u1', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 0, '2026-04-03', '2026-04-03 05:26:40'),
(5, 'cyybrid', 'cyybrid@gmail.com', NULL, 'male', NULL, 0, NULL, 'admin', '$2y$10$n.0V9sTLyivC5OVcZyAv3ubxU7tUo7P3q5fSlFQcdEVl6jJOip0iy', NULL, 0, NULL, '2026-04-07 18:38:38'),
(14, 'morgan freeman', 'mog@gmail.com', '0244522973', 'male', NULL, 0, 'u2', 'student', '$2y$10$8TkHkPMlC39ls1HmVt3e3eFc1xA7hB.fz/dRppEWqL0PldSBdv/AK', NULL, 0, NULL, '2026-04-14 21:28:24'),
(17, 'Lilian', 'lil@g.com', '0011223344', 'male', NULL, 0, 'u1', 'student', '$2y$10$S2cg/naTcG9rvRiFH5QFR.2m3E.zlyBcWbh13UPiCe/WNu7wSea0W', NULL, 0, NULL, '2026-04-17 00:32:54'),
(38, 'redoff 12dd', 'johnredoff@gmail.com', '111666', 'male', NULL, 0, 'u177648064270', 'student', '$2y$10$UbxgFOqcE16YOmPMhic60eycgOZm3Yq3He2mIKUF1pNOqm8oiRXQa', NULL, 0, NULL, '2026-04-19 18:27:28'),
(44, 'rose', 'rose@gmail.com', '123456789', 'female', NULL, 0, 'u177620961952', '', '$2y$10$palSUmH7.8yFjUD5JjHXj.L1vm7prkSGNz1iF9j3tXx9l8OKQ.B/m', NULL, 0, NULL, '2026-04-27 22:24:30'),
(45, 'green', 'gn@gmail.com', '123456789', 'male', NULL, 0, 'u177620961952', '', '$2y$10$xGQ01EMwS39anbUifCax9uCChwYzdiwlh2z1LGqCiHmybmwq5YVhu', NULL, 0, NULL, '2026-04-27 23:41:51'),
(46, 'Student Student', 'email@email.com', '0123456789', 'male', NULL, 0, 'u177620961952', 'student', '$2y$10$RVAjGioeNODqVhiybSaKXe7P38lVgFVJ9LdyLgaSQ.0ofYi8zw446', NULL, 0, NULL, '2026-04-28 03:07:28'),
(47, 'red', 'r@g.com', '098765432', 'male', NULL, 0, 'u177620961952', '', '$2y$10$I/fSJdlq.PwwOSf.NgzS7.9PUJgRQtwDTzKjv/K9Kt.f.OCEGcjBe', NULL, 0, NULL, '2026-04-29 04:11:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `hostels`
--
ALTER TABLE `hostels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hostel_id` (`hostel_id`);

--
-- Indexes for table `universities`
--
ALTER TABLE `universities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
