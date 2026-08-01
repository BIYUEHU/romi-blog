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

DROP TABLE IF EXISTS `romi_views`;
CREATE TABLE `romi_views` (
  `slug` text NOT NULL,
  `count` int(10) unsigned NOT NULL,
  PRIMARY KEY (`slug`(255))
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
