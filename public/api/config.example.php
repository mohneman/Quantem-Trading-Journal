<?php
/**
 * Copy to config.php and set real credentials.
 * config.php is gitignored and is copied into dist/ on build.
 */
return [
  "db_host" => "localhost",
  "db_name" => "quantum_db",
  "db_user" => "quantum_user",
  "db_pass" => "CHANGE_ME",
  "db_charset" => "utf8mb4",
  "session_days" => 30,
  "mail_from" => "noreply@quantum.amiinhub.com",
  "app_url" => "https://quantum.amiinhub.com",
];
