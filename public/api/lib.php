<?php
declare(strict_types=1);

function cfg(): array {
  static $cfg;
  if ($cfg) return $cfg;
  $file = __DIR__ . "/config.php";
  if (!is_file($file)) {
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(["error" => "API config.php is missing. Copy config.example.php to config.php."]);
    exit;
  }
  $cfg = require $file;
  return $cfg;
}

function pdo(): PDO {
  static $pdo;
  if ($pdo) return $pdo;
  $c = cfg();
  $dsn = sprintf("mysql:host=%s;dbname=%s;charset=%s", $c["db_host"], $c["db_name"], $c["db_charset"] ?? "utf8mb4");
  $pdo = new PDO($dsn, $c["db_user"], $c["db_pass"], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function json_input(): array {
  $raw = file_get_contents("php://input") ?: "";
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function send_json($data, int $code = 200): void {
  http_response_code($code);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
  exit;
}

function fail(string $message, int $code = 400): void {
  send_json(["error" => $message], $code);
}

function new_id(): string {
  try {
    return bin2hex(random_bytes(8));
  } catch (Exception $e) {
    return substr(md5(uniqid((string) mt_rand(), true)), 0, 16);
  }
}

function bearer_token(): string {
  $header = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
  if (stripos($header, "Bearer ") === 0) return trim(substr($header, 7));
  return "";
}

function ensure_schema(PDO $db): void {
  $db->exec("CREATE TABLE IF NOT EXISTS q_users (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(40) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    provider ENUM('email','google') NOT NULL DEFAULT 'email',
    role ENUM('superadmin','trader') NOT NULL DEFAULT 'trader',
    status ENUM('pending','active','disabled') NOT NULL DEFAULT 'pending',
    referral_code VARCHAR(32) NOT NULL UNIQUE,
    referred_by_code VARCHAR(32) NULL,
    reset_token VARCHAR(64) NULL,
    created_at DATETIME NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS q_sessions (
    token VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS q_data (
    user_id VARCHAR(32) NOT NULL PRIMARY KEY,
    payload LONGTEXT NOT NULL,
    updated_at DATETIME NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $count = (int) $db->query("SELECT COUNT(*) FROM q_users")->fetchColumn();
  if ($count === 0) {
    seed_user($db, [
      "id" => "u-admin",
      "name" => "Quantum Admin",
      "email" => "admin@quantum.local",
      "phone" => "",
      "password" => "quantum-admin",
      "provider" => "email",
      "role" => "superadmin",
      "status" => "active",
      "referral_code" => "ADMIN0001",
    ]);
    seed_user($db, [
      "id" => "u-demo",
      "name" => "ali ahmed",
      "email" => "nejahseid750@gmail.com",
      "phone" => "251962091945",
      "password" => "quantum",
      "provider" => "email",
      "role" => "trader",
      "status" => "active",
      "referral_code" => "ALIAHDEMO",
    ]);
  }
}

function seed_user(PDO $db, array $u): void {
  $stmt = $db->prepare("INSERT INTO q_users
    (id, name, email, phone, password_hash, provider, role, status, referral_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())");
  $stmt->execute([
    $u["id"],
    $u["name"],
    $u["email"],
    $u["phone"],
    password_hash($u["password"], PASSWORD_DEFAULT),
    $u["provider"],
    $u["role"],
    $u["status"],
    $u["referral_code"],
  ]);
}

function public_user(array $row): array {
  return [
    "id" => $row["id"],
    "name" => $row["name"],
    "email" => $row["email"],
    "phone" => $row["phone"] ?? "",
    "password" => "",
    "provider" => $row["provider"],
    "role" => $row["role"],
    "status" => $row["status"],
    "createdAt" => gmdate("c", strtotime($row["created_at"] . " UTC") ?: time()),
    "referralCode" => $row["referral_code"],
    "referredByCode" => $row["referred_by_code"] ?: null,
  ];
}

function find_user_by_email(PDO $db, string $email): ?array {
  $stmt = $db->prepare("SELECT * FROM q_users WHERE email = ? LIMIT 1");
  $stmt->execute([strtolower(trim($email))]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function find_user_by_id(PDO $db, string $id): ?array {
  $stmt = $db->prepare("SELECT * FROM q_users WHERE id = ? LIMIT 1");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function make_referral_code(PDO $db, string $name, string $id): string {
  $prefix = strtoupper(preg_replace("/[^A-Za-z]/", "", $name) ?: "USER");
  $prefix = substr($prefix, 0, 5);
  $tail = strtoupper(substr(preg_replace("/[^A-Za-z0-9]/", "", $id) ?: "CODE", -4));
  $code = $prefix . $tail;
  $n = 2;
  $check = $db->prepare("SELECT id FROM q_users WHERE referral_code = ? LIMIT 1");
  while (true) {
    $check->execute([$code]);
    if (!$check->fetch()) return $code;
    $code = $prefix . $tail . $n;
    $n++;
  }
}

function create_session(PDO $db, string $userId): string {
  $token = bin2hex(random_bytes(24));
  $days = (int) (cfg()["session_days"] ?? 30);
  $stmt = $db->prepare("INSERT INTO q_sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))");
  $stmt->execute([$token, $userId, $days]);
  return $token;
}

function current_user(PDO $db): ?array {
  $token = bearer_token();
  if ($token === "") return null;
  $stmt = $db->prepare("SELECT u.* FROM q_sessions s JOIN q_users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1");
  $stmt->execute([$token]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function require_user(PDO $db): array {
  $user = current_user($db);
  if (!$user) fail("Please log in.", 401);
  if ($user["status"] !== "active") fail("Contact the admin for approval", 403);
  return $user;
}

function require_admin(PDO $db): array {
  $user = require_user($db);
  if ($user["role"] !== "superadmin") fail("Super admin only.", 403);
  return $user;
}

function empty_journal(array $user): array {
  return [
    "profile" => [
      "name" => $user["name"],
      "email" => $user["email"],
      "phone" => $user["phone"] ?? "",
      "avatar" => "",
      "initials" => initials_of($user["name"]),
    ],
    "accounts" => [],
    "trades" => [],
    "journals" => [],
    "notes" => [],
    "maps" => [],
    "checklists" => [],
    "payouts" => [],
    "backtests" => [],
    "coupons" => [],
    "symbols" => ["GBPUSD", "EURUSD", "USDJPY", "XAUUSD", "EURGBP"],
    "tasks" => [],
    "affiliateCode" => $user["referral_code"] ?? "",
  ];
}

function initials_of(string $name): string {
  $parts = preg_split("/\s+/", trim($name)) ?: [];
  $out = "";
  foreach ($parts as $p) {
    if ($p !== "") $out .= strtoupper($p[0]);
    if (strlen($out) >= 2) break;
  }
  return $out !== "" ? $out : "Q";
}

function get_payload(PDO $db, array $user): array {
  $stmt = $db->prepare("SELECT payload FROM q_data WHERE user_id = ?");
  $stmt->execute([$user["id"]]);
  $raw = $stmt->fetchColumn();
  if (is_string($raw) && $raw !== "") {
    $json = json_decode($raw, true);
    if (is_array($json)) return $json;
  }
  return empty_journal($user);
}

function save_payload(PDO $db, string $userId, array $payload): void {
  $stmt = $db->prepare("INSERT INTO q_data (user_id, payload, updated_at) VALUES (?, ?, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = UTC_TIMESTAMP()");
  $stmt->execute([$userId, json_encode($payload, JSON_UNESCAPED_SLASHES)]);
}

function send_reset_mail(string $email, string $token): void {
  $from = cfg()["mail_from"] ?? "noreply@quantum.amiinhub.com";
  $url = rtrim((string) (cfg()["app_url"] ?? ""), "/");
  $link = $url . "/#/reset?email=" . rawurlencode($email) . "&code=" . rawurlencode($token);
  $body = "Your Quantum reset code is {$token}\n\nReset link: {$link}\n";
  @mail($email, "Quantum password reset", $body, "From: {$from}\r\nContent-Type: text/plain; charset=utf-8");
}
