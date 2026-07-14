<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;      
use PHPMailer\PHPMailer\Exception;
require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';
session_start();

// Helper: log + redirect
function fail($reason) {
    error_log("RepipesOnly FORM FAIL: " . $reason);
    header('Location: ../form-error.html?r=' . urlencode($reason));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('not_post');

$lastSubmit = $_SESSION['last_submit'] ?? 0;
if (time() - $lastSubmit < 10) fail('rate_limited');

if (!empty($_POST['website'])) fail('honeypot');

$name    = trim($_POST['full_name'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$email   = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $phone === '' || $email === '' || $message === '' || 
    !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('validation');
}

/*$recaptchaSecret = '6LcjktwsAAAAAAhpTGtunVh77nDk4aT_WR0OOQHh';
$recaptchaResponse = $_POST['g-recaptcha-response'] ?? '';
if (empty($recaptchaResponse)) fail('recaptcha_empty');

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://www.google.com/recaptcha/api/siteverify');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'secret' => $recaptchaSecret,
    'response' => $recaptchaResponse,
    'remoteip' => $_SERVER['REMOTE_ADDR']
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
$verifyResponse = curl_exec($ch);
$curlErr = curl_error($ch);
curl_close($ch);

if ($verifyResponse === false) fail('curl_failed: ' . $curlErr);

$responseData = json_decode($verifyResponse);
if (!$responseData || !$responseData->success) {
    fail('recaptcha_verify_failed: ' . json_encode($responseData));
}*/

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'carvel@smashtoday.com';
    $mail->Password   = 'bkycheocwfoxoblg';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->setFrom('carvel@smashtoday.com', 'Cdremodelsflorida');
    $mail->Sender = 'carvel@smashtoday.com';
    
    $mail->addAddress('cdremodels77@gmail.com');
    $mail->addReplyTo($email, $name);
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = 'New Service Request from ' . $name;
    $mail->Body = "
        <h3>New Request Form Submission</h3>
        <p><strong>Full Name:</strong> $name</p>
        <p><strong>Phone:</strong> $phone</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Service:</strong> $message</p>
    ";
    $mail->send();
    $_SESSION['last_submit'] = time();
    header('Location: ../thank-you.html');
    exit;
} catch (Exception $e) {
    fail('phpmailer: ' . $mail->ErrorInfo);
}