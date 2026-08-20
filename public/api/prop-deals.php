<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: public, max-age=300");
header("Access-Control-Allow-Origin: *");

$firms = [
  ["firm" => "FTMO", "url" => "https://ftmo.com/en/"],
  ["firm" => "FundingPips", "url" => "https://www.fundingpips.com/"],
  ["firm" => "FundedNext", "url" => "https://fundednext.com/"],
  ["firm" => "The5ers", "url" => "https://the5ers.com/"],
  ["firm" => "E8 Markets", "url" => "https://e8markets.com/"],
  ["firm" => "FXIFY", "url" => "https://fxify.com/"],
  ["firm" => "Alpha Capital", "url" => "https://alphacapitalgroup.uk/"],
  ["firm" => "Goat Funded Trader", "url" => "https://www.goatfundedtrader.com/"],
];

$junk = [
  "SEE","SITE","APPLY","CODE","CODES","COUPON","PROMO","DISCOUNT","OFFER","SALE",
  "SAVE","GET","NOW","HERE","NEW","LIVE","CLAIM","START","BUY","USE","THE","AND",
  "FOR","OFF","WITH","YOUR","THIS","THAT","FROM","FREE","DEAL","FLASH","LIMIT",
  "TIME","STEP","PHASE","CLASS","NAME","TYPE","LOGIN","SIGNUP","ACCOUNT","CHALLENGE",
];

function fetch_url(string $url): string {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 18,
    CURLOPT_USERAGENT => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    CURLOPT_HTTPHEADER => ["Accept: text/html,application/xhtml+xml"],
    CURLOPT_SSL_VERIFYPEER => true,
  ]);
  $body = curl_exec($ch);
  curl_close($ch);
  return is_string($body) ? $body : "";
}

function strip_tags_text(string $html): string {
  $html = preg_replace("#<script[\\s\\S]*?</script>#i", " ", $html) ?? $html;
  $html = preg_replace("#<style[\\s\\S]*?</style>#i", " ", $html) ?? $html;
  $html = preg_replace("#<[^>]+>#", " ", $html) ?? $html;
  $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, "UTF-8");
  return preg_replace("/\\s+/", " ", $html) ?? $html;
}

function is_promo_code(string $raw): bool {
  global $junk;
  $code = strtoupper(preg_replace("/[^A-Z0-9_-]/", "", $raw) ?? "");
  if (strlen($code) < 4 || strlen($code) > 16) return false;
  if (in_array($code, $junk, true)) return false;
  if (!preg_match("/[A-Z]/", $code) || !preg_match("/\\d/", $code)) return false;
  return true;
}

function nearby_percent(string $text, int $index): string {
  if (!preg_match_all("/(\\d{1,2})\\s*%\\s*(?:off|discount)/i", $text, $matches, PREG_OFFSET_CAPTURE)) {
    return "";
  }
  $best = "";
  $bestDist = 9999;
  foreach ($matches[1] as $i => $row) {
    $dist = abs(($matches[0][$i][1] ?? 0) - $index);
    if ($dist < $bestDist && $dist <= 100) {
      $bestDist = $dist;
      $best = $row[0];
    }
  }
  return $best;
}

function parse_deals(string $firm, string $url, string $html): array {
  if ($html === "" || strlen($html) < 400) return [];
  if (preg_match("/vercel security checkpoint/i", $html)) return [];
  if (preg_match("/just a moment/i", $html) && strlen($html) < 2500) return [];

  $text = strip_tags_text($html);
  if (!preg_match("/discount|coupon|promo|% off|save \\d|code[:\\s]/i", $text)) return [];

  $found = [];
  $remember = function (string $raw, string $pct, int $dist) use (&$found): void {
    if (!is_promo_code($raw)) return;
    $code = strtoupper(preg_replace("/[^A-Z0-9_-]/", "", $raw) ?? "");
    if (isset($found[$code]) && $found[$code]["dist"] <= $dist) {
      if ($found[$code]["pct"] === "" && $pct !== "") $found[$code] = ["pct" => $pct, "dist" => $dist];
      return;
    }
    $found[$code] = ["pct" => $pct, "dist" => $dist];
  };

  if (preg_match_all("/\\b(?:promo(?:tion)?|discount|coupon)?\\s*codes?[:\\s]+([A-Za-z0-9_-]{4,16})\\b/i", $text, $m, PREG_OFFSET_CAPTURE)) {
    foreach ($m[1] as $row) {
      $remember($row[0], nearby_percent($text, $row[1]), 0);
    }
  }
  if (preg_match_all("/\\b([A-Za-z][A-Za-z0-9_-]{3,15})\\s+for\\s+(\\d{1,2})\\s*%\\s*off\\b/i", $text, $m, PREG_SET_ORDER)) {
    foreach ($m as $row) $remember($row[1], $row[2], 0);
  }
  if (preg_match_all("/(\\d{1,2})\\s*%\\s*off/i", $text, $pcts, PREG_OFFSET_CAPTURE)) {
    foreach ($pcts[0] as $i => $hit) {
      $percentIndex = $hit[1];
      $start = max(0, $percentIndex - 80);
      $around = substr($text, $start, 170);
      if (preg_match_all("/\\b([A-Za-z][A-Za-z0-9_-]{3,15})\\b/", $around, $tokens, PREG_OFFSET_CAPTURE)) {
        foreach ($tokens[1] as $token) {
          $dist = abs($start + $token[1] - $percentIndex);
          $remember($token[0], $pcts[1][$i][0], $dist);
        }
      }
    }
  }

  $slug = strtolower(preg_replace("/\\s+/", "-", $firm) ?? $firm);
  $deals = [];
  $n = 0;
  foreach ($found as $code => $row) {
    $pct = $row["pct"];
    $deals[] = [
      "id" => "live-{$slug}-" . strtolower($code) . "-{$n}",
      "firm" => $firm,
      "code" => $code,
      "discount" => $pct ? "{$pct}% off" : "Live offer",
      "details" => $pct
        ? "Use code {$code} at checkout for {$pct}% off. Confirm it still applies before you pay."
        : "Use code {$code} at checkout. Confirm the current terms on the offer page.",
      "url" => $url,
      "expiry" => "",
      "source" => "live",
    ];
    $n++;
  }
  if ($deals) return $deals;

  if (!preg_match("/(\\d{1,2})\\s*%\\s*(?:off|discount)/i", $text, $pctMatch)) return [];
  $pct = $pctMatch[1];
  return [[
    "id" => "live-{$slug}-auto",
    "firm" => $firm,
    "code" => "",
    "discount" => "{$pct}% off",
    "details" => "{$firm} is advertising {$pct}% off with no published coupon code. The sale is applied on the offer page.",
    "url" => $url,
    "expiry" => "",
    "source" => "live",
  ]];
}

$all = [];
foreach ($firms as $page) {
  $html = fetch_url($page["url"]);
  foreach (parse_deals($page["firm"], $page["url"], $html) as $deal) {
    $all[] = $deal;
  }
}

echo json_encode(["deals" => $all], JSON_UNESCAPED_SLASHES);
