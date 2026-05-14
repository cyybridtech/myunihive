<?php
$host = "localhost";
$dbname = "unihive";
$user = "root";
$pass = ""; // default XAMPP password

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

if(session_status() === PHP_SESSION_NONE){
    session_start();
}

// NOTE To User: Replace with your LIVE Secret Key (sk_live_...)!
define('PAYSTACK_SECRET_KEY', 'sk_live_872ec54809abb27b4723038a9e65168d3bcc839e');
?>