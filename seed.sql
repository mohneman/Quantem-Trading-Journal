-- Quantem / RyzeLog sample data
-- Import in Yegara cPanel phpMyAdmin: open phpMyAdmin → select database `quantem` (or your prefixed name)
-- → Import tab → Choose File → this file → Go.
-- Import AFTER schema.mysql (or scheme.mysql).
--
-- The SPA currently uses localStorage (`q-users`, `q-session`, `q-data-*`, `q-theme`).
-- These SQL files are a MySQL mirror for phpMyAdmin / future API use — the browser app
-- does not read this database yet.
-- Demo login in the SPA: nejahseid750@gmail.com / quantem (plaintext in localStorage).
-- password_hash below is SHA2-256('quantem'). For production, replace with bcrypt, e.g.
--   php -r "echo password_hash('quantem', PASSWORD_BCRYPT);"
--   -- $2y$10$......................................................

USE `quantem`;

SET NAMES utf8mb4;

-- Re-runnable seed for the demo user (keeps other users if you added any)
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `focus_tasks` WHERE `user_id` = 'u-demo';
DELETE FROM `symbols` WHERE `user_id` = 'u-demo';
DELETE FROM `settings` WHERE `user_id` = 'u-demo';
DELETE FROM `coupons` WHERE `user_id` = 'u-demo';
DELETE FROM `backtests` WHERE `user_id` = 'u-demo';
DELETE FROM `payouts` WHERE `user_id` = 'u-demo';
DELETE FROM `checklist_items` WHERE `checklist_id` IN (SELECT `id` FROM `checklists` WHERE `user_id` = 'u-demo');
DELETE FROM `checklists` WHERE `user_id` = 'u-demo';
DELETE FROM `mind_maps` WHERE `user_id` = 'u-demo';
DELETE FROM `notes` WHERE `user_id` = 'u-demo';
DELETE FROM `journal_plans` WHERE `journal_id` IN (SELECT `id` FROM `journal_days` WHERE `user_id` = 'u-demo');
DELETE FROM `journal_tasks` WHERE `journal_id` IN (SELECT `id` FROM `journal_days` WHERE `user_id` = 'u-demo');
DELETE FROM `journal_days` WHERE `user_id` = 'u-demo';
DELETE FROM `trade_accounts` WHERE `trade_id` IN (SELECT `id` FROM `trades` WHERE `user_id` = 'u-demo');
DELETE FROM `trades` WHERE `user_id` = 'u-demo';
DELETE FROM `accounts` WHERE `user_id` = 'u-demo';
DELETE FROM `sessions` WHERE `user_id` = 'u-demo';
DELETE FROM `users` WHERE `id` = 'u-demo';
DELETE FROM `economic_events` WHERE `event_date` = '2026-08-18';

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `users` (
  `id`, `name`, `email`, `phone`, `password_hash`, `provider`,
  `avatar`, `initials`, `affiliate_code`, `created_at`
) VALUES (
  'u-demo',
  'ali ahmed',
  'nejahseid750@gmail.com',
  '251962091945',
  SHA2('quantem', 256),
  'email',
  '',
  'AA',
  'RYZE-AA',
  '2026-08-16 09:00:00'
);

INSERT INTO `sessions` (`id`, `user_id`, `email`, `created_at`, `expires_at`) VALUES (
  's-demo',
  'u-demo',
  'nejahseid750@gmail.com',
  '2026-08-18 08:00:00',
  '2026-09-18 08:00:00'
);

INSERT INTO `settings` (`user_id`, `theme`, `prefs`) VALUES (
  'u-demo',
  'light',
  JSON_OBJECT('darkMode', false, 'locale', 'en')
);

INSERT INTO `accounts` (
  `id`, `user_id`, `name`, `type`, `challenge_type`, `website`,
  `profit_split`, `drawdown`, `target`, `status`, `balance`, `created_at`
) VALUES (
  'a-ftmo',
  'u-demo',
  'FTMO 10K Challenge',
  'Prop',
  'Phase 1',
  'https://ftmo.com',
  '80/20',
  '10',
  '8%',
  'Phase 1',
  10000.00,
  '2026-08-16 10:00:00'
);

