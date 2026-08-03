-- RomiChan

DROP TABLE IF EXISTS `romi_characters`;
CREATE TABLE `romi_characters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `romaji` varchar(191) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `alias` text,
  `age` int(10) unsigned DEFAULT NULL,
  `images` text NOT NULL,
  `url` text,
  `description` text NOT NULL,
  `comment` text,
  `hitokoto` text,
  `birthday` int(10) unsigned DEFAULT NULL,
  `voice` varchar(191) DEFAULT NULL,
  `series` text NOT NULL,
  `series_genre` varchar(20) NOT NULL,
  `tags` text,
  `hair_color` varchar(191) DEFAULT NULL,
  `eye_color` varchar(191) DEFAULT NULL,
  `blood_type` varchar(3) DEFAULT NULL,
  `height` int(10) unsigned DEFAULT NULL,
  `bust` int(10) unsigned DEFAULT NULL,
  `waist` int(10) unsigned DEFAULT NULL,
  `hip` int(10) unsigned DEFAULT NULL,
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `color` varchar(191) DEFAULT NULL,
  `hide` char(1) NOT NULL DEFAULT '0',
  `order` int(10) unsigned NOT NULL DEFAULT '50',
  `songId` int(10) unsigned DEFAULT NULL,
  `weight` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `romi_comments`;
CREATE TABLE `romi_comments` (
  `cid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pid` int(10) unsigned NOT NULL,
  `uid` int(10) unsigned NOT NULL,
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `ip` varchar(64) NOT NULL,
  `ua` text NOT NULL,
  `text` text NOT NULL,
  `status` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`cid`),
  KEY `pid` (`pid`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_hitokotos`;
CREATE TABLE `romi_hitokotos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `msg` text NOT NULL,
  `from` varchar(150) NOT NULL,
  `type` varchar(10) NOT NULL,
  `likes` int(10) NOT NULL DEFAULT '0',
  `public` char(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=791 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_hitokotos2`;
