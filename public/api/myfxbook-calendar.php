<?php
header("Cache-Control: public, max-age=120");
header("Access-Control-Allow-Origin: *");

$ch = curl_init("https://www.myfxbook.com/forex-economic-calendar");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_TIMEOUT => 25,
  CURLOPT_USERAGENT => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  CURLOPT_HTTPHEADER => ["Accept: text/html,application/xhtml+xml"],
  CURLOPT_SSL_VERIFYPEER => true,
]);
$html = curl_exec($ch);
$ok = is_string($html) && strpos($html, "economicCalendarRow") !== false;
curl_close($ch);

if (!$ok) {
  http_response_code(502);
  header("Content-Type: text/plain; charset=utf-8");
  echo "Myfxbook calendar unavailable";
  exit;
}

header("Content-Type: text/html; charset=utf-8");
echo $html;