INSERT INTO `trades` (
  `id`, `user_id`, `account_id`, `no`, `trade_date`, `symbol`, `direction`,
  `session`, `grade`, `rr`, `sl_pips`, `tp_pips`, `risk`, `outcome`, `pnl`,
  `psychology`, `checklist_name`, `rules`, `notes`, `proof_url`, `after_url`, `created_at`
) VALUES
(
  't1',
  'u-demo',
  'a-ftmo',
  1,
  '2026-08-17',
  'GBPUSD',
  'Buy',
  'New York',
  'A+',
  '1:2.33',
  '15',
  '35',
  '1.00%',
  'LOSS',
  0.00,
  JSON_ARRAY('Calm'),
  'Default Checklist',
  JSON_ARRAY(
    JSON_OBJECT('text', 'Soo hel Trend-ka (H1/H4 for S1) (15M for S2/S3) (5M for S4)', 'checked', TRUE),
    JSON_OBJECT('text', 'Soo hel Zone-ka maamulaya Order Flow-ga suuqa.', 'checked', TRUE),
    JSON_OBJECT('text', 'Sug in Liquidity-ga lagu jebiyo Reversal Volume muuqda.', 'checked', TRUE),
    JSON_OBJECT('text', 'Hubi in Volume-ka uu keeno Countertrend Break.', 'checked', TRUE),
    JSON_OBJECT('text', 'Hubi in Momentum-ku la jaanqaadayo direction-ka.', 'checked', TRUE)
  ),
  '',
  '',
  '',
  '2026-08-17 14:30:00'
),
(
  't2',
  'u-demo',
  'a-ftmo',
  2,
  '2026-08-18',
  'GBPUSD',
  'Buy',
  'New York',
  'A+',
  '1:2',
  '15',
  '30',
  '2.00%',
  'WIN',
  0.00,
  JSON_ARRAY('Calm'),
  'Default Checklist',
  JSON_ARRAY(
    JSON_OBJECT('text', 'Soo hel Trend-ka (H1/H4 for S1) (15M for S2/S3) (5M for S4)', 'checked', TRUE),
    JSON_OBJECT('text', 'Soo hel Zone-ka maamulaya Order Flow-ga suuqa.', 'checked', TRUE),
    JSON_OBJECT('text', 'Sug in Liquidity-ga lagu jebiyo Reversal Volume muuqda.', 'checked', TRUE),
    JSON_OBJECT('text', 'Hubi in Volume-ka uu keeno Countertrend Break.', 'checked', TRUE),
    JSON_OBJECT('text', 'Hubi in Momentum-ku la jaanqaadayo direction-ka.', 'checked', TRUE)
  ),
  'waan ku dagdag oo kale',
  '',
  '',
  '2026-08-18 15:10:00'
);

INSERT INTO `trade_accounts` (`trade_id`, `account_id`) VALUES
  ('t1', 'a-ftmo'),
  ('t2', 'a-ftmo');

INSERT INTO `journal_days` (
  `id`, `user_id`, `title`, `journal_date`, `mood`, `tags`,
  `gratitude`, `affirmation`, `notes`, `created_at`
) VALUES (
  'j1',
  'u-demo',
  'monday',
  '2026-08-16',
  'Excited',
  JSON_ARRAY('Monday', 'Trading', 'Personal', 'Excited'),
  'Grateful for a clear plan and a funded-account path.',
  'I follow my rules and wait for A+ setups.',
  '--- Account Plane ---',
  '2026-08-16 21:00:00'
);

INSERT INTO `journal_tasks` (`id`, `journal_id`, `task_text`, `done`, `sort_order`) VALUES
  ('jt1', 'j1', 'Review London/NY overlap for GBPUSD', 1, 1),
  ('jt2', 'j1', 'Stick to 1% risk on Phase 1', 0, 2);

INSERT INTO `journal_plans` (
  `id`, `journal_id`, `account_id`, `balance`, `trades`, `pips`, `risk`, `amount`
) VALUES (
  'jp1',
  'j1',
  'a-ftmo',
  '10000',
  '2-3',
  '50',
  '1%',
  '$50'
);

INSERT INTO `notes` (`id`, `user_id`, `title`, `html`, `color`, `pinned`, `updated_at`) VALUES (
  'n1',
  'u-demo',
  'New Note',
  '<p>Session notes: wait for liquidity sweep on GBPUSD before NY open.</p>',
  '#00D1C1',
  0,
  '2026-08-18 08:00:00'
);

INSERT INTO `mind_maps` (`id`, `user_id`, `title`, `color`, `pinned`, `zoom`, `canvas`, `updated_at`) VALUES (
  'm1',
  'u-demo',
  'New Mind Map',
  '#00D1C1',
  0,
  1.00,
  JSON_OBJECT(
    'zoom', 1,
    'nodes', JSON_ARRAY(
      JSON_OBJECT(
        'id', 'root',
        'x', 380,
        'y', 220,
        'text', 'New Mind Map',
        'color', '#00D1C1',
        'type', 'topic',
        'parentId', NULL
      ),
      JSON_OBJECT(
        'id', 'child1',
        'x', 620,
        'y', 220,
        'text', 'Double-click to edit...',
        'color', '#00D1C1',
        'type', 'note',
        'parentId', 'root'
      )
    )
  ),
  '2026-08-18 08:00:00'
);

