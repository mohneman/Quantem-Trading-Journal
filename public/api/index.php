<?php
declare(strict_types=1);

require __DIR__ . "/lib.php";

header("X-Content-Type-Options: nosniff");

$method = strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET");
$uri = parse_url($_SERVER["REQUEST_URI"] ?? "/", PHP_URL_PATH) ?: "/";
$route = $_GET["r"] ?? "";
if ($route === "") {
  if (preg_match("#/api/(.+)$#", $uri, $m)) $route = $m[1];
}
$route = trim($route, "/");
if (strlen($route) > 4 && substr($route, -4) === ".php") $route = substr($route, 0, -4);

try {
  $db = pdo();
  ensure_schema($db);
} catch (Throwable $e) {
  fail("Database connection failed. Check config.php and that quantum_db exists.", 500);
}

if ($method === "GET" && ($route === "health" || $route === "")) {
  send_json(["ok" => true, "app" => "quantum", "storage" => "mysql"]);
}

if ($method === "POST" && $route === "auth/signup") {
  $body = json_input();
  $name = trim((string) ($body["name"] ?? ""));
  $email = strtolower(trim((string) ($body["email"] ?? "")));
  $password = (string) ($body["password"] ?? "");
  $phone = trim((string) ($body["phone"] ?? ""));
  $ref = strtoupper(trim((string) ($body["referredByCode"] ?? "")));
  if ($name === "" || $email === "" || $password === "") fail("All fields are required.");
  if (strlen($password) < 6) fail("Password must be at least 6 characters.");
  if (find_user_by_email($db, $email)) fail("An account with that email already exists.");
  $id = new_id();
  $code = make_referral_code($db, $name, $id);
  $referred = null;
  if ($ref !== "") {
    $stmt = $db->prepare("SELECT referral_code FROM q_users WHERE referral_code = ? LIMIT 1");
    $stmt->execute([$ref]);
    $referred = $stmt->fetchColumn() ?: null;
  }
  $stmt = $db->prepare("INSERT INTO q_users
    (id, name, email, phone, password_hash, provider, role, status, referral_code, referred_by_code, created_at)
    VALUES (?, ?, ?, ?, ?, 'email', 'trader', 'pending', ?, ?, UTC_TIMESTAMP())");
  $stmt->execute([$id, $name, $email, $phone, password_hash($password, PASSWORD_DEFAULT), $code, $referred]);
  $user = find_user_by_id($db, $id);
  save_payload($db, $id, empty_journal($user));
  send_json(["error" => "Contact the admin for approval", "awaitingApproval" => true], 201);
}

if ($method === "POST" && $route === "auth/login") {
  $body = json_input();
  $email = strtolower(trim((string) ($body["email"] ?? "")));
  $password = (string) ($body["password"] ?? "");
  $user = find_user_by_email($db, $email);
  if (!$user) fail("No account found for that email.");
  if ($user["status"] !== "active") fail("Contact the admin for approval", 403);
  if ($user["provider"] === "google" && ($user["password_hash"] ?? "") === "") {
    fail("This account uses Google. Continue with Google to sign in.");
  }
  if (!password_verify($password, $user["password_hash"] ?? "")) fail("Incorrect password.");
  $token = create_session($db, $user["id"]);
  send_json(["token" => $token, "user" => public_user($user)]);
}

if ($method === "POST" && $route === "auth/google") {
  $body = json_input();
  $email = strtolower(trim((string) ($body["email"] ?? "")));
  $name = trim((string) ($body["name"] ?? ""));
  $ref = strtoupper(trim((string) ($body["referredByCode"] ?? "")));
  if ($email === "") fail("Google did not return an email.");
  if ($name === "") $name = explode("@", $email)[0] ?: "Trader";
  $existing = find_user_by_email($db, $email);
  if ($existing) {
    if ($existing["status"] !== "active") fail("Contact the admin for approval", 403);
    $db->prepare("UPDATE q_users SET provider = 'google', name = CASE WHEN name = '' THEN ? ELSE name END WHERE id = ?")
      ->execute([$name, $existing["id"]]);
    $existing = find_user_by_id($db, $existing["id"]);
    $token = create_session($db, $existing["id"]);
    send_json(["token" => $token, "user" => public_user($existing)]);
  }
  $id = new_id();
  $code = make_referral_code($db, $name, $id);
  $referred = null;
  if ($ref !== "") {
    $stmt = $db->prepare("SELECT referral_code FROM q_users WHERE referral_code = ? LIMIT 1");
    $stmt->execute([$ref]);
    $referred = $stmt->fetchColumn() ?: null;
  }
  $stmt = $db->prepare("INSERT INTO q_users
    (id, name, email, phone, password_hash, provider, role, status, referral_code, referred_by_code, created_at)
    VALUES (?, ?, ?, '', '', 'google', 'trader', 'pending', ?, ?, UTC_TIMESTAMP())");
  $stmt->execute([$id, $name, $email, $code, $referred]);
  $user = find_user_by_id($db, $id);
  save_payload($db, $id, empty_journal($user));
  send_json(["error" => "Contact the admin for approval", "awaitingApproval" => true], 201);
}

if ($method === "POST" && $route === "auth/logout") {
  $token = bearer_token();
  if ($token !== "") {
    $db->prepare("DELETE FROM q_sessions WHERE token = ?")->execute([$token]);
  }
  send_json(["ok" => true]);
}

if ($method === "GET" && $route === "auth/me") {
  $user = require_user($db);
  $out = ["user" => public_user($user), "users" => [public_user($user)]];
  if ($user["role"] === "superadmin") {
    $rows = $db->query("SELECT * FROM q_users ORDER BY created_at DESC")->fetchAll();
    $out["users"] = array_map("public_user", $rows);
  } else {
    $stmt = $db->prepare("SELECT * FROM q_users WHERE id = ? OR referred_by_code = ? ORDER BY created_at DESC");
    $stmt->execute([$user["id"], $user["referral_code"]]);
    $out["users"] = array_map("public_user", $stmt->fetchAll());
  }
  send_json($out);
}

if ($method === "POST" && $route === "auth/forgot") {
  $body = json_input();
  $email = strtolower(trim((string) ($body["email"] ?? "")));
  $user = find_user_by_email($db, $email);
  if (!$user) fail("No account found for that email.");
  $token = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
  $db->prepare("UPDATE q_users SET reset_token = ? WHERE id = ?")->execute([$token, $user["id"]]);
  send_reset_mail($email, $token);
  send_json(["error" => null, "token" => $token]);
}

if ($method === "POST" && $route === "auth/reset") {
  $body = json_input();
  $email = strtolower(trim((string) ($body["email"] ?? "")));
  $token = strtoupper(trim((string) ($body["token"] ?? "")));
  $password = (string) ($body["password"] ?? "");
  $user = find_user_by_email($db, $email);
  if (!$user) fail("No account found.");
  if ($token === "" || strtoupper((string) $user["reset_token"]) !== $token) fail("Invalid reset code.");
  if (strlen($password) < 6) fail("Password must be at least 6 characters.");
  if ($user["status"] !== "active") fail("Contact the admin for approval", 403);
  $db->prepare("UPDATE q_users SET password_hash = ?, reset_token = NULL, provider = 'email' WHERE id = ?")
    ->execute([password_hash($password, PASSWORD_DEFAULT), $user["id"]]);
  $session = create_session($db, $user["id"]);
  send_json(["token" => $session, "user" => public_user($user)]);
}

if ($method === "GET" && $route === "users") {
  require_admin($db);
  $rows = $db->query("SELECT * FROM q_users ORDER BY created_at DESC")->fetchAll();
  send_json(["users" => array_map("public_user", $rows)]);
}

if ($method === "POST" && $route === "users") {
  $admin = require_admin($db);
  $body = json_input();
  $name = trim((string) ($body["name"] ?? ""));
  $email = strtolower(trim((string) ($body["email"] ?? "")));
  $password = (string) ($body["password"] ?? "");
  $phone = trim((string) ($body["phone"] ?? ""));
  $role = ($body["role"] ?? "trader") === "superadmin" ? "superadmin" : "trader";
  if ($name === "" || $email === "" || $password === "") fail("All fields are required.");
  if (strlen($password) < 6) fail("Password must be at least 6 characters.");
  if (find_user_by_email($db, $email)) fail("An account with that email already exists.");
  $id = new_id();
  $code = make_referral_code($db, $name, $id);
  $stmt = $db->prepare("INSERT INTO q_users
    (id, name, email, phone, password_hash, provider, role, status, referral_code, created_at)
    VALUES (?, ?, ?, ?, ?, 'email', ?, 'active', ?, UTC_TIMESTAMP())");
  $stmt->execute([$id, $name, $email, $phone, password_hash($password, PASSWORD_DEFAULT), $role, $code]);
  $user = find_user_by_id($db, $id);
  save_payload($db, $id, empty_journal($user));
  send_json(["user" => public_user($user)]);
}

if (preg_match("#^users/([A-Za-z0-9_-]+)/password$#", $route, $m) && $method === "POST") {
  require_admin($db);
  $body = json_input();
  $password = (string) ($body["password"] ?? "");
  if (strlen($password) < 6) fail("Password must be at least 6 characters.");
  $user = find_user_by_id($db, $m[1]);
  if (!$user) fail("User not found.", 404);
  $db->prepare("UPDATE q_users SET password_hash = ?, reset_token = NULL, provider = 'email' WHERE id = ?")
    ->execute([password_hash($password, PASSWORD_DEFAULT), $user["id"]]);
  send_json(["ok" => true]);
}

if (preg_match("#^users/([A-Za-z0-9_-]+)/reset-data$#", $route, $m) && $method === "POST") {
  require_admin($db);
  $user = find_user_by_id($db, $m[1]);
  if (!$user) fail("User not found.", 404);
  save_payload($db, $user["id"], empty_journal($user));
  send_json(["ok" => true, "data" => empty_journal($user)]);
}

if (preg_match("#^users/([A-Za-z0-9_-]+)$#", $route, $m) && $method === "PATCH") {
  $admin = require_admin($db);
  $target = find_user_by_id($db, $m[1]);
  if (!$target) fail("User not found.", 404);
  $body = json_input();
  $name = array_key_exists("name", $body) ? trim((string) $body["name"]) : $target["name"];
  $email = array_key_exists("email", $body) ? strtolower(trim((string) $body["email"])) : $target["email"];
  $phone = array_key_exists("phone", $body) ? trim((string) $body["phone"]) : $target["phone"];
  $role = array_key_exists("role", $body) ? (($body["role"] === "superadmin") ? "superadmin" : "trader") : $target["role"];
  $status = array_key_exists("status", $body) ? (string) $body["status"] : $target["status"];
  if (!in_array($status, ["pending", "active", "disabled"], true)) fail("Invalid status.");
  if ($email !== $target["email"] && find_user_by_email($db, $email)) fail("An account with that email already exists.");
  if ($role === "trader" && $target["role"] === "superadmin") {
    $admins = (int) $db->query("SELECT COUNT(*) FROM q_users WHERE role = 'superadmin'")->fetchColumn();
    if ($admins < 2) fail("Cannot demote the last super admin.");
  }
  if ($status === "disabled" && $target["role"] === "superadmin") {
    $stmt = $db->prepare("SELECT COUNT(*) FROM q_users WHERE role = 'superadmin' AND status != 'disabled' AND id != ?");
    $stmt->execute([$target["id"]]);
    if ((int) $stmt->fetchColumn() < 1) fail("Cannot disable the last active super admin.");
  }
  if ($status === "disabled" && $target["id"] === $admin["id"]) fail("You cannot disable the account you are signed in with.");
  if ($name === "") $name = $target["name"];
  $db->prepare("UPDATE q_users SET name = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?")
    ->execute([$name, $email, $phone, $role, $status, $target["id"]]);
  $next = find_user_by_id($db, $target["id"]);
  send_json(["user" => public_user($next)]);
}

if (preg_match("#^users/([A-Za-z0-9_-]+)$#", $route, $m) && $method === "DELETE") {
  $admin = require_admin($db);
  $target = find_user_by_id($db, $m[1]);
  if (!$target) fail("User not found.", 404);
  if ($target["id"] === $admin["id"]) fail("You cannot delete the account you are signed in with.");
  if ($target["role"] === "superadmin") {
    $admins = (int) $db->query("SELECT COUNT(*) FROM q_users WHERE role = 'superadmin'")->fetchColumn();
    if ($admins < 2) fail("Cannot delete the last super admin.");
  }
  $db->prepare("DELETE FROM q_sessions WHERE user_id = ?")->execute([$target["id"]]);
  $db->prepare("DELETE FROM q_data WHERE user_id = ?")->execute([$target["id"]]);
  $db->prepare("DELETE FROM q_users WHERE id = ?")->execute([$target["id"]]);
  send_json(["ok" => true]);
}

if ($method === "GET" && $route === "data") {
  $user = require_user($db);
  send_json(["data" => get_payload($db, $user)]);
}

if ($method === "PUT" && $route === "data") {
  $user = require_user($db);
  $body = json_input();
  $payload = $body["data"] ?? $body;
  if (!is_array($payload)) fail("Invalid journal payload.");
  save_payload($db, $user["id"], $payload);
  $profile = $payload["profile"] ?? [];
  if (is_array($profile)) {
    $name = trim((string) ($profile["name"] ?? $user["name"]));
    $phone = trim((string) ($profile["phone"] ?? $user["phone"]));
    if ($name === "") $name = $user["name"];
    $db->prepare("UPDATE q_users SET name = ?, phone = ? WHERE id = ?")->execute([$name, $phone, $user["id"]]);
  }
  send_json(["ok" => true]);
}

fail("Not found.", 404);