CREATE TABLE `romi_hitokotos2` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `msg` text NOT NULL,
  `msg_origin` text,
  `uuid` varchar(40) NOT NULL,
  `from` varchar(150) DEFAULT NULL,
  `from_who` varchar(150) DEFAULT NULL,
  `type` tinyint(2) NOT NULL,
  `likes` int(10) NOT NULL DEFAULT '0',
  `public` char(1) NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_metas`;
CREATE TABLE `romi_metas` (
  `mid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `is_category` char(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`mid`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_news`;
CREATE TABLE `romi_news` (
  `nid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `modified` int(10) unsigned NOT NULL DEFAULT '0',
  `text` text NOT NULL,
  `private` char(1) NOT NULL DEFAULT '0',
  `views` int(10) unsigned NOT NULL DEFAULT '0',
  `likes` int(10) unsigned NOT NULL DEFAULT '0',
  `comments` int(10) unsigned NOT NULL DEFAULT '0',
  `imgs` text,
  PRIMARY KEY (`nid`),
  KEY `created` (`created`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_news_comments`;
CREATE TABLE `romi_news_comments` (
  `cid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nid` int(10) unsigned NOT NULL,
  `uid` int(10) unsigned NOT NULL,
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `ip` varchar(64) NOT NULL,
  `ua` varchar(511) NOT NULL,
  `text` text NOT NULL,
  PRIMARY KEY (`cid`),
  KEY `nid` (`nid`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_posts`;
CREATE TABLE `romi_posts` (
  `pid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `str_id` varchar(150) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `modified` int(10) unsigned NOT NULL DEFAULT '0',
  `text` text NOT NULL,
  `password` varchar(32) DEFAULT NULL,
  `hide` char(1) NOT NULL DEFAULT '0',
  `allow_comment` char(1) NOT NULL DEFAULT '1',
  `views` int(10) unsigned NOT NULL DEFAULT '0',
  `likes` int(10) unsigned NOT NULL DEFAULT '0',
  `comments` int(10) unsigned NOT NULL DEFAULT '0',
  `banner` text,
  PRIMARY KEY (`pid`),
  KEY `created` (`created`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_relationships`;
CREATE TABLE `romi_relationships` (
  `pid` int(10) unsigned NOT NULL,
  `mid` int(10) unsigned NOT NULL,
  PRIMARY KEY (`pid`,`mid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_seimgs`;
CREATE TABLE `romi_seimgs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pixiv_pid` int(10) unsigned NOT NULL,
  `pixiv_uid` int(10) unsigned NOT NULL,
  `title` varchar(150) NOT NULL,
  `author` varchar(150) NOT NULL,
  `r18` char(1) NOT NULL DEFAULT '0',
  `tags` text,
  `width` int(10) unsigned NOT NULL,
  `height` int(10) unsigned NOT NULL,
  `type` varchar(10) NOT NULL,
  `url` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pixivPid` (`pixiv_pid`),
  KEY `pixivUid` (`pixiv_uid`)
) ENGINE=InnoDB AUTO_INCREMENT=70202 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `romi_settings`;
CREATE TABLE `romi_settings` (
  `id` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `site_title` varchar(255) NOT NULL DEFAULT '',
  `site_description` text NOT NULL,
  `site_keywords` text NOT NULL,
  `site_name` varchar(100) NOT NULL DEFAULT '',
  `site_favicon` varchar(500) NOT NULL DEFAULT '',
  `site_logo` varchar(500) NOT NULL DEFAULT '',
  `header_background` varchar(500) NOT NULL DEFAULT '',
  `home_avatar` varchar(500) NOT NULL DEFAULT '',
  `home_title` varchar(255) NOT NULL DEFAULT '',
  `home_subtitle` text NOT NULL,
  `home_links` json NOT NULL,
  `independent_pages` json NOT NULL,
  `links` json NOT NULL,
  `site_url` varchar(255) NOT NULL DEFAULT '',
  `smtp_host` varchar(255) NOT NULL DEFAULT '',
  `smtp_port` int(10) unsigned NOT NULL DEFAULT '587',
  `smtp_username` varchar(255) NOT NULL DEFAULT '',
  `smtp_password` varchar(255) NOT NULL DEFAULT '',
  `smtp_email` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

INSERT INTO `romi_settings` (`id`, `site_title`, `site_description`, `site_keywords`, `site_name`, `site_favicon`, `site_logo`, `header_background`, `home_avatar`, `home_title`, `home_subtitle`, `home_links`, `independent_pages`, `links`, `site_url`, `smtp_host`, `smtp_port`, `smtp_username`, `smtp_password`, `smtp_email`) VALUES
(1, 'Romi Nest', 'Arimura Sena\'s personal website and blog powered by Angular and Rust | AS 的个人网站和博客，由 Angular 和 Rust 驱动', 'arimura sena, Romi Nest, personal website, blog, angular, rust, as, 个人网站, 博客, Angular, Rust, AS, anime, acg, 二次元, 动漫, 原神, galgame, 视觉小说, 个人站, 动画, visual-novels, github, developer, coder, 开源, open-source, 前端, 后端, 开发者, 开源, 个人, idealism, 理想主义者, 自由主义者, 民主, 自由, axum, sea-orm, unocss, web, modern', 'Romi Nest', '/favicon.ico', '/favicon.ico', '/api/utils/background', '/api/utils/qqavatar', 'Arimura Sena', '👋 Hi there, this is my personal website and blog\n🔧 It\'s frontend built with Angular and Lit, backend built with Axum and SeaORM\n🧩 The best like character is Himeno Sena (姬野星奏) and Arimura Romi (有村ロミ)\n🌱 I\'m currently learning Idris2 and Type Theory', '[[\"mdi:github\", \"GitHub\", \"https://github.com/biyuehu\"], [\"mdi:email\", \"Email\", \"mailto:me@hotaru.icu\"], [\"mdi:qqchat\", \"QQ\", \"https://qm.qq.com/q/QbbNiQ6Tq6\"], [\"mdi:television-classic\", \"BiliBili\", \"https://space.bilibili.com/293767574\"], [\"mdi:animation-play\", \"Bangumi\", \"https://bgm.tv/user/himeno\"], [\"mdi:youtube\", \"YouTube\", \"\"], [\"mdi:alpha-x-box\", \"X\", \"\"], [\"mdi:square-rounded-badge\", \"Tieba\", \"\"], [\"mdi:telegram\", \"Telegram\", \"\"], [\"mdi:steam\", \"Steam\", \"\"], [\"mdi:reddit\", \"Reddit\", \"\"], [\"mdi:discord\", \"Discord\", \"\"], [\"mdi:xbox\", \"Xbox\", \"\"]]', '[{\"id\": 25, \"name\": \"about\", \"title\": \"关于\", \"hideToc\": true, \"routine\": true, \"template\": \"\", \"hideComments\": false}, {\"id\": 26, \"name\": \"log\", \"title\": \"日志\", \"hideToc\": false, \"routine\": true, \"template\": \"\", \"hideComments\": true}, {\"id\": 6, \"name\": \"links\", \"title\": \"友情链接\", \"hideToc\": false, \"routine\": false, \"template\": \"links\", \"hideComments\": false}]', '[{\"link\": \"https://hotaru.icu\", \"name\": \"Romi Nest\", \"avatar\": \"/favicon.ico\", \"description\": \"ArimuraSena 的个人网站，基于 Angular & Rust\"}, {\"link\": \"https://l.himeno-sena.com\", \"name\": \"Sena Language\", \"avatar\": \"https://l.himeno-sena.com/favicon-7a447ed069013842.ico\", \"description\": \"基于 Rust 的实验性一等类型&依赖类型编程语言\"}, {\"link\": \"https://himeno-sena.com\", \"name\": \"Himeno Sena\", \"avatar\": \"https://himeno-sena.com/favicon.ico\", \"description\": \"姬野星奏的专属网站\"}, {\"link\": \"https://huoshen80.top/\", \"name\": \"火神80的小窝\", \"avatar\": \"https://huoshen80.top/favicon.ico\", \"description\": \"一位热爱 Coding、MC、原神、galgame 的b站up主\"}, {\"link\": \"https://kana.hotaru.icu/\", \"name\": \"KanaRhythm\", \"avatar\": \"https://kana.hotaru.icu/favicon.png\", \"description\": \"基于 MoonBit 语言的日语假名学习游戏\"}, {\"link\": \"https://gal.hotaru.icu/\", \"name\": \"Nanno\", \"avatar\": \"https://gal.hotaru.icu/assets/cover.png\", \"description\": \"基于 Rust 的 GAL 管理、统计、同步工具\"}, {\"link\": \"https://st.hotaru.icu/\", \"name\": \"SenaTab\", \"avatar\": \"https://st.hotaru.icu/icons/icon.png\", \"description\": \"基于 React 的浏览器起始页\"}, {\"link\": \"https://avg.js.org\", \"name\": \"AvgJS\", \"avatar\": \"https://avg.js.org/favicon.svg\", \"description\": \"轻量级视觉小说游戏制作引擎\"}, {\"link\": \"https://kotori.js.org\", \"name\": \"KotoriBot\", \"avatar\": \"https://kotori.js.org/favicon.svg\", \"description\": \"基于 Node + TS 的跨平台聊天机器人框架\"}, {\"link\": \"https://tool.hotaru.icu\", \"name\": \"HULITOOL\", \"avatar\": \"https://tool.hotaru.icu/favicon.ico\", \"description\": \"HULITOOL 工具箱\"}, {\"link\": \"https://api.hotaru.icu\", \"name\": \"HotaruApi\", \"avatar\": \"https://api.hotaru.icu/favicon.ico\", \"description\": \"超快超稳定的接口网站\"}]', '', '', 587, '', '', '');


DROP TABLE IF EXISTS `romi_users`;
CREATE TABLE `romi_users` (
  `uid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(32) NOT NULL,
  `password` varchar(256) NOT NULL,
  `salt` varchar(32) NOT NULL,
  `email` varchar(128) NOT NULL,
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `last_login` int(10) unsigned NOT NULL DEFAULT '0',
  `is_admin` char(1) NOT NULL DEFAULT '0',
  `is_deleted` char(1) NOT NULL DEFAULT '0',
  `url` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;

INSERT INTO `romi_users` (`uid`, `username`, `password`, `salt`, `email`, `created`, `last_login`, `is_admin`, `is_deleted`, `url`) VALUES
(1, 'romi', 'password', '1', 'admin@gmail.com', 1738643604, 1785137662, '1', '0', 'https://i.arimuraromi.com');

DROP TABLE IF EXISTS `romi_views`;
CREATE TABLE `romi_views` (
  `slug` text NOT NULL,
  `count` int(10) unsigned NOT NULL,
  PRIMARY KEY (`slug`(255))
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