INSERT INTO `checklists` (`id`, `user_id`, `name`, `is_default`, `created_at`) VALUES (
  'cl-default',
  'u-demo',
  'Default Checklist',
  1,
  '2026-08-16 09:00:00'
);

INSERT INTO `checklist_items` (`id`, `checklist_id`, `item_text`, `sort_order`) VALUES
  ('cli1', 'cl-default', 'Soo hel Trend-ka (H1/H4 for S1) (15M for S2/S3) (5M for S4)', 1),
  ('cli2', 'cl-default', 'Soo hel Zone-ka maamulaya Order Flow-ga suuqa.', 2),
  ('cli3', 'cl-default', 'Sug in Liquidity-ga lagu jebiyo Reversal Volume muuqda.', 3),
  ('cli4', 'cl-default', 'Hubi in Volume-ka uu keeno Countertrend Break.', 4),
  ('cli5', 'cl-default', 'Hubi in Momentum-ku la jaanqaadayo direction-ka.', 5);

INSERT INTO `payouts` (
  `id`, `user_id`, `account_id`, `firm`, `account_name`, `size`,
  `amount`, `profit_split`, `payout`, `status`, `method`,
  `request_date`, `payout_date`, `notes`
) VALUES (
  'p1',
  'u-demo',
  'a-ftmo',
  'FTMO',
  'FTMO 10K Challenge',
  '$10,000',
  800.00,
  '80/20',
  640.00,
  'Pending',
  'Crypto',
  '2026-08-18',
  NULL,
  'Sample payout request after first funded cycle.'
);

INSERT INTO `backtests` (
  `id`, `user_id`, `no`, `backtest_date`, `symbol`, `direction`, `scenario`,
  `sl_pips`, `tp_pips`, `result`, `notes`, `rules`, `chart5`, `chart15`
) VALUES (
  'bt1',
  'u-demo',
  1,
  '2026-08-17',
  'GBPUSD',
  'Buy',
  'NY session liquidity sweep then displacement',
  '15',
  '35',
  'LOSS',
  'Same A+ checklist as live t1; stop hunted before target.',
  JSON_ARRAY(
    JSON_OBJECT('text', 'Soo hel Trend-ka (H1/H4 for S1) (15M for S2/S3) (5M for S4)', 'checked', TRUE),
    JSON_OBJECT('text', 'Soo hel Zone-ka maamulaya Order Flow-ga suuqa.', 'checked', TRUE),
    JSON_OBJECT('text', 'Sug in Liquidity-ga lagu jebiyo Reversal Volume muuqda.', 'checked', TRUE),
    JSON_OBJECT('text', 'Hubi in Volume-ka uu keeno Countertrend Break.', 'checked', TRUE),
    JSON_OBJECT('text', 'Hubi in Momentum-ku la jaanqaadayo direction-ka.', 'checked', TRUE)
  ),
  '',
  ''
);

INSERT INTO `coupons` (`id`, `user_id`, `firm`, `code`, `discount`, `url`, `expiry`) VALUES
  ('c1', 'u-demo', 'FTMO', 'RYZE10', '10% off', 'https://ftmo.com', '2026-12-31'),
  ('c2', 'u-demo', 'FundingPips', 'QUANTEM', '20% off', 'https://fundingpips.com', '2026-10-31');

INSERT INTO `economic_events` (
  `event_date`, `event_time`, `currency`, `event_name`, `impact`,
  `previous`, `consensus`, `actual`, `better`
) VALUES
  ('2026-08-18', '06:00:00', 'GBP', 'Average Earnings incl. Bonus (3Mo/Yr) (Jun)', 'HIGH', '3.4%', '3.4%', '3.5%', 1),
  ('2026-08-18', '07:30:00', 'CHF', 'Trade Balance (Jul)', 'MED', '3.8B', '4.0B', '4.2B', 1),
  ('2026-08-18', '08:30:00', 'USD', 'Building Permits (Jul)', 'MED', '1.39M', '1.42M', '1.37M', 0),
  ('2026-08-18', '10:00:00', 'EUR', 'German ZEW Economic Sentiment (Aug)', 'HIGH', '41.8', '42.5', '—', 1),
  ('2026-08-18', '14:00:00', 'USD', 'Existing Home Sales (Jul)', 'LOW', '3.93M', '3.99M', '—', 1);

INSERT INTO `symbols` (`user_id`, `symbol`) VALUES
  ('u-demo', 'GBPUSD'),
  ('u-demo', 'EURUSD'),
  ('u-demo', 'USDJPY'),
  ('u-demo', 'XAUUSD'),
  ('u-demo', 'EURGBP');

INSERT INTO `focus_tasks` (`id`, `user_id`, `task_text`, `done`, `sort_order`) VALUES
  ('ft1', 'u-demo', 'Mark HTF supply/demand on GBPUSD', 0, 1);
